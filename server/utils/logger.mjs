import pino from "pino";
import config from "../config/index.mjs";

const logger = pino({
  level: process.env.LOG_LEVEL || (config.isProduction ? "info" : "debug"),
  ...(config.isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
});

export default logger;
