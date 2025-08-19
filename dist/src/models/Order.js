"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const OrderSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true,
    },
    products: [
        {
            product: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            color: {
                type: String,
                required: true,
            },
            size: {
                type: mongoose_1.Schema.Types.Mixed,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
        },
    ],
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    originalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    coupon: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null,
    },
    discount: {
        type: Number,
    },
    paymentMethod: {
        type: String,
        enum: ["cash"],
        default: "cash",
    },
    deliveryMethod: {
        type: String,
        enum: ["home", "pickup"],
        default: "home",
    },
    status: {
        type: String,
        enum: [
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "returned",
            "cancelled",
        ],
        default: "pending",
    },
    deliveryInfo: {
        fullName: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
            match: /^0[567]\d{8}$/,
        },
        wilaya: {
            type: String,
            required: true,
        },
        commune: {
            type: String,
            required: true,
        },
        notes: {
            type: String,
        },
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model("Order", OrderSchema);
//# sourceMappingURL=Order.js.map