import express from "express";
import corsMiddleware from "./middleware/cors.mjs";
import createSessionMiddleware from "./middleware/session.mjs";
import { helmetMiddleware } from "./middleware/security.mjs";
import requestLogger from "./middleware/requestLogger.mjs";
import {
  notFoundHandler,
  globalErrorHandler,
} from "./middleware/errorHandler.mjs";
import routes from "./routes/index.mjs";
import { getClient, healthCheck } from "./database/index.mjs";

export default function createApp() {
  const app = express();

  app.use(helmetMiddleware);
  app.use(requestLogger);
  app.use(corsMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(createSessionMiddleware(getClient()));

  app.get("/health", async (_req, res) => {
    const dbHealth = await healthCheck();
    const status = dbHealth.status === "connected" ? 200 : 503;
    res.status(status).json({
      status: status === 200 ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: dbHealth,
    });
  });

  app.use(routes);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
