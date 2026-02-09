import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { RoleName } from "@/src/lib/role";
import { createNotification } from "@/src/lib/notifications";

export const runtime = "nodejs";
import { canRecruiterManageJob } from "@/src/lib/jobs";

function hasRecruiterRole(roles: RoleName[]): boolean {
  return roles.includes("Recruiter");
}

// PATCH /api/jobs/:id/submit - Submit job for admin review
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 },
      );
    }

    let userId: string;
    let roles: RoleName[];
    try {
      ({ userId, roles } = await verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (!hasRecruiterRole(roles)) {
      return NextResponse.json(
        { error: "Recruiter role required" },
        { status: 403 },
      );
    }

    const { id: jobId } = await params;

    // Get existing job
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        recruiterId: true,
        status: true,
        title: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check ownership
    if (!canRecruiterManageJob(roles, existingJob.recruiterId, userId)) {
      return NextResponse.json(
        { error: "You can only submit your own jobs" },
        { status: 403 },
      );
    }

    // Check if job can be submitted
    if (existingJob.status !== "Draft" && existingJob.status !== "Rejected") {
      return NextResponse.json(
        {
          error: `Cannot submit job with status ${existingJob.status}. Only Draft or Rejected jobs can be submitted.`,
        },
        { status: 400 },
      );
    }

    // Update job status to Pending
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "Pending",
        submittedAt: new Date(),
        // Clear rejection reason if resubmitting
        rejectionReason: null,
      },
      include: {
        companyProfile: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    // Create notifications for all admins
    try {
      const admins = await prisma.adminUser.findMany({
        select: { id: true }
      });

      for (const admin of admins) {
        await createNotification({
          adminId: admin.id,
          title: "New Job Submission",
          content: `A new job "${existingJob.title}" has been submitted for review.`,
          type: "NEW_JOB_SUBMISSION",
          link: `/admin/jobs/${jobId}`
        });
      }
    } catch (notifError) {
      console.error("Failed to notify admins of job submission:", notifError);
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message:
        "Job submitted for admin review. You will be notified once it's reviewed.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error submitting job:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
