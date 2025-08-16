"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
// api/ping.ts
function handler(_req, res) {
    res.status(200).json({ ok: true, now: Date.now() });
}
//# sourceMappingURL=ping.js.map