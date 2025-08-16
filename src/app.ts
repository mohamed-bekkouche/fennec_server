import express, { Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import connectDB from "./config/database";

// routers
import authRouter from "./routes/AuthRouter";
import productRouter from "./routes/ProductRouter";
import categoryRouter from "./routes/CategoryRouter";
import brandRouter from "./routes/BrandRouter";
import orderRouter from "./routes/OrderRouter";
import adminRouter from "./routes/AdminRouter";
import collectionRouter from "./routes/CollectionRouter";
import productImageRouter from "./routes/ProductImageRouter";
import couponRouter from "./routes/CouponRouter";
import suitElemntRouter from "./routes/SuitELementRouter";
import mongoose from "mongoose";

dotenv.config();

const app = express();

// connect once per cold start, reuse on warm starts
let dbOnce: any | null = null;
function ensureDB() {
  if (!dbOnce) dbOnce = connectDB();
  return dbOnce;
}
app.use(async (_req, _res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    next(err as Error);
  }
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// ⚠️ Vercel Functions are read-only; keep uploads in external storage.
// Static files that ship with the app can live in /public.
const UPLOADS_DIR = path.resolve("public/uploads");
app.use("/uploads", express.static(UPLOADS_DIR));

const allowedOrigins = [
  process.env.CLIENT_ORIGIN ?? "",
  process.env.ADMIN_ORIGIN ?? "",
  process.env.PROD_CLIENT_ORIGIN ?? "",
  process.env.PROD_ADMIN_ORIGIN ?? "",
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    // ensure a connection exists
    await connectDB();

    // low-level server ping (throws if blocked / auth fails)
    await mongoose.connection.db?.admin().command({ ping: 1 });

    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    res.json({
      state: states[mongoose.connection.readyState] || "unknown",
    });
  } catch (err: any) {
    res.status(503).json({
      ok: false,
      error: err?.message || String(err),
      state: mongoose.connection.readyState, // 0,1,2,3
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/brands", brandRouter);
app.use("/api/collections", collectionRouter);
app.use("/api/product-images", productImageRouter);
app.use("/api/suit-elements", suitElemntRouter);
app.use("/api/coupons", couponRouter);

export default app;
