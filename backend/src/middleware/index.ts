import { Application } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./auth";
import { requestLogger } from "./requestLogger";
import { rateLimiter } from "./rateLimiter";
import { sameOriginProtection, securityHeaders } from "./security";

export const setupMiddlewares = (app: Application) => {
  // 公网链路为 Caddy -> Nginx -> Express。
  app.set("trust proxy", 2);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(securityHeaders);
  app.use(requestLogger());
  app.use(rateLimiter({ windowMs: 60 * 1000, maxRequests: 300 }));
  app.use(
    "/user/login",
    rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 20, namespace: "login" })
  );
  app.use(
    "/user/register",
    rateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 8, namespace: "register" })
  );
  app.use(sameOriginProtection);
  app.use(authMiddleware);
};
