export interface GlobalSettingAttributes {
  httpProxyHost: string;
  httpProxyPort: string | number;
  isProxyEnabled: boolean;
  AdminUserCode: string | number;
  CommonUserCode: string | number;
  teleChannels?: string;
  jiaofuCookie?: string;
}

export interface UserSettingAttributes {
  cloud115Cookie: string;
  quarkCookie: string;
  aiApiUrl?: string;
  aiApiKey?: string;
  aiModel?: string;
}

export interface UserSettingStore {
  globalSetting: GlobalSettingAttributes | null;
  userSettings: UserSettingAttributes;
  displayStyle: "table" | "card";
  imagesSource: "proxy" | "local";
}
