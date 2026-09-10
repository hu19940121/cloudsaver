<template>
  <div class="login-page">
    <!-- 科技质感极光流光背景 -->
    <div class="login-backdrop">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="glow-orb orb-3"></div>
      <div class="grid-overlay"></div>
    </div>

    <!-- 悬浮深色毛玻璃登录卡片 -->
    <div class="login-card-wrapper">
      <div class="login-card">
        <!-- 头部品牌展示 -->
        <div class="card-header">
          <div class="brand-badge">
            <span class="pulse-dot"></span>
            <span class="brand-text">Cloud Saver</span>
          </div>
          <h1 class="welcome-title">{{ activeTab === 'login' ? '欢迎回来' : '注册新账户' }}</h1>
          <p class="welcome-subtitle">
            {{ activeTab === 'login' ? '登录以管理与转存您的影视资源' : '配置您的专属网盘影视管家' }}
          </p>
        </div>

        <!-- 现代胶囊分段切换栏 -->
        <div class="tab-switcher">
          <button
            type="button"
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'login' }"
            @click="activeTab = 'login'"
          >
            登录
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'register' }"
            @click="activeTab = 'register'"
          >
            注册
          </button>
          <div
            class="tab-indicator"
            :style="{ transform: activeTab === 'login' ? 'translateX(0)' : 'translateX(100%)' }"
          ></div>
        </div>

        <!-- 登录表单 -->
        <transition name="tab-fade" mode="out-in">
          <div v-if="activeTab === 'login'" key="login" class="form-container">
            <el-form
              ref="loginFormRef"
              :model="loginForm"
              :rules="loginRules"
              @keyup.enter="handleLogin"
            >
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="用户名 / 账号"
                  :prefix-icon="User"
                  autocomplete="username"
                  size="large"
                />
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="登录密码"
                  :prefix-icon="Lock"
                  show-password
                  autocomplete="current-password"
                  size="large"
                />
              </el-form-item>

              <div class="form-extras">
                <el-checkbox v-model="rememberLogin" class="remember-check">
                  保持登录（最长 6 小时）
                </el-checkbox>
              </div>

              <el-button
                type="primary"
                class="modern-submit-btn"
                size="large"
                :loading="loading"
                @click="handleLogin"
              >
                {{ loading ? '正在验证...' : '立即登录' }}
              </el-button>
            </el-form>
          </div>

          <!-- 注册表单 -->
          <div v-else key="register" class="form-container">
            <el-form
              ref="registerFormRef"
              :model="registerForm"
              :rules="registerRules"
              @keyup.enter="handleRegister"
            >
              <el-form-item prop="username">
                <el-input
                  v-model="registerForm.username"
                  placeholder="设置用户名"
                  :prefix-icon="User"
                  size="large"
                />
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                  v-model="registerForm.password"
                  type="password"
                  placeholder="设置密码 (至少6位)"
                  :prefix-icon="Lock"
                  show-password
                  size="large"
                />
              </el-form-item>

              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="registerForm.confirmPassword"
                  type="password"
                  placeholder="再次确认密码"
                  :prefix-icon="Lock"
                  show-password
                  size="large"
                />
              </el-form-item>

              <el-form-item prop="registerCode">
                <el-input
                  v-model="registerForm.registerCode"
                  placeholder="请输入邀请注册码"
                  :prefix-icon="Key"
                  size="large"
                />
              </el-form-item>

              <el-button
                type="primary"
                class="modern-submit-btn"
                size="large"
                :loading="loading"
                @click="handleRegister"
              >
                {{ loading ? '正在创建...' : '注册账户' }}
              </el-button>
            </el-form>
          </div>
        </transition>

        <!-- 底部标语 -->
        <div class="card-footer">
          <span>智能解析 · 云盘直达 · AI 重命名</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock, Key } from "@element-plus/icons-vue";
import { userApi } from "@/api/user";
import "@/styles/common.scss";
import { STORAGE_KEYS } from "@/constants/storage";
import type { FormItemRule } from "element-plus";

// 状态
const activeTab = ref("login");
const loading = ref(false);
const rememberLogin = ref(false);

const loginForm = ref({
  username: "",
  password: "",
});

const registerForm = ref({
  username: "",
  password: "",
  confirmPassword: "",
  registerCode: "",
});

// 表单校验规则
const loginRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 32, message: "长度在 3 到 32 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 10, max: 72, message: "长度在 10 到 72 个字符", trigger: "blur" },
  ],
};

const registerRules = {
  ...loginRules,
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (_rule: FormItemRule, value: string, callback: (error?: Error) => void) => {
        if (value !== registerForm.value.password) {
          callback(new Error("两次输入密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  registerCode: [{ required: true, message: "请输入注册码", trigger: "blur" }],
};

const router = useRouter();
const loginFormRef = ref();
const registerFormRef = ref();

// 清理旧版本曾保存在浏览器中的明文密码和 JWT
onMounted(() => {
  const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
  if (savedUsername) {
    loginForm.value.username = savedUsername;
  }
  localStorage.removeItem(STORAGE_KEYS.PASSWORD);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
});

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        const res = await userApi.login({ ...loginForm.value, rememberMe: rememberLogin.value });
        if (res.code === 0) {
          if (rememberLogin.value) {
            localStorage.setItem(STORAGE_KEYS.USERNAME, loginForm.value.username);
          } else {
            localStorage.removeItem(STORAGE_KEYS.USERNAME);
          }
          ElMessage.success("登录成功");
          router.push("/");
        } else {
          ElMessage.error(res.message || "登录失败");
        }
      } catch (error: unknown) {
        ElMessage.error(error instanceof Error ? error.message : "登录失败");
      } finally {
        loading.value = false;
      }
    }
  });
};

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return;

  await registerFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        const res = await userApi.register({
          username: registerForm.value.username,
          password: registerForm.value.password,
          registerCode: registerForm.value.registerCode,
        });

        if (res.code === 0) {
          ElMessage.success("注册成功");
          loginForm.value.username = registerForm.value.username;
          loginForm.value.password = registerForm.value.password;
          activeTab.value = "login";
          handleLogin();
        } else {
          ElMessage.error(res.message || "注册失败");
        }
      } catch (error: unknown) {
        ElMessage.error(error instanceof Error ? error.message : "注册失败");
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped lang="scss">
@use "@/styles/common.scss" as *;

.login-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #090c12;
  overflow-x: hidden;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

// 极光光晕暗调背景
.login-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  background: radial-gradient(circle at 50% 20%, #131a29 0%, #080a0f 85%);

  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.35;
    animation: floatOrb 18s ease-in-out infinite alternate;
  }

  .orb-1 {
    width: 480px;
    height: 480px;
    background: linear-gradient(135deg, #1d4ed8, #059669);
    top: -100px;
    left: 15%;
  }

  .orb-2 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, #6b21a8, #2563eb);
    bottom: -80px;
    right: 15%;
    animation-delay: -6s;
  }

  .orb-3 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, #0284c7, #4f46e5);
    top: 40%;
    left: 60%;
    animation-delay: -12s;
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 36px 36px;
    opacity: 0.8;
  }
}

@keyframes floatOrb {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 20px) scale(1.06); }
  100% { transform: translate(-25px, -15px) scale(0.95); }
}

// 卡片外层与深色毛玻璃卡片
.login-card-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 20px 16px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  background: rgba(18, 24, 38, 0.9);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border-radius: 20px;
  padding: 36px 32px 28px;
  box-sizing: border-box;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.65),
    0 4px 20px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease;
}

// 头部
.card-header {
  text-align: center;
  margin-bottom: 22px;

  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 3px 12px;
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.25);
    border-radius: 20px;
    margin-bottom: 12px;

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #3b82f6;
      box-shadow: 0 0 8px #3b82f6;
    }

    .brand-text {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #60a5fa;
    }
  }

  .welcome-title {
    font-size: 23px;
    font-weight: 700;
    color: #f8fafc;
    letter-spacing: -0.3px;
    margin: 0 0 6px;
  }

  .welcome-subtitle {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
    line-height: 1.4;
  }
}

// 胶囊分段切换栏
.tab-switcher {
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 3px;
  border-radius: 12px;
  margin-bottom: 22px;

  .tab-btn {
    position: relative;
    z-index: 2;
    flex: 1;
    height: 36px;
    border: none;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.25s ease;

    &.is-active {
      color: #f8fafc;
      font-weight: 600;
    }
  }

  .tab-indicator {
    position: absolute;
    top: 3px;
    left: 3px;
    width: calc(50% - 3px);
    height: calc(100% - 6px);
    background: rgba(59, 130, 246, 0.3);
    border: 1px solid rgba(59, 130, 246, 0.45);
    border-radius: 9px;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.25);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }
}

// 表单切换动画
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

// 输入框现代深色定制
:deep(.el-form-item) {
  margin-bottom: 18px;

  .el-input__wrapper {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 2px 14px;
    transition: all 0.25s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    &.is-focus {
      background-color: rgba(255, 255, 255, 0.09);
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }
  }

  .el-input__inner {
    height: 44px;
    font-size: 14px;
    color: #f8fafc;
    font-weight: 500;

    &::placeholder {
      color: #64748b;
      font-weight: 400;
    }
  }

  .el-input__prefix-inner {
    color: #64748b;
    font-size: 16px;
    margin-right: 8px;
  }
}

.form-extras {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -4px 0 18px;

  .remember-check {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 400;
  }
}

// 现代电光蓝渐变提交按钮
.modern-submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 6px 18px rgba(59, 130, 246, 0.35);
  color: #ffffff;
  transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
  letter-spacing: 0.3px;

  &:hover {
    background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 3px 10px rgba(59, 130, 246, 0.25);
  }
}

// 底部标语
.card-footer {
  margin-top: 22px;
  text-align: center;
  font-size: 12px;
  color: #64748b;
  letter-spacing: 0.4px;
}

// 移动端响应式适配 (保证小屏手机不溢出变形)
@media screen and (max-width: 480px) {
  .login-card-wrapper {
    padding: 12px;
  }

  .login-card {
    padding: 26px 20px 22px;
    border-radius: 16px;
  }

  .card-header {
    margin-bottom: 18px;

    .welcome-title {
      font-size: 20px;
    }
  }

  .tab-switcher {
    margin-bottom: 18px;
  }
}
</style>
