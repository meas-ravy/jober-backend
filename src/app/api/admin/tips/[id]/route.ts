import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tip = await prisma.tip.findUnique({
      where: { id },
      include: {
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.tip.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, imageUrl, category, isPublished } = body;

    const tip = await prisma.tip.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(category !== undefined && { category }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ tip }, { status: 200 });
  } catch (error) {
    console.error("Error updating tip:", error);
    return NextResponse.json(
      { error: "Failed to update tip" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.tip.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }

    await prisma.tip.delete({ where: { id } });

    return NextResponse.json(
      { message: "Tip deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting tip:", error);
    return NextResponse.json(
      { error: "Failed to delete tip" },
      { status: 500 },
    );
  }
}
