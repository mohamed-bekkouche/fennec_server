"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategories = void 0;
const Category_1 = __importDefault(require("../models/Category"));
const getAllCategories = async (req, res) => {
    try {
        const { name } = req.query;
        const query = {};
        if (name)
            query.name = { $rgex: name, $options: "i" };
        const categories = await Category_1.default.find(query).sort({ createdAt: -1 });
        res.status(200).json({ categories });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal server error", err: error.message });
    }
};
exports.getAllCategories = getAllCategories;
//# sourceMappingURL=CategoryController.js.map