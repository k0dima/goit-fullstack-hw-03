import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import prisma from "../../prisma/client.ts";
import { createTokens, replaceRefreshToken, setRefreshTokenCookie } from "../services/auth.ts";
import { REFRESH_TOKEN_LIFETIME } from "../constants/time.ts";
import type { RegisterBody, LoginBody } from "../validators/auth.validator.ts";

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.user!.sub) },
  });

  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
  });
};

export const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response,
) => {
  const { username, email, password, name } = req.body;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existingUser) {
    throw createHttpError(409, "Username or email already taken");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword, name },
  }).catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw createHttpError(409, "Username or email already taken");
    }
    throw error;
  });

  const { accessToken, refreshToken } = createTokens(user.id);
  await replaceRefreshToken(user.id, refreshToken);
  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    },
  });
};

export const login = async (req: Request<{}, {}, LoginBody>, res: Response) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createHttpError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = createTokens(user.id);
  await replaceRefreshToken(user.id, refreshToken);
  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.body?.refreshToken ?? req.cookies?.refreshToken;

  if (typeof refreshToken !== "string" || !refreshToken) {
    throw createHttpError(401, "Refresh token not provided");
  }

  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!);
    if (typeof decoded === "string" || decoded.type !== "refresh" || !/^[1-9]\d*$/.test(decoded.sub ?? "")) {
      throw new Error("Invalid refresh token");
    }
    payload = decoded;
  } catch {
    throw createHttpError(401, "Invalid refresh token");
  }

  const userId = Number(payload.sub);
  const newTokens = createTokens(userId);
  await prisma.$transaction(async (tx) => {
    const deleted = await tx.refreshToken.deleteMany({
      where: { token: refreshToken, userId, expiresAt: { gt: new Date() } },
    });
    if (deleted.count !== 1) throw createHttpError(401, "Invalid refresh token");
    await tx.refreshToken.create({ data: {
      userId, token: newTokens.refreshToken, expiresAt: new Date(Date.now() + REFRESH_TOKEN_LIFETIME),
    } });
  });
  setRefreshTokenCookie(res, newTokens.refreshToken);

  res.status(200).json({
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
  });
};

export const logout = async (req: Request, res: Response) => {
  await prisma.refreshToken.deleteMany({ where: { userId: Number(req.user!.sub) } });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(204).end();
};
