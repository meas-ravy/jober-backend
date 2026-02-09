import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/notifications/register-device
 * Registers an FCM device token for the authenticated user.
 * Used by Flutter (Android/iOS) to enable push notifications.
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      ({ userId } = await verifyAccessToken(token));
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired access token" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const { deviceToken, platform } = body;

    if (!deviceToken || typeof deviceToken !== "string") {
      return NextResponse.json(
        { error: "deviceToken is required and must be a string" },
        { status: 400 }
      );
    }

    // 3. Register or update the token
    // We use upsert based on the unique 'token' field.
    // If the token already exists (even for another user), we reassign it to the current user.
    await prisma.deviceToken.upsert({
      where: { token: deviceToken },
      update: {
        userId,
        platform: platform || null,
        updatedAt: new Date(),
      },
      create: {
        token: deviceToken,
        userId,
        platform: platform || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Device token registered successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Device registration error    :", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
