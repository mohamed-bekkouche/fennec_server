"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SuitElementController_1 = require("../controllers/SuitElementController");
const suitElemntRouter = (0, express_1.Router)();
suitElemntRouter.get("/", SuitElementController_1.getAllSuitElemnts);
exports.default = suitElemntRouter;
//# sourceMappingURL=SuitELementRouter.js.map