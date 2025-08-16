"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProductController_1 = require("../controllers/ProductController");
const Auth_1 = require("../middlewares/Auth");
const productRouter = (0, express_1.Router)();
productRouter.get("/", ProductController_1.getAllProducts);
productRouter.get("/top-selling", ProductController_1.getTopSellingProducts);
productRouter.get("/wishlist", Auth_1.authenticate, ProductController_1.getUserWishlist);
productRouter.put("/wishlist/:productId", Auth_1.authenticate, ProductController_1.addToWishlist);
productRouter.delete("/wishlist/:productId", Auth_1.authenticate, ProductController_1.removeFromWishlist);
productRouter.get("/:id", ProductController_1.getProduct);
exports.default = productRouter;
//# sourceMappingURL=ProductRouter.js.map