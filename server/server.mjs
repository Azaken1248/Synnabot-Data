import config from "./config/index.mjs";
import logger from "./utils/logger.mjs";
import { connect, disconnect } from "./database/index.mjs";
import createApp from "./app.mjs";

async function bootstrap() {
  await connect();

  const app = createApp();

  const server = app.listen(config.server.port, () => {
    logger.info(
      { port: config.server.port, env: config.env },
      `Server running on http://localhost:${config.server.port}`
    );
  });

  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info({ signal }, "Shutdown signal received — draining…");

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

bootstrap().catch((err) => {
  console.error("Fatal: failed to start server", err);
  process.exit(1);
});
