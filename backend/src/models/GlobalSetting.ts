import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface GlobalSettingAttributes {
  id: number;
  httpProxyHost: string;
  httpProxyPort: number;
  isProxyEnabled: boolean;
  CommonUserCode: number;
  AdminUserCode: number;
  teleChannels?: string;
  jiaofuCookie?: string;
}

interface GlobalSettingCreationAttributes extends Optional<GlobalSettingAttributes, "id"> {}

class GlobalSetting
  extends Model<GlobalSettingAttributes, GlobalSettingCreationAttributes>
  implements GlobalSettingAttributes
{
  public id!: number;
  public httpProxyHost!: string;
  public httpProxyPort!: number;
  public isProxyEnabled!: boolean;
  public CommonUserCode!: number;
  public AdminUserCode!: number;
  public teleChannels?: string;
  public jiaofuCookie?: string;
}

GlobalSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    httpProxyHost: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "127.0.0.1",
    },
    httpProxyPort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7890,
    },
    isProxyEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    CommonUserCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 9527,
    },
    AdminUserCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 230713,
    },
    teleChannels: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
    },
    jiaofuCookie: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
    },
  },
  {
    sequelize,
    modelName: "GlobalSetting",
    tableName: "global_settings",
  }
);

export default GlobalSetting;
