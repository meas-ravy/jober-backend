import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import { createNotification } from "@/src/lib/notifications";

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

/**
 * POST /api/agora/call-signal
 * Triggers a high-priority push notification to the recipient of a call.
 */
export async function POST(req: Request) {
  try {
    const { userId: callerId, type: callerType } = await getCurrentUser(req);

    if (!callerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { conversationId, signalType } = body; // signalType: "START_CALL" | "END_CALL" | "MISSED_CALL"

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 },
      );
    }

    // 1. Verify caller is a participant and find the recipient
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                jobSeekerProfile: { select: { fullName: true } },
              },
            },
            admin: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const callerParticipant = conversation.participants.find(p =>
      callerType === "User" ? p.userId === callerId : p.adminId === callerId,
    );

    if (!callerParticipant) {
      return NextResponse.json(
        { error: "Forbidden: You are not in this conversation" },
        { status: 403 },
      );
    }

    const recipient = conversation.participants.find(p =>
      callerType === "User"
        ? p.userId !== callerId || p.adminId !== null
        : p.adminId !== callerId || p.userId !== null,
    );

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 },
      );
    }

    const callerName =
      callerParticipant.admin?.name ||
      callerParticipant.user?.jobSeekerProfile?.fullName ||
      callerParticipant.user?.name ||
      "Someone";

    // 2. Handle Signal Types
    if (signalType === "START_CALL") {
      // Send High-Priority INCOMING_CALL signal
      await createNotification({
        userId: recipient.userId || undefined,
        adminId: recipient.adminId || undefined,
        title: "Incoming Call",
        content: `${callerName} is calling you...`,
        type: "INCOMING_CALL" as any, // Cast to any until prisma generates
        link: `/call/${conversationId}`,
      });
    } else if (signalType === "MISSED_CALL") {
      // Send standard CALL_MISSED notification
      await createNotification({
        userId: recipient.userId || undefined,
        adminId: recipient.adminId || undefined,
        title: "Missed Call",
        content: `You missed a call from ${callerName}`,
        type: "CALL_MISSED" as any,
        link: `/messages/${conversationId}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Call signaling error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
