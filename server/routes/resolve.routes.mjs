import { Router } from "express";
import requireAuth from "../middleware/auth.mjs";
import { validateResolveParams } from "../middleware/validator.mjs";
import * as discordService from "../services/discord.service.mjs";
import * as dataService from "../services/data.service.mjs";

const router = Router();

router.get(
  "/:type/:id",
  requireAuth,
  validateResolveParams,
  async (req, res) => {
    const { type, id } = req.params;

    let result;

    switch (type) {
      case "discord-user":
        result = await discordService.resolveUser(id);
        break;
      case "discord-server":
        result = await discordService.resolveGuild(id);
        break;
      case "client":
      case "server":
        result = await dataService.resolveEntity(type, id);
        break;
    }

    res.json(result);
  }
);

export default router;
