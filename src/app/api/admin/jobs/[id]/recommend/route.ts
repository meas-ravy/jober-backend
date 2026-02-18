import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import prisma from "@/src/lib/prisma";

export const runtime = "nodejs";

// PATCH /api/admin/jobs/:id/recommend - Toggle job recommendation status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
      select: { isRecommended: true, status: true },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (existingJob.status !== "Active") {
      return NextResponse.json(
        { error: "Only active jobs can be recommended" },
        { status: 400 },
      );
    }

    // Toggle logic
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { isRecommended: !existingJob.isRecommended },
    });

    return NextResponse.json({
      success: true,
      isRecommended: updatedJob.isRecommended,
      message: updatedJob.isRecommended
        ? "Job added to recommendations"
        : "Job removed from recommendations",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error toggling job recommendation:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
