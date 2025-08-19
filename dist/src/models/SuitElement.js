"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const suitElementSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    type: {
        type: String,
        enum: [
            "jacket",
            "pants",
            "shirt",
            "tie",
            "shoes",
            "vest",
            "belt",
            "accessory",
        ],
        required: true,
    },
    color: {
        name: { type: String, required: true },
        image: { type: String, required: true },
    },
    image: { type: String, required: true },
}, { timestamps: true });
const SuitElement = (0, mongoose_1.model)("SuitElement", suitElementSchema);
exports.default = SuitElement;
//# sourceMappingURL=SuitElement.js.map