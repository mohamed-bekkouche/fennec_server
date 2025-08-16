import { Request, Response } from "express";
import SeasonCollection from "../models/seasonCollection";

export const getAllCollections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.query;

    const query: any = {};
    if (name) query.name = { $rgex: name, $options: "i" };

    const collections = await SeasonCollection.find(query).sort({
      createdAt: -1,
    });

    res.status(200).json({ collections });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};
