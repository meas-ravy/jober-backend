import { NextResponse } from "next/server";
import { generateToken04 } from "@/src/lib/zego-server-assistant";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";

export const runtime = "nodejs";

const APP_ID = process.env.ZEGO_APP_ID;
const SERVER_SECRET = process.env.ZEGO_SERVER_SECRET;

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
    const roomID = searchParams.get("roomID"); // Use conversationId as roomID

    if (!roomID) {
      return NextResponse.json(
        { error: "roomID (conversationId) is required" },
        { status: 400 },
      );
    }

    if (!APP_ID || !SERVER_SECRET) {
      return NextResponse.json(
        {
          error: "ZEGOCLOUD credentials not configured on server",
          message: "Please add ZEGO_APP_ID and ZEGO_SERVER_SECRET to .env",
        },
        { status: 500 },
      );
    }

    // 1. Verify user is a participant of this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: roomID,
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

    // 2. Setup Token Payload
    const appID = parseInt(APP_ID, 10); // Zego requires AppID to be a number
    const serverSecret = SERVER_SECRET;
    const userID = userId; // The unique ID of the user joining
    const effectiveTimeInSeconds = 3600; // Token valid for 1 hour
    const payload = ""; // Optional empty payload string

    // 3. Generate Token
    // ZEGOCLOUD uses generateToken04 for their latest UI Kits
    const token = generateToken04(
      appID,
      userID,
      serverSecret,
      effectiveTimeInSeconds,
      payload,
    );

    return NextResponse.json({
      token,
      appID: appID,
      roomID,
      userID,
    });
  } catch (error) {
    console.error("ZEGOCLOUD token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
