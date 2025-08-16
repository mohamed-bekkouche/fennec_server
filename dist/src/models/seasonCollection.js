"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Product_1 = __importDefault(require("./Product"));
const seasonCollectionSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
}, {
    timestamps: true,
});
seasonCollectionSchema
    .virtual("totalProduct")
    .get(async function () {
    return await Product_1.default.countDocuments({ seasonCollection: this._id });
});
const SeasonCollection = (0, mongoose_1.model)("SeasonCollection", seasonCollectionSchema);
exports.default = SeasonCollection;
//# sourceMappingURL=seasonCollection.js.map