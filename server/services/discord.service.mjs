import config from "../config/index.mjs";
import logger from "../utils/logger.mjs";
import { NotFoundError } from "../utils/httpErrors.mjs";

const DISCORD_API_BASE = "https://discord.com/api";

async function botFetch(path, options = {}) {
  const { method = "GET", headers = {}, body } = options;
  return fetch(`${DISCORD_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${config.discord.botToken}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  });
}

export async function exchangeCodeForToken(code) {
  const resp = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.discord.clientId,
      client_secret: config.discord.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.discord.callbackUrl,
    }),
  });

  if (!resp.ok) {
    logger.error(
      { status: resp.status, body: await resp.text() },
      "OAuth token exchange failed"
    );
    return null;
  }

  return resp.json();
}

export async function fetchUser(accessToken) {
  const resp = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    logger.error(
      { status: resp.status, body: await resp.text() },
      "User profile fetch failed"
    );
    return null;
  }

  return resp.json();
}

export function buildAvatarUrl(user) {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }
  const idx = Number(user.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

export async function isUserAuthorized(userId) {
  if (userId === config.discord.ownerId) return true;

  const memberResp = await botFetch(
    `/guilds/${config.discord.guildId}/members/${userId}`
  );
  if (!memberResp.ok) return false;

  const member = await memberResp.json();

  const rolesResp = await botFetch(`/guilds/${config.discord.guildId}/roles`);
  if (!rolesResp.ok) return false;

  const roles = await rolesResp.json();
  const memberRoleIds = new Set(member.roles || []);
  return roles.some((r) => memberRoleIds.has(r.id) && /mod/i.test(r.name));
}

export async function resolveUser(id) {
  const resp = await botFetch(`/users/${id}`);
  if (!resp.ok) throw new NotFoundError("Discord user not found");
  const user = await resp.json();
  return { id, name: `${user.username}#${user.discriminator}` };
}

export async function resolveGuild(id) {
  const resp = await botFetch(`/guilds/${id}`);
  if (!resp.ok) throw new NotFoundError("Discord server not found");
  const guild = await resp.json();
  return { id, name: guild.name };
}

export function getOAuthUrl() {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    redirect_uri: config.discord.callbackUrl,
    response_type: "code",
    scope: "identify",
  });
  return `${DISCORD_API_BASE}/oauth2/authorize?${params.toString()}`;
}
