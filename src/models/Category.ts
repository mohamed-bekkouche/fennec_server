import { Document, Schema, model } from "mongoose";
import type { Model } from "mongoose";
import Product from "./Product";

export interface ICategory extends Document {
  name: string;
  description: string;
  image: string;
  totalProduct?: number;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

categorySchema.virtual("totalProduct").get(async function (this: ICategory) {
  return await Product.countDocuments({ category: this._id });
});

const Category: Model<ICategory> = model<ICategory>("Category", categorySchema);
export default Category;
