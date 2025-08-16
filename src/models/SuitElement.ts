import { Schema, Document, model } from "mongoose";

export interface ISuitElement extends Document {
  product: Schema.Types.ObjectId;
  type:
    | "jacket"
    | "pants"
    | "shirt"
    | "tie"
    | "shoes"
    | "vest"
    | "belt"
    | "accessory";
  color: {
    name: string;
    image: string;
  };
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const suitElementSchema = new Schema<ISuitElement>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
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
  },
  { timestamps: true }
);

const SuitElement = model<ISuitElement>("SuitElement", suitElementSchema);

export default SuitElement;
