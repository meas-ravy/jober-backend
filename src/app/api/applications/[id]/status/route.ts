import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { createNotification } from "@/src/lib/notifications";

export const runtime = "nodejs";
import {
  canRecruiterManageApplication,
  isValidStatusTransition,
  ApplicationStatus,
  type ApplicationStatusType,
} from "@/src/lib/applications";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Get application ID from params
    const { id: applicationId } = await context.params;

    // Authenticate user
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 },
      );
    }

    let userId: string;
    let roles: string[];
    try {
      ({ userId, roles } = await verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    // Check if user has Recruiter role
    if (!roles.includes("Recruiter")) {
      return NextResponse.json(
        { error: "Only recruiters can update application status" },
        { status: 403 },
      );
    }

    // Parse request body
    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { status, notes } = body as {
      status?: unknown;
      notes?: unknown;
    };

    // Validate status
    if (typeof status !== "string" || !status.trim()) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    // Check if status is valid
    const validStatuses = Object.values(ApplicationStatus);
    if (!validStatuses.includes(status as ApplicationStatusType)) {
      return NextResponse.json(
        {
          error: "Invalid status",
          details: `Status must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate notes if provided
    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      return NextResponse.json(
        { error: "Notes must be a string" },
        { status: 400 },
      );
    }

    // Check if recruiter can manage this application
    const canManage = await canRecruiterManageApplication(
      applicationId,
      userId,
    );

    if (!canManage.allowed) {
      return NextResponse.json(
        { error: canManage.reason },
        { status: 403 },
      );
    }

    // Get current application
    const currentApplication = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      select: { status: true, reviewedAt: true },
    });

    if (!currentApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Validate status transition
    if (
      !isValidStatusTransition(
        currentApplication.status as ApplicationStatusType,
        status as ApplicationStatusType,
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid status transition",
          details: `Cannot change status from ${currentApplication.status} to ${status}`,
        },
        { status: 400 },
      );
    }

    // Update application
    const updateData: any = {
      status: status as ApplicationStatusType,
      updatedAt: new Date(),
    };

    // Set reviewedAt timestamp on first review (if not already set)
    if (!currentApplication.reviewedAt) {
      updateData.reviewedAt = new Date();
    }

    // Update notes if provided
    if (notes !== undefined && notes !== null) {
      const trimmedNotes = (notes as string).trim();
      updateData.recruiterNotes = trimmedNotes || null;
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        jobSeeker: {
          select: {
            id: true,
            phone: true,
            jobSeekerProfile: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Notify Job Seeker
    try {
      let statusTitle = "Application Updated";
      let statusContent = `The status of your application for "${updatedApplication.job.title}" has changed to ${status}.`;

      if (status === "Shortlisted") {
        statusTitle = "Application Shortlisted! 🎉";
        statusContent = `Congratulations! You have been shortlisted for the "${updatedApplication.job.title}" position. The recruiter will be in touch.`;
      } else if (status === "Rejected") {
        statusTitle = "Application Update";
        statusContent = `Thank you for your interest in the "${updatedApplication.job.title}" position. Unfortunately, the recruiter has decided not to move forward with your application at this time.`;
      } else if (status === "Hired") {
        statusTitle = "You're Hired! 🎊";
        statusContent = `Great news! You have been hired for the "${updatedApplication.job.title}" position. Congratulations on your new job!`;
      }

      await createNotification({
        userId: updatedApplication.jobSeeker.id,
        title: statusTitle,
        content: statusContent,
        type: "APPLICATION_UPDATE",
        link: `/my-applications/${applicationId}`
      });
    } catch (notifError) {
      console.error("Failed to notify seeker of application status update:", notifError);
    }

    return NextResponse.json({
      success: true,
      message: "Application status updated successfully",
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        recruiterNotes: updatedApplication.recruiterNotes,
        reviewedAt: updatedApplication.reviewedAt,
        updatedAt: updatedApplication.updatedAt,
        jobSeeker: {
          id: updatedApplication.jobSeeker.id,
          profile: updatedApplication.jobSeeker.jobSeekerProfile
            ? {
                fullName: updatedApplication.jobSeeker.jobSeekerProfile.fullName,
                email: updatedApplication.jobSeeker.jobSeekerProfile.email,
              }
            : null,
        },
        job: {
          id: updatedApplication.job.id,
          title: updatedApplication.job.title,
        },
      },
    });
  } catch (error) {
    console.error("Error updating application status:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to update application status",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : "An error occurred while updating the application",
      },
      { status: 500 },
    );
  }
}
