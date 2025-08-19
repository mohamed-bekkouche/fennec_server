"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CategoryController_1 = require("../controllers/CategoryController");
const categoryRouter = (0, express_1.Router)();
categoryRouter.get("/", CategoryController_1.getAllCategories);
exports.default = categoryRouter;
//# sourceMappingURL=CategoryRouter.js.map