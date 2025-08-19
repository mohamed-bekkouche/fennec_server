"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = connectDB;
// src/config/database.ts
const mongoose_1 = __importDefault(require("mongoose"));
async function connectDB() {
    if (global.__mongooseConn)
        return global.__mongooseConn;
    // accept either name; prefer MONGODB_URI
    const uri = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim();
    if (!uri) {
        // don't default to localhost in serverless; fail clearly
        throw new Error("MONGODB_URI (or MONGO_URI) is missing");
    }
    global.__mongooseConn = mongoose_1.default.connect(uri, {
        // optional tweaks
        serverSelectionTimeoutMS: 8000,
        // dbName can be included in the URI; only set here if you omit it there
        // dbName: "loko",
    });
    return global.__mongooseConn;
}
//# sourceMappingURL=database.js.map