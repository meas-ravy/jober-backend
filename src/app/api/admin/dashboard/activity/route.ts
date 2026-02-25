import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

// GET /api/admin/dashboard/activity - Get recent activity for the dashboard
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch pending jobs (awaiting review)
    const pendingJobs = await prisma.job.findMany({
      where: { status: "Pending" },
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        submittedAt: true,
        companyProfile: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    // Fetch recent applications
    const recentApplications = await prisma.jobApplication.findMany({
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        submittedAt: true,
        job: {
          select: {
            id: true,
            title: true,
            companyProfile: {
              select: {
                name: true,
              },
            },
          },
        },
        jobSeeker: {
          select: {
            name: true,
            email: true,
            jobSeekerProfile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
            oauthAccounts: {
              select: {
                avatarUrl: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Fetch quick stats for action items
    const [pendingCount, pendingVerifications] = await Promise.all([
      prisma.job.count({ where: { status: "Pending" } }),
      prisma.companyProfile.count({ where: { isVerified: false } }),
    ]);

    return NextResponse.json(
      {
        pendingJobs,
        recentApplications,
        actionItems: {
          pendingJobReviews: pendingCount,
          pendingVerifications,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching dashboard activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data" },
      { status: 500 },
    );
  }
}
