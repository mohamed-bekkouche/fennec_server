// controllers/productImageController.ts
import { Request, Response } from "express";
import ProductImage from "../models/ProductImage";

export const getAllProductImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const productImages = await ProductImage.find()
      .populate({
        path: "hotspots.product",
        model: "Product", 
        // select: "all" 
      });
    
    res.status(200).json({ productImages });
  } catch (error: any) {
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};