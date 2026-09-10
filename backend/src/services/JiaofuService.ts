import axios, { AxiosInstance } from "axios";
import { injectable } from "inversify";
import { logger } from "../utils/logger";
import { config } from "../config";
import GlobalSetting from "../models/GlobalSetting";

export interface JiaofuItem {
  messageId?: string;
  title?: string;
  completeTitle?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  description?: string;
  image?: string;
  cloudLinks?: string[];
  tags?: string[];
  cloudType?: string;
  channel?: string;
  channelId?: string;
  isLastMessage?: boolean;
}

@injectable()
export class JiaofuService {
  private baseURL = "https://www.xn--wcv59z.com";
  private cookies: Map<string, string> = new Map();
  private userAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  constructor() {
    this.reloadConfig().catch(() => {});
  }

  public isConfigured(): boolean {
    return (
      this.cookies.size > 0 &&
      (this.cookies.has("app_auth") || this.cookies.has("PHPSESSID"))
    );
  }

  public async reloadConfig(cookie?: string) {
    if (cookie !== undefined) {
      this.applyCookieString(cookie);
      return;
    }
    try {
      const setting = await GlobalSetting.findOne();
      if (setting?.jiaofuCookie) {
        this.applyCookieString(setting.jiaofuCookie);
        return;
      }
    } catch (e) {
      // 数据库未就绪时回退
    }
    const rawCookie = process.env.JIAOFU_COOKIE || "";
    this.applyCookieString(rawCookie);
  }

  private applyCookieString(cookieStr: string) {
    this.cookies.clear();
    cookieStr.split(";").forEach((part) => {
      const [key, ...rest] = part.trim().split("=");
      if (key && rest.length > 0) {
        this.cookies.set(key.trim(), rest.join("=").trim());
      }
    });
  }

  private getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  private async saveCookiesToGlobalSetting() {
    try {
      const cookieStr = this.getCookieHeader();
      await GlobalSetting.update({ jiaofuCookie: cookieStr }, { where: {} });
    } catch (e) {
      // ignore
    }
  }

  private updateCookies(setCookieHeader?: string | string[]) {
    if (!setCookieHeader) return;
    const list = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    for (const item of list) {
      const parts = item.split(";")[0].split("=");
      if (parts.length >= 2) {
        this.cookies.set(parts[0].trim(), parts.slice(1).join("=").trim());
      }
    }
  }

  private async request(url: string, options: any = {}) {
    const headers = {
      "User-Agent": this.userAgent,
      Referer: `${this.baseURL}/`,
      Cookie: this.getCookieHeader(),
      ...(options.headers || {}),
    };

    const resp = await axios({
      url,
      baseURL: this.baseURL,
      timeout: 20000,
      ...options,
      headers,
      validateStatus: () => true,
    });

    this.updateCookies(resp.headers["set-cookie"]);
    return resp;
  }

  private async solvePow(): Promise<boolean> {
    logger.info("教父资源站：检测到防爬PoW验证，开始自动计算求解...");
    try {
      const resp = await this.request("/res/pow");
      if (resp.status >= 500) {
        logger.warn(`教父资源站目前服务不可用 (HTTP ${resp.status})，可能正在维护或限制访问`);
        return false;
      }
      if (!resp.data || !resp.data.N || !resp.data.x || !resp.data.t) {
        logger.warn("教父资源站：未获取到有效PoW挑战参数，跳过本次解析");
        return false;
      }

      const { N: nHex, x: xHex, t: steps } = resp.data;
      const bigN = BigInt("0x" + nHex);
      let y = BigInt("0x" + xHex);
      const totalSteps = Number(steps);

      const t0 = Date.now();
      for (let i = 0; i < totalSteps; i++) {
        y = (y * y) % bigN;
      }
      const elapsedSec = (Date.now() - t0) / 1000;

      // 网站前端要求计算用时必须大于等于 3 秒，不足则补足
      if (elapsedSec < 3.2) {
        await new Promise((r) => setTimeout(r, (3.3 - elapsedSec) * 1000));
      }

      const postResp = await this.request("/res/pow", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: this.baseURL,
        },
        data: `y=${y.toString(16)}`,
      });

      if (postResp.data && postResp.data.success) {
        logger.info("教父资源站：PoW安全验证成功通过！已获取有效凭证");
        this.saveCookiesToGlobalSetting().catch(() => {});
        return true;
      } else {
        logger.warn("教父资源站：PoW验证提交未通过", postResp.data);
        return false;
      }
    } catch (err) {
      logger.warn("教父资源站：PoW验证处理异常", err);
      return false;
    }
  }

  private async safeRequest(url: string, options: any = {}) {
    let resp = await this.request(url, options);
    if (resp.status === 200 && typeof resp.data === "string" && resp.data.includes("浏览器安全验证")) {
      const solved = await this.solvePow();
      if (solved) {
        resp = await this.request(url, options);
      }
    }
    return resp;
  }

  private extractObj(str: string, prefix: string): any {
    const startIdx = str.indexOf(prefix);
    if (startIdx === -1) return null;
    let idx = startIdx + prefix.length;
    while (str[idx] === " " || str[idx] === "=") idx++;
    if (str[idx] !== "{" && str[idx] !== "[") return null;
    const openChar = str[idx];
    const closeChar = openChar === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escape = false;
    const begin = idx;

    for (; idx < str.length; idx++) {
      const ch = str[idx];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (ch === openChar) depth++;
        else if (ch === closeChar) {
          depth--;
          if (depth === 0) {
            try {
              return JSON.parse(str.slice(begin, idx + 1));
            } catch (e) {
              return null;
            }
          }
        }
      }
    }
    return null;
  }

  private detectCloudType(url: string): string {
    for (const [type, regex] of Object.entries(config.cloudPatterns)) {
      if (regex.test(url)) {
        return type;
      }
    }
    if (url.includes("quark.cn")) return "quark";
    if (url.includes("115.com") || url.includes("115cdn.com")) return "pan115";
    if (url.includes("baidu.com")) return "baiduPan";
    if (url.includes("alipan.com") || url.includes("aliyundrive.com")) return "aliyun";
    if (url.includes("189.cn")) return "tianyi";
    if (url.includes("139.com")) return "yidong";
    if (url.includes("123pan.com")) return "pan123";
    return "other";
  }

  private rankQuarkResource(
    item: { name: string; time: string },
    movieTitle: string
  ): number {
    let score = 0;
    const name = item.name.toLowerCase();
    const title = movieTitle.toLowerCase();

    // 1. 时间越新权重越高，保证优先获取最新可用链接
    if (item.time.includes("今天")) score += 100;
    else if (item.time.includes("昨天")) score += 80;
    else if (item.time.includes("小时")) score += 90;
    else if (item.time.includes("天前")) score += 60;
    else if (item.time.includes("周前")) score += 40;
    else if (item.time.includes("月前")) score += 20;

    // 2. 优先匹配该电影名或副标题的单片专属资源
    if (name.includes(title)) score += 50;
    const subTitle = title.split(/[：:]/)[1] || "";
    if (subTitle && name.includes(subTitle.trim())) score += 40;

    // 3. 高清规格加分
    if (/4K|REMUX|原盘|HDR|杜比|2160P/i.test(name)) score += 30;

    // 4. 降低动辄几T的超级合集优先级（此类老合集往往极易失效）
    if (/(漫威宇宙|漫威系列|50部|全收录|全宇宙|大合集|总[0-9]T)/i.test(name)) {
      score -= 80;
    }

    return score;
  }

  public async search(keyword?: string): Promise<{
    items: JiaofuItem[];
    channelLogo: string;
  }> {
    const channelLogo = `${this.baseURL}/favicon.png`;
    if (!this.isConfigured()) {
      return {
        items: [],
        channelLogo,
      };
    }
    try {
      let targets: { id: string; dir: string; title: string; info: string }[] = [];

      if (keyword && keyword.trim()) {
        const cleanKw = keyword.trim();
        const searchUrl = `/search?q=${encodeURIComponent(cleanKw)}`;
        const resp = await this.safeRequest(searchUrl);
        const searchObj = this.extractObj(resp.data, "_obj.search");
        if (searchObj && searchObj.l) {
          const titles: string[] = searchObj.l.title || [];
          const ids: string[] = searchObj.l.i || [];
          const dirs: string[] = searchObj.l.d || [];
          const infos: string[] = searchObj.l.info || [];
          for (let i = 0; i < titles.length; i++) {
            targets.push({
              id: ids[i],
              dir: dirs[i] || "mv",
              title: titles[i],
              info: infos[i] || "",
            });
          }
        }
      } else {
        // 无关键词时获取首页最新资源
        const resp = await this.safeRequest("/");
        const inlist = this.extractObj(resp.data, "_obj.inlist");
        if (Array.isArray(inlist)) {
          for (const section of inlist) {
            const titles: string[] = section.t || [];
            const ids: string[] = section.i || [];
            const dir = section.ty || "mv";
            for (let i = 0; i < titles.length; i++) {
              targets.push({
                id: ids[i],
                dir,
                title: titles[i],
                info: section.ht || "",
              });
            }
          }
        }
      }

      const isLatestMode = !keyword || !keyword.trim();

      // 最新资源模式多取几部不同影片，搜索模式取前 6 部
      targets = targets.slice(0, isLatestMode ? 15 : 6);

      const items: JiaofuItem[] = [];

      // 并行请求每个资源的网盘列表
      await Promise.all(
        targets.map(async (target) => {
          try {
            const downResp = await this.safeRequest(`/res/downurl/${target.dir}/${target.id}`, {
              headers: { "X-Requested-With": "XMLHttpRequest" },
            });

            if (downResp.data && downResp.data.panlist) {
              const pl = downResp.data.panlist;
              const urls: string[] = pl.url || [];
              const names: string[] = pl.name || [];
              const types: number[] = pl.type || [];
              const tnames: string[] = pl.tname || [];
              const times: string[] = pl.time || [];

              const quarkList: {
                url: string;
                name: string;
                panName: string;
                time: string;
              }[] = [];

              for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                const cloudType = this.detectCloudType(url);
                if (cloudType === "quark" || url.includes("quark.cn")) {
                  quarkList.push({
                    url,
                    name: names[i] || "",
                    panName: tnames[types[i]] || "夸克网盘",
                    time: times[i] || "",
                  });
                }
              }

              if (quarkList.length === 0) return;

              // 对夸克资源按照时效性与电影标题相关度进行智能优选排序
              quarkList.sort(
                (a, b) =>
                  this.rankQuarkResource(b, target.title) -
                  this.rankQuarkResource(a, target.title)
              );

              if (isLatestMode) {
                // 最新资源模式：每部电影仅保留 1 条精选夸克资源，避免同部电影刷屏
                const best = quarkList[0];
                const allUrls = [
                  best.url,
                  ...quarkList.map((r) => r.url).filter((u) => u !== best.url),
                ];

                items.push({
                  messageId: `${target.id}`,
                  title: `【${best.panName}】${target.title} ${best.name}`.trim(),
                  completeTitle: `${target.title} ${best.name}`.trim(),
                  pubDate: best.time || new Date().toISOString(),
                  content: `<h3>${target.title}</h3><p>${target.info}</p><p>${best.name}</p>`,
                  image: `https://s.tutu.pm/img/${target.dir}/${target.id}/256.webp`,
                  cloudLinks: allUrls,
                  cloudType: "quark",
                  tags: [best.panName, target.dir === "tv" ? "剧集" : "电影"],
                  channel: "教父影视",
                  channelId: "jiaofu",
                });
              } else {
                // 搜索模式：挑选优选前 4 个最新有效版本
                const selected = quarkList.slice(0, 4);
                for (let i = 0; i < selected.length; i++) {
                  const item = selected[i];
                  items.push({
                    messageId: `${target.id}_${i}`,
                    title: `【${item.panName}】${target.title} ${item.name}`.trim(),
                    completeTitle: `${target.title} ${item.name}`.trim(),
                    pubDate: item.time || new Date().toISOString(),
                    content: `<h3>${target.title}</h3><p>${target.info}</p><p>${item.name}</p>`,
                    image: `https://s.tutu.pm/img/${target.dir}/${target.id}/256.webp`,
                    cloudLinks: [item.url],
                    cloudType: "quark",
                    tags: [item.panName, target.dir === "tv" ? "剧集" : "电影"],
                    channel: "教父影视",
                    channelId: "jiaofu",
                  });
                }
              }
            }
          } catch (err) {
            logger.error(`获取教父资源详情失败: ${target.id}`, err);
          }
        })
      );

      if (items.length > 0) {
        items[items.length - 1].isLastMessage = true;
      }

      return {
        items,
        channelLogo,
      };
    } catch (error) {
      logger.error("教父资源站搜索失败:", error);
      return {
        items: [],
        channelLogo,
      };
    }
  }
}
