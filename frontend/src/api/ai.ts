import request from "@/utils/request";

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

export const aiApi = {
  testConnection: (data?: { aiApiUrl?: string; aiApiKey?: string; aiModel?: string }) => {
    return request.post<{ success: boolean; message: string }>("/api/ai/test", data, {
      timeout: 30000,
    });
  },
  renameFiles: (data: {
    items: RenameItemInput[];
    mode?: "auto" | "movie" | "tv" | "clean";
    customPrompt?: string;
  }) => {
    return request.post<RenameResultItem[]>("/api/ai/rename", data, {
      timeout: 120000, // 支持长列表大模型深度分析，放宽至 2 分钟
    });
  },
};
