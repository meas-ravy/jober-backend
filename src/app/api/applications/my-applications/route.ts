import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import {
  formatApplicationStatus,
  ApplicationStatusType,
} from "@/src/lib/applications";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  try {
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
        { error: "Only job seekers can view their applications" },
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
      jobSeekerId: userId,
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

    // Fetch applications with job details
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
              category: true,
              employmentType: true,
              location: true,
              applicationDeadline: true,
              status: true,
              companyProfile: {
                select: {
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.jobApplication.count({ where }),
    ]);

    // Format response
    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: formatApplicationStatus(app.status as ApplicationStatusType),
      submittedAt: app.submittedAt,
      updatedAt: app.updatedAt,
      reviewedAt: app.reviewedAt,
      job: {
        id: app.job.id,
        title: app.job.title,
        category: app.job.category,
        employmentType: app.job.employmentType,
        location: app.job.location,
        applicationDeadline: app.job.applicationDeadline,
        status: app.job.status,
        company: {
          name: app.job.companyProfile.name,
          logoUrl: app.job.companyProfile.logoUrl,
        },
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
    console.error("Error fetching applications:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to fetch applications",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : "An error occurred while fetching your applications",
      },
      { status: 500 },
    );
  }
}
