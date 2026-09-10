import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../core/types";
import { UserService } from "../services/UserService";
import { BaseController } from "./BaseController";
import { config } from "../config";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

@injectable()
export class UserController extends BaseController {
  constructor(@inject(TYPES.UserService) private userService: UserService) {
    super();
  }

  async register(req: Request, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { username, password, registerCode } = req.body;
      return await this.userService.register(username, password, registerCode);
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { username, password, rememberMe } = req.body;
      const result = await this.userService.login(username, password);
      res.cookie(config.auth.cookieName, result.token, {
        ...cookieOptions,
        ...(rememberMe ? { maxAge: 6 * 60 * 60 * 1000 } : {}),
      });
      return { data: {}, message: "登录成功" };
    });
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(config.auth.cookieName, cookieOptions);
    res.json({ success: true, code: 0, message: "已退出登录" });
  }
}
