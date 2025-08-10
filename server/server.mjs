import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());

const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

let db;

async function initMongo() {
  try {
    await client.connect();
    db = client.db(process.env.MONGO_DATABASE);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

app.get("/data", async (_req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    const result = {};

    for (const col of collections) {
      const documents = await db.collection(col.name).find({}).toArray();
      result[col.name] = documents;
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(3000, async () => {
  await initMongo();
  console.log("Server running on http://localhost:3000");
});
