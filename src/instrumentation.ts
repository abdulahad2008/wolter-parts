export async function register() {
  // Only in the Node.js server, and never while `next build` runs.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { runSetup } = await import("./lib/setup");
  await runSetup();
}
