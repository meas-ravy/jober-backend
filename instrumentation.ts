/**
 * Next.js Instrumentation
 * Runs when the server starts (both dev and production)
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the server side (Node.js runtime, not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Use dynamic import to avoid loading Node.js modules in Edge Runtime
    const { runStartupTasks, schedulePeriodicCleanup } = await import(
      "./src/lib/startup"
    );

    // Run startup tasks
    await runStartupTasks();

    // Schedule periodic cleanup (every 24 hours)
    schedulePeriodicCleanup();
  }
}
