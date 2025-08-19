"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
exports.getAes256Key = getAes256Key;
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Read CRYPTO_KEY and strip any whitespace/newlines pasted in Netlify UI
const raw = (process.env.CRYPTO_KEY || "").replace(/\s+/g, "");
if (!raw)
    throw new Error("CRYPTO_KEY is missing");
// Accept 64-char hex OR base64 (~44 chars). Choose decoder based on pattern.
const cryptoKey = Buffer.from(raw, /^[0-9a-f]{64}$/i.test(raw) ? "hex" : "base64");
if (cryptoKey.length !== 32) {
    throw new Error("CRYPTO_KEY must decode to 32 bytes for AES-256.");
}
// Encrypt (AES-256-CBC needs a 16-byte IV per message)
const encrypt = (data) => {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", cryptoKey, iv);
    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");
    return { iv: iv.toString("hex"), data: encrypted };
};
exports.encrypt = encrypt;
const decrypt = (encryptedData, ivHex) => {
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", cryptoKey, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
};
exports.decrypt = decrypt;
let cached = null;
function getAes256Key() {
    if (cached)
        return cached;
    const raw0 = process.env.CRYPTO_KEY;
    if (!raw0)
        throw new Error("CRYPTO_KEY is missing");
    const raw = raw0.replace(/\s+/g, "");
    const isHex = /^[0-9a-f]{64}$/i.test(raw);
    const key = Buffer.from(raw, isHex ? "hex" : "base64");
    if (key.length !== 32) {
        throw new Error("CRYPTO_KEY must decode to 32 bytes for AES-256.");
    }
    cached = key;
    return key;
}
//# sourceMappingURL=Crypto.js.map