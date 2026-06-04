import pinoHttp from "pino-http";
import logger from "../utils/logger.mjs";

const requestLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === "/health",
  },
  customSuccessMessage(_req, res) {
    return `${res.statusCode} ${res.statusMessage}`;
  },
  customErrorMessage(_req, res, err) {
    return `${res.statusCode} ${err.message}`;
  },
});

export default requestLogger;
