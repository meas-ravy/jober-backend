import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const tip = await prisma.tip.findUnique({
      where: { id, isPublished: true },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!tip) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }

    return NextResponse.json({ tip }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tip:", error);
    return NextResponse.json({ error: "Failed to fetch tip" }, { status: 500 });
  }
}
