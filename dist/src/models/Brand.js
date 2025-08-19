"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Product_1 = __importDefault(require("./Product"));
const brandSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String, required: true },
});
brandSchema.virtual("totalProduct").get(async function () {
    return await Product_1.default.countDocuments({ brand: this._id });
});
const Brand = (0, mongoose_1.model)("Brand", brandSchema);
exports.default = Brand;
//# sourceMappingURL=Brand.js.map