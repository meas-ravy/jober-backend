import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch current month stats
    const [
      jobSeekersTotal,
      jobSeekersThisMonth,
      jobSeekersLastMonth,
      recruitersTotal,
      recruitersThisMonth,
      recruitersLastMonth,
      activeJobs,
      activeJobsThisWeek,
      activeJobsLastWeek,
      applicationsToday,
      applicationsYesterday,
    ] = await Promise.all([
      // Job Seekers
      prisma.userRole.count({
        where: { role: "Job_finder" },
      }),
      prisma.userRole.count({
        where: {
          role: "Job_finder",
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.userRole.count({
        where: {
          role: "Job_finder",
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfMonth,
          },
        },
      }),
      // Recruiters
      prisma.userRole.count({
        where: { role: "Recruiter" },
      }),
      prisma.userRole.count({
        where: {
          role: "Recruiter",
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.userRole.count({
        where: {
          role: "Recruiter",
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfMonth,
          },
        },
      }),
      // Active Jobs
      prisma.job.count({
        where: { status: "Active" },
      }),
      prisma.job.count({
        where: {
          status: "Active",
          publishedAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.job.count({
        where: {
          status: "Active",
          publishedAt: {
            gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Applications Today
      prisma.jobApplication.count({
        where: {
          submittedAt: { gte: startOfToday },
        },
      }),
      prisma.jobApplication.count({
        where: {
          submittedAt: {
            gte: new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000),
            lt: startOfToday,
          },
        },
      }),
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const stats = {
      jobSeekers: {
        total: jobSeekersTotal,
        growth: calculateGrowth(jobSeekersThisMonth, jobSeekersLastMonth),
      },
      recruiters: {
        total: recruitersTotal,
        growth: calculateGrowth(recruitersThisMonth, recruitersLastMonth),
      },
      activeJobs: {
        total: activeJobs,
        growth: calculateGrowth(activeJobsThisWeek, activeJobsLastWeek),
      },
      applicationsToday: {
        total: applicationsToday,
        growth: calculateGrowth(applicationsToday, applicationsYesterday),
      },
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
