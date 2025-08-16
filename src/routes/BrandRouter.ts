import { Router } from "express";
import { getAllBrands } from "../controllers/BrandController";

const brandRouter = Router();

brandRouter.get("/", getAllBrands);

export default brandRouter;
