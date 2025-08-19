"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCollections = void 0;
const seasonCollection_1 = __importDefault(require("../models/seasonCollection"));
const getAllCollections = async (req, res) => {
    try {
        const { name } = req.query;
        const query = {};
        if (name)
            query.name = { $rgex: name, $options: "i" };
        const collections = await seasonCollection_1.default.find(query).sort({
            createdAt: -1,
        });
        res.status(200).json({ collections });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal server error", err: error.message });
    }
};
exports.getAllCollections = getAllCollections;
//# sourceMappingURL=CollectionController.js.map