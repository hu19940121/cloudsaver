<template>
  <div class="login-page">
    <!-- 科技质感光晕背景 -->
    <div class="login-backdrop">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="glow-orb orb-3"></div>
      <div class="grid-overlay"></div>
    </div>

    <!-- 悬浮毛玻璃登录卡片 -->
    <div class="login-card-wrapper">
      <div class="login-card">
        <!-- 头部品牌展示（去除了旧 Logo 图片） -->
        <div class="card-header">
          <div class="brand-badge">
            <span class="pulse-dot"></span>
            <span class="brand-text">Cloud Saver</span>
          </div>
          <h1 class="welcome-title">{{ activeTab === 'login' ? '欢迎回来' : '创建新账户' }}</h1>
          <p class="welcome-subtitle">
            {{ activeTab === 'login' ? '跨网盘资源搜索与标准化智能转存' : '配置您的专属网盘影视管家' }}
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
                <el-checkbox v-model="rememberPassword" class="remember-check">
                  记住登录凭据
                </el-checkbox>
              </div>

              <el-button
                type="primary"
                class="modern-submit-btn"
                size="large"
                :loading="loading"
                @click="handleLogin"
              >
                {{ loading ? '验证中...' : '立即登录' }}
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
                  placeholder="请输入系统注册码"
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
                {{ loading ? '创建中...' : '注册账户' }}
              </el-button>
            </el-form>
          </div>
        </transition>

        <!-- 底部版权/安全提示 -->
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
const rememberPassword = ref(false);

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
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "长度在 6 到 20 个字符", trigger: "blur" },
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

// 记住密码相关
onMounted(() => {
  const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
  const savedPassword = localStorage.getItem(STORAGE_KEYS.PASSWORD);
  if (savedUsername && savedPassword) {
    loginForm.value.username = savedUsername;
    loginForm.value.password = savedPassword;
    rememberPassword.value = true;
  }
});

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        const res = await userApi.login(loginForm.value);
        if (res.code === 0) {
          // 记住密码
          if (rememberPassword.value) {
            localStorage.setItem(STORAGE_KEYS.USERNAME, loginForm.value.username);
            localStorage.setItem(STORAGE_KEYS.PASSWORD, loginForm.value.password);
          } else {
            localStorage.removeItem(STORAGE_KEYS.USERNAME);
            localStorage.removeItem(STORAGE_KEYS.PASSWORD);
          }

          localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
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
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d1117;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

// 科技渐变光晕背景
.login-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  background: radial-gradient(circle at 50% 10%, #161f30 0%, #090d13 85%);

  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.5;
    animation: floatOrb 18s ease-in-out infinite alternate;
  }

  .orb-1 {
    width: 480px;
    height: 480px;
    background: linear-gradient(135deg, #1677ff, #00b96b);
    top: -80px;
    left: 20%;
  }

  .orb-2 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, #722ed1, #1677ff);
    bottom: -60px;
    right: 25%;
    animation-delay: -6s;
  }

  .orb-3 {
    width: 320px;
    height: 320px;
    background: linear-gradient(135deg, #13c2c2, #2f54eb);
    top: 45%;
    left: 60%;
    animation-delay: -12s;
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 32px 32px;
    opacity: 0.8;
  }
}

@keyframes floatOrb {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(40px, 30px) scale(1.08);
  }
  100% {
    transform: translate(-30px, -20px) scale(0.95);
  }
}

// 卡片外层与毛玻璃卡片
.login-card-wrapper {
  position: relative;
  z-index: 10;
  padding: 20px;
}

.login-card {
  width: 420px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 38px 36px 30px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.35),
    0 4px 16px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: transform 0.3s ease;
}

// 头部
.card-header {
  text-align: center;
  margin-bottom: 24px;

  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 4px 14px;
    background: rgba(22, 119, 255, 0.08);
    border: 1px solid rgba(22, 119, 255, 0.18);
    border-radius: 20px;
    margin-bottom: 14px;

    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #1677ff;
      box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.25);
    }

    .brand-text {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #1677ff;
    }
  }

  .welcome-title {
    font-size: 24px;
    font-weight: 700;
    color: #1a1f2c;
    letter-spacing: -0.4px;
    margin: 0 0 6px;
  }

  .welcome-subtitle {
    font-size: 13px;
    color: #8c9ba8;
    margin: 0;
    line-height: 1.4;
  }
}

// 胶囊分段切换栏
.tab-switcher {
  position: relative;
  display: flex;
  background: #f0f2f5;
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 24px;

  .tab-btn {
    position: relative;
    z-index: 2;
    flex: 1;
    height: 36px;
    border: none;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: color 0.25s ease;

    &.is-active {
      color: #1e293b;
      font-weight: 600;
    }
  }

  .tab-indicator {
    position: absolute;
    top: 4px;
    left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: #ffffff;
    border-radius: 9px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
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

// 输入框现代定制
:deep(.el-form-item) {
  margin-bottom: 20px;

  .el-input__wrapper {
    background-color: #f8fafc;
    border-radius: 10px;
    box-shadow: none;
    border: 1px solid #e2e8f0;
    padding: 2px 14px;
    transition: all 0.25s ease;

    &:hover {
      background-color: #ffffff;
      border-color: #cbd5e1;
    }

    &.is-focus {
      background-color: #ffffff;
      border-color: #1677ff;
      box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.12);
    }
  }

  .el-input__inner {
    height: 44px;
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;

    &::placeholder {
      color: #94a3b8;
      font-weight: 400;
    }
  }

  .el-input__prefix-inner {
    color: #94a3b8;
    font-size: 16px;
    margin-right: 8px;
  }
}

.form-extras {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -6px 0 20px;

  .remember-check {
    font-size: 13px;
    color: #64748b;
    font-weight: 400;
  }
}

// 现代渐变主按钮
.modern-submit-btn {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  box-shadow: 0 8px 20px rgba(22, 119, 255, 0.32);
  color: #ffffff;
  transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
  letter-spacing: 0.3px;

  &:hover {
    background: linear-gradient(135deg, #4096ff 0%, #1677ff 100%);
    box-shadow: 0 10px 26px rgba(22, 119, 255, 0.45);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 4px 12px rgba(22, 119, 255, 0.25);
  }
}

// 底部标语
.card-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 0.5px;
}
</style>
