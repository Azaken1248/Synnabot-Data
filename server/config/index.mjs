import dotenv from "dotenv";

dotenv.config();

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";

const config = Object.freeze({
  env,
  isProduction,

  server: Object.freeze({
    port: parseInt(process.env.PORT || "3000", 10),
  }),

  db: Object.freeze({
    uri: `mongodb+srv://${encodeURIComponent(
      required("MONGO_USERNAME")
    )}:${encodeURIComponent(required("MONGO_PASSWORD"))}@${required(
      "MONGO_CLUSTER"
    )}/${required("MONGO_DATABASE")}?retryWrites=true&w=majority`,
    database: required("MONGO_DATABASE"),
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10", 10),
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || "2", 10),
  }),

  discord: Object.freeze({
    clientId: required("DISCORD_CLIENT_ID"),
    clientSecret: required("DISCORD_CLIENT_SECRET"),
    callbackUrl: required("DISCORD_CALLBACK_URL"),
    botToken: required("DISCORD_BOT_TOKEN"),
    guildId: required("SYN_GUILD_ID"),
    ownerId: required("OWNER_DISCORD_ID"),
  }),

  session: Object.freeze({
    secret: required("SESSION_SECRET"),
  }),

  cors: Object.freeze({
    origin: required("FRONTEND_ORIGIN"),
  }),
});

export default config;
