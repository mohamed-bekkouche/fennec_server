import { Router } from "express";
import { getAllCategories } from "../controllers/CategoryController";

const categoryRouter = Router();

categoryRouter.get("/", getAllCategories);

export default categoryRouter;
