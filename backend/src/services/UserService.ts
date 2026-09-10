import { injectable } from "inversify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, timingSafeEqual } from "crypto";
import { config } from "../config";
import User from "../models/User";
import GlobalSetting from "../models/GlobalSetting";

const DUMMY_PASSWORD_HASH = "$2b$12$P736NPK.DwneD7ZlO9HQiO4LpL8LM9DJMbRzvsVeyYSyiwfbWIsG6";
const MAX_FAILED_LOGINS = 10;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

interface LoginAttempt {
  count: number;
  windowStartedAt: number;
  lockedUntil: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

@injectable()
export class UserService {
  private adminRegistrationInProgress = false;

  private secureEquals(left: string, right: string): boolean {
    const leftHash = createHash("sha256").update(left).digest();
    const rightHash = createHash("sha256").update(right).digest();
    return timingSafeEqual(leftHash, rightHash);
  }

  private validateRegistrationInput(username: unknown, password: unknown): {
    username: string;
    password: string;
  } {
    if (typeof username !== "string" || !/^[A-Za-z0-9_.-]{3,32}$/.test(username)) {
      throw new Error("用户名须为 3-32 位字母、数字、点、下划线或连字符");
    }
    if (typeof password !== "string") {
      throw new Error("密码格式无效");
    }
    const passwordBytes = Buffer.byteLength(password, "utf8");
    if (password.length < 10 || passwordBytes > 72) {
      throw new Error("密码至少 10 个字符，且不能超过 72 字节");
    }
    return { username, password };
  }

  private async createUser(username: string, password: string, role: number) {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new Error("用户名已存在");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ username, password: hashedPassword, role });
    return {
      data: {
        userId: String(user.userId),
        username: user.username,
        role: user.role,
      },
      message: "用户注册成功",
    };
  }

  async register(usernameInput: unknown, passwordInput: unknown, registerCodeInput: unknown) {
    const { username, password } = this.validateRegistrationInput(usernameInput, passwordInput);
    if (typeof registerCodeInput !== "string" || registerCodeInput.length > 128) {
      throw new Error("注册码无效");
    }

    const globalSetting = await GlobalSetting.findOne();
    const commonCode = String(globalSetting?.dataValues.CommonUserCode || "");
    const adminCode = String(globalSetting?.dataValues.AdminUserCode || "");
    const inputCode = registerCodeInput.trim();

    if (adminCode && this.secureEquals(inputCode, adminCode)) {
      if (this.adminRegistrationInProgress) {
        throw new Error("注册码无效");
      }
      this.adminRegistrationInProgress = true;
      try {
        const adminExists = (await User.count({ where: { role: 1 } })) > 0;
        if (adminExists) {
          throw new Error("注册码无效");
        }
        return await this.createUser(username, password, 1);
      } finally {
        this.adminRegistrationInProgress = false;
      }
    }

    if (commonCode && this.secureEquals(inputCode, commonCode)) {
      return await this.createUser(username, password, 0);
    }

    throw new Error("注册码无效");
  }

  async login(usernameInput: unknown, passwordInput: unknown): Promise<{ token: string }> {
    const username = typeof usernameInput === "string" ? usernameInput.trim() : "";
    const password = typeof passwordInput === "string" ? passwordInput : "";
    const attemptKey = username.toLowerCase();
    const now = Date.now();
    const attempt = loginAttempts.get(attemptKey);

    if (attempt?.lockedUntil && attempt.lockedUntil > now) {
      throw new Error("用户名或密码错误，请稍后重试");
    }
    if (
      attempt &&
      ((attempt.lockedUntil && attempt.lockedUntil <= now) ||
        now - attempt.windowStartedAt >= LOGIN_LOCK_MS)
    ) {
      loginAttempts.delete(attemptKey);
    }

    const user = username ? await User.findOne({ where: { username } }) : null;
    const passwordHash = user?.password || DUMMY_PASSWORD_HASH;
    const passwordMatches = password.length <= 1024 && (await bcrypt.compare(password, passwordHash));

    if (!user || !passwordMatches) {
      const currentAttempt = loginAttempts.get(attemptKey);
      const failedCount = (currentAttempt?.count || 0) + 1;
      loginAttempts.set(attemptKey, {
        count: failedCount,
        windowStartedAt: currentAttempt?.windowStartedAt || now,
        lockedUntil: failedCount >= MAX_FAILED_LOGINS ? now + LOGIN_LOCK_MS : 0,
      });
      throw new Error("用户名或密码错误，请稍后重试");
    }

    loginAttempts.delete(attemptKey);
    const token = jwt.sign({}, config.jwtSecret, {
      algorithm: "HS256",
      subject: String(user.userId),
      issuer: config.auth.issuer,
      audience: config.auth.audience,
      expiresIn: "6h",
    });

    return { token };
  }
}
