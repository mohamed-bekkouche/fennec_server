"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const Multer_1 = require("../middlewares/Multer");
const Auth_1 = require("../middlewares/Auth");
const authRouter = (0, express_1.Router)();
authRouter.post("/register", AuthController_1.register);
authRouter.post("/activate", AuthController_1.activate);
authRouter.post("/login", AuthController_1.login);
authRouter.post("/google-login", AuthController_1.googleLogin);
authRouter.post("/logout", AuthController_1.logout);
authRouter.post("/refresh", AuthController_1.refreshTokens);
authRouter.put("/profile", Auth_1.authenticate, (0, Multer_1.upload)("users").single("image"), AuthController_1.updateUser);
authRouter.put("/confirm-email", AuthController_1.changeEmail);
authRouter.post("/recovery", AuthController_1.passwordRecovery);
authRouter.post("/reset", AuthController_1.resetPassword);
exports.default = authRouter;
//# sourceMappingURL=AuthRouter.js.map