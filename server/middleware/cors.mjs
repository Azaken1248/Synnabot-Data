import cors from "cors";
import config from "../config/index.mjs";

const corsMiddleware = cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

export default corsMiddleware;
