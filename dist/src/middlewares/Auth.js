"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuthentication = exports.requireAdmin = exports.authenticateStrict = exports.authenticate = void 0;
const Token_1 = require("../utils/Token");
const User_1 = __importDefault(require("../models/User"));
const ACCESS_SECRET = process.env.ACCESS_SECRET || "default_secret_key";
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized: No token provided" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = (0, Token_1.verifyToken)(token, ACCESS_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
    }
};
exports.authenticate = authenticate;
const authenticateStrict = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const decoded = (0, Token_1.verifyToken)(token, ACCESS_SECRET);
        const user = await User_1.default.findById(decoded.userId).select("id email role isBlocked");
        if (!user || user.isBlocked) {
            res.status(403).json({ message: "User is blocked" });
            return;
        }
        next();
    }
    catch {
        res.status(403).json({ message: "Token invalid or expired" });
        return;
    }
};
exports.authenticateStrict = authenticateStrict;
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        res.status(403).json({ message: "Admins only." });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const checkAuthentication = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        next();
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = (0, Token_1.verifyToken)(token, ACCESS_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        next();
        return;
    }
};
exports.checkAuthentication = checkAuthentication;
//# sourceMappingURL=Auth.js.map