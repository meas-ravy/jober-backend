import { rotateRefreshToken } from "@/src/lib/jwt";
import { NextResponse } from "next/server";

/**
 * Refresh access token using refresh token
 * Returns new access token and refresh token pair
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const refreshToken =
      body && typeof body === "object"
        ? (body as { refreshToken?: unknown }).refreshToken
        : undefined;

    if (typeof refreshToken !== "string" || refreshToken.length === 0) {
      return NextResponse.json(
        { error: "refreshToken is required" },
        { status: 400 },
      );
    }

    const tokens = await rotateRefreshToken(refreshToken);

    if (!tokens) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      roles: tokens.roles,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
