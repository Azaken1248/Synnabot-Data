import { Router } from "express";
import requireAuth from "../middleware/auth.mjs";
import { validateExportQuery } from "../middleware/validator.mjs";
import * as exportService from "../services/export.service.mjs";

const router = Router();

router.get("/", requireAuth, validateExportQuery, async (req, res) => {
  const { type, scope, collection, query } = req.exportParams;

  const data = await exportService.getExportData({ scope, collection, query });
  const { content, contentType, filename } = exportService.serialize(
    type,
    data
  );

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", contentType);
  res.send(content);
});

export default router;
