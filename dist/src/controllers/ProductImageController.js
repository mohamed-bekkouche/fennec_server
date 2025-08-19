"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProductImages = void 0;
const ProductImage_1 = __importDefault(require("../models/ProductImage"));
const getAllProductImages = async (req, res) => {
    try {
        const productImages = await ProductImage_1.default.find()
            .populate({
            path: "hotspots.product",
            model: "Product",
            // select: "all" 
        });
        res.status(200).json({ productImages });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
exports.getAllProductImages = getAllProductImages;
//# sourceMappingURL=ProductImageController.js.map