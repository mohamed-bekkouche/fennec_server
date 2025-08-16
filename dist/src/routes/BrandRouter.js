"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BrandController_1 = require("../controllers/BrandController");
const brandRouter = (0, express_1.Router)();
brandRouter.get("/", BrandController_1.getAllBrands);
exports.default = brandRouter;
//# sourceMappingURL=BrandRouter.js.map