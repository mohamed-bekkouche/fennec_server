"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateRecoveryToken = exports.generateChangeEmailToken = exports.generateActivationToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Crypto_1 = require("./Crypto");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const secret = process.env.JWT_SECRET || "default_secret_key";
// src/config/crypto.ts
const generateTokens = (userId, isAdmin, res) => {
    const access_secret = process.env.ACCESS_SECRET || "default_secret_key";
    const refresh_secret = process.env.REFRESH_SECRET || "default_secret_key";
    const accessToken = jsonwebtoken_1.default.sign({ userId, isAdmin }, access_secret, {
        expiresIn: "15m",
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId, isAdmin }, refresh_secret, {
        expiresIn: "7d",
    });
    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return accessToken;
};
exports.generateTokens = generateTokens;
const generateActivationToken = ({ username, email, password, }) => {
    const activation_number = Math.floor(1000 + Math.random() * 9000).toString();
    const { data, iv } = (0, Crypto_1.encrypt)({
        username,
        email,
        password,
        activation_number,
    });
    const activation_token = jsonwebtoken_1.default.sign({ data, iv }, secret, {
        expiresIn: "30m",
    });
    return { activation_token, activation_number };
};
exports.generateActivationToken = generateActivationToken;
const generateChangeEmailToken = (oldEmail, newEmail) => {
    const activation_number = Math.floor(1000 + Math.random() * 9000).toString();
    const { data, iv } = (0, Crypto_1.encrypt)({
        oldEmail,
        newEmail,
        activation_number,
    });
    const email_token = jsonwebtoken_1.default.sign({ data, iv }, secret, {
        expiresIn: "30m",
    });
    return { email_token, activation_number };
};
exports.generateChangeEmailToken = generateChangeEmailToken;
const generateRecoveryToken = (email) => {
    const { data, iv } = (0, Crypto_1.encrypt)(email);
    return jsonwebtoken_1.default.sign({ data, iv }, secret, {
        expiresIn: "30m",
    });
};
exports.generateRecoveryToken = generateRecoveryToken;
const verifyToken = (token, secret) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        throw new Error("Invalid token");
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=Token.js.map