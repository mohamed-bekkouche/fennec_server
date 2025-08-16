import mongoose, { Schema, Document } from "mongoose";

export interface IHotspot {
  positionX: number;
  positionY: number;
  product: string;
}

export interface IProductImage extends Document {
  image: string;
  hotspots: IHotspot[];
}

const hotspotSchema = new Schema<IHotspot>(
  {
    positionX: { type: Number, required: true },
    positionY: { type: Number, required: true },
    product: { type: String, required: true },
  },
  { _id: false }
);

const productImageSchema = new Schema<IProductImage>(
  {
    image: { type: String, required: true },
    hotspots: { type: [hotspotSchema], default: [] },
  },
  { timestamps: true }
);

const ProductImage = mongoose.model<IProductImage>(
  "ProductImage",
  productImageSchema
);

export default ProductImage;
