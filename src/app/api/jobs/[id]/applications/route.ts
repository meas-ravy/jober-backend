import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(
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

    // Check if user has Recruiter role
    if (!roles.includes("Recruiter")) {
      return NextResponse.json(
        { error: "Only recruiters can view job applications" },
        { status: 403 },
      );
    }

    // Verify the job exists and belongs to the recruiter
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        recruiterId: true,
        title: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.recruiterId !== userId) {
      return NextResponse.json(
        { error: "You do not have permission to view applications for this job" },
        { status: 403 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "submittedAt";
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || String(DEFAULT_PAGE)),
    );
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT))),
    );

    // Build where clause
    const where: any = {
      jobId,
    };

    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "submittedAt" || sortBy === "updatedAt") {
      orderBy[sortBy] = "desc";
    } else {
      orderBy.submittedAt = "desc";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch applications with job seeker details
    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          jobSeeker: {
            select: {
              id: true,
              phone: true,
              jobSeekerProfile: {
                select: {
                  fullName: true,
                  email: true,
                  avatarUrl: true,
                  gender: true,
                  dateOfBirth: true,
                },
              },
            },
          },
        },
      }),
      prisma.jobApplication.count({ where }),
    ]);

    // Format response
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      status: app.status,
      resumeUrl: app.resumeUrl,
      coverLetter: app.coverLetter,
      recruiterNotes: app.recruiterNotes,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      updatedAt: app.updatedAt,
      jobSeeker: {
        id: app.jobSeeker.id,
        phone: app.jobSeeker.phone,
        profile: app.jobSeeker.jobSeekerProfile
          ? {
              fullName: app.jobSeeker.jobSeekerProfile.fullName,
              email: app.jobSeeker.jobSeekerProfile.email,
              avatarUrl: app.jobSeeker.jobSeekerProfile.avatarUrl,
              gender: app.jobSeeker.jobSeekerProfile.gender,
              dateOfBirth: app.jobSeeker.jobSeekerProfile.dateOfBirth,
            }
          : null,
      },
    }));

    // Get status summary
    const statusCounts = await prisma.jobApplication.groupBy({
      by: ["status"],
      where: { jobId },
      _count: true,
    });

    const summary = statusCounts.reduce((acc: any, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      job: {
        id: jobId,
        title: job.title,
      },
      applications: formattedApplications,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching job applications:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to fetch job applications",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : "An error occurred while fetching applications",
      },
      { status: 500 },
    );
  }
}
