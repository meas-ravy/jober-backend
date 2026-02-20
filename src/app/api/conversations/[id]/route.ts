import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";

export const runtime = "nodejs";

// Helper to get current user
async function getCurrentUser(req: Request) {
  let userId: string | null = null;
  let type: "User" | "Admin" | null = null;

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    userId = session.user.id;
    type = "Admin";
  }

  if (!userId) {
    const token = getBearerToken(req);
    if (token) {
      try {
        const verified = await verifyAccessToken(token);
        userId = verified.userId;
        type = "User";
      } catch (e) {
        console.error("Token verification failed:", e);
      }
    }
  }

  return { userId, type };
}

// PATCH /api/conversations/[id]
// Used to sync last message metadata from Firebase to Postgres
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, type } = await getCurrentUser(req);
  const { id } = await params;

  if (!userId || !type) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { lastMessageContent } = body;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        OR: [
          { userId: type === "User" ? userId : undefined },
          { adminId: type === "Admin" ? userId : undefined },
        ],
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageContent,
        lastMessageAt: new Date(),
      },
      include: {
        participants: true,
      },
    });

    // Send Notification to the other participant(s)
    try {
      const otherParticipants = updatedConversation.participants.filter(p =>
        type === "User"
          ? p.userId !== userId || p.adminId !== null
          : p.adminId !== userId || p.userId !== null,
      );

      const { createNotification } = await import("@/src/lib/notifications");

      for (const p of otherParticipants) {
        await createNotification({
          userId: p.userId || undefined,
          adminId: p.adminId || undefined,
          title: "New Message",
          content:
            lastMessageContent.length > 50
              ? lastMessageContent.substring(0, 47) + "..."
              : lastMessageContent,
          type: "NEW_MESSAGE",
          link: `/messages/${id}`, // Flutter handles this or React dashboard
        });
      }
    } catch (notifError) {
      console.error("Failed to send message notification:", notifError);
    }

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// GET /api/conversations/[id]
// Get single conversation details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, type } = await getCurrentUser(req);
  const { id } = await params;

  if (!userId || !type) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                jobSeekerProfile: {
                  select: { avatarUrl: true, fullName: true },
                },
                companyProfile: { select: { logoUrl: true, name: true } },
              },
            },
            admin: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // Verify participant
    const isParticipant = conversation.participants.some(p =>
      type === "User" ? p.userId === userId : p.adminId === userId,
    );

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
