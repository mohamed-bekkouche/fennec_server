"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMyOrder = exports.getMyOrder = exports.getMyOrders = exports.makeOrder = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const Order_1 = __importDefault(require("../models/Order"));
const generateOrderNumber = () => {
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit
    return `ORD-${date}-${rand}`;
};
const useCoupon = async (couponId, totalPrice) => {
    if (!couponId)
        return null;
    const coupon = await Coupon_1.default.findById(couponId);
    if (!coupon)
        throw new Error("Coupon not found");
    if (!coupon.isActive)
        throw new Error("Coupon is not active");
    if (coupon.expiresAt < new Date())
        throw new Error("Coupon expired");
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
        throw new Error("Coupon usage limit exceeded");
    let discount = 0;
    if (coupon.discountType === "percent") {
        discount = (totalPrice * coupon.value) / 100;
    }
    else if (coupon.discountType === "amount") {
        discount = coupon.value;
    }
    if (discount > totalPrice)
        throw new Error("Discount exceeds total price");
    coupon.usedCount += 1;
    await coupon.save();
    return discount;
};
const makeOrder = async (req, res) => {
    try {
        const { products, coupon, deliveryMethod, deliveryInfo } = req.body;
        const pricePromises = products.map(async ({ product: productId, quantity }) => {
            const product = await Product_1.default.findById(productId);
            if (!product)
                throw new Error("Product not found");
            if (product.stock < quantity) {
                throw new Error(`Not enough stock for product: ${product.name}`);
            }
            product.stock -= quantity;
            await product.save();
            return product.price * quantity;
        });
        const prices = await Promise.all(pricePromises);
        const totalPrice = prices.reduce((acc, price) => acc + price, 0);
        if (totalPrice <= 0) {
            res
                .status(400)
                .json({ message: "Total price must be greater than zero" });
            return;
        }
        let discount = 0;
        if (coupon) {
            discount = (await useCoupon(coupon, totalPrice)) ?? 0;
        }
        const order = new Order_1.default({
            products,
            user: req.user?.userId,
            coupon,
            deliveryInfo,
            deliveryMethod,
            originalPrice: totalPrice,
            totalPrice: totalPrice - discount,
            discount,
            orderNumber: generateOrderNumber(),
        });
        await order.save();
        res.status(201).json({
            message: "Order created successfully",
            orderId: order._id,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.makeOrder = makeOrder;
const getMyOrders = async (req, res) => {
    try {
        const { orderNumber, deliveryMethod, status, page = 1, limit = 10, } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res
                .status(400)
                .json({ message: "Page and limit must be greater than 0" });
            return;
        }
        const query = { user: req.user?.userId };
        if (status)
            query.status = status;
        if (deliveryMethod)
            query.deliveryMethod = deliveryMethod;
        if (orderNumber)
            query.orderNumber = { $regex: orderNumber, $options: "i" };
        const skip = (Number(page) - 1) * Number(limit);
        const orders = await Order_1.default.find(query)
            .populate([
            { path: "products.product", select: "name images price" },
            { path: "coupon", select: "code discountType value" },
            { path: "user", select: "avatar email username" },
        ])
            .skip(skip)
            .limit(Number(limit));
        const total = await Order_1.default.countDocuments(query);
        res
            .status(200)
            .json({ orders, total, pages: Math.ceil(total / Number(limit)) });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};
exports.getMyOrders = getMyOrders;
const getMyOrder = async (req, res) => {
    try {
        const order = await Order_1.default.findById(req.params.id).populate([
            { path: "products.product", select: "name images price" },
            { path: "coupon", select: "code discountType value" },
        ]);
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        if (order.user && order.user.toString() !== req.user?.userId) {
            res.status(404).json({ message: "You can't access this order" });
            return;
        }
        res.status(200).json({ order });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};
exports.getMyOrder = getMyOrder;
const cancelMyOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            res.status(404).json({ message: "Order Not Found" });
            return;
        }
        if (order.user && order.user.toString() !== req.user?.userId) {
            res.status(404).json({ message: "You can't access this order" });
            return;
        }
        if (order.status === "cancelled") {
            res.status(404).json({ message: "Order already cancelled" });
            return;
        }
        await Promise.all(order.products.map(async ({ product: productId, quantity }) => {
            const product = await Product_1.default.findById(productId);
            if (product) {
                product.stock = product.stock + quantity;
                await product.save();
            }
        }));
        if (order.coupon) {
            const coupon = await Coupon_1.default.findById(order.coupon);
            if (coupon) {
                coupon.usedCount -= 1;
                await coupon.save();
            }
        }
        if (reason)
            order.deliveryInfo.notes = reason;
        order.status = "cancelled";
        await order.save();
        res.status(200).json({
            message: "Order cancelled",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};
exports.cancelMyOrder = cancelMyOrder;
//# sourceMappingURL=OrderController.js.map