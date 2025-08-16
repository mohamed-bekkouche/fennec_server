import { Request, Response } from "express";
import Product from "../models/Product";
import Coupon from "../models/Coupon";
import Order from "../models/Order";
import Brand from "../models/Brand";
import Category from "../models/Category";
import { deleteImage } from "../utils/Delete";
import User from "../models/User";
import { generateMonthlyData } from "../utils/Analytics";
import SeasonCollection from "../models/seasonCollection";
import ProductImage, { IHotspot } from "../models/ProductImage";
import SuitElement from "../models/SuitElement";
import { isValidObjectId } from "mongoose";

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      sizes,
      colors,
      cost,
      category,
      stock,
      seasonCollection,
      brand,
    } = req.body;

    if (
      !name ||
      !description ||
      !price ||
      !cost ||
      !category ||
      !stock ||
      !brand ||
      !sizes ||
      !colors
    ) {
      res.status(400).json({ message: "All fields must fill" });
      return;
    }
    const files: any = req.files;
    const images = files.map(
      (file: any) => `/uploads/products/${file?.filename}`
    );

    const newProduct = await Product.create({
      name,
      description,
      price,
      cost,
      stock,
      category,
      seasonCollection,
      brand,
      images,
      colors: JSON.parse(colors),
      sizes: sizes === "onsize" ? sizes : JSON.parse(sizes),
    });

    res
      .status(200)
      .json({ message: "Product created Successfully", product: newProduct });
  } catch (error: any) {
    console.error("Error : ", error);
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      cost,
      stock,
      category,
      seasonCollection,
      brand,
      sizes,
      colors,
      deletedImages,
    } = req.body;

    console.log("Updated Product");

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Porduct not found" });
      return;
    }

    if (name) product.name = name;
    if (description) product.description = description;

    if (typeof cost === "number") product.cost = cost;
    if (typeof price === "number") product.price = price;
    if (typeof stock === "number") product.stock = stock;
    if (sizes) product.sizes = sizes === "onsize" ? sizes : JSON.parse(sizes);
    if (colors) product.colors = JSON.parse(colors);
    if (brand) product.brand = brand;
    if (category) product.category = category;
    if (seasonCollection) product.seasonCollection = seasonCollection;

    JSON.parse(deletedImages).map((imagePath: string) => {
      const index = product.images.indexOf(imagePath);
      if (imagePath) {
        product.images.splice(index, 1);
        deleteImage(imagePath);
      }
    });

    const files: any = req.files;
    const images = files.map(
      (file: any) => `/uploads/products/${file?.filename}`
    );
    if (images && images.length > 0) {
      product.images.push(...images);
    }
    await product.save();

    res.status(200).json({ message: "Product created Successfully", product });
  } catch (error: any) {
    console.error("Error : ", error);
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    product.images.forEach((imagePath: string) => {
      deleteImage(imagePath);
    });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      status,
      reason,
    }: {
      status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "returned"
        | "cancelled";
      reason?: string;
    } = req.body;

    if (!status) {
      res.status(400).json({ message: "You must provide a status" });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ message: "Order Not Found" });
      return;
    }

    if (status === "cancelled" || status === "returned") {
      await Promise.all(
        order.products.map(async ({ product: productId, quantity }) => {
          const product = await Product.findById(productId);
          if (product) {
            product.stock = product.stock + quantity;
            await product.save();
          }
        })
      );
      if (order.coupon) {
        const coupon = await Coupon.findById(order.coupon);
        if (coupon) {
          coupon.usedCount -= 1;
          await coupon.save();
        }
      }
      order.deliveryInfo.notes = reason;
    }

    if (order.status === "cancelled" || order.status === "returned") {
      res.status(400).json({
        message: "Cannot update status of cancelled or returned orders",
      });
      return;
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      orderNumber,
      deliveryMethod,
      status,
      sortBy,
      order,
      page = 1,
      limit = 10,
    } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res
        .status(400)
        .json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const query: any = {};
    if (status) query.status = status;
    if (deliveryMethod) query.deliveryMethod = deliveryMethod;
    if (orderNumber) query.orderNumber = { $regex: orderNumber, $options: "i" };

    const sortField = sortBy?.toString() || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query)
      .populate([
        { path: "products.product", select: "name images price" },
        { path: "coupon", select: "code discountType value" },
        { path: "user", select: "avatar email username" },
      ])
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(Number(limit));
    const total = await Order.countDocuments(query);

    res
      .status(200)
      .json({ orders, total, pages: Math.ceil(total / Number(limit)) });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate([
      { path: "products.product", select: "name images[0] price" },
      { path: "coupon", select: "code discountType value" },
    ]);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json({ order });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const createBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: "Brand name is require" });
      return;
    }

    const filename = req.file?.filename;
    const newBrand = await Brand.create({
      name,
      description,
      image: `/uploads/brands/${filename}`,
    });

    res.status(201).json({
      message: "Bran created Successfully",
      brand: newBrand,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const updateBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;

    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      res.status(404).json({ message: "Brand not found" });
      return;
    }

    if (name) brand.name = name;
    if (description) brand.description = description;

    const filename = req.file?.filename;
    if (filename) {
      deleteImage(brand.image);
      brand.image = `/uploads/brands/${filename}`;
    }

    await brand.save();

    res.status(200).json({
      message: "Brand updated Successfully",
      brand,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const deleteBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      res.status(404).json({ message: "Brand not found" });
      return;
    }

    deleteImage(brand.image);

    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, sortBy, order } = req.query;

    const query: any = {};
    if (name) query.name = { $regex: name, $options: "i" };

    const sortField = sortBy?.toString() || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const brands = await Brand.find(query)
      .sort({ [sortField]: sortOrder })
      .lean();

    const brandsWithCount = await Promise.all(
      brands.map(async (brand) => {
        const totalProduct = await Product.countDocuments({
          brand: brand._id,
        });
        return { ...brand, totalProduct };
      })
    );

    const total = await Brand.countDocuments(query);

    res.status(200).json({ brands: brandsWithCount, total });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id).lean();

    if (!brand) {
      res.status(404).json({ message: "Brand not found" });
    }

    const totalProduct = await Product.countDocuments({
      brand: brand?._id,
    });

    res.status(200).json({ brand: { ...brand, totalProduct } });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      res.status(400).json({ message: "All fields must fill" });
      return;
    }
    const filename = req.file?.filename;
    const newCategory = await Category.create({
      name,
      description,
      image: `/uploads/categories/${filename}`,
    });

    res.status(200).json({
      message: "Category created Successfully",
      category: newCategory,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    if (name) category.name = name;
    if (description) category.description = description;

    const filename = req.file?.filename;
    if (filename) {
      deleteImage(category.image);
      category.image = `/uploads/categories/${filename}`;
    }

    await category.save();

    res.status(200).json({
      message: "Category updated Successfully",
      category,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, sortBy, order } = req.query;
    const query: any = {};
    if (name) query.name = { $regex: name, $options: "i" };

    const sortField = sortBy?.toString() || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const categories = await Category.find(query)
      .sort({ [sortField]: sortOrder })
      .lean();

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const totalProduct = await Product.countDocuments({
          category: cat._id,
        });
        return { ...cat, totalProduct };
      })
    );

    const total = await Category.countDocuments(query);

    res.status(200).json({ categories: categoriesWithCount, total });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).lean();

    if (!category) {
      res.status(404).json({ message: "Category not found" });
    }

    const totalProduct = await Product.countDocuments({
      category: category?._id,
    });

    res.status(200).json({ category: { ...category, totalProduct } });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    deleteImage(category.image);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const createCollection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      res.status(400).json({ message: "All fields must fill" });
      return;
    }
    const filename = req.file?.filename;
    const newCollection = await SeasonCollection.create({
      name,
      description,
      image: `/uploads/collections/${filename}`,
    });

    res.status(200).json({
      message: "Collection created successffully",
      collection: newCollection,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const updateCollection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;

    const collection = await SeasonCollection.findById(req.params.id);
    if (!collection) {
      res.status(404).json({ message: "Collection not found" });
      return;
    }

    if (name) collection.name = name;
    if (description) collection.description = description;

    const filename = req.file?.filename;
    if (filename) {
      deleteImage(collection.image);
      collection.image = `/uploads/collections/${filename}`;
    }

    await collection.save();

    res.status(200).json({
      message: "Collection updated Successfully",
      collection,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getCollections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, sortBy, order } = req.query;
    const query: any = {};
    if (name) query.name = { $regex: name, $options: "i" };

    const sortField = sortBy?.toString() || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const collections = await SeasonCollection.find(query)
      .sort({ [sortField]: sortOrder })
      .lean();

    const collectionsWithCount = await Promise.all(
      collections.map(async (coll) => {
        const totalProduct = await Product.countDocuments({
          seasonCollection: coll._id,
        });
        return { ...coll, totalProduct };
      })
    );

    const total = await SeasonCollection.countDocuments(query);

    res.status(200).json({ collections: collectionsWithCount, total });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getCollection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const collection = await SeasonCollection.findById(id).lean();

    if (!collection) {
      res.status(404).json({ message: "Collection not found" });
    }

    const totalProduct = await Product.countDocuments({
      seasonCollection: collection?._id,
    });

    res.status(200).json({ collection: { ...collection, totalProduct } });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const deleteCollection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const collection = await SeasonCollection.findByIdAndDelete(req.params.id);
    if (!collection) {
      res.status(404).json({ message: "Collection not found" });
      return;
    }

    deleteImage(collection.image);

    res.status(200).json({ message: "Collection deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const createCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code, discountType, value, expiresAt, usageLimit } = req.body;

    if (!code || !discountType || !value || !expiresAt) {
      res.status(400).json({ message: "All fields must fill" });
      return;
    }

    const newCoupon = await Coupon.create({
      code,
      discountType,
      value,
      expiresAt,
      usageLimit,
    });

    res.status(201).json({
      message: "Coupon created Successfully",
      coupon: newCoupon,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const updateCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code, discountType, value, expiresAt, usageLimit, isActive } =
      req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ message: "Coupon not found" });
      return;
    }

    // Validate expiration date
    if (expiresAt && new Date(expiresAt) < new Date()) {
      res
        .status(400)
        .json({ message: "Expiration date must be in the future" });
      return;
    }

    // Validate usage limit
    if (usageLimit !== undefined && usageLimit < coupon.usedCount) {
      res.status(400).json({
        message: `Usage limit cannot be less than used count (${coupon.usedCount})`,
      });
      return;
    }

    // Check if code is being changed to one that already exists
    if (code && code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code });
      if (existingCoupon) {
        res.status(400).json({ message: "Coupon code already exists" });
        return;
      }
    }

    // Update fields
    if (code) coupon.code = code;
    if (typeof isActive === "boolean") coupon.isActive = isActive;
    if (discountType) coupon.discountType = discountType;
    if (value) coupon.value = value;
    if (expiresAt) coupon.expiresAt = new Date(expiresAt);
    if (typeof usageLimit === "number") coupon.usageLimit = usageLimit;

    await coupon.save();

    res.status(200).json({
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};
export const deleteCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ message: "Coupon not found" });
      return;
    }
    if (coupon.usedCount > 0) {
      res.status(400).json({
        message: "Cannot delete a coupon that has been used",
      });
      return;
    }
    await Coupon.deleteOne();
    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getAllCoupons = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      isActive,
      isExpired,
      code,
      sortBy,
      order,
      page = 1,
      limit = 10,
    } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res
        .status(400)
        .json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const query: any = {};

    if (code) query.code = { $regex: code, $options: "i" };
    if (isActive === "true") query.isActive = true;
    if (isActive === "false") query.isActive = false;
    if (isExpired == "true") query.expiresAt = { $lte: new Date() };
    if (isExpired == "false") query.expiresAt = { $gte: new Date() };

    const skip = (Number(page) - 1) * Number(limit);
    const sortField = sortBy?.toString() || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;
    const coupons = await Coupon.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ [sortField]: sortOrder });

    const total = await Coupon.countDocuments(query);

    res.status(200).json({
      coupons,
      total,
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ message: "Coupon not found" });
      return;
    }

    res.status(200).json({ coupon });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      username,
      sortBy,
      isBlocked,
      page = 1,
      limit = 10,
      order,
    } = req.query;
    if (Number(page) < 1 || Number(limit) < 1) {
      res
        .status(400)
        .json({ message: "Page and limit must be greater than 0" });
      return;
    }
    const query: any = {};

    if (username) query.username = { $regex: username, $options: "i" };
    if (isBlocked) query.isBlocked = isBlocked;

    const sortField = sortBy?.toString() || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ [sortField]: sortOrder });

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
      total,
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getUserWithOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const orders = await Order.find({ user: user._id }).populate([
      { path: "products.product", select: "name images price" },
      { path: "coupon", select: "code discountType value" },
    ]);

    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered"
    );
    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled"
    );
    const returnedOrders = orders.filter(
      (order) => order.status === "returned"
    );

    const totalSpentOnDelivered = deliveredOrders.reduce(
      (sum, o) => sum + o.totalPrice,
      0
    );

    const averageDeliveredOrderValue =
      deliveredOrders.length > 0
        ? totalSpentOnDelivered / deliveredOrders.length
        : 0;
    const lastDeliveredOrderDate = deliveredOrders[0]?.createdAt;

    res.status(200).json({
      user,
      orders,
      summary: {
        totalOrders: orders.length,
        deliveredOrders: deliveredOrders.length,
        cancelledOrders: cancelledOrders.length,
        returnedOrders: returnedOrders.length,
        totalSpentOnDelivered,
        averageDeliveredOrderValue,
        lastDeliveredOrderDate,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const blockAndDeblockUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      user,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const makeAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.isAdmin = !user.isAdmin;
    await user.save();

    res.status(200).json({
      message: `User ${
        user.isAdmin ? "made admin" : "removed from admin"
      } successfully`,
      user,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const addProductImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotspots } = req.body;
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Image for hotspots is required" });
    }

    const productImage = await ProductImage.create({
      image: `/uploads/hotspots/${file?.filename}`,
      hotspots: JSON.parse(hotspots),
    });

    res.status(200).json({ productImage });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const updateProductImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotspots } = req.body;

    const productImage = await ProductImage.findById(req.params.id);

    if (!productImage) {
      res.status(200).json({ message: "Product Image not found" });
      return;
    }

    const file = req.file;
    if (file) {
      deleteImage(productImage.image);
      productImage.image = `/uploads/hotspots/${file?.filename}`;
    }
    if (hotspots) productImage.hotspots = JSON.parse(hotspots);
    await productImage.save();
    res.status(200).json({ productImage });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const deleteProductImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("I Want to delete ");

    const productImage = await ProductImage.findByIdAndDelete(req.params.id);

    if (!productImage) {
      res.status(200).json({ message: "Product Image not found" });
      return;
    }

    res.status(200).json({ message: "Image Deleted Successffully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

interface MulterFiles {
  [fieldname: string]: Express.Multer.File[];
}

export const createSuitElement = async (req: Request, res: Response) => {
  try {
    const { colorName, product, type } = req.body;
    const files = req.files as MulterFiles;
    if (!files || !files["colorImage"] || !files["productImage"]) {
      res
        .status(400)
        .json({ message: "Both colorImage and productImage are required" });
      return;
    }

    const colorImagePath = files["colorImage"][0].filename;
    const productImagePath = files["productImage"][0].filename;

    if (!isValidObjectId(product)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const suitElement = new SuitElement({
      type,
      product,
      color: {
        name: colorName,
        image: `/uploads/suit-elements/${colorImagePath}`,
      },
      image: `/uploads/suit-elements/${productImagePath}`,
    });

    await suitElement.save();

    res.status(201).json({ suitElement });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Suit element already exists" });
      return;
    }
    res.status(400).json({
      message: "Error creating suit element",
      error: error.message,
    });
  }
};

export const deleteSuitElemnt = async (req: Request, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid Suit element ID" });
      return;
    }

    const suitElement = await SuitElement.findByIdAndDelete(req.params.id);
    if (!suitElement) {
      res.status(404).json({ message: "Suit element not found" });
      return;
    }

    if (suitElement.image) {
      deleteImage(suitElement.image);
    }

    if (suitElement.color.image) {
      deleteImage(suitElement.color.image);
    }

    res.status(201).json({ suitElement });
  } catch (error: any) {
    res.status(400).json({
      message: "Error deleting suit element",
      error: error.message,
    });
  }
};

export const getSalesAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, monthsBack = 6 } = req.query;
    const query: any = {};
    if (status) query.status;
    const data = await generateMonthlyData(
      Order,
      Number(monthsBack) || 6,
      {},
      query
    );
    res.status(200).json({ data });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getCustomerAnalytics = async (req: Request, res: Response) => {
  try {
    const result = await User.aggregate([
      {
        $facet: {
          totalCustomers: [{ $count: "count" }],
          blockedCustomers: [
            { $match: { isBlocked: true } },
            { $count: "count" },
          ],
          newCustomersByMonth: [
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
          ],
        },
      },
    ]);

    const data = result[0];

    res.status(200).json({
      totalCustomers: data.totalCustomers[0]?.count || 0,
      blockedCustomers: data.blockedCustomers[0]?.count || 0,
      newCustomersByMonth: data.newCustomersByMonth,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch customer analytics",
      error: error.message,
    });
  }
};

export const getProductAnalytics = async (req: Request, res: Response) => {
  try {
    const result = await Product.aggregate([
      {
        $facet: {
          totalProducts: [{ $count: "count" }],
          outOfStock: [{ $match: { stock: { $lte: 0 } } }, { $count: "count" }],
          averagePrice: [
            { $group: { _id: null, avgPrice: { $avg: "$price" } } },
          ],
          topRated: [
            { $sort: { rating: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                productId: "$_id",
                name: 1,
                rating: 1,
                price: 1,
              },
            },
          ],
        },
      },
    ]);

    const data = result[0];

    res.status(200).json({
      totalProducts: data.totalProducts[0]?.count || 0,
      outOfStock: data.outOfStock[0]?.count || 0,
      averagePrice: data.averagePrice[0]?.avgPrice || 0,
      topRated: data.topRated,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch product analytics",
      error: error.message,
    });
  }
};

export const getSalesStatics = async (
  _: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await Order.aggregate([
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$totalPrice" },
                totalOrders: { $sum: 1 },
                averageOrderValue: { $avg: "$totalPrice" },
              },
            },
          ],

          topSellingProducts: [
            { $unwind: "$products" },
            {
              $group: {
                _id: "$products.product",
                totalSold: { $sum: "$products.quantity" },
              },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product",
              },
            },
            { $unwind: "$product" },
            {
              $project: {
                _id: 0,
                productId: "$product._id",
                name: "$product.name",
                images: "$product.images",
                totalSold: 1,
              },
            },
          ],

          salesByStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                total: { $sum: "$totalPrice" },
              },
            },
          ],

          salesByUser: [
            {
              $group: {
                _id: {
                  $cond: [{ $eq: ["$user", null] }, "guest", "user"],
                },
                totalOrders: { $sum: 1 },
                totalSales: { $sum: "$totalPrice" },
              },
            },
            {
              $group: {
                _id: null,
                guests: {
                  $sum: {
                    $cond: [{ $eq: ["$_id", "guest"] }, "$totalOrders", 0],
                  },
                },
                guestSales: {
                  $sum: {
                    $cond: [{ $eq: ["$_id", "guest"] }, "$totalSales", 0],
                  },
                },
                users: {
                  $sum: {
                    $cond: [{ $eq: ["$_id", "user"] }, "$totalOrders", 0],
                  },
                },
                userSales: {
                  $sum: {
                    $cond: [{ $eq: ["$_id", "user"] }, "$totalSales", 0],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                guests: {
                  totalOrders: "$guests",
                  totalSales: "$guestSales",
                },
                users: {
                  totalOrders: "$users",
                  totalSales: "$userSales",
                },
              },
            },
          ],

          mostCustomersRaw: [
            {
              $match: {
                user: { $ne: null },
                status: { $in: ["delivered", "returned", "cancelled"] },
              },
            },
            {
              $group: {
                _id: {
                  user: "$user",
                  status: "$status",
                },
                count: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id.user",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $project: {
                _id: 0,
                userId: "$_id.user",
                count: 1,
                status: "$_id.status",
                name: "$user.username",
                email: "$user.email",
                avatar: "$user.avatar",
              },
            },
          ],
        },
      },

      {
        $addFields: {
          most: {
            delivered: {
              $slice: [
                {
                  $filter: {
                    input: "$mostCustomersRaw",
                    as: "item",
                    cond: { $eq: ["$$item.status", "delivered"] },
                  },
                },
                10,
              ],
            },
            returned: {
              $slice: [
                {
                  $filter: {
                    input: "$mostCustomersRaw",
                    as: "item",
                    cond: { $eq: ["$$item.status", "returned"] },
                  },
                },
                10,
              ],
            },
            cancelled: {
              $slice: [
                {
                  $filter: {
                    input: "$mostCustomersRaw",
                    as: "item",
                    cond: { $eq: ["$$item.status", "cancelled"] },
                  },
                },
                10,
              ],
            },
          },
        },
      },
      {
        $project: {
          mostCustomersRaw: 0,
        },
      },
    ]);

    const data = stats[0];

    res.status(200).json({
      totalStats: data.totalStats[0] || {
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      },
      topSellingProducts: data.topSellingProducts,
      salesByStatus: data.salesByStatus,
      salesByUser: data.salesByUser[0] || {
        guests: { totalOrders: 0, totalSales: 0 },
        users: { totalOrders: 0, totalSales: 0 },
      },
      most: data.most,
    });
  } catch (error: any) {
    console.error("getSalesStatics error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getFinancialAnalytics = async (req: Request, res: Response) => {
  try {
    const result = await Order.aggregate([
      {
        $facet: {
          totalRevenue: [
            { $group: { _id: null, total: { $sum: "$totalPrice" } } },
          ],
          totalCost: [
            { $unwind: "$products" },
            {
              $lookup: {
                from: "products",
                localField: "products.product",
                foreignField: "_id",
                as: "productData",
              },
            },
            { $unwind: "$productData" },
            {
              $group: {
                _id: null,
                totalCost: {
                  $sum: {
                    $multiply: ["$products.quantity", "$productData.cost"],
                  },
                },
              },
            },
          ],
          monthlyRevenue: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m", date: "$createdAt" },
                },
                revenue: { $sum: "$totalPrice" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const data = result[0];
    const revenue = data.totalRevenue[0]?.total || 0;
    const cost = data.totalCost[0]?.totalCost || 0;
    const profit = revenue - cost;

    res.status(200).json({
      totalRevenue: revenue,
      totalCost: cost,
      totalProfit: profit,
      monthlyRevenue: data.monthlyRevenue,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch financial analytics",
      error: error.message,
    });
  }
};
