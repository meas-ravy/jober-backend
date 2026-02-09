import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { RoleName } from "@/src/lib/role";

export const runtime = "nodejs";
import { validateJobData, type JobData } from "@/src/lib/jobs";

function hasRecruiterRole(roles: RoleName[]): boolean {
  return roles.includes("Recruiter");
}

// POST /api/jobs - Create new job as Draft
export async function POST(request: Request) {
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

    // Check if recruiter has company profile
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!companyProfile) {
      return NextResponse.json(
        {
          error:
            "Company profile required. Please create your company profile first.",
        },
        { status: 400 },
      );
    }

    // Check active jobs limit (max 50)
    const activeJobsCount = await prisma.job.count({
      where: {
        recruiterId: userId,
        status: { in: ["Active", "Pending"] },
      },
    });

    if (activeJobsCount >= 50) {
      return NextResponse.json(
        {
          error:
            "Maximum active jobs limit reached (50). Please close some jobs before creating new ones.",
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

    // Create job
    const job = await prisma.job.create({
      data: {
        recruiterId: userId,
        companyProfileId: companyProfile.id,
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
        status: "Draft",
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
      job,
      message:
        "Job created as draft. Submit for admin review when ready to publish.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating job:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/jobs - List recruiter's jobs
export async function GET(request: Request) {
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

    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const sortBy = url.searchParams.get("sort") || "createdAt";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {
      recruiterId: userId,
    };

    if (status) {
      where.status = status;
    }

    // Get total count
    const totalCount = await prisma.job.count({ where });

    // Get jobs with pagination
    const jobs = await prisma.job.findMany({
      where,
      orderBy: {
        [sortBy]: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        companyProfile: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
