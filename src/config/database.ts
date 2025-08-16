// src/config/database.ts
import mongoose from "mongoose";

declare global {
  // allow global caching across Lambda invocations
  // eslint-disable-next-line no-var
  var __mongooseConn: Promise<typeof mongoose> | undefined;
}

export default async function connectDB() {
  if (global.__mongooseConn) return global.__mongooseConn;

  // accept either name; prefer MONGODB_URI
  const uri = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim();
  if (!uri) {
    // don't default to localhost in serverless; fail clearly
    throw new Error("MONGODB_URI (or MONGO_URI) is missing");
  }

  global.__mongooseConn = mongoose.connect(uri, {
    // optional tweaks
    serverSelectionTimeoutMS: 8000,
    // dbName can be included in the URI; only set here if you omit it there
    // dbName: "loko",
  });

  return global.__mongooseConn;
}
