import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../core/types";
import { AIService } from "../services/AIService";
import { BaseController } from "./BaseController";

@injectable()
export class AIController extends BaseController {
  constructor(@inject(TYPES.AIService) private aiService: AIService) {
    super();
  }

  async test(req: Request, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error("请先登录");
      }
      const result = await this.aiService.testConnection(userId, req.body);
      return { data: result, message: result.message };
    });
  }

  async rename(req: Request, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error("请先登录");
      }
      const result = await this.aiService.renameFiles(userId, req.body);
      return { data: result, message: "AI 重命名解析完成" };
    });
  }
}
