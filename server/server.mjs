import config from "./config/index.mjs";
import logger from "./utils/logger.mjs";
import { connect, disconnect } from "./database/index.mjs";
import createApp from "./app.mjs";

/**
 * Bootstrap the server:
 * 1. Connect to MongoDB (with retry)
 * 2. Create the Express app
 * 3. Start listening
 * 4. Register graceful-shutdown handlers
 */
async function bootstrap() {
  await connect();

  const app = createApp();

  const server = app.listen(config.server.port, () => {
    logger.info(
      { port: config.server.port, env: config.env },
      `Server running on http://localhost:${config.server.port}`
    );
  });

  // ── Graceful shutdown ──────────────────────────────────────────────

  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return; // prevent double-shutdown
    shuttingDown = true;

    logger.info({ signal }, "Shutdown signal received — draining…");

    // Stop accepting new connections and wait for in-flight requests
    server.close(async () => {
      logger.info("HTTP server closed");

      try {
        await disconnect();
        logger.info("All connections closed — exiting");
        process.exit(0);
      } catch (err) {
        logger.error({ err }, "Error during shutdown");
        process.exit(1);
      }
    });

    // Force-kill if draining takes too long
    setTimeout(() => {
      logger.error("Forced shutdown after 10 s timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Unhandled Promise rejection");
    shutdown("unhandledRejection");
  });

  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    shutdown("uncaughtException");
  });
}

// ── Start ────────────────────────────────────────────────────────────
bootstrap().catch((err) => {
  // If we can't even start, make sure we log and exit non-zero
  console.error("Fatal: failed to start server", err);
  process.exit(1);
});
