import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tips = await prisma.tip.findMany({
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tips }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tips:", error);
    return NextResponse.json(
      { error: "Failed to fetch tips" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, imageUrl, category, isPublished } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 },
      );
    }

    // Find the admin user by session email
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email! },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 },
      );
    }

    const tip = await prisma.tip.create({
      data: {
        title,
        content,
        imageUrl: imageUrl || null,
        category: category || "Career",
        isPublished: isPublished ?? false,
        authorId: adminUser.id,
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ tip }, { status: 201 });
  } catch (error) {
    console.error("Error creating tip:", error);
    return NextResponse.json(
      { error: "Failed to create tip" },
      { status: 500 },
    );
  }
}
