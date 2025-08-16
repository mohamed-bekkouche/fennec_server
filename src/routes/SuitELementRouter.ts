import { Router } from "express";
import { getAllSuitElemnts } from "../controllers/SuitElementController";

const suitElemntRouter = Router();

suitElemntRouter.get("/", getAllSuitElemnts);

export default suitElemntRouter;
