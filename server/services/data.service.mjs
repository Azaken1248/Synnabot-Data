import { getDb } from "../database/index.mjs";
import { NotFoundError, BadRequestError } from "../utils/httpErrors.mjs";

export async function getAllCollections() {
  const db = getDb();
  const collections = await db.listCollections().toArray();
  const result = {};

  for (const col of collections) {
    result[col.name] = await db.collection(col.name).find({}).toArray();
  }

  return result;
}

export async function getCollection(name) {
  const db = getDb();
  return db.collection(name).find({}).toArray();
}

export async function queryCollection(name, filter) {
  const db = getDb();
  let parsed;

  try {
    parsed = typeof filter === "string" ? JSON.parse(filter) : filter;
  } catch {
    throw new BadRequestError("Invalid search query JSON");
  }

  return db.collection(name).find(parsed).toArray();
}

export async function resolveEntity(type, id) {
  const db = getDb();

  if (type === "client") {
    const doc = await db.collection("clients").findOne({ _id: id });
    if (!doc) throw new NotFoundError("Client not found");
    return { id, name: doc.name || "Unnamed Client" };
  }

  if (type === "server") {
    const doc = await db.collection("servers").findOne({ _id: id });
    if (!doc) throw new NotFoundError("Server not found");
    return { id, name: doc.name || "Unnamed Server" };
  }

  throw new BadRequestError(`Cannot resolve entity type: ${type}`);
}
