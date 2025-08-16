import "dotenv/config"; // load .env at the very top
import mongoose from "mongoose";
import connectDB from "../src/config/database";

(async () => {
  try {
    await connectDB();
    await mongoose.connection.db?.admin().command({ ping: 1 });
    console.log("DB OK:", mongoose.connection.host, mongoose.connection.name);
    process.exit(0);
  } catch (e: any) {
    console.error("DB FAIL:", e?.message || e);
    process.exit(1);
  }
})();
