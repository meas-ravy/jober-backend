import { NextResponse } from "next/server";
import { JOB_CATEGORIES } from "@/src/lib/jobs";
import prisma from "@/src/lib/prisma";

export const runtime = "nodejs";

// GET /api/jobs/categories - Get all job categories and their active job counts
export async function GET() {
  try {
    // Fetch counts for each category to help UI show "Tech (12)" or hide empty ones
    const activeJobs = await prisma.job.groupBy({
      by: ["category"],
      where: { status: "Active" },
      _count: {
        _all: true,
      },
    });

    const categoryCounts = activeJobs.reduce(
      (acc, curr) => {
        acc[curr.category] = curr._count._all;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Combine with the full list of categories defined in the system
    const categories = JOB_CATEGORIES.map(cat => ({
      name: cat,
      count: categoryCounts[cat] || 0,
    }));

    return NextResponse.json({
      categories,
      totalActiveJobs: activeJobs.reduce(
        (sum, curr) => sum + curr._count._all,
        0,
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
