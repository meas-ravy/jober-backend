import { NextResponse } from "next/server";
import { cleanupRevokedTokens } from "@/src/lib/jwt";

/**
 * Admin endpoint to manually trigger token cleanup
 * This can be called via cron job or manually
 * 
 * Usage:
 * POST /api/admin/cleanup-tokens
 * 
 * Optional: Add authentication/authorization for production
 */
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
