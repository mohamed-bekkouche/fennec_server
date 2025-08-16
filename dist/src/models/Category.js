"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Product_1 = __importDefault(require("./Product"));
const categorySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
}, {
    timestamps: true,
});
categorySchema.virtual("totalProduct").get(async function () {
    return await Product_1.default.countDocuments({ category: this._id });
});
const Category = (0, mongoose_1.model)("Category", categorySchema);
exports.default = Category;
//# sourceMappingURL=Category.js.map