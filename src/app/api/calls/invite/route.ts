import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { messaging, db } from "@/src/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";

export const runtime = "nodejs";

// Helper to get current user (Admin session OR Mobile Bearer token)
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

export async function POST(req: Request) {
  try {
    const { userId, type } = await getCurrentUser(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      conversationId,
      callerName,
      callerAvatar: providedAvatar,
      calleeId,
      isVideoCall,
      callerRole, // New: 'Recruiter' or 'Job_finder'
    } = body;

    if (!conversationId || !calleeId) {
      return NextResponse.json(
        { error: "conversationId and calleeId are required" },
        { status: 400 },
      );
    }

    // 1. Verify sender is a participant and get context (Job, etc.)
    const senderParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        OR: [
          { userId: type === "User" ? userId : undefined },
          { adminId: type === "Admin" ? userId : undefined },
        ],
      },
      include: {
        user: {
          include: {
            jobSeekerProfile: true,
            companyProfile: true,
          },
        },
        admin: true,
        conversation: {
          include: { job: true },
        },
      },
    });

    if (!senderParticipant) {
      return NextResponse.json(
        { error: "You are not a participant of this conversation" },
        { status: 403 },
      );
    }

    // SMART PERSONA LOGIC (matches messaging)
    const conversation = senderParticipant.conversation;
    const isSenderRecruiter =
      conversation.jobId && userId === conversation.job?.recruiterId;

    let finalName = callerName || "";
    let finalAvatar = providedAvatar || "";

    if (senderParticipant.admin) {
      finalName = finalName || senderParticipant.admin.name || "Admin";
      finalAvatar = finalAvatar || senderParticipant.admin.avatarUrl || "";
    } else if (senderParticipant.user) {
      const { companyProfile, jobSeekerProfile, name } = senderParticipant.user;

      if (isSenderRecruiter || callerRole === "Recruiter") {
        // Context: Calling as Recruiter
        finalName = finalName || companyProfile?.name || name || "Company";
        finalAvatar = finalAvatar || companyProfile?.logoUrl || "";
      } else {
        // Context: Calling as Job Seeker
        finalName =
          finalName || jobSeekerProfile?.fullName || name || "Job Seeker";
        finalAvatar = finalAvatar || jobSeekerProfile?.avatarUrl || "";
      }
    }

    // 2. Clear previous call state in Firebase RTDB
    const callRef = db.ref(`calls/${conversationId}`);
    await callRef.set({
      state: "ringing",
      callerId: userId,
      callerName: finalName || "Someone",
      callerAvatar: finalAvatar,
      calleeId: calleeId,
      isVideoCall: isVideoCall || false,
      timestamp: Date.now(),
    });

    // 3. Fetch recipient device tokens
    const recipientTokens = await prisma.deviceToken.findMany({
      where: { userId: calleeId },
      select: { token: true },
    });

    if (recipientTokens.length > 0) {
      const tokens = recipientTokens.map((t: { token: string }) => t.token);

      // 4. Send FCM data message
      // Note: Data messages are handled by the app in background/foreground
      const message = {
        data: {
          type: "INCOMING_CALL",
          conversationId,
          callerName: finalName || "Someone",
          callerAvatar: finalAvatar,
          calleeId,
          isVideoCall: String(isVideoCall || false),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        tokens: tokens,
        android: {
          priority: "high" as const,
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
        },
      };

      try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(
          `Successfully sent call push to ${response.successCount} devices`,
        );
      } catch (fcmError) {
        console.error("FCM Send Error:", fcmError);
      }
    }

    // 5. Keep signaling active for 45 seconds (or handled by client timeout)
    // We don't need to await anything here, just return success
    return NextResponse.json({ success: true, conversationId });
  } catch (error) {
    console.error("Call invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
