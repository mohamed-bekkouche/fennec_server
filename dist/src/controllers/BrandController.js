"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBrands = void 0;
const Brand_1 = __importDefault(require("../models/Brand"));
const getAllBrands = async (req, res) => {
    try {
        const { name } = req.query;
        const query = {};
        if (name)
            query.name = { $rgex: name, $options: "i" };
        const brands = await Brand_1.default.find(query).sort({ createdAt: -1 });
        res.status(200).json({ brands });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal server error", err: error.message });
    }
};
exports.getAllBrands = getAllBrands;
//# sourceMappingURL=BrandController.js.map