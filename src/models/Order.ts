import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId | null;

  orderNumber: string;

  products: {
    product: mongoose.Types.ObjectId;
    color: string;
    size: string | number | "onesize";
    quantity: number;
  }[];

  originalPrice: number;
  totalPrice: number;
  coupon: mongoose.Types.ObjectId | null;
  discount?: number;

  paymentMethod: "cash";

  deliveryMethod: "home" | "pickup";

  status:
    | "pending"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "returned"
    | "cancelled";

  deliveryInfo: {
    fullName: string;
    phone: string;
    wilaya: string;
    commune: string;
    notes?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
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
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        color: {
          type: String,
          required: true,
        },
        size: {
          type: Schema.Types.Mixed,
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
      type: mongoose.Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
