import { Router } from "express";
import {
  addToWishlist,
  getAllProducts,
  getProduct,
  getTopSellingProducts,
  getUserWishlist,
  removeFromWishlist,
} from "../controllers/ProductController";
import { authenticate } from "../middlewares/Auth";

const productRouter = Router();

productRouter.get("/", getAllProducts);

productRouter.get("/top-selling", getTopSellingProducts);

productRouter.get("/wishlist", authenticate, getUserWishlist);
productRouter.put("/wishlist/:productId", authenticate, addToWishlist);
productRouter.delete("/wishlist/:productId", authenticate, removeFromWishlist);
productRouter.get("/:id", getProduct);

export default productRouter;
