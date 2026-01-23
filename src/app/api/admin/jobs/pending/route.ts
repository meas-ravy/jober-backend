import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import prisma from "@/src/lib/prisma";

// GET /api/admin/jobs/pending - List pending jobs for review (admin only)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    // Get total count
    const totalCount = await prisma.job.count({
      where: { status: "Pending" },
    });

    // Get pending jobs with pagination
    const jobs = await prisma.job.findMany({
      where: { status: "Pending" },
      orderBy: {
        submittedAt: "asc", // Oldest submissions first
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        companyProfile: {
          select: {
            name: true,
            logoUrl: true,
            location: true,
            description: true,
          },
        },
        recruiter: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching pending jobs:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
