import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import prisma from "@/src/lib/prisma";
import { createNotification } from "@/src/lib/notifications";

// POST /api/admin/jobs/:id/approve - Approve a pending job (admin only)
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
          error: `Cannot approve job with status ${existingJob.status}. Only Pending jobs can be approved.`,
        },
        { status: 400 },
      );
    }

    // Approve job
    const approvedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "Active",
        reviewedAt: new Date(),
        reviewedBy: adminUser?.id ?? null,
        rejectionReason: null, // Clear any previous rejection reason
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
        userId: approvedJob.recruiterId,
        title: "Job Approved",
        content: `Your job post "${approvedJob.title}" has been approved and is now live!`,
        type: "JOB_STATUS_CHANGE",
        link: "/recruiter",
        imageUrl: approvedJob.companyProfile?.logoUrl || undefined,
      });
    } catch (notifError) {
      console.error("Failed to notify recruiter of job approval:", notifError);
    }

    return NextResponse.json({
      success: true,
      job: approvedJob,
      message: "Job approved and is now active",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error approving job:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
