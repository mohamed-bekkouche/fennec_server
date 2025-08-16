"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CollectionController_1 = require("../controllers/CollectionController");
const collectionRouter = (0, express_1.Router)();
collectionRouter.get("/", CollectionController_1.getAllCollections);
exports.default = collectionRouter;
//# sourceMappingURL=CollectionRouter.js.map