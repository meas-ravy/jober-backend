import { NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";

export const runtime = "nodejs";

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

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

export async function GET(req: Request) {
  try {
    const { userId, type } = await getCurrentUser(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelName = searchParams.get("channelName"); // Use conversationId as channelName

    if (!channelName) {
      return NextResponse.json(
        { error: "channelName (conversationId) is required" },
        { status: 400 },
      );
    }

    if (!APP_ID || !APP_CERTIFICATE) {
      return NextResponse.json(
        {
          error: "Agora credentials not configured on server",
          message: "Please add AGORA_APP_ID and AGORA_APP_CERTIFICATE to .env",
        },
        { status: 500 },
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

    // 2. Set token expiration (e.g., 1 hour)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // 3. Generate Token
    // We use buildTokenWithUserAccount because our IDs are strings (CUIDs)
    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      userId,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs,
    );

    return NextResponse.json({
      token,
      appId: APP_ID,
      channelName,
      uid: userId, // The "Account" used for token generation
    });
  } catch (error) {
    console.error("Agora token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
