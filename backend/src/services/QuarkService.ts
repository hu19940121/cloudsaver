import { AxiosInstance, AxiosHeaders } from "axios";
import { logger } from "../utils/logger";
import { createAxiosInstance } from "../utils/axiosInstance";
import { injectable } from "inversify";
import { Request } from "express";
import UserSetting from "../models/UserSetting";
import {
  ShareInfoResponse,
  FolderListResponse,
  QuarkFolderItem,
  SaveFileParams,
} from "../types/cloud";
import { ICloudStorageService } from "@/types/services";

interface QuarkShareInfo {
  stoken?: string;
  pwdId?: string;
  fileSize?: number;
  list: {
    fid: string;
    file_name: string;
    file_type: number;
    share_fid_token: string;
  }[];
}

@injectable()
export class QuarkService implements ICloudStorageService {
  private api: AxiosInstance;
  private cookie: string = "";

  constructor() {
    this.api = createAxiosInstance(
      "https://drive-h.quark.cn",
      AxiosHeaders.from({
        cookie: this.cookie,
        accept: "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua": '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      })
    );

    this.api.interceptors.request.use((config) => {
      config.headers.cookie = this.cookie;
      return config;
    });
  }

  async setCookie(req: Request): Promise<void> {
    const userId = req.user?.userId;
    const userSetting = await UserSetting.findOne({
      where: { userId },
    });
    if (userSetting && userSetting.dataValues.quarkCookie) {
      this.cookie = userSetting.dataValues.quarkCookie;
    } else {
      throw new Error("请先设置夸克网盘cookie");
    }
  }

  async getShareInfo(
    pwdId: string,
    passcode = "",
    pdirFid = "0",
    stoken = ""
  ): Promise<ShareInfoResponse> {
    let currentStoken = stoken;
    if (!currentStoken) {
      const response = await this.api.post(
        `/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc&uc_param_str=&__dt=994&__t=${Date.now()}`,
        {
          pwd_id: pwdId,
          passcode,
        }
      );
      if (response.data?.status === 200 && response.data.data) {
        currentStoken = response.data.data.stoken;
      }
    }

    if (currentStoken) {
      const res = await this.getShareList(pwdId, currentStoken, pdirFid || "0");
      return {
        data: res,
      };
    }
    throw new Error("获取夸克分享信息失败");
  }

  async getShareList(
    pwdId: string,
    stoken: string,
    pdirFid = "0"
  ): Promise<ShareInfoResponse["data"]> {
    const response = await this.api.get("/1/clouddrive/share/sharepage/detail", {
      params: {
        pr: "ucpro",
        fr: "pc",
        uc_param_str: "",
        pwd_id: pwdId,
        stoken: stoken,
        pdir_fid: pdirFid || "0",
        force: "0",
        _page: "1",
        _size: "100",
        _fetch_banner: "1",
        _fetch_share: "1",
        _fetch_total: "1",
        _sort: "file_type:asc,updated_at:desc",
        __dt: "1589",
        __t: Date.now(),
      },
    });
    if (response.data?.data) {
      const list = response.data.data.list
        .filter((item: any) => item.fid)
        .map((item: any) => ({
          fileId: item.fid,
          fileName: item.file_name,
          fileIdToken: item.share_fid_token,
          fileSize: item.size || 0,
          isDir: item.file_type === 0,
          fileType: item.file_type,
          pdirFid: item.pdir_fid || pdirFid || "0",
        }));
      return {
        list,
        pwdId,
        stoken,
        fileSize: response.data.data.share?.size || 0,
      };
    } else {
      return {
        list: [],
      };
    }
  }

  async getFolderList(parentCid = "0"): Promise<FolderListResponse> {
    const response = await this.api.get("/1/clouddrive/file/sort", {
      params: {
        pr: "ucpro",
        fr: "pc",
        uc_param_str: "",
        pdir_fid: parentCid,
        _page: "1",
        _size: "100",
        _fetch_total: "false",
        _fetch_sub_dirs: "1",
        _sort: "",
        __dt: "2093126",
        __t: Date.now(),
      },
    });
    if (response.data?.data && response.data.data.list) {
      const data = response.data.data.list
        .filter((item: QuarkFolderItem) => item.fid && item.file_type === 0)
        .map((folder: QuarkFolderItem) => ({
          cid: folder.fid,
          name: folder.file_name,
          path: [],
        }));
      return {
        data,
      };
    } else {
      const message = "获取夸克目录列表失败:" + response.data.error;
      logger.error(message);
      throw new Error(message);
    }
  }

  async saveSharedFile(params: SaveFileParams): Promise<{ message: string; data: unknown }> {
    const quarkParams = {
      fid_list: params.fids,
      fid_token_list: params.fidTokens,
      to_pdir_fid: params.folderId,
      pwd_id: params.shareCode,
      stoken: params.receiveCode,
      pdir_fid: params.pdirFid || "0",
      scene: "link",
    };
    try {
      const response = await this.api.post(
        `/1/clouddrive/share/sharepage/save?pr=ucpro&fr=pc&uc_param_str=&__dt=208097&__t=${Date.now()}`,
        quarkParams
      );

      // 若存在自定义重命名需求，在保存完成后自动执行重命名
      if (params.renames && params.renames.length > 0) {
        this.processRenames(params.folderId || "0", params.renames).catch((err) => {
          logger.error("夸克自动重命名任务异常:", err);
        });
      }

      return {
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "未知错误");
    }
  }

  private async processRenames(
    targetFolderId: string,
    renames: NonNullable<SaveFileParams["renames"]>
  ): Promise<void> {
    // 延迟 1.5 秒，等待夸克后端将文件复制到目标目录
    await new Promise((r) => setTimeout(r, 1500));

    try {
      // 获取目标目录下的最新文件列表
      const sortResp = await this.api.get("/1/clouddrive/file/sort", {
        params: {
          pr: "ucpro",
          fr: "pc",
          uc_param_str: "",
          pdir_fid: targetFolderId,
          _page: "1",
          _size: "100",
          _fetch_total: "false",
          _fetch_sub_dirs: "0",
          _sort: "updated_at:desc",
          __t: Date.now(),
        },
      });

      const fileList = sortResp.data?.data?.list || [];
      for (const renameItem of renames) {
        if (!renameItem.newName || renameItem.newName === renameItem.originalName) {
          continue;
        }
        // 匹配目标文件夹下具有原始名称的文件
        const matched = fileList.find(
          (f: any) => f.file_name === renameItem.originalName
        );
        if (matched && matched.fid) {
          await this.renameFile(matched.fid, renameItem.newName);
          logger.info(
            `夸克文件自动重命名成功: "${renameItem.originalName}" -> "${renameItem.newName}"`
          );
        }
      }
    } catch (error) {
      logger.error("夸克执行重命名处理失败:", error);
    }
  }

  async renameFile(fid: string, newName: string): Promise<boolean> {
    try {
      const resp = await this.api.post(
        `/1/clouddrive/file/rename?pr=ucpro&fr=pc&__t=${Date.now()}`,
        {
          fid,
          file_name: newName,
        }
      );
      return resp.data?.status === 200;
    } catch (err) {
      logger.error(`夸克重命名接口调用失败 (fid: ${fid}):`, err);
      return false;
    }
  }
}
