import mongoose, { Schema, Document } from "mongoose";

export interface IReturnRequest extends Document {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  reason: string;
  status: "pending" | "approved" | "rejected";
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ReturnRequestSchema = new Schema<IReturnRequest>(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    images: [{ type: String }],
  },
  { timestamps: true }
);

const ReturnRequest = mongoose.model<IReturnRequest>(
  "ReturnRequest",
  ReturnRequestSchema
);
export default ReturnRequest;
