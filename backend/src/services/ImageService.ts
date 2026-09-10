import { injectable } from "inversify";
import axios, { AxiosInstance } from "axios";
import tunnel from "tunnel";
import GlobalSetting from "../models/GlobalSetting";
import { GlobalSettingAttributes } from "../models/GlobalSetting";

@injectable()
export class ImageService {
  private axiosInstance: AxiosInstance | null = null;
  private readonly allowedHosts = (
    process.env.IMAGE_PROXY_ALLOWED_HOSTS ||
    "doubanio.com,cdn-telegram.org,telesco.pe,tutu.pm"
  )
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  constructor() {
    // 移除构造函数中的初始化，改为懒加载
  }

  private validateImageUrl(rawUrl: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error("图片地址无效");
    }

    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      throw new Error("图片代理只允许 HTTPS 地址");
    }
    if (parsed.port && parsed.port !== "443") {
      throw new Error("图片代理不允许非标准端口");
    }

    const hostname = parsed.hostname.toLowerCase();
    const allowed = this.allowedHosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
    if (!allowed) {
      throw new Error("该图片域名不在代理白名单中");
    }
    return parsed;
  }

  private async ensureAxiosInstance(): Promise<AxiosInstance> {
    if (!this.axiosInstance) {
      const settings = await GlobalSetting.findOne();
      const globalSetting = settings?.dataValues || ({} as GlobalSettingAttributes);

      this.axiosInstance = axios.create({
        timeout: 30000,
        headers: {
          Accept: "image/*, */*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        withCredentials: false,
        maxRedirects: 5,
        maxContentLength: 15 * 1024 * 1024,
        beforeRedirect: (options: any) => {
          const port = options.port ? `:${options.port}` : "";
          this.validateImageUrl(`${options.protocol}//${options.hostname}${port}${options.path}`);
        },
        httpsAgent: globalSetting.isProxyEnabled
          ? tunnel.httpsOverHttp({
              proxy: {
                host: globalSetting.httpProxyHost,
                port: globalSetting.httpProxyPort,
                headers: {
                  "Proxy-Authorization": "",
                },
              },
            })
          : undefined,
      });

      this.axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
          throw error;
        }
      );
    }
    return this.axiosInstance;
  }

  async updateAxiosInstance(): Promise<void> {
    this.axiosInstance = null;
    await this.ensureAxiosInstance();
  }

  async getImages(url: string): Promise<any> {
    const axiosInstance = await this.ensureAxiosInstance();
    const validatedUrl = this.validateImageUrl(url);

    let referer = "";
    try {
      if (validatedUrl.hostname.endsWith("doubanio.com")) {
        referer = "https://movie.douban.com/";
      } else {
        referer = validatedUrl.origin;
      }
    } catch (e) {
      referer = "";
    }

    const response = await axiosInstance.get(validatedUrl.toString(), {
      responseType: "stream",
      validateStatus: (status) => status >= 200 && status < 300,
      headers: {
        Referer: referer,
      },
    });
    const contentType = String(response.headers["content-type"] || "").toLowerCase();
    if (!contentType.startsWith("image/")) {
      response.data.destroy();
      throw new Error("远程地址返回的不是图片");
    }
    const contentLength = Number(response.headers["content-length"] || 0);
    if (contentLength > 15 * 1024 * 1024) {
      response.data.destroy();
      throw new Error("图片大小超过限制");
    }
    return response;
  }
}
