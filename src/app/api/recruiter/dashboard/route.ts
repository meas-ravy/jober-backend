import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { startOfMonth, subMonths, format, endOfMonth } from "date-fns";

export const runtime = "nodejs";

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
        { error: "Only recruiters can access the dashboard" },
        { status: 403 },
      );
    }

    // 3. Get all jobs by this recruiter
    const recruiterJobs = await prisma.job.findMany({
      where: { recruiterId: userId },
      select: {
        id: true,
        title: true,
      },
    });

    const jobIds = recruiterJobs.map(j => j.id);

    if (jobIds.length === 0) {
      return NextResponse.json({
        success: true,
        summary: { applied: 0, interview: 0, confirm: 0 },
        chart: [],
        jobs: [],
      });
    }

    // 4. Calculate Summary Stats
    const totalApplied = await prisma.jobApplication.count({
      where: { jobId: { in: jobIds } },
    });

    const totalInterview = await prisma.jobApplication.count({
      where: {
        jobId: { in: jobIds },
        status: { in: ["Shortlisted", "UnderReview"] }, // Mapping "Interview" to these
      },
    });

    const totalConfirm = await prisma.jobApplication.count({
      where: {
        jobId: { in: jobIds },
        status: "Hired",
      },
    });

    // 5. Calculate Chart Data (Last 12 Months)
    const chartData = [];
    const now = new Date();

    // We'll fetch applications from the last 12 months to aggregate
    const twelveMonthsAgo = startOfMonth(subMonths(now, 11));

    const applications = await prisma.jobApplication.findMany({
      where: {
        jobId: { in: jobIds },
        submittedAt: { gte: twelveMonthsAgo },
      },
      select: {
        status: true,
        submittedAt: true,
      },
    });

    // Aggregate by month
    for (let i = 11; i >= 0; i--) {
      const monthDate = startOfMonth(subMonths(now, i));
      const monthStr = format(monthDate, "MMM");

      const monthApps = applications.filter(
        app =>
          app.submittedAt >= monthDate &&
          app.submittedAt <= endOfMonth(monthDate),
      );

      chartData.push({
        month: monthStr,
        applied: monthApps.length,
        interview: monthApps.filter(a =>
          ["Shortlisted", "UnderReview"].includes(a.status),
        ).length,
        confirm: monthApps.filter(a => a.status === "Hired").length,
      });
    }

    // 6. Get Job Breakdown (Counts per job)
    const jobsWithCounts = await Promise.all(
      recruiterJobs.map(async job => {
        const counts = await prisma.jobApplication.groupBy({
          by: ["status"],
          where: { jobId: job.id },
          _count: true,
        });

        const jobApplied = counts.reduce((acc, c) => acc + c._count, 0);
        const jobInterview = counts
          .filter(c => ["Shortlisted", "UnderReview"].includes(c.status))
          .reduce((acc, c) => acc + c._count, 0);
        const jobConfirm = counts
          .filter(c => c.status === "Hired")
          .reduce((acc, c) => acc + c._count, 0);

        return {
          id: job.id,
          title: job.title,
          applied: jobApplied,
          interview: jobInterview,
          confirm: jobConfirm,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      summary: {
        applied: totalApplied,
        interview: totalInterview,
        confirm: totalConfirm,
      },
      chart: chartData,
      jobs: jobsWithCounts,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
