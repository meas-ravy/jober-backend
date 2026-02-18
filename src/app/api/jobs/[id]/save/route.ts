import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export const runtime = "nodejs";

// POST /api/jobs/[id]/save - Save or Unsave a job
export async function POST(
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
    let roles: string[];
    try {
      ({ userId, roles } = await verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (!roles.includes("Job_finder")) {
      return NextResponse.json(
        { error: "Role mismatch. Only Job Seekers can save jobs." },
        { status: 403 },
      );
    }

    const { id: jobId } = await params;

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { status: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Checking if already saved
    const existingSave = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    if (existingSave) {
      // Unsave logic: Remove from bookmarks
      await prisma.savedJob.delete({
        where: {
          userId_jobId: {
            userId,
            jobId,
          },
        },
      });

      return NextResponse.json({
        success: true,
        isSaved: false,
        message: "Job removed from saved list",
      });
    } else {
      // Save logic: Add to bookmarks
      await prisma.savedJob.create({
        data: {
          userId,
          jobId,
        },
      });

      return NextResponse.json({
        success: true,
        isSaved: true,
        message: "Job saved successfully",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error toggling save job:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
