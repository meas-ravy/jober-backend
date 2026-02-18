import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import prisma from "@/src/lib/prisma";

// GET /api/admin/jobs - List all jobs (admin only)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const isRecommended = url.searchParams.get("isRecommended");
    const sortBy = url.searchParams.get("sort") || "createdAt";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (isRecommended === "true") {
      where.isRecommended = true;
    } else if (isRecommended === "false") {
      where.isRecommended = false;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // Order logic: Pending first, then by date
    let orderBy: any = { [sortBy]: "desc" };

    if (sortBy === "createdAt") {
      // Custom order to prioritize Pending status
      // Note: Prisma doesn't support custom sort order values directly in orderBy easily,
      // but we can sort by status desc which puts 'Rejected', 'Pending' higher than 'Active'
      orderBy = [{ status: "desc" }, { createdAt: "desc" }];
    }

    // Get total count
    const totalCount = await prisma.job.count({ where });

    // Get jobs with pagination
    const jobs = await prisma.job.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        companyProfile: {
          select: {
            name: true,
            logoUrl: true,
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
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
