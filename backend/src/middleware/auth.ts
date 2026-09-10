// filepath: /D:/code/CloudDiskDown/backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User";
import { config } from "../config";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: number;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  if (
    req.path === "/user/login" ||
    req.path === "/user/register" ||
    req.path === "/health"
  ) {
    return next();
  }

  const authorization = req.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : undefined;
  const token = req.cookies?.[config.auth.cookieName] || bearerToken;
  if (!token) {
    return res.status(401).json({ message: "未提供 token" });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ["HS256"],
      issuer: config.auth.issuer,
      audience: config.auth.audience,
    }) as JwtPayload;
    const userId = typeof decoded.sub === "string" ? decoded.sub : undefined;
    if (!userId) {
      return res.status(401).json({ message: "无效的 token" });
    }

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(401).json({ message: "无效的 token" });
    }
    req.user = {
      userId: String(user.userId),
      role: user.role,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "无效的 token" });
  }
};
