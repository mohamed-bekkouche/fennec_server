import { Router } from "express";
import { getAllProductImages } from "../controllers/ProductImageController";

const productImageRouter = Router();

productImageRouter.get("/", getAllProductImages); 

export default productImageRouter;
