import { Router } from "express";
import {
  cancelMyOrder,
  getMyOrder,
  getMyOrders,
  makeOrder,
} from "../controllers/OrderController";
import { authenticate, checkAuthentication } from "../middlewares/Auth";

const orderRouter = Router();

orderRouter.post("/", checkAuthentication, makeOrder);
orderRouter.get("/", authenticate, getMyOrders);
orderRouter.get("/:id", authenticate, getMyOrder);
orderRouter.put("/:id", authenticate, cancelMyOrder);

export default orderRouter;
