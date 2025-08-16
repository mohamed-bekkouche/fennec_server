"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCoupon = void 0;
const Coupon_1 = __importDefault(require("../models/Coupon"));
const applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const coupon = await Coupon_1.default.findOne({ code });
        if (!coupon) {
            res.status(404).json({ message: "coupon not found" });
            return;
        }
        if (!coupon.isActive) {
            res.status(400).json({ message: "coupon is not active" });
            return;
        }
        if (coupon.expiresAt < new Date()) {
            res.status(400).json({ message: "coupon expired at : " + coupon.expiresAt.toUTCString() });
            return;
        }
        if (coupon.usageLimit && coupon.usageLimit <= coupon.usedCount) {
            res.status(400).json({ message: `coupon usage limit reached ${coupon.usageLimit}` });
            return;
        }
        res.status(200).json({ message: "coupon applied successfully", coupon });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.applyCoupon = applyCoupon;
//# sourceMappingURL=CouponController.js.map