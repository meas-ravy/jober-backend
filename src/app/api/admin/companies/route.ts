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

    // Fetch all company profiles
    const companies = await prisma.companyProfile.findMany({
      include: {
        user: {
          include: {
            roles: true,
          },
        },
        jobs: {
          where: {
            status: "Active",
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Count recruiters per company (users who posted jobs for this company)
    const transformedCompanies = await Promise.all(
      companies.map(async company => {
        // Count unique recruiters who posted jobs for this company
        const recruitersCount = await prisma.job.findMany({
          where: {
            companyProfileId: company.id,
          },
          distinct: ["recruiterId"],
          select: {
            recruiterId: true,
          },
        });

        const status: "Pending" | "Verified" = company.isVerified
          ? "Verified"
          : "Pending";

        return {
          id: company.id,
          name: company.name,
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          location: company.location,
          description: company.description,
          logoUrl: company.logoUrl,
          recruiters: recruitersCount.length || 1, // At least the owner
          jobsActive: company.jobs.length,
          jobsTotal: company._count.jobs,
          status,
          submitted: company.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
      }),
    );

    return NextResponse.json(
      { companies: transformedCompanies },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 },
    );
  }
}
