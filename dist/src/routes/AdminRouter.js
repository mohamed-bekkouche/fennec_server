"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Multer_1 = require("../middlewares/Multer");
const Auth_1 = require("../middlewares/Auth");
const AdminController_1 = require("../controllers/AdminController");
const adminRouter = (0, express_1.Router)();
adminRouter.use(Auth_1.authenticate);
adminRouter.use(Auth_1.requireAdmin);
// Product management routes
adminRouter.post("/products/", (0, Multer_1.upload)("products").array("images", 10), AdminController_1.createProduct);
adminRouter.put("/products/:id", (0, Multer_1.upload)("products").array("images", 10), AdminController_1.updateProduct);
adminRouter.delete("/products/:id", AdminController_1.deleteProduct);
// Order management routes
adminRouter.put("/orders/:id", AdminController_1.updateOrderStatus);
adminRouter.get("/orders", AdminController_1.getAllOrders);
adminRouter.get("/orders/:id", AdminController_1.getOrder);
// Brand management routes
adminRouter.post("/brands", (0, Multer_1.upload)("brands").single("image"), AdminController_1.createBrand);
adminRouter.put("/brands/:id", (0, Multer_1.upload)("brands").single("image"), AdminController_1.updateBrand);
adminRouter.delete("/brands/:id", AdminController_1.deleteBrand);
adminRouter.get("/brands", AdminController_1.getBrands);
adminRouter.get("/brands/:id", AdminController_1.getBrand);
// Category management routes
adminRouter.post("/categories", (0, Multer_1.upload)("categories").single("image"), AdminController_1.createCategory);
adminRouter.put("/categories/:id", (0, Multer_1.upload)("categories").single("image"), AdminController_1.updateCategory);
adminRouter.delete("/categories/:id", AdminController_1.deleteCategory);
adminRouter.get("/categories", AdminController_1.getCategories);
adminRouter.get("/categories/:id", AdminController_1.getCategory);
// Collection management routes
adminRouter.post("/collections", (0, Multer_1.upload)("collections").single("image"), AdminController_1.createCollection);
adminRouter.put("/collections/:id", (0, Multer_1.upload)("collections").single("image"), AdminController_1.updateCollection);
adminRouter.delete("/collections/:id", AdminController_1.deleteCollection);
adminRouter.get("/collections", AdminController_1.getCollections);
adminRouter.get("/collections/:id", AdminController_1.getCollection);
// Coupon management routes
adminRouter.post("/coupons", AdminController_1.createCoupon);
adminRouter.put("/coupons/:id", AdminController_1.updateCoupon);
adminRouter.delete("/coupons/:id", AdminController_1.deleteCoupon);
adminRouter.get("/coupons", AdminController_1.getAllCoupons);
adminRouter.get("/coupons/:id", AdminController_1.getCoupon);
// User management routes
adminRouter.get("/users", AdminController_1.getAllUsers);
adminRouter.get("/users/:id", AdminController_1.getUserWithOrders);
adminRouter.put("/users/block/:id", AdminController_1.blockAndDeblockUser);
adminRouter.put("/users/admin/:id", AdminController_1.makeAdmin);
// ProductImage management routes
adminRouter.post("/product-image", (0, Multer_1.upload)("hotspots").single("image"), AdminController_1.addProductImage);
adminRouter.put("/product-image/:id", (0, Multer_1.upload)("hotspots").single("image"), AdminController_1.updateProductImage);
adminRouter.delete("/product-image/:id", AdminController_1.deleteProductImage);
// SuitElemnts management routes
adminRouter.post("/suit-elements", (0, Multer_1.upload)("suit-elements").fields([
    { name: "colorImage", maxCount: 1 },
    { name: "productImage", maxCount: 1 },
]), AdminController_1.createSuitElement);
adminRouter.delete("/suit-elements/:id", AdminController_1.deleteSuitElemnt);
// Dashboard management routes
adminRouter.get("/dashboard/sales", AdminController_1.getSalesStatics);
adminRouter.get("/dashboard/financial", AdminController_1.getFinancialAnalytics);
exports.default = adminRouter;
//# sourceMappingURL=AdminRouter.js.map