import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export const runtime = "nodejs";

// GET /api/jobs/saved - Get all jobs saved by the current user
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
    let roles: string[];
    try {
      ({ userId, roles } = await verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (!roles.includes("Job_finder")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const totalCount = await prisma.savedJob.count({
      where: { userId },
    });

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        job: {
          include: {
            companyProfile: {
              select: {
                name: true,
                logoUrl: true,
                location: true,
              },
            },
          },
        },
      },
    });

    // Flattening the structure for easier UI consumption
    const jobs = savedJobs.map(item => item.job);

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
    console.error("Error fetching saved jobs:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
