import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());

const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

app.get("/data", async (_req, res) => {
  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DATABASE);

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
  } finally {
    await client.close();
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
