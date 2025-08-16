import { Request, Response } from "express";
import SuitElement, { ISuitElement } from "../models/SuitElement";

export const getAllSuitElemnts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const suitElements = await SuitElement.find().populate({
      path: "product",
    });

    const grouped: Record<string, ISuitElement[]> = {};
    for (const element of suitElements) {
      if (!grouped[element.type]) {
        grouped[element.type] = [];
      }
      grouped[element.type].push(element);
    }

    res.status(200).json({ suitElements: grouped });
  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
