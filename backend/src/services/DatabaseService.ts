import { Sequelize, QueryTypes } from "sequelize";
import GlobalSetting from "../models/GlobalSetting";
import { Searcher } from "./Searcher";
import sequelize from "../config/database";
import User from "../models/User";

const getRequiredRegistrationCode = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value || value.length < 16) {
    throw new Error(`${name} 必须设置为至少 16 个字符的随机字符串`);
  }
  return value;
};

// 全局设置默认值
const getDefaultGlobalSettings = () => ({
  httpProxyHost: "127.0.0.1",
  httpProxyPort: 7890,
  isProxyEnabled: false,
  CommonUserCode: getRequiredRegistrationCode("COMMON_REGISTRATION_CODE"),
  AdminUserCode: getRequiredRegistrationCode("ADMIN_REGISTRATION_CODE"),
  teleChannels: "",
  jiaofuCookie: "",
});

export class DatabaseService {
  private sequelize: Sequelize;

  constructor() {
    this.sequelize = sequelize;
  }

  async initialize(): Promise<void> {
    try {
      await this.sequelize.query("PRAGMA foreign_keys = OFF");
      await this.cleanupBackupTables();
      await this.sequelize.sync({ alter: true });
      await this.sequelize.query("PRAGMA foreign_keys = ON");
      await this.initializeGlobalSettings();
    } catch (error) {
      throw new Error(`数据库初始化失败: ${(error as Error).message}`);
    }
  }

  private async initializeGlobalSettings(): Promise<void> {
    try {
      const settings = await GlobalSetting.findOne();
      if (!settings) {
        await GlobalSetting.create(getDefaultGlobalSettings());
        console.log("✅ Global settings initialized with default values.");
      }
      await this.rotateLegacyRegistrationCodes();
      await Searcher.updateAxiosInstance();
    } catch (error) {
      console.error("❌ Failed to initialize global settings:", error);
      throw error;
    }
  }

  private async rotateLegacyRegistrationCodes(): Promise<void> {
    const settings = await GlobalSetting.findOne();
    if (!settings) return;

    const updates: Partial<{ CommonUserCode: string; AdminUserCode: string }> = {};
    if (String(settings.CommonUserCode) === "5549") {
      updates.CommonUserCode = getRequiredRegistrationCode("COMMON_REGISTRATION_CODE");
    }
    if (String(settings.AdminUserCode) === "012101") {
      updates.AdminUserCode = getRequiredRegistrationCode("ADMIN_REGISTRATION_CODE");
    }
    if (Object.keys(updates).length > 0) {
      await settings.update(updates);
      console.log("✅ 已替换旧版默认注册码。");
    }

    const adminCount = await User.count({ where: { role: 1 } });
    if (adminCount > 0) {
      console.log("✅ 管理员已初始化，管理员注册码不再接受新注册。");
    }
  }

  private async cleanupBackupTables(): Promise<void> {
    const backupTables = await this.sequelize.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%\\_backup%' ESCAPE '\\'",
      { type: QueryTypes.SELECT }
    );

    for (const table of backupTables) {
      if (table?.name) {
        await this.sequelize.query(`DROP TABLE IF EXISTS ${table.name}`);
      }
    }
  }

  // ... 其他数据库相关方法
}
