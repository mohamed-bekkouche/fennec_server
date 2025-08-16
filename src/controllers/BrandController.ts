import { Request, Response } from "express";
import Brand from "../models/Brand";

export const getAllBrands = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.query;
    const query: any = {};
    if (name) query.name = { $rgex: name, $options: "i" };

    const brands = await Brand.find(query).sort({ createdAt: -1 });

    res.status(200).json({ brands });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};
