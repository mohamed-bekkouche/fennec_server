"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.passwordRecovery = exports.changeEmail = exports.updateUser = exports.refreshTokens = exports.logout = exports.googleLogin = exports.login = exports.activate = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const Token_1 = require("../utils/Token");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const Mail_1 = require("../utils/Mail");
const Crypto_1 = require("../utils/Crypto");
const Delete_1 = require("../utils/Delete");
const axios_1 = __importDefault(require("axios"));
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !password || !email) {
            res.status(400).json({ message: "Username and password are required" });
            return;
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const { activation_token, activation_number } = (0, Token_1.generateActivationToken)({
            username,
            email,
            password,
        });
        const activation_url = `http://localhost:3000/activation/${activation_token}`;
        const templatePath = path_1.default.join(__dirname, "..", "mails", "activate.ejs");
        if (fs_1.default.existsSync(templatePath)) {
            const template = fs_1.default.readFileSync(templatePath, "utf8");
            const html = ejs_1.default.render(template, {
                activation_url,
                email,
                activation_number,
            });
            await Mail_1.transporter.sendMail({
                from: `Fennec Wear <${process.env.SMTP_MAIL}>`,
                to: email,
                subject: `Activation Code is ${activation_number}`,
                html,
            });
        }
        res.cookie("activation_token", activation_token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 30 * 60 * 1000,
        });
        // Development
        res.status(200).json({ activation_token, activation_number });
        // res.status(200).json({
        //   message: "Please check your DM to activate your account",
        // });
    }
    catch (error) {
        console.error("Registration error:", error);
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
};
exports.register = register;
const activate = async (req, res) => {
    try {
        const { activation_token: ac_token, activation_number: ac_number } = req.body;
        const activation_token = ac_token || req.cookies.activation_token;
        if (!activation_token) {
            res.status(404).json({ message: "Activation token not found" });
            return;
        }
        if (!ac_number) {
            res.status(404).json({ message: "Activation number not found" });
            return;
        }
        const secret = process.env.JWT_SECRET || "default_secret_key";
        const decoded = (0, Token_1.verifyToken)(activation_token, secret);
        if (typeof decoded === "string") {
            res.status(400).json({ message: "Invalid activation token" });
            return;
        }
        const { username, email, password, activation_number } = (0, Crypto_1.decrypt)(decoded.data, decoded.iv);
        if (ac_number !== activation_number) {
            res.status(400).json({ message: "Invalid activation number" });
            return;
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const newUser = new User_1.default({
            username,
            email,
            password,
        });
        await newUser.save();
        const accessToken = (0, Token_1.generateTokens)(newUser._id, newUser.isAdmin, res);
        res.clearCookie("activation_token", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.status(200).json({
            message: "Account activated successfully",
            user: { ...newUser, password: undefined },
            accessToken,
        });
    }
    catch (error) {
        console.error("Activation error:", error);
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
};
exports.activate = activate;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }
        const user = await User_1.default.findOne({ email }).select("+password");
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        if (user.isBlocked) {
            res.status(403).json({ message: "User is blocked" });
            return;
        }
        const accessToken = (0, Token_1.generateTokens)(user._id, user.isAdmin, res);
        res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id,
                createdAt: user.createdAt,
                email: user.email,
                googleAccount: user.googleAccount,
                isAdmin: user.isAdmin,
                isBlocked: user.isBlocked,
                updatedAt: user.updatedAt,
                username: user.username,
                wishList: user.wishList || [],
                avatar: user.avatar,
            },
            access_token: accessToken,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.login = login;
const googleLogin = async (req, res) => {
    const { credential: accessToken } = req.body;
    try {
        const { data } = await axios_1.default.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const { email, name, picture } = data;
        if (!email) {
            res.status(400).json({ message: "Invalid user info from Google" });
            return;
        }
        let user = await User_1.default.findOne({ email });
        if (!user) {
            user = new User_1.default({
                email,
                username: name,
                avatar: picture,
                googleAccount: true,
                password: null,
            });
            await user.save();
        }
        const accessTokenServer = (0, Token_1.generateTokens)((user?._id).toString(), user.isAdmin, res);
        res.status(200).json({
            message: "Login successful",
            user,
            access_token: accessTokenServer,
        });
    }
    catch (err) {
        console.error("Google login error:", err);
        res.status(401).json({ message: "Invalid Google login" });
    }
};
exports.googleLogin = googleLogin;
const logout = async (_, res) => {
    try {
        res.clearCookie("refresh_token", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.status(200).json({ message: "Logout successful" });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.logout = logout;
const refreshTokens = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            res.status(401).json({ message: "Refresh token not found" });
            return;
        }
        const secret = process.env.REFRESH_SECRET || "default_refresh_secret_key";
        const decoded = (0, Token_1.verifyToken)(refreshToken, secret);
        if (typeof decoded === "string") {
            res.status(400).json({ message: "Invalid refresh token" });
            return;
        }
        const userId = decoded.userId;
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (user.isBlocked) {
            res.status(403).json({ message: "User is blocked" });
            return;
        }
        const accessToken = (0, Token_1.generateTokens)(user._id, user.isAdmin, res);
        res.status(200).json({ message: "Tokens refreshed", accessToken });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
};
exports.refreshTokens = refreshTokens;
const updateUser = async (req, res) => {
    try {
        const { username, password, newPassword, email } = req.body;
        const filename = req.file?.filename;
        const userId = req.user?.userId;
        const user = await User_1.default.findById(userId).select("+password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (newPassword && password) {
            const isMatch = await user.comparePassword(password.toString());
            if (!isMatch) {
                res
                    .status(400)
                    .json({ message: "The Password You provided is not correct" });
                return;
            }
            user.password = newPassword;
        }
        if (username)
            user.username = username;
        if (filename) {
            console.log("File name: ", filename);
            if (user.avatar && user.avatar !== "/uploads/users/user.jpeg")
                (0, Delete_1.deleteImage)(user.avatar);
            const avatar = `/uploads/users/${filename}`;
            console.log("Avatar: ", avatar);
            user.avatar = avatar;
        }
        if (email && email !== user.email) {
            const { email_token, activation_number } = (0, Token_1.generateChangeEmailToken)(user.email, email);
            const email_url = `http://localhost:5173/confirm-email/${email_token}`;
            const templatePath = path_1.default.join(__dirname, "..", "mails", "updateEmail.ejs");
            if (fs_1.default.existsSync(templatePath)) {
                const template = fs_1.default.readFileSync(templatePath, "utf8");
                const html = ejs_1.default.render(template, {
                    email_url,
                    email,
                    activation_number,
                });
                await Mail_1.transporter.sendMail({
                    from: `Fennec Wear <${process.env.SMTP_MAIL}>`,
                    to: email,
                    subject: `Activation Code is ${activation_number}`,
                    html,
                });
            }
            res.cookie("email_token", email_token, {
                httpOnly: true,
                sameSite: "none",
                secure: true,
                maxAge: 30 * 60 * 1000,
            });
        }
        await user.save();
        res.status(200).json({
            message: " User Updated Successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin,
                googleAccount: user.googleAccount,
            },
        });
    }
    catch (error) {
        console.error("Update user error:", error);
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
};
exports.updateUser = updateUser;
const changeEmail = async (req, res) => {
    try {
        const { email_token: em_token, activation_number: ac_number } = req.body;
        const email_token = em_token || req.cookies.email_token;
        if (!email_token) {
            res.status(404).json({ message: "Email Token not found" });
            return;
        }
        if (!ac_number) {
            res.status(404).json({ message: "Activation number not found" });
            return;
        }
        const secret = process.env.JWT_SECRET || "default_secret_key";
        const decoded = (0, Token_1.verifyToken)(email_token, secret);
        if (typeof decoded === "string") {
            res.status(400).json({ message: "Invalid email token" });
            return;
        }
        const { oldEmail, newEmail, activation_number } = (0, Crypto_1.decrypt)(decoded.data, decoded.iv);
        if (ac_number !== activation_number) {
            res.status(400).json({ message: "Invalid activation number" });
            return;
        }
        const user = await User_1.default.findOne({ email: oldEmail });
        if (!user) {
            res.status(404).json({ message: "User Not Found" });
            return;
        }
        user.email = newEmail;
        await user.save();
        res.clearCookie("email_token", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.status(200).json({
            message: "Account activated successfully",
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin,
                googleAccount: user.googleAccount,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        console.error("Email Changing error:", error);
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
};
exports.changeEmail = changeEmail;
const passwordRecovery = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: "Email is required." });
            return;
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        }
        const recovery_token = (0, Token_1.generateRecoveryToken)(email);
        const ORIGIN = process.env.ORIGIN || "http://localhost:5173";
        const resetUrl = `${ORIGIN}/reset-password/${recovery_token}`;
        const template = fs_1.default.readFileSync(path_1.default.join(__dirname, "..", "mails", "recovery.ejs"), "utf8");
        const html = ejs_1.default.render(template, { resetUrl, email });
        await Mail_1.transporter.sendMail({
            from: `FENNEC <${process.env.SMTP_MAIL}>`,
            to: email,
            subject: "Password Recovery Request",
            html,
        });
        res.status(200).json({ message: "Reset link sent to your email." });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal server error", err: error.message });
    }
};
exports.passwordRecovery = passwordRecovery;
const resetPassword = async (req, res) => {
    try {
        let { newPassword, recovery_token } = req.body;
        if (!recovery_token) {
            res.status(403).json({ err: "You must provide a recovery token" });
            return;
        }
        const secret = process.env.REFRESH_SECRET || "default_refresh_secret_key";
        const decoded = (0, Token_1.verifyToken)(recovery_token, secret);
        if (typeof decoded === "string") {
            res.status(400).json({ message: "Invalid activation token" });
            return;
        }
        const email = (0, Crypto_1.decrypt)(decoded.data, decoded.iv);
        const user = await User_1.default.findOne({
            email,
        });
        if (!user) {
            res.status(404).json({ message: "User Not Found." });
            return;
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: "Password has been reset" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal server error", err: error.message });
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=AuthController.js.map