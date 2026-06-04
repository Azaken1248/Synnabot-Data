import { Router } from "express";
import authRoutes from "./auth.routes.mjs";
import dataRoutes from "./data.routes.mjs";
import exportRoutes from "./export.routes.mjs";
import resolveRoutes from "./resolve.routes.mjs";
import { authLimiter, apiLimiter } from "../middleware/security.mjs";

const router = Router();

router.use("/auth", authLimiter, authRoutes);
router.use("/data", apiLimiter, dataRoutes);
router.use("/export", apiLimiter, exportRoutes);
router.use("/resolve", apiLimiter, resolveRoutes);

export default router;
