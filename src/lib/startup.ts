
import { cleanupRevokedTokens } from "./jwt";

/**
 * Run all startup tasks
 */
export async function runStartupTasks(): Promise<void> {
  console.log("🚀 Running startup tasks...");

  try {
    // Cleanup expired revoked tokens
    console.log("🧹 Cleaning up expired revoked tokens...");
    const deletedCount = await cleanupRevokedTokens();
    console.log(`✅ Cleaned up ${deletedCount} expired revoked tokens`);
  } catch (error) {
    console.error("❌ Error during startup tasks:", error);
    // Don't throw - allow server to start even if cleanup fails
  }

  console.log("✅ Startup tasks completed");
}

/**
 * Schedule periodic cleanup (runs every 24 hours)
 * Call this function after server starts
 */
export function schedulePeriodicCleanup(): void {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  setInterval(async () => {
    try {
      console.log("🧹 Running scheduled token cleanup...");
      const deletedCount = await cleanupRevokedTokens();
      console.log(`✅ Scheduled cleanup: removed ${deletedCount} expired tokens`);
    } catch (error) {
      console.error("❌ Scheduled cleanup error:", error);
    }
  }, TWENTY_FOUR_HOURS);

  console.log("⏰ Scheduled periodic cleanup (runs every 24 hours)");
}
