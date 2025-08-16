import { Request, Response } from "express";
import Product from "../models/Product";
import Order from "../models/Order";
import { isValidObjectId } from "mongoose";
import User from "../models/User";

export const getProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("brand")
      .populate("seasonCollection");

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      category: (product.category as any)._id,
      isAvailable: true,
    })
      .limit(4)
      .populate("category")
      .populate("brand")
      .populate("seasonCollection");

    res.status(200).json({ product, similarProducts });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      category,
      seasonCollection,
      brand,
      minPrice,
      maxPrice,
      sortBy,
      order,
      page = 1,
      limit = 10,
      isAvailable,
    } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res
        .status(400)
        .json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const query: any = {};

    if (name) {
      query.$or = [
        { name: { $regex: name, $options: "i" } },
        { description: { $regex: name, $options: "i" } },
      ];
    }
    if (category) query.category = category;
    if (seasonCollection) query.seasonCollection = seasonCollection;
    if (brand) query.brand = brand;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (isAvailable === "true") query.isAvailable = true;
    if (isAvailable === "false") query.isAvailable = false;

    const sortField = sortBy?.toString() || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate("category")
      .populate("brand")
      .populate("seasonCollection")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      total,
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getTopSellingProducts = async (req: Request, res: Response) => {
  try {
    const { limit = 8 } = req.query;

    const topSellingProducts = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $limit: Number(limit) },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$product", { totalSold: "$totalSold" }],
          },
        },
      },
    ]);

    res.status(200).json({ topSellingProducts });
  } catch (error) {
    console.error("Failed to get top selling products:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getUserWishlist = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  try {
    const user = await User.findById(userId)
      .populate({
        path: "wishList",
        model: Product,
        options: {
          skip,
          limit,
        },
      })
      .select("wishList");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const total = await User.findById(userId).select("wishList");

    const totalItems = total?.wishList?.length || 0;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      totalPages,
      wishList: user.wishList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    if (!isValidObjectId(productId)) {
      res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    if (user.wishList?.includes(productId as any)) {
      res.status(400).json({
        message: "Product already in wishlist",
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?.userId,
      { $addToSet: { wishList: productId } },
      { new: true }
    )
      .select("wishList")
      .populate({
        path: "wishList",
        select: "name price images",
      });

    res.status(200).json({
      success: true,
      data: {
        wishList: updatedUser?.wishList || [],
        count: updatedUser?.wishList?.length || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      message: "Internal server error",
    });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?.userId,
      { $pull: { wishList: productId } },
      { new: true }
    )
      .select("wishList")
      .populate({
        path: "wishList",
        select: "name price images",
      });

    if (!updatedUser) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        wishList: updatedUser.wishList || [],
        count: updatedUser.wishList?.length || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      message: "Internal server error",
    });
  }
};
