/**
 * Next.js Instrumentation
 * Runs when the server starts (both dev and production)
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { runStartupTasks, schedulePeriodicCleanup } from "./src/lib/startup";

export async function register() {
  // Only run on the server side
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Run startup tasks
    await runStartupTasks();

    // Schedule periodic cleanup (every 24 hours)
    schedulePeriodicCleanup();
  }
}
