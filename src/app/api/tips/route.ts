import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isPublished: true };
    if (category) {
      where.category = category;
    }

    const [tips, total] = await Promise.all([
      prisma.tip.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          imageUrl: true,
          category: true,
          createdAt: true,
          author: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.tip.count({ where }),
    ]);

    return NextResponse.json(
      {
        tips,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching tips:", error);
    return NextResponse.json(
      { error: "Failed to fetch tips" },
      { status: 500 },
    );
  }
}
