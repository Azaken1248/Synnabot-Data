import { Router } from "express";
import requireAuth from "../middleware/auth.mjs";
import * as dataService from "../services/data.service.mjs";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const result = await dataService.getAllCollections();
  res.json(result);
});

export default router;
