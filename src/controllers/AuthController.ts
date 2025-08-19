import { Request, Response } from "express";
import User from "../models/User";
import {
  generateActivationToken,
  generateChangeEmailToken,
  generateRecoveryToken,
  generateTokens,
  verifyToken,
} from "../utils/Token";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import { transporter } from "../utils/Mail";
import { decrypt } from "../utils/Crypto";
import { deleteImage } from "../utils/Delete";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password || !email) {
      res.status(400).json({ message: "Username and password are required" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const { activation_token, activation_number } = generateActivationToken({
      username,
      email,
      password,
    });

    const activation_url = `http://localhost:3000/activation/${activation_token}`;

    const templatePath = path.join(__dirname, "..", "mails", "activate.ejs");

    if (fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, "utf8");
      const html = ejs.render(template, {
        activation_url,
        email,
        activation_number,
      });

      await transporter.sendMail({
        from: `Fennec Wear <${process.env.SMTP_MAIL}>`,
        to: email,
        subject: `Activation Code is ${activation_number}`,
        html,
      });
    }
    if (!fs.existsSync(templatePath)) {
      console.error("Template file not found:", templatePath);
      res
        .status(400)
        .json({ message: `Template file not found: ${templatePath}` });
      return;
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
  } catch (error: any) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const activate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activation_token: ac_token, activation_number: ac_number } =
      req.body;

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
    const decoded = verifyToken(activation_token, secret) as {
      iv: string;
      data: string;
    };

    if (typeof decoded === "string") {
      res.status(400).json({ message: "Invalid activation token" });
      return;
    }

    const { username, email, password, activation_number } = decrypt(
      decoded.data,
      decoded.iv
    );

    if (ac_number !== activation_number) {
      res.status(400).json({ message: "Invalid activation number" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const newUser = new User({
      username,
      email,
      password,
    });

    await newUser.save();

    const accessToken = generateTokens(
      newUser._id as string,
      newUser.isAdmin,
      res
    );

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
  } catch (error: any) {
    console.error("Activation error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: { email: string; password: string } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email }).select("+password");

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

    const accessToken = generateTokens(user._id as string, user.isAdmin, res);
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { credential: accessToken } = req.body;

  try {
    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { email, name, picture } = data;

    if (!email) {
      res.status(400).json({ message: "Invalid user info from Google" });
      return;
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        username: name,
        avatar: picture,
        googleAccount: true,
        password: null,
      });
      await user.save();
    }

    const accessTokenServer = generateTokens(
      (user?._id as any).toString(),
      user.isAdmin,
      res
    );
    res.status(200).json({
      message: "Login successful",
      user,
      access_token: accessTokenServer,
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Invalid Google login" });
  }
};

export const logout = async (_: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("refresh_token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshTokens = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token not found" });
      return;
    }

    const secret = process.env.REFRESH_SECRET || "default_refresh_secret_key";
    const decoded = verifyToken(refreshToken, secret);

    if (typeof decoded === "string") {
      res.status(400).json({ message: "Invalid refresh token" });
      return;
    }

    const userId = decoded.userId;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ message: "User is blocked" });
      return;
    }

    const accessToken = generateTokens(user._id as string, user.isAdmin, res);

    res.status(200).json({ message: "Tokens refreshed", accessToken });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, password, newPassword, email } = req.body;

    const filename = req.file?.filename;
    const userId = req.user?.userId;
    const user = await User.findById(userId).select("+password");
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

    if (username) user.username = username;

    if (filename) {
      console.log("File name: ", filename);
      if (user.avatar && user.avatar !== "/uploads/users/user.jpeg")
        deleteImage(user.avatar);
      const avatar = `/uploads/users/${filename}`;
      console.log("Avatar: ", avatar);
      user.avatar = avatar;
    }

    if (email && email !== user.email) {
      const { email_token, activation_number } = generateChangeEmailToken(
        user.email,
        email
      );

      const email_url = `http://localhost:5173/confirm-email/${email_token}`;

      const templatePath = path.join(
        __dirname,
        "..",
        "mails",
        "updateEmail.ejs"
      );

      if (fs.existsSync(templatePath)) {
        const template = fs.readFileSync(templatePath, "utf8");
        const html = ejs.render(template, {
          email_url,
          email,
          activation_number,
        });

        await transporter.sendMail({
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
  } catch (error: any) {
    console.error("Update user error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const changeEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    const decoded = verifyToken(email_token, secret) as {
      iv: string;
      data: string;
    };

    if (typeof decoded === "string") {
      res.status(400).json({ message: "Invalid email token" });
      return;
    }

    const { oldEmail, newEmail, activation_number } = decrypt(
      decoded.data,
      decoded.iv
    );

    if (ac_number !== activation_number) {
      res.status(400).json({ message: "Invalid activation number" });
      return;
    }

    const user = await User.findOne({ email: oldEmail });
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
  } catch (error: any) {
    console.error("Email Changing error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const passwordRecovery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email is required." });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const recovery_token = generateRecoveryToken(email);
    const ORIGIN = process.env.ORIGIN || "http://localhost:5173";
    const resetUrl = `${ORIGIN}/reset-password/${recovery_token}`;

    const template = fs.readFileSync(
      path.join(__dirname, "..", "mails", "recovery.ejs"),
      "utf8"
    );

    const html = ejs.render(template, { resetUrl, email });

    await transporter.sendMail({
      from: `FENNEC <${process.env.SMTP_MAIL}>`,
      to: email,
      subject: "Password Recovery Request",
      html,
    });

    res.status(200).json({ message: "Reset link sent to your email." });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let { newPassword, recovery_token } = req.body;
    if (!recovery_token) {
      res.status(403).json({ err: "You must provide a recovery token" });
      return;
    }

    const secret = process.env.REFRESH_SECRET || "default_refresh_secret_key";
    const decoded = verifyToken(recovery_token, secret);
    if (typeof decoded === "string") {
      res.status(400).json({ message: "Invalid activation token" });
      return;
    }

    const email = decrypt(decoded.data, decoded.iv);
    const user = await User.findOne({
      email,
    });
    if (!user) {
      res.status(404).json({ message: "User Not Found." });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};
