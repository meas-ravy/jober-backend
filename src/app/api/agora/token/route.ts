import { NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";

export const runtime = "nodejs";

const APP_ID = process.env.AGORA_APP_ID!;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;

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

export async function GET(req: Request) {
  try {
    const { userId, type } = await getCurrentUser(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!APP_ID || !APP_CERTIFICATE) {
      return NextResponse.json(
        {
          error: "Agora credentials not configured",
          message: "Please add AGORA_APP_ID and AGORA_APP_CERTIFICATE to .env",
        },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);
    // channelName is the conversationId — used as the Agora "room"
    const channelName = searchParams.get("channelName");

    if (!channelName) {
      return NextResponse.json(
        { error: "channelName (conversationId) is required" },
        { status: 400 },
      );
    }

    // 1. Verify user is a participant of this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: channelName,
        OR: [
          { userId: type === "User" ? userId : undefined },
          { adminId: type === "Admin" ? userId : undefined },
        ],
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant of this conversation" },
        { status: 403 },
      );
    }

    // 2. Generate a numeric UID from the userId string
    // Agora needs a numeric UID (0 = Agora assigns one automatically)
    // We use 0 so Agora auto-assigns, and we track identity via channelName
    const uid = 0;
    const expirationInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationInSeconds;

    // 3. Build the Agora RTC Token (for video/voice calls)
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
    );

    return NextResponse.json({
      token,
      appId: APP_ID,
      channelName,
      uid,
      userId,
      expiresAt: privilegeExpiredTs,
    });
  } catch (error) {
    console.error("Agora token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
