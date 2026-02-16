import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

// GET /api/admin/dashboard/chart - Get real chart data for jobs vs applications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "90d";

    // Calculate the start date based on range
    const now = new Date();
    let daysBack = 90;
    if (range === "30d") daysBack = 30;
    else if (range === "7d") daysBack = 7;

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    // Fetch jobs created per day (published/active jobs)
    const jobs = await prisma.job.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ["Active", "Pending", "Rejected", "Closed", "Filled"] },
      },
      select: { createdAt: true },
    });

    // Fetch applications per day
    const applications = await prisma.jobApplication.findMany({
      where: {
        submittedAt: { gte: startDate },
      },
      select: { submittedAt: true },
    });

    // Group by day
    const chartMap = new Map<string, { jobs: number; applications: number }>();

    // Initialize all days in range
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      chartMap.set(key, { jobs: 0, applications: 0 });
    }

    // Count jobs per day
    for (const job of jobs) {
      const key = job.createdAt.toISOString().split("T")[0];
      const entry = chartMap.get(key);
      if (entry) entry.jobs++;
    }

    // Count applications per day
    for (const app of applications) {
      const key = app.submittedAt.toISOString().split("T")[0];
      const entry = chartMap.get(key);
      if (entry) entry.applications++;
    }

    // Convert to sorted array
    const chartData = Array.from(chartMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        jobs: counts.jobs,
        applications: counts.applications,
      }));

    return NextResponse.json({ chartData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 },
    );
  }
}
