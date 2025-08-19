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
dotenv_1.default.config();
const app = (0, express_1.default)();
// DB: ensure we connect once per cold start and reuse on warm starts
app.use(async (_req, _res, next) => {
    try {
        await (0, database_1.default)();
        next();
    }
    catch (err) {
        next(err);
    }
});
app.use(express_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
const UPLOADS_DIR = path_1.default.resolve("src/uploads");
app.use("/uploads", express_1.default.static(UPLOADS_DIR));
const allowedOrigins = [
    process.env.CLIENT_ORIGIN ?? "",
    process.env.ADMIN_ORIGIN ?? "",
    process.env.PROD_CLIENT_ORIGIN ?? "https://<your-client>.vercel.app",
    process.env.PROD_ADMIN_ORIGIN ?? "https://<your-admin>.vercel.app",
];
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map