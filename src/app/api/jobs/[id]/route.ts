import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { RoleName } from "@/src/lib/role";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
import {
  validateJobData,
  canRecruiterManageJob,
  canEditJob,
  canDeleteJob,
  type JobData,
} from "@/src/lib/jobs";

function hasRecruiterRole(roles: RoleName[]): boolean {
  return roles.includes("Recruiter");
}

function hasJobFinderRole(roles: RoleName[]): boolean {
  return roles.includes("Job_finder");
}

// GET /api/jobs/:id - Get job details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    let userId: string;
    let roles: RoleName[] = [];
    
    // 1. Check for Admin Session first (React Web)
    const session = await getServerSession(authOptions);
    if (session?.user?.role === "Admin" && session.user.id) {
      userId = session.user.id;
      roles = ["Admin"];
    } else {
      // 2. Check for Token (Flutter Mobile or Web Seeker/Recruiter)
      const token = getBearerToken(request);
      if (!token) {
        return NextResponse.json(
          { error: "Authorization token is required" },
          { status: 401 },
        );
      }

      try {
        const verified = await verifyAccessToken(token);
        userId = verified.userId;
        roles = verified.roles;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Invalid access token";
        return NextResponse.json({ error: message }, { status: 401 });
      }
    }

    const { id: jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        companyProfile: {
          select: {
            name: true,
            logoUrl: true,
            location: true,
            contactEmail: true,
            contactPhone: true,
            description: true,
          },
        },
        recruiter: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Access control
    const isRecruiter = hasRecruiterRole(roles);
    const isJobFinder = hasJobFinderRole(roles);
    const isAdmin = roles.includes("Admin");
    const isOwner = job.recruiterId === userId;

    if (isAdmin) {
      // Admins can see everything
    } else if (isRecruiter) {
      // Recruiters can only view their own jobs
      if (!isOwner) {
        return NextResponse.json(
          { error: "You can only view your own jobs" },
          { status: 403 },
        );
      }
    } else if (isJobFinder) {
      // Job finders can only view Active jobs
      if (job.status !== "Active") {
        return NextResponse.json(
          { error: "Job not available" },
          { status: 404 },
        );
      }

      // Increment view count for job finders
      await prisma.job.update({
        where: { id: jobId },
        data: { viewCount: { increment: 1 } },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid role for this operation" },
        { status: 403 },
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching job:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/jobs/:id - Update job
export async function PUT(
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
        applicationCount: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check ownership
    if (!canRecruiterManageJob(roles, existingJob.recruiterId, userId)) {
      return NextResponse.json(
        { error: "You can only update your own jobs" },
        { status: 403 },
      );
    }

    // Check if job can be edited
    if (!canEditJob(existingJob.status)) {
      return NextResponse.json(
        {
          error: `Cannot edit job with status ${existingJob.status}. Only Draft and Rejected jobs can be edited.`,
        },
        { status: 400 },
      );
    }

    // Parse and validate request body
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const jobData = body as Partial<JobData>;

    // Validate job data
    const validation = validateJobData(jobData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", errors: validation.errors },
        { status: 400 },
      );
    }

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: jobData.title!.trim(),
        description: jobData.description!.trim(),
        location: jobData.location!.trim(),
        category: jobData.category!,
        employmentType: jobData.employmentType!,
        experienceLevel: jobData.experienceLevel!,
        workArrangement: jobData.workArrangement || "OnSite",
        salaryType: jobData.salaryType!,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        salaryFixed: jobData.salaryFixed,
        salaryCurrency: jobData.salaryCurrency || "USD",
        salaryPeriod: jobData.salaryPeriod || "Year",
        requirements: jobData.requirements!.trim(),
        responsibilities: jobData.responsibilities!.trim(),
        benefits: jobData.benefits?.trim() || null,
        skills: jobData.skills?.trim() || null,
        applicationDeadline: new Date(jobData.applicationDeadline!),
        positionsAvailable: jobData.positionsAvailable || 1,
        jobImageUrl: jobData.jobImageUrl?.trim() || null,
      },
      include: {
        companyProfile: {
          select: {
            name: true,
            logoUrl: true,
            location: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: "Job updated successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating job:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/jobs/:id - Delete job
export async function DELETE(
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
        applicationCount: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check ownership
    if (!canRecruiterManageJob(roles, existingJob.recruiterId, userId)) {
      return NextResponse.json(
        { error: "You can only delete your own jobs" },
        { status: 403 },
      );
    }

    // Check if job can be deleted
    if (!canDeleteJob(existingJob.status, existingJob.applicationCount)) {
      return NextResponse.json(
        {
          error:
            "Cannot delete job. Only Draft or Rejected jobs with no applications can be deleted.",
        },
        { status: 400 },
      );
    }

    // Delete job
    await prisma.job.delete({
      where: { id: jobId },
    });

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting job:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
