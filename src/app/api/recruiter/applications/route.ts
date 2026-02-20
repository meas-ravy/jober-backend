import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/recruiter/applications
 * Returns all applications for all jobs posted by the authenticated recruiter.
 * Useful for a "Recent Applications" or "All Candidates" dashboard view.
 */
export async function GET(request: Request) {
  try {
    // 1. Authenticate user
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

    // 2. Check for Recruiter role
    if (!roles.includes("Recruiter")) {
      return NextResponse.json(
        { error: "Only recruiters can access this list" },
        { status: 403 },
      );
    }

    // 3. Parse query parameters
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

    // 4. Find all jobs belonging to this recruiter
    const recruiterJobs = await prisma.job.findMany({
      where: { recruiterId: userId },
      select: { id: true },
    });

    const jobIds = recruiterJobs.map(j => j.id);

    if (jobIds.length === 0) {
      return NextResponse.json({
        success: true,
        applications: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // 5. Build WHERE clause
    const where: any = {
      jobId: { in: jobIds },
    };

    if (status) {
      where.status = status;
    }

    // 6. Build ORDER BY
    const orderBy: any = {};
    if (sortBy === "submittedAt" || sortBy === "updatedAt") {
      orderBy[sortBy] = "desc";
    } else {
      orderBy.submittedAt = "desc";
    }

    // 7. Calculate pagination
    const skip = (page - 1) * limit;

    // 8. Fetch data
    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
          jobSeeker: {
            select: {
              id: true,
              phone: true,
              jobSeekerProfile: {
                select: {
                  fullName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.jobApplication.count({ where }),
    ]);

    // 9. Format response
    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      resumeUrl: app.resumeUrl,
      submittedAt: app.submittedAt,
      job: app.job,
      jobSeeker: {
        id: app.jobSeeker.id,
        phone: app.jobSeeker.phone,
        fullName: app.jobSeeker.jobSeekerProfile?.fullName || app.fullName, // Fallback to submitted name
        email: app.jobSeeker.jobSeekerProfile?.email || app.email, // Fallback to submitted email
        avatarUrl: app.jobSeeker.jobSeekerProfile?.avatarUrl,
      },
    }));

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching recruiter applications:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch applications", details: message },
      { status: 500 },
    );
  }
}
