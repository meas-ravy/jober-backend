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

    // Fetch all users with their roles
    const users = await prisma.user.findMany({
      include: {
        roles: true,
        jobSeekerProfile: true,
        companyProfile: true,
        oauthAccounts: {
          select: {
            avatarUrl: true,
          },
          take: 1,
        },
        _count: {
          select: {
            applications: true,
            postedJobs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for frontend
    const transformedUsers = users.map(user => {
      const primaryRole = user.roles[0]?.role || "Job_finder";
      const roleName =
        primaryRole === "Job_finder"
          ? "Job Seeker"
          : primaryRole === "Recruiter"
            ? "Recruiter"
            : "Admin";

      // Determine status based on profile completion
      let status: "Active" | "Pending" | "Suspended" = "Active";
      if (primaryRole === "Job_finder" && !user.jobSeekerProfile) {
        status = "Pending";
      } else if (primaryRole === "Recruiter" && !user.companyProfile) {
        status = "Pending";
      }

      const displayName =
        user.jobSeekerProfile?.fullName ||
        user.companyProfile?.name ||
        user.name ||
        "N/A";

      const avatarUrl =
        user.jobSeekerProfile?.avatarUrl ||
        user.companyProfile?.logoUrl ||
        user.oauthAccounts?.[0]?.avatarUrl ||
        null;

      return {
        id: user.id,
        name: displayName,
        avatar: avatarUrl,
        email:
          user.jobSeekerProfile?.email ||
          user.companyProfile?.contactEmail ||
          user.email ||
          "No email",
        phone: user.phone || "N/A",
        role: roleName,
        status,
        joined: user.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        applicationsCount: user._count.applications,
        jobsCount: user._count.postedJobs,
      };
    });

    return NextResponse.json({ users: transformedUsers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
