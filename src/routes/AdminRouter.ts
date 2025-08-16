import { Router } from "express";
import { upload } from "../middlewares/Multer";
import { authenticate, requireAdmin } from "../middlewares/Auth";
import {
  addProductImage,
  blockAndDeblockUser,
  createBrand,
  createCategory,
  createCollection,
  createCoupon,
  createProduct,
  createSuitElement,
  deleteBrand,
  deleteCategory,
  deleteCollection,
  deleteCoupon,
  deleteProduct,
  deleteProductImage,
  deleteSuitElemnt,
  getAllCoupons,
  getAllOrders,
  getAllUsers,
  getBrand,
  getBrands,
  getCategories,
  getCategory,
  getCollection,
  getCollections,
  getCoupon,
  getFinancialAnalytics,
  getOrder,
  getSalesStatics,
  getUserWithOrders,
  makeAdmin,
  updateBrand,
  updateCategory,
  updateCollection,
  updateCoupon,
  updateOrderStatus,
  updateProduct,
  updateProductImage,
} from "../controllers/AdminController";

const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

// Product management routes
adminRouter.post(
  "/products/",
  upload("products").array("images", 10),
  createProduct
);
adminRouter.put(
  "/products/:id",
  upload("products").array("images", 10),
  updateProduct
);
adminRouter.delete("/products/:id", deleteProduct);

// Order management routes
adminRouter.put("/orders/:id", updateOrderStatus);
adminRouter.get("/orders", getAllOrders);
adminRouter.get("/orders/:id", getOrder);

// Brand management routes
adminRouter.post("/brands", upload("brands").single("image"), createBrand);
adminRouter.put("/brands/:id", upload("brands").single("image"), updateBrand);
adminRouter.delete("/brands/:id", deleteBrand);
adminRouter.get("/brands", getBrands);
adminRouter.get("/brands/:id", getBrand);

// Category management routes
adminRouter.post(
  "/categories",
  upload("categories").single("image"),
  createCategory
);
adminRouter.put(
  "/categories/:id",
  upload("categories").single("image"),
  updateCategory
);
adminRouter.delete("/categories/:id", deleteCategory);
adminRouter.get("/categories", getCategories);
adminRouter.get("/categories/:id", getCategory);

// Collection management routes
adminRouter.post(
  "/collections",
  upload("collections").single("image"),
  createCollection
);
adminRouter.put(
  "/collections/:id",
  upload("collections").single("image"),
  updateCollection
);
adminRouter.delete("/collections/:id", deleteCollection);
adminRouter.get("/collections", getCollections);
adminRouter.get("/collections/:id", getCollection);

// Coupon management routes
adminRouter.post("/coupons", createCoupon);
adminRouter.put("/coupons/:id", updateCoupon);
adminRouter.delete("/coupons/:id", deleteCoupon);
adminRouter.get("/coupons", getAllCoupons);
adminRouter.get("/coupons/:id", getCoupon);

// User management routes
adminRouter.get("/users", getAllUsers);
adminRouter.get("/users/:id", getUserWithOrders);
adminRouter.put("/users/block/:id", blockAndDeblockUser);
adminRouter.put("/users/admin/:id", makeAdmin);

// ProductImage management routes
adminRouter.post(
  "/product-image",
  upload("hotspots").single("image"),
  addProductImage
);
adminRouter.put(
  "/product-image/:id",
  upload("hotspots").single("image"),
  updateProductImage
);
adminRouter.delete("/product-image/:id", deleteProductImage);

// SuitElemnts management routes
adminRouter.post(
  "/suit-elements",
  upload("suit-elements").fields([
    { name: "colorImage", maxCount: 1 },
    { name: "productImage", maxCount: 1 },
  ]),
  createSuitElement
);
adminRouter.delete("/suit-elements/:id", deleteSuitElemnt);

// Dashboard management routes
adminRouter.get("/dashboard/sales", getSalesStatics);
adminRouter.get("/dashboard/financial", getFinancialAnalytics);

export default adminRouter;
