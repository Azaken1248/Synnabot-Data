import { AppError } from "../utils/httpErrors.mjs";
import logger from "../utils/logger.mjs";
import config from "../config/index.mjs";

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function globalErrorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  const isOperational =
    err instanceof AppError ? err.isOperational : false;

  if (statusCode >= 500) {
    logger.error({ err, statusCode }, "Server error");
  } else {
    logger.warn({ statusCode, message }, "Client error");
  }

  if (config.isProduction && !isOperational) {
    message = "Internal Server Error";
  }

  res.status(statusCode).json({
    error: message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
}
