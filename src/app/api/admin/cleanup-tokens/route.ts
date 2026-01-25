import { NextResponse } from "next/server";
import { cleanupRevokedTokens } from "@/src/lib/jwt";

// Force Node.js runtime (required for Prisma and crypto)
export const runtime = "nodejs";

export async function POST() {
  try {
    const deletedCount = await cleanupRevokedTokens();

    return NextResponse.json({
      success: true,
      message: `Cleanup successful. Removed ${deletedCount} expired tokens.`,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Token cleanup error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Cleanup failed",
        details: message,
      },
      { status: 500 }
    );
  }
}
