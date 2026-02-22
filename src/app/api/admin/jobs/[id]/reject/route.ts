import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import prisma from "@/src/lib/prisma";
import { createNotification } from "@/src/lib/notifications";

// POST /api/admin/jobs/:id/reject - Reject a pending job (admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;

    // Look up AdminUser by session email
    const adminUser = await prisma.adminUser.findFirst({
      where: { email: session.user.email },
      select: { id: true },
    });

    // Parse request body
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { reason } = body as { reason?: unknown };

    // Validate rejection reason
    if (typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 },
      );
    }

    if (reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Rejection reason must be at least 10 characters" },
        { status: 400 },
      );
    }

    if (reason.trim().length > 500) {
      return NextResponse.json(
        { error: "Rejection reason must not exceed 500 characters" },
        { status: 400 },
      );
    }

    // Get existing job
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        title: true,
        recruiterId: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if job is pending
    if (existingJob.status !== "Pending") {
      return NextResponse.json(
        {
          error: `Cannot reject job with status ${existingJob.status}. Only Pending jobs can be rejected.`,
        },
        { status: 400 },
      );
    }

    // Reject job
    const rejectedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "Rejected",
        reviewedAt: new Date(),
        reviewedBy: adminUser?.id ?? null,
        rejectionReason: reason.trim(),
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

    // Notify recruiter
    try {
      await createNotification({
        userId: existingJob.recruiterId,
        title: "Job Rejected",
        content: `Your job post "${existingJob.title}" was not approved. Reason: ${reason.trim()}`,
        type: "JOB_STATUS_CHANGE",
        link: "/recruiter",
      });
    } catch (notifError) {
      console.error("Failed to notify recruiter of job rejection:", notifError);
    }

    return NextResponse.json({
      success: true,
      job: rejectedJob,
      message: "Job rejected. Recruiter will be notified.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error rejecting job:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
