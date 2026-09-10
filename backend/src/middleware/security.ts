import { Request, Response, NextFunction } from "express";

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (!req.path.startsWith("/tele-images")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
};

export const sameOriginProtection = (req: Request, res: Response, next: NextFunction) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  if (req.get("Sec-Fetch-Site") === "cross-site") {
    return res.status(403).json({ message: "拒绝跨站请求" });
  }

  const origin = req.get("Origin");
  if (!origin) {
    return next();
  }

  const configuredOrigins = (process.env.PUBLIC_ORIGIN || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const currentOrigin = `${req.protocol}://${req.get("host")}`;

  if (![currentOrigin, ...configuredOrigins].includes(origin.replace(/\/$/, ""))) {
    return res.status(403).json({ message: "请求来源无效" });
  }

  next();
};
