import { Document, Schema, model } from "mongoose";
import Product from "./Product";

export interface IBrand extends Document {
  name: string;
  description?: string;
  image: string;
}

const brandSchema = new Schema<IBrand>({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String, required: true },
});

brandSchema.virtual("totalProduct").get(async function (this: IBrand) {
  return await Product.countDocuments({ brand: this._id });
});

const Brand = model<IBrand>("Brand", brandSchema);
export default Brand;
