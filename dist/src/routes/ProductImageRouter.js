"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProductImageController_1 = require("../controllers/ProductImageController");
const productImageRouter = (0, express_1.Router)();
productImageRouter.get("/", ProductImageController_1.getAllProductImages);
exports.default = productImageRouter;
//# sourceMappingURL=ProductImageRouter.js.map