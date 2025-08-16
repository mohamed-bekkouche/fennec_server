"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Review_1 = __importDefault(require("./Review"));
const productSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Product Name Is Required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Product Description Is Required"],
        trim: true,
    },
    cost: {
        type: Number,
        required: [true, "Product Cost Is Required"],
    },
    price: {
        type: Number,
        required: [true, "Product Price Is Required"],
    },
    oldPrice: {
        type: Number,
    },
    sizes: {
        type: mongoose_1.Schema.Types.Mixed,
        validate: {
            validator: function (value) {
                if (value === "onsize")
                    return true;
                if (Array.isArray(value)) {
                    return value.every((item) => typeof item === "string" || typeof item === "number");
                }
                return false;
            },
            message: 'sizes must be "onsize", an array of strings, or an array of numbers',
        },
        required: [true, "Product Sizes Is Required"],
    },
    colors: {
        type: [String],
        required: [true, "Product Colors Is Required"],
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Product Category Is Required"],
    },
    seasonCollection: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SeasonCollection",
        required: [true, "Product seasonCollection Is Required"],
    },
    brand: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Brand",
        required: [true, "Product Brand Is Required"],
    },
    images: {
        type: [String],
        required: [true, "Product Image Are Required"],
    },
    stock: {
        type: Number,
        required: [true, "Product Stock Is Required"],
        default: 0,
    },
    rating: {
        type: Number,
        default: 5,
    },
    reviews: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    isAvailable: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
productSchema.pre("save", async function (next) {
    try {
        if (this.isModified("stock")) {
            if (this.stock <= 0) {
                this.isAvailable = false;
            }
        }
        if (this.isModified("reviews")) {
            const reviewDocs = await Review_1.default.find({ product: this._id }).select("rating");
            const ratings = reviewDocs.map((review) => review.rating);
            if (ratings.length > 0) {
                this.rating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            }
        }
        return next();
    }
    catch (err) {
        return next(err);
    }
});
productSchema.index({ name: "text" });
const Product = (0, mongoose_1.model)("Product", productSchema);
exports.default = Product;
//# sourceMappingURL=Product.js.map