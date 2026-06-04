import { Router } from "express";
import * as discordService from "../services/discord.service.mjs";
import config from "../config/index.mjs";
import logger from "../utils/logger.mjs";

const router = Router();

router.get("/discord", (_req, res) => {
  res.redirect(discordService.getOAuthUrl());
});

router.get("/discord/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${config.cors.origin}/login?error=no_code`);
  }

  try {
    const tokenData = await discordService.exchangeCodeForToken(code);
    if (!tokenData) {
      return res.redirect(`${config.cors.origin}/login?error=oauth_failed`);
    }

    const user = await discordService.fetchUser(tokenData.access_token);
    if (!user) {
      return res.redirect(
        `${config.cors.origin}/login?error=user_fetch_failed`
      );
    }

    const avatarUrl = discordService.buildAvatarUrl(user);
    const allowed = await discordService.isUserAuthorized(user.id);

    req.session.auth = {
      id: user.id,
      tag: `${user.username}#${user.discriminator}`,
      avatar: avatarUrl,
      allowed,
    };

    const dest = allowed ? "/" : "/login?auth=denied";
    return res.redirect(`${config.cors.origin}${dest}`);
  } catch (err) {
    logger.error({ err }, "OAuth callback error");
    return res.redirect(`${config.cors.origin}/login?error=server_error`);
  }
});

router.get("/me", (req, res) => {
  if (req.session?.auth) {
    return res.json({ ok: true, user: req.session.auth });
  }
  return res.json({ ok: false });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) logger.error({ err }, "Session destruction failed");
    res.clearCookie("sid");
    return res.json({ ok: !err });
  });
});

export default router;
