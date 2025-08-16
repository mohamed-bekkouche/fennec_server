import { Router } from "express";
import {
  activate,
  changeEmail,
  googleLogin,
  login,
  logout,
  passwordRecovery,
  refreshTokens,
  register,
  resetPassword,
  updateUser,
} from "../controllers/AuthController";
import { upload } from "../middlewares/Multer";
import { authenticate } from "../middlewares/Auth";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/activate", activate);
authRouter.post("/login", login);
authRouter.post("/google-login", googleLogin);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refreshTokens);
authRouter.put(
  "/profile",
  authenticate,
  upload("users").single("image"),
  updateUser
);

authRouter.put("/confirm-email", changeEmail);
authRouter.post("/recovery", passwordRecovery);
authRouter.post("/reset", resetPassword);

export default authRouter;
