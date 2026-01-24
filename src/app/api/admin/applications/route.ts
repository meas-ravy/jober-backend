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

    // Fetch all job applications
    const applications = await prisma.jobApplication.findMany({
      include: {
        jobSeeker: {
          include: {
            jobSeekerProfile: true,
          },
        },
        job: {
          include: {
            companyProfile: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Transform data for frontend
    const transformedApplications = applications.map((app) => ({
      id: app.id,
      applicantName:
        app.jobSeeker.jobSeekerProfile?.fullName ||
        app.jobSeeker.name ||
        "N/A",
      applicantEmail:
        app.jobSeeker.jobSeekerProfile?.email || app.jobSeeker.email || "N/A",
      jobTitle: app.job.title,
      company: app.job.companyProfile.name,
      status: app.status,
      submittedAt: app.submittedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      resumeUrl: app.resumeUrl,
      coverLetter: app.coverLetter,
      recruiterNotes: app.recruiterNotes,
    }));

    return NextResponse.json(
      { applications: transformedApplications },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}
