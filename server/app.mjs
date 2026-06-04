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

/**
 * App factory — creates and configures the Express application.
 * No side-effects (doesn't call listen) → testable in isolation.
 */
export default function createApp() {
  const app = express();

  // ── 1. Security headers ──────────────────────────────────────────
  app.use(helmetMiddleware);

  // ── 2. Request logging ───────────────────────────────────────────
  app.use(requestLogger);

  // ── 3. CORS ──────────────────────────────────────────────────────
  app.use(corsMiddleware);

  // ── 4. Body parsing ──────────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  // ── 5. Session ───────────────────────────────────────────────────
  app.use(createSessionMiddleware(getClient()));

  // ── 6. Health check (unauthenticated) ────────────────────────────
  app.get("/health", async (_req, res) => {
    const dbHealth = await healthCheck();
    const status = dbHealth.status === "connected" ? 200 : 503;
    res.status(status).json({
      status: status === 200 ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: dbHealth,
    });
  });

  // ── 7. API routes ────────────────────────────────────────────────
  app.use(routes);

  // ── 8. 404 + global error handler (must be last) ─────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
