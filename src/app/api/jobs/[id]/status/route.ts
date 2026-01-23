import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { RoleName } from "@/src/lib/role";
import {
  canRecruiterManageJob,
  getValidStatusTransitions,
  isValidJobStatus,
  type JobStatus,
} from "@/src/lib/jobs";

function hasRecruiterRole(roles: RoleName[]): boolean {
  return roles.includes("Recruiter");
}

// PATCH /api/jobs/:id/status - Change job status (pause/resume/close/filled)
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
      ({ userId, roles } = verifyAccessToken(token));
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

    // Parse request body
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { status: newStatus } = body as { status?: unknown };

    if (!isValidJobStatus(newStatus)) {
      return NextResponse.json(
        { error: "Invalid job status" },
        { status: 400 },
      );
    }

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
        { error: "You can only manage your own jobs" },
        { status: 403 },
      );
    }

    // Check if transition is valid
    const validTransitions = getValidStatusTransitions(
      existingJob.status as JobStatus,
      "Recruiter",
    );

    if (!validTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot change job status from ${existingJob.status} to ${newStatus}. Valid transitions: ${validTransitions.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Prepare update data
    const updateData: {
      status: JobStatus;
      closedAt?: Date;
    } = {
      status: newStatus,
    };

    // Set closedAt timestamp when closing or filling
    if (newStatus === "Closed" || newStatus === "Filled") {
      updateData.closedAt = new Date();
    }

    // Update job status
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        companyProfile: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    const statusMessages: Record<JobStatus, string> = {
      Draft: "Job saved as draft",
      Pending: "Job submitted for review",
      Rejected: "Job rejected",
      Active: "Job is now active and visible to job seekers",
      Paused: "Job paused. It's no longer visible to job seekers.",
      Closed: "Job closed. No longer accepting applications.",
      Filled: "Job marked as filled.",
    };

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: statusMessages[newStatus],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error changing job status:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
