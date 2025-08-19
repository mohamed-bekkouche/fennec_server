"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CouponController_1 = require("../controllers/CouponController");
const couponRouter = (0, express_1.Router)();
couponRouter.post("/", CouponController_1.applyCoupon);
exports.default = couponRouter;
//# sourceMappingURL=CouponRouter.js.map