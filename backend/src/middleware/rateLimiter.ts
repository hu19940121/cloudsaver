import { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  namespace?: string;
}

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export const rateLimiter = (options: RateLimitOptions = {}) => {
  const windowMs = options.windowMs ?? 60 * 1000;
  const maxRequests = options.maxRequests ?? 300;
  const namespace = options.namespace ?? "global";

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const key = `${namespace}:${ip}`;
    const record = requestCounts.get(key) || { count: 0, resetAt: now + windowMs };

    if (now >= record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count++;
    requestCounts.set(key, record);

    if (record.count > maxRequests) {
      res.setHeader("Retry-After", Math.ceil((record.resetAt - now) / 1000).toString());
      return res.status(429).json({ message: "请求过于频繁，请稍后再试" });
    }

    next();
  };
};
