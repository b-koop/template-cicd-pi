/**
 * Minimal project extension example.
 *
 * Extensions run inside the agent process. Keep credentials out of source
 * files and review extension code before loading it.
 */
export default function registerExampleExtension(pi: any): void {
  pi.on?.("session_start", async (_event: unknown, context: any) => {
    if (context?.hasUI && context.ui?.notify) {
      context.ui.notify("Example extension loaded", "info");
    }
  });
}
