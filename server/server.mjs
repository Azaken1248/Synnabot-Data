import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import fetch from "node-fetch";
import { stringify as csvStringify } from "csv-stringify/sync";
import { BSON } from "bson";

dotenv.config();

const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_CLUSTER,
  MONGO_DATABASE,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_CALLBACK_URL,
  DISCORD_BOT_TOKEN,
  SESSION_SECRET,
  FRONTEND_ORIGIN,
  SYN_GUILD_ID,
  OWNER_DISCORD_ID,
  PORT = 3000,
} = process.env;

if (!MONGO_USERNAME || !MONGO_PASSWORD || !MONGO_CLUSTER || !MONGO_DATABASE) {
  throw new Error("Missing MongoDB env vars");
}
if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_CALLBACK_URL || !DISCORD_BOT_TOKEN) {
  throw new Error("Missing Discord OAuth env vars");
}

const app = express();

const mongoUri = `mongodb+srv://${encodeURIComponent(MONGO_USERNAME)}:${encodeURIComponent(
  MONGO_PASSWORD
)}@${MONGO_CLUSTER}/${MONGO_DATABASE}?retryWrites=true&w=majority`;

const client = new MongoClient(mongoUri);
await client.connect();
const db = client.db(MONGO_DATABASE);

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(
  session({
    name: "sid",
    secret: SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client,
      dbName: MONGO_DATABASE,
      stringify: false,
    }),
    cookie: {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
);

const discordApi = (path, method = "GET") =>
  fetch(`https://discord.com/api${path}`, {
    method,
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

app.get("/auth/discord", (_req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_CALLBACK_URL,
    response_type: "code",
    scope: "identify",
  });
  return res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect(`${FRONTEND_ORIGIN}/login?error=no_code`);
  }

  try {
    const tokenResp = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_CALLBACK_URL,
      }),
    });

    if (!tokenResp.ok) {
      console.error("OAuth token exchange failed:", await tokenResp.text());
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=oauth_failed`);
    }

    const { access_token } = await tokenResp.json();

    const userResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResp.ok) {
      console.error("User fetch failed:", await userResp.text());
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=user_fetch_failed`);
    }

    const user = await userResp.json();

    let avatarUrl;
    if (user.avatar) {
      const format = user.avatar.startsWith("a_") ? "gif" : "png";
      avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${format}?size=256`;
    } else {
      const defaultAvatarIndex = Number(user.discriminator) % 5;
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
    }

    let allowed = false;
    if (user.id === OWNER_DISCORD_ID) {
      allowed = true;
    } else {
      const memberResp = await discordApi(`/guilds/${SYN_GUILD_ID}/members/${user.id}`);
      if (memberResp.ok) {
        const member = await memberResp.json();
        const rolesResp = await discordApi(`/guilds/${SYN_GUILD_ID}/roles`);
        if (rolesResp.ok) {
          const roles = await rolesResp.json();
          const roleIdSet = new Set(member.roles || []);
          allowed = roles.some((r) => roleIdSet.has(r.id) && /mod/i.test(r.name));
        }
      }
    }

    req.session.auth = {
      id: user.id,
      tag: `${user.username}#${user.discriminator}`,
      avatar: avatarUrl,
      allowed,
    };

    return res.redirect(`${FRONTEND_ORIGIN}${allowed ? "/" : "/login?auth=denied"}`);
  } catch (err) {
    console.error("Callback error:", err);
    return res.redirect(`${FRONTEND_ORIGIN}/login?error=server_error`);
  }
});

app.get("/auth/me", (req, res) => {
  if (req.session?.auth) {
    return res.json({ ok: true, user: req.session.auth });
  }
  return res.json({ ok: false });
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie("sid");
    return res.json({ ok: !err });
  });
});

function requireAuth(req, res, next) {
  if (req.session?.auth?.allowed) return next();
  return res.status(401).json({ error: "unauthorized" });
}

app.get("/export", requireAuth, async (req, res) => {
  try {
    const { type = "json", scope = "full", collection, query } = req.query;

    let data;

    if (scope === "collection" && collection) {
      data = await db.collection(collection).find({}).toArray();
    } else if (scope === "search" && collection && query) {
      let q;
      try {
        q = JSON.parse(query);
      } catch {
        return res.status(400).json({ error: "Invalid search query JSON" });
      }
      data = await db.collection(collection).find(q).toArray();
    } else {
      // full DB
      const collections = await db.listCollections().toArray();
      data = {};
      for (const col of collections) {
        data[col.name] = await db.collection(col.name).find({}).toArray();
      }
    }

    if (type === "json") {
      res.setHeader("Content-Disposition", `attachment; filename="export.json"`);
      return res.json(data);
    }

    if (type === "bson") {
      const bsonData = BSON.serialize(data);
      res.setHeader("Content-Disposition", `attachment; filename="export.bson"`);
      res.setHeader("Content-Type", "application/octet-stream");
      return res.send(bsonData);
    }

    if (type === "csv") {
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "CSV export only works on a single collection array" });
      }
      const csv = csvStringify(data, { header: true });
      res.setHeader("Content-Disposition", `attachment; filename="export.csv"`);
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    }

    return res.status(400).json({ error: "Invalid export type" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Export failed" });
  }
});

app.get("/resolve/:type/:id", requireAuth, async (req, res) => {
  const { type, id } = req.params;

  try {
    if (type === "discord-user") {
      const userResp = await discordApi(`/users/${id}`);
      if (!userResp.ok) {
        return res.status(404).json({ error: "Discord user not found" });
      }
      const user = await userResp.json();
      const name = `${user.username}#${user.discriminator}`;
      return res.json({ id, name });
    }

    if (type === "discord-server") {
      const guildResp = await discordApi(`/guilds/${id}`);
      if (!guildResp.ok) {
        return res.status(404).json({ error: "Discord server not found" });
      }
      const guild = await guildResp.json();
      return res.json({ id, name: guild.name });
    }

    if (type === "client") {
      const clientDoc = await db.collection("clients").findOne({ _id: id });
      if (!clientDoc) {
        return res.status(404).json({ error: "Client not found" });
      }
      return res.json({ id, name: clientDoc.name || "Unnamed Client" });
    }

    if (type === "server") {
      const serverDoc = await db.collection("servers").findOne({ _id: id });
      if (!serverDoc) {
        return res.status(404).json({ error: "Server not found" });
      }
      return res.json({ id, name: serverDoc.name || "Unnamed Server" });
    }

    return res.status(400).json({ error: "Invalid type parameter" });
  } catch (err) {
    console.error("Resolve error:", err);
    return res.status(500).json({ error: "Failed to resolve name" });
  }
});

app.get("/data", requireAuth, async (_req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    const result = {};
    for (const col of collections) {
      result[col.name] = await db.collection(col.name).find({}).toArray();
    }
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
