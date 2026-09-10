import { useUserSettingStore } from "@/stores/userSetting";
import defaultImage from "@/assets/images/default.png";

export { defaultImage };

export const getProxyImageUrl = (originalUrl: string): string => {
  const userStore = useUserSettingStore();
  if (!originalUrl) return defaultImage;
  // 豆瓣图片统一强制走代理，绕过防盗链
  if (originalUrl.includes("doubanio.com")) {
    return `/tele-images/?url=${encodeURIComponent(originalUrl)}`;
  }
  return userStore.imagesSource === "proxy"
    ? `/tele-images/?url=${encodeURIComponent(originalUrl)}`
    : originalUrl;
};

// 豆瓣海报封面：因豆瓣严格的 Referer 防盗链与网络阻断，统一走代理接口保证显示
export const getDoubanImageUrl = (originalUrl: string): string => {
  if (!originalUrl) return defaultImage;
  return `/tele-images/?url=${encodeURIComponent(originalUrl)}`;
};
