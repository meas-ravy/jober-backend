import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { createNotification } from "@/src/lib/notifications";

export const runtime = "nodejs";
import {
  validateApplicationData,
  canUserApplyToJob,
  ApplicationStatus,
} from "@/src/lib/applications";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Get job ID from params
    const { id: jobId } = await context.params;

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

    // Check if user has Job_finder role
    if (!roles.includes("Job_finder")) {
      return NextResponse.json(
        { error: "Only job seekers can apply to jobs" },
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

    const { fullName, email, resumeUrl, coverLetter } = body as {
      fullName?: unknown;
      email?: unknown;
      resumeUrl?: unknown;
      coverLetter?: unknown;
    };

    // Validate application data
    const validation = validateApplicationData({
      fullName: typeof fullName === "string" ? fullName.trim() : "",
      email: typeof email === "string" ? email.trim() : "",
      resumeUrl: typeof resumeUrl === "string" ? resumeUrl.trim() : "",
      coverLetter:
        typeof coverLetter === "string" ? coverLetter.trim() : undefined,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if user can apply to this job
    const canApply = await canUserApplyToJob(jobId, userId);

    if (!canApply.allowed) {
      return NextResponse.json({ error: canApply.reason }, { status: 400 });
    }

    // Create application and increment job application count in a transaction
    const application = (await prisma.$transaction(async tx => {
      // Create the application
      const newApplication = await tx.jobApplication.create({
        data: {
          jobId,
          jobSeekerId: userId,
          fullName: (fullName as string).trim(),
          email: (email as string).trim(),
          resumeUrl: (resumeUrl as string).trim(),
          coverLetter:
            typeof coverLetter === "string" && coverLetter.trim()
              ? coverLetter.trim()
              : null,
          status: ApplicationStatus.Submitted,
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              recruiterId: true,
              category: true,
              employmentType: true,
              location: true,
              applicationDeadline: true,
              companyProfile: {
                select: {
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      // Increment job application count
      await tx.job.update({
        where: { id: jobId },
        data: { applicationCount: { increment: 1 } },
      });

      const applicantName = (fullName as string).trim();

      // Send Notification to Recruiter
      try {
        await createNotification({
          userId: newApplication.job.recruiterId,
          title: "New Job Application",
          content: `${applicantName} has applied for your job: ${newApplication.job.title}`,
          type: "NEW_APPLICATION",
          link: `/view-applicants/${jobId}`,
        });
      } catch (notifError) {
        // Log notification error but don't fail the application transaction
        console.error("Failed to create application notification:", notifError);
      }

      return newApplication;
    })) as any; // Temporary cast to bypass stubborn linting after schema change

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        application: {
          id: application.id,
          jobId: application.jobId,
          status: application.status,
          submittedAt: application.submittedAt,
          job: {
            id: application.job.id,
            title: application.job.title,
            category: application.job.category,
            employmentType: application.job.employmentType,
            location: application.job.location,
            applicationDeadline: application.job.applicationDeadline,
            company: {
              name: application.job.companyProfile.name,
              logoUrl: application.job.companyProfile.logoUrl,
            },
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error submitting application:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to submit application",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : "An error occurred while submitting your application",
      },
      { status: 500 },
    );
  }
}
