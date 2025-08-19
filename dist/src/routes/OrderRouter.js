"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OrderController_1 = require("../controllers/OrderController");
const Auth_1 = require("../middlewares/Auth");
const orderRouter = (0, express_1.Router)();
orderRouter.post("/", Auth_1.checkAuthentication, OrderController_1.makeOrder);
orderRouter.get("/", Auth_1.authenticate, OrderController_1.getMyOrders);
orderRouter.get("/:id", Auth_1.authenticate, OrderController_1.getMyOrder);
orderRouter.put("/:id", Auth_1.authenticate, OrderController_1.cancelMyOrder);
exports.default = orderRouter;
//# sourceMappingURL=OrderRouter.js.map