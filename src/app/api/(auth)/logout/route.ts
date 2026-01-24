import { revokeRefreshToken, verifyAccessToken } from "@/src/lib/jwt";
import { revokeAllUserOAuthTokens } from "@/src/lib/oauth";
import { NextResponse } from "next/server";

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

    // Try to get userId from Authorization header for OAuth token revocation
    let userId: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.substring(7);
      try {
        const payload = await verifyAccessToken(accessToken);
        userId = payload.userId;
      } catch {
        // If access token is invalid/expired, continue with logout anyway
        // We'll still revoke the refresh token
      }
    }

    // Revoke OAuth tokens if we have userId
    if (userId) {
      await revokeAllUserOAuthTokens(userId);
    }

    // Revoke JWT refresh token
    const revoked = await revokeRefreshToken(refreshToken);
    if (!revoked) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true, message: "Logout successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
