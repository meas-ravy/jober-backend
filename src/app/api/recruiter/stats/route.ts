import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the user is a recruiter
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { roles: true },
    });

    const isRecruiter = user?.roles.some(r => r.role === "Recruiter");
    if (!isRecruiter) {
      return NextResponse.json(
        { error: "Only recruiters can access this data" },
        { status: 403 },
      );
    }

    // Fetch the stats
    // 1. Total Post (active/pending/closed jobs)
    const totalJobs = await prisma.job.count({
      where: { recruiterId: session.user.id },
    });

    // 2. Fetch application counts by status for all jobs posted by this recruiter
    const recruiterJobs = await prisma.job.findMany({
      where: { recruiterId: session.user.id },
      select: { id: true },
    });

    const jobIds = recruiterJobs.map(j => j.id);

    // Total Applied
    const totalApplied = await prisma.jobApplication.count({
      where: { jobId: { in: jobIds } },
    });

    // Interview (Shortlisted in your schema)
    const totalInterview = await prisma.jobApplication.count({
      where: {
        jobId: { in: jobIds },
        status: "Shortlisted",
      },
    });

    // Confirm (Hired in your schema)
    const totalHired = await prisma.jobApplication.count({
      where: {
        jobId: { in: jobIds },
        status: "Hired",
      },
    });

    return NextResponse.json(
      {
        stats: {
          totalJobs,
          totalApplied,
          totalInterview,
          totalHired,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching recruiter stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
