import jwt, { JwtPayload } from "jsonwebtoken";
import { encrypt } from "./Crypto";
import { Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.JWT_SECRET || "default_secret_key";

// src/config/crypto.ts

export const generateTokens = (
  userId: string,
  isAdmin: boolean,
  res: Response
): string => {
  const access_secret = process.env.ACCESS_SECRET || "default_secret_key";
  const refresh_secret = process.env.REFRESH_SECRET || "default_secret_key";

  const accessToken = jwt.sign({ userId, isAdmin }, access_secret, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId, isAdmin }, refresh_secret, {
    expiresIn: "7d",
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return accessToken;
};

export const generateActivationToken = ({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}): { activation_token: string; activation_number: string } => {
  const activation_number = Math.floor(1000 + Math.random() * 9000).toString();

  const { data, iv } = encrypt({
    username,
    email,
    password,
    activation_number,
  });

  const activation_token = jwt.sign({ data, iv }, secret, {
    expiresIn: "30m",
  });
  return { activation_token, activation_number };
};

export const generateChangeEmailToken = (
  oldEmail: string,
  newEmail: string
): { email_token: string; activation_number: string } => {
  const activation_number = Math.floor(1000 + Math.random() * 9000).toString();

  const { data, iv } = encrypt({
    oldEmail,
    newEmail,
    activation_number,
  });

  const email_token = jwt.sign({ data, iv }, secret, {
    expiresIn: "30m",
  });
  return { email_token, activation_number };
};

export const generateRecoveryToken = (email: string): string => {
  const { data, iv } = encrypt(email);
  return jwt.sign({ data, iv }, secret, {
    expiresIn: "30m",
  });
};

export const verifyToken = (
  token: string,
  secret: string
): string | JwtPayload => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid token");
  }
};
