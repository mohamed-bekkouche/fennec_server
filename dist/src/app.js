"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("./config/database"));
// routers
const AuthRouter_1 = __importDefault(require("./routes/AuthRouter"));
const ProductRouter_1 = __importDefault(require("./routes/ProductRouter"));
const CategoryRouter_1 = __importDefault(require("./routes/CategoryRouter"));
const BrandRouter_1 = __importDefault(require("./routes/BrandRouter"));
const OrderRouter_1 = __importDefault(require("./routes/OrderRouter"));
const AdminRouter_1 = __importDefault(require("./routes/AdminRouter"));
const CollectionRouter_1 = __importDefault(require("./routes/CollectionRouter"));
const ProductImageRouter_1 = __importDefault(require("./routes/ProductImageRouter"));
const CouponRouter_1 = __importDefault(require("./routes/CouponRouter"));
const SuitELementRouter_1 = __importDefault(require("./routes/SuitELementRouter"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const app = (0, express_1.default)();
let isConnected = false;
app.use(async (_req, _res, next) => {
    try {
        if (!isConnected) {
            await (0, database_1.default)();
            isConnected = true;
        }
        next();
    }
    catch (err) {
        console.error("Database connection failed:", err);
        next(err);
    }
});
app.use(express_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// ⚠️ Vercel Functions are read-only; keep uploads in external storage.
// Static files that ship with the app can live in /public.
const UPLOADS_DIR = path_1.default.resolve("public/uploads");
app.use("/uploads", express_1.default.static(UPLOADS_DIR));
const allowedOrigins = [
    process.env.CLIENT_ORIGIN ?? "",
    process.env.ADMIN_ORIGIN ?? "",
    process.env.PROD_CLIENT_ORIGIN ?? "",
    process.env.PROD_ADMIN_ORIGIN ?? "",
];
app.use((0, cors_1.default)({
    origin(origin, cb) {
        if (!origin)
            return cb(null, true);
        if (allowedOrigins.includes(origin))
            return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});
app.get("/api/health/db", async (_req, res) => {
    // Set a timeout for the response
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(503).json({
                ok: false,
                error: "Database health check timeout",
                state: mongoose_1.default.connection.readyState,
            });
        }
    }, 10000); // 10 second timeout
    try {
        // Ensure connection with timeout
        await Promise.race([
            (0, database_1.default)(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 5000)),
        ]);
        // Quick ping with timeout
        await Promise.race([
            mongoose_1.default.connection.db?.admin().command({ ping: 1 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Ping timeout")), 3000)),
        ]);
        clearTimeout(timeout);
        if (!res.headersSent) {
            const states = [
                "disconnected",
                "connected",
                "connecting",
                "disconnecting",
            ];
            res.json({
                ok: true,
                state: states[mongoose_1.default.connection.readyState] || "unknown",
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (err) {
        clearTimeout(timeout);
        if (!res.headersSent) {
            res.status(503).json({
                ok: false,
                error: err?.message || String(err),
                state: mongoose_1.default.connection.readyState,
            });
        }
    }
});
app.get("/api/test", (_req, res) => {
    res.json({
        message: "Server is working!",
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
    });
});
app.use("/api/auth", AuthRouter_1.default);
app.use("/api/admin", AdminRouter_1.default);
app.use("/api/products", ProductRouter_1.default);
app.use("/api/orders", OrderRouter_1.default);
app.use("/api/categories", CategoryRouter_1.default);
app.use("/api/brands", BrandRouter_1.default);
app.use("/api/collections", CollectionRouter_1.default);
app.use("/api/product-images", ProductImageRouter_1.default);
app.use("/api/suit-elements", SuitELementRouter_1.default);
app.use("/api/coupons", CouponRouter_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map