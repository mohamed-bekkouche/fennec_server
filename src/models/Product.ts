import { Schema, model, Document, MongooseError } from "mongoose";
import Review from "./Review";

export interface IProduct extends Document {
  _id: string;
  name: string;
  description: string;
  cost: number;
  price: number;
  oldPrice?: number;
  sizes: string[] | number[] | "onsize";
  colors: string[];
  category: Schema.Types.ObjectId;
  seasonCollection: Schema.Types.ObjectId;
  brand: Schema.Types.ObjectId;
  images: string[];
  stock: number;
  rating: number;
  reviews: Schema.Types.ObjectId[];
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<IProduct>(
  {
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
      type: Schema.Types.Mixed,
      validate: {
        validator: function (value) {
          if (value === "onsize") return true;

          if (Array.isArray(value)) {
            return value.every(
              (item) => typeof item === "string" || typeof item === "number"
            );
          }
          return false;
        },
        message:
          'sizes must be "onsize", an array of strings, or an array of numbers',
      },
      required: [true, "Product Sizes Is Required"],
    },
    colors: {
      type: [String],
      required: [true, "Product Colors Is Required"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product Category Is Required"],
    },
    seasonCollection: {
      type: Schema.Types.ObjectId,
      ref: "SeasonCollection",
      required: [true, "Product seasonCollection Is Required"],
    },
    brand: {
      type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", async function (next) {
  try {
    if (this.isModified("stock")) {
      if (this.stock <= 0) {
        this.isAvailable = false;
      }
    }

    if (this.isModified("reviews")) {
      const reviewDocs = await Review.find({ product: this._id }).select(
        "rating"
      );
      const ratings: number[] = reviewDocs.map((review) => review.rating);
      if (ratings.length > 0) {
        this.rating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      }
    }

    return next();
  } catch (err: unknown) {
    return next(err as MongooseError);
  }
});

productSchema.index({ name: "text" });

const Product = model<IProduct>("Product", productSchema);
export default Product;
