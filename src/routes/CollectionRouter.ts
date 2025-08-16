import { Router } from "express";
import { getAllCollections } from "../controllers/CollectionController";

const collectionRouter = Router();

collectionRouter.get("/", getAllCollections);

export default collectionRouter;
