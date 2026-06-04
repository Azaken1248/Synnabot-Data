import { MongoClient } from "mongodb";
import config from "../config/index.mjs";
import logger from "../utils/logger.mjs";

let client = null;
let db = null;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

async function connect() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info({ attempt }, "Connecting to MongoDB…");

      client = new MongoClient(config.db.uri, {
        maxPoolSize: config.db.maxPoolSize,
        minPoolSize: config.db.minPoolSize,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      await client.connect();
      db = client.db(config.db.database);

      await db.command({ ping: 1 });
      logger.info("Successfully connected to MongoDB");
      return;
    } catch (err) {
      logger.error(
        { err, attempt },
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed`
      );

      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${err.message}`
        );
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      logger.info({ delayMs: delay }, "Retrying…");
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialised — call connect() first");
  }
  return db;
}

function getClient() {
  if (!client) {
    throw new Error("Database client not initialised — call connect() first");
  }
  return client;
}

async function disconnect() {
  if (client) {
    logger.info("Disconnecting from MongoDB…");
    await client.close();
    client = null;
    db = null;
    logger.info("Disconnected from MongoDB");
  }
}

async function healthCheck() {
  try {
    if (!db) return { status: "disconnected" };
    await db.command({ ping: 1 });
    return { status: "connected" };
  } catch {
    return { status: "error" };
  }
}

export { connect, getDb, getClient, disconnect, healthCheck };
