import { Request, Response } from "express";
import Category from "../models/Category";

export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.query;
    const query: any = {};
    if (name) query.name = { $rgex: name, $options: "i" };

    const categories = await Category.find(query).sort({ createdAt: -1 });

    res.status(200).json({ categories });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};
