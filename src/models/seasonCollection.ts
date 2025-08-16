import { Document, Schema, model } from "mongoose";
import type { Model } from "mongoose";
import Product from "./Product";

export interface ISeasonCollection extends Document {
  name: string;
  description: string;
  image: string;
  totalProduct?: number;
}

const seasonCollectionSchema = new Schema<ISeasonCollection>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

seasonCollectionSchema
  .virtual("totalProduct")
  .get(async function (this: ISeasonCollection) {
    return await Product.countDocuments({ seasonCollection: this._id });
  });

const SeasonCollection: Model<ISeasonCollection> = model<ISeasonCollection>(
  "SeasonCollection",
  seasonCollectionSchema
);
export default SeasonCollection;
