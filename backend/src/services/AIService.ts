import { injectable } from "inversify";
import axios, { AxiosInstance } from "axios";
import tunnel from "tunnel";
import UserSetting from "../models/UserSetting";
import GlobalSetting, { GlobalSettingAttributes } from "../models/GlobalSetting";

export interface RenameItemInput {
  id: string;
  name: string;
  isDir?: boolean;
}

export interface RenameResultItem {
  id: string;
  originalName: string;
  newName: string;
}

export interface RenameOptions {
  items: RenameItemInput[];
  mode?: "auto" | "movie" | "tv" | "clean";
  customPrompt?: string;
}

@injectable()
export class AIService {
  private async getAxios(targetUrl: string): Promise<AxiosInstance> {
    const isHttps = targetUrl.startsWith("https://");
    const settings = await GlobalSetting.findOne();
    const globalSetting = settings?.dataValues || ({} as GlobalSettingAttributes);

    let httpsAgent: any = undefined;
    if (isHttps && globalSetting.isProxyEnabled && globalSetting.httpProxyHost && globalSetting.httpProxyPort) {
      try {
        httpsAgent = tunnel.httpsOverHttp({
          proxy: {
            host: globalSetting.httpProxyHost,
            port: Number(globalSetting.httpProxyPort),
            headers: {
              "Proxy-Authorization": "",
            },
          },
        });
      } catch (err) {
        console.warn("AI proxy agent creation failed, falling back to direct:", err);
      }
    }

    return axios.create({
      timeout: 120000, // 提升至 120 秒，容纳长列表思考与网络延迟
      headers: {
        "Content-Type": "application/json",
      },
      httpsAgent,
    });
  }

  private async getEffectiveConfig(
    userId: string,
    override?: { aiApiUrl?: string; aiApiKey?: string; aiModel?: string }
  ) {
    const userSetting = await UserSetting.findOne({ where: { userId: userId.toString() } });
    const aiApiUrl =
      override?.aiApiUrl?.trim() ||
      userSetting?.aiApiUrl?.trim() ||
      "https://api.deepseek.com/v1";
    const aiApiKey = override?.aiApiKey?.trim() || userSetting?.aiApiKey?.trim() || "";
    const aiModel =
      override?.aiModel?.trim() || userSetting?.aiModel?.trim() || "deepseek-chat";

    return { aiApiUrl, aiApiKey, aiModel };
  }

  private formatBaseUrl(url: string): string {
    let clean = url.trim().replace(/\/+$/, "");
    if (clean.endsWith("/chat/completions")) {
      return clean;
    }
    return `${clean}/chat/completions`;
  }

  async testConnection(
    userId: string,
    config?: { aiApiUrl?: string; aiApiKey?: string; aiModel?: string }
  ): Promise<{ success: boolean; message: string }> {
    const { aiApiUrl, aiApiKey, aiModel } = await this.getEffectiveConfig(userId, config);

    if (!aiApiKey) {
      throw new Error("请先填写 AI API Key 后再进行测试");
    }

    const requestUrl = this.formatBaseUrl(aiApiUrl);
    const client = await this.getAxios(requestUrl);

    try {
      const response = await client.post(
        requestUrl,
        {
          model: aiModel,
          messages: [
            {
              role: "user",
              content: "请仅回复一个词：OK",
            },
          ],
          max_tokens: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${aiApiKey}`,
          },
        }
      );

      const content = response.data?.choices?.[0]?.message?.content?.trim();
      return {
        success: true,
        message: `测试成功！模型 [${aiModel}] 响应: ${content || "正常"}`,
      };
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "连接失败";
      throw new Error(`AI 服务连接失败: ${errMsg}`);
    }
  }

  async renameFiles(userId: string, options: RenameOptions): Promise<RenameResultItem[]> {
    const { items, mode = "auto", customPrompt = "" } = options;
    if (!items || items.length === 0) {
      return [];
    }

    const { aiApiUrl, aiApiKey, aiModel } = await this.getEffectiveConfig(userId);
    if (!aiApiKey) {
      throw new Error("未配置 AI API Key，请先在【设置】中配置 AI API Key 与接口地址");
    }

    const modeDescriptions: Record<string, string> = {
      auto: "智能识别：根据文件或文件夹内容自动判断是电影还是电视剧，并分别应用对应标准格式。",
      movie: "电影标准模式：格式应为《电影中文名 (年份).扩展名》或《电影名.年份.清晰度.扩展名》；目录则命名为《电影中文名 (年份)》。",
      tv: "电视剧/动漫剧集模式：格式应为《剧集中文名.S01E01.扩展名》或《剧名.S01E01.第1集.扩展名》（季数与集数均用两位数字补零）；整季目录规范为《剧名.S01》或《剧名 (年份)》。",
      clean: "极简去广告模式：主要去除文件及文件夹中的垃圾网站前缀、广告词、特殊符号，保留主体名称与扩展名。",
    };

    const systemPrompt = `你是一个专业的影视资源命名与整理专家（严格遵循 Plex / Emby / Jellyfin 媒体库刮削标准）。
你的任务是将用户提供的杂乱网盘文件/文件夹名称，规范化重命名为标准的影视命名格式，并彻底剔除垃圾广告信息。

【核心规则】：
1. 彻底清除无意义垃圾信息：如网站域名、广告水印、发布组前缀/后缀（例如 "电影天堂-www.dy2018.com"、"【高清影视】"、"阳光电影"、"关注公众号"、"4K压制组" 等）。
2. 保留扩展名：对于文件（isDir: false），必须严格保留其原有的文件扩展名（如 .mp4, .mkv, .ts, .srt, .ass 等），绝不能弄丢或更改扩展名！对于文件夹（isDir: true），不要添加任何文件扩展名。
3. 影视命名标准：
   - 电影：规范为 "电影中文名 (年份).扩展名" 或 "电影名.Year.分辨率.扩展名"（例如 "流浪地球2 (2023).mp4"、"奥本海默.2023.1080p.mkv"）。
   - 电视剧/动漫：规范为 "剧名.S01E01.扩展名"（季数用 S01/S02，集数用 E01/E02，两位数补零。例如 "繁花-01.mp4" 识别为 "繁花.S01E01.mp4"；"庆余年第二季 第05集.mkv" 识别为 "庆余年.S02E05.mkv"）。
   - 文件夹：剧集总文件夹规范为 "剧名 (年份)" 或 "剧名.S01"。
4. 命名必须整洁美观，不要出现多余的特殊符号或前后空格。
5. 必须仅返回合法的 JSON 数组，格式如下，不要输出任何额外的说明文字或 markdown 解释：
[
  { "id": "文件对应id", "newName": "修改后的新文件名" }
]`;

    const userMessageContent = `当前重命名模式：${modeDescriptions[mode] || modeDescriptions.auto}
${customPrompt ? `用户特别要求：${customPrompt}` : ""}

请对以下列表进行规范化重命名：
${JSON.stringify(
  items.map((item) => ({
    id: item.id,
    originalName: item.name,
    isDir: !!item.isDir,
  })),
  null,
  2
)}`;

    const requestUrl = this.formatBaseUrl(aiApiUrl);
    const client = await this.getAxios(requestUrl);

    let rawReply = "";
    try {
      const response = await client.post(
        requestUrl,
        {
          model: aiModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessageContent },
          ],
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${aiApiKey}`,
          },
        }
      );

      rawReply = response.data?.choices?.[0]?.message?.content || "";
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "请求失败";
      throw new Error(`AI 请求失败: ${errMsg}`);
    }

    // 解析 JSON
    const parsedList = this.extractJsonArray(rawReply);
    const resultMap = new Map<string, string>();
    parsedList.forEach((item: any) => {
      if (item && item.id && typeof item.newName === "string") {
        resultMap.set(item.id.toString(), item.newName.trim());
      }
    });

    // 组装结果并做防御性检查（如扩展名丢失补全）
    return items.map((item) => {
      let newName = resultMap.get(item.id.toString()) || item.name;

      if (!item.isDir) {
        const origExtMatch = item.name.match(/(\.[a-zA-Z0-9_-]+)$/);
        const origExt = origExtMatch ? origExtMatch[1] : "";
        const newExtMatch = newName.match(/(\.[a-zA-Z0-9_-]+)$/);

        // 如果原文件有扩展名，但 AI 漏掉了扩展名，自动补上
        if (origExt && (!newExtMatch || newExtMatch[1].toLowerCase() !== origExt.toLowerCase())) {
          newName = `${newName.replace(/\.+$/, "")}${origExt}`;
        }
      }

      return {
        id: item.id,
        originalName: item.name,
        newName,
      };
    });
  }

  private extractJsonArray(text: string): any[] {
    try {
      // 1. 去掉 markdown ```json ... ```
      let cleaned = text.trim();
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
      }

      // 2. 找到第一个 '[' 和最后一个 ']'
      const startIdx = cleaned.indexOf("[");
      const endIdx = cleaned.lastIndexOf("]");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
        return JSON.parse(cleaned);
      }

      return JSON.parse(cleaned);
    } catch (err) {
      console.error("解析 AI 返回的 JSON 失败，原始内容:", text, err);
      return [];
    }
  }
}
