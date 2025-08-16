import { Router } from "express";
import { applyCoupon } from "../controllers/CouponController";

const couponRouter = Router();

couponRouter.post("/", applyCoupon);

export default couponRouter;
