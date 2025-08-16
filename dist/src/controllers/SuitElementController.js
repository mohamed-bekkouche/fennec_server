"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSuitElemnts = void 0;
const SuitElement_1 = __importDefault(require("../models/SuitElement"));
const getAllSuitElemnts = async (req, res) => {
    try {
        const suitElements = await SuitElement_1.default.find().populate({
            path: "product",
        });
        const grouped = {};
        for (const element of suitElements) {
            if (!grouped[element.type]) {
                grouped[element.type] = [];
            }
            grouped[element.type].push(element);
        }
        res.status(200).json({ suitElements: grouped });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.getAllSuitElemnts = getAllSuitElemnts;
//# sourceMappingURL=SuitElementController.js.map