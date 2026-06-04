import session from "express-session";
import MongoStore from "connect-mongo";
import config from "../config/index.mjs";

export default function createSessionMiddleware(mongoClient) {
  return session({
    name: "sid",
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongoClient,
      dbName: config.db.database,
      stringify: false,
      ttl: 30 * 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  });
}
