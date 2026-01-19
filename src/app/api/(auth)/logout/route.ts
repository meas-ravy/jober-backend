import { revokeRefreshToken } from "@/src/lib/jwt";
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

    const revoked = await revokeRefreshToken(refreshToken);
    if (!revoked) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 },
      );
    }

    return NextResponse.json({ sucess: true, message: "logout successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
