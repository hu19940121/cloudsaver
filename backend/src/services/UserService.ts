import { injectable } from "inversify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config";
import User from "../models/User";
import GlobalSetting from "../models/GlobalSetting";

@injectable()
export class UserService {
  private isValidInput(input: string): boolean {
    // 检查是否包含空格或汉字
    const regex = /^[^\s\u4e00-\u9fa5]+$/;
    return regex.test(input);
  }

  async register(username: string, password: string, registerCode: string) {
    const globalSetting = await GlobalSetting.findOne();
    const commonCode = String(globalSetting?.dataValues.CommonUserCode ?? "5549").trim();
    const adminCode = String(globalSetting?.dataValues.AdminUserCode ?? "012101").trim();
    const inputCode = String(registerCode || "").trim();

    let role = -1;
    if (inputCode === commonCode || Number(inputCode) === Number(commonCode)) {
      role = 0;
    } else if (inputCode === adminCode || Number(inputCode) === Number(adminCode)) {
      role = 1;
    } else {
      throw new Error("注册码错误");
    }

    // 验证输入
    if (!this.isValidInput(username) || !this.isValidInput(password)) {
      throw new Error("用户名、密码或注册码不能包含空格或汉字");
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new Error("用户名已存在");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, role });

    return {
      data: user,
      message: "用户注册成功",
    };
  }

  async login(username: string, password: string) {
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("用户名或密码错误");
    }

    const token = jwt.sign({ userId: user.userId, role: user.role }, config.jwtSecret, {
      expiresIn: "6h",
    });

    return {
      data: {
        token,
      },
    };
  }
}
