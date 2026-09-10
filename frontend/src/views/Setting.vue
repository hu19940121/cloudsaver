<template>
  <div class="settings-page">
    <!-- 项目配置卡片 -->
    <el-card v-if="settingStore.globalSetting" class="settings-card network-card">
      <template #header>
        <div class="card-header">
          <el-icon><Connection /></el-icon>
          <h2>项目配置</h2>
        </div>
      </template>

      <div class="settings-section">
        <!-- 代理配置组 -->
        <div class="settings-group">
          <div class="group-header">
            <h3>代理设置</h3>
            <el-switch
              v-model="localGlobalSetting.isProxyEnabled"
              active-text="已启用"
              @change="handleProxyChange"
            />
          </div>

          <div class="form-row">
            <div class="form-item">
              <label for="proxyDomain">代理服务器IP</label>
              <el-input
                id="proxyDomain"
                v-model="localGlobalSetting.httpProxyHost"
                placeholder="127.0.0.1"
                :disabled="!localGlobalSetting.isProxyEnabled"
                @input="handleProxyHostChange"
              >
                <template #prefix>
                  <el-icon><Monitor /></el-icon>
                </template>
              </el-input>
            </div>

            <div class="form-item">
              <label for="proxyPort">代理端口</label>
              <el-input
                id="proxyPort"
                v-model="localGlobalSetting.httpProxyPort"
                placeholder="7890"
                :disabled="!localGlobalSetting.isProxyEnabled"
              >
                <template #prefix>
                  <el-icon><Position /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </div>

        <!-- 注册码配置组 -->
        <div class="settings-group">
          <h3>注册码设置</h3>
          <div class="form-row">
            <div class="form-item">
              <label for="AdminUserCode">管理员注册码</label>
              <el-input
                id="AdminUserCode"
                v-model="localGlobalSetting.AdminUserCode"
                placeholder="请输入管理员注册码"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </div>

            <div class="form-item">
              <label for="CommonUserCode">普通用户注册码</label>
              <el-input
                id="CommonUserCode"
                v-model="localGlobalSetting.CommonUserCode"
                placeholder="请输入普通用户注册码"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </div>

        <!-- Telegram搜索频道配置组 -->
        <div class="settings-group">
          <div class="group-header">
            <h3>Telegram 搜索频道配置</h3>
            <el-button type="primary" link size="small" @click="addChannel">
              <el-icon><Plus /></el-icon> 添加频道
            </el-button>
          </div>
          <div v-if="channelList.length === 0" class="empty-tip">
            暂未配置 Telegram 频道，如需搜索 TG 资源请点击上方【添加频道】。
          </div>
          <div
            v-for="(channel, index) in channelList"
            :key="index"
            class="form-row"
            style="margin-bottom: 12px; align-items: center;"
          >
            <div class="form-item" style="flex: 1;">
              <label>频道名称</label>
              <el-input
                v-model="channel.name"
                placeholder="例如: 夸克云盘影视资源频道"
                @input="syncChannels"
              />
            </div>
            <div class="form-item" style="flex: 1;">
              <label>频道用户名/ID</label>
              <el-input
                v-model="channel.id"
                placeholder="例如: Quark_Movies"
                @input="syncChannels"
              />
            </div>
            <div style="padding-top: 24px;">
              <el-button
                type="danger"
                circle
                plain
                @click="removeChannel(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 教父资源站配置组 -->
        <div class="settings-group">
          <div class="group-header">
            <h3>教父资源站设置 (www.教父.com)</h3>
          </div>
          <div class="form-row">
            <div class="form-item full-width">
              <label for="jiaofuCookie">教父资源站 Cookie</label>
              <el-input
                id="jiaofuCookie"
                v-model="localGlobalSetting.jiaofuCookie"
                type="password"
                show-password
                placeholder="请输入教父资源站Cookie (包含 browser_verified, PHPSESSID, app_auth)"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
              <span class="field-tip">配置后可检索海量夸克/115网盘影视资源，系统会自动完成PoW防爬验证</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 用户配置卡片 -->
    <el-card class="settings-card user-card">
      <template #header>
        <div class="card-header">
          <el-icon><User /></el-icon>
          <h2>用户配置</h2>
        </div>
      </template>

      <div class="settings-section">
        <div class="settings-group">
          <h3>网盘授权</h3>
          <div class="form-row">
            <div class="form-item full-width">
              <label for="cookie115">115网盘 Cookie</label>
              <el-input
                id="cookie115"
                v-model="localUserSettings.cloud115Cookie"
                type="password"
                show-password
                placeholder="请输入115网盘Cookie"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </div>
          </div>

          <div class="form-row">
            <div class="form-item full-width">
              <label for="cookieQuark">夸克网盘 Cookie</label>
              <el-input
                id="cookieQuark"
                v-model="localUserSettings.quarkCookie"
                type="password"
                show-password
                placeholder="请输入夸克网盘Cookie"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- AI 智能命名配置卡片 -->
    <el-card class="settings-card ai-card">
      <template #header>
        <div class="card-header">
          <el-icon><Cpu /></el-icon>
          <h2>AI 智能命名配置</h2>
        </div>
      </template>

      <div class="settings-section">
        <div class="settings-group">
          <div class="group-header">
            <h3>大模型接口设置 (兼容 OpenAI / DeepSeek / 通义千问等)</h3>
            <el-button
              type="success"
              plain
              size="small"
              :loading="isTestingAi"
              @click="handleTestAi"
            >
              <el-icon><Connection /></el-icon> 测试连接
            </el-button>
          </div>

          <div class="form-row">
            <div class="form-item full-width">
              <label for="aiApiUrl">API 接口地址 (Base URL)</label>
              <el-input
                id="aiApiUrl"
                v-model="localUserSettings.aiApiUrl"
                placeholder="例如: https://api.deepseek.com/v1 或 https://api.openai.com/v1"
              >
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
              <span class="field-tip">支持任意兼容 OpenAI 协议的模型接口服务（默认推荐 DeepSeek）</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-item">
              <label for="aiModel">模型名称 (Model)</label>
              <el-input
                id="aiModel"
                v-model="localUserSettings.aiModel"
                placeholder="例如: deepseek-chat, gpt-4o-mini, qwen-turbo"
              >
                <template #prefix>
                  <el-icon><Cpu /></el-icon>
                </template>
              </el-input>
            </div>

            <div class="form-item">
              <label for="aiApiKey">API 密钥 (API Key)</label>
              <el-input
                id="aiApiKey"
                v-model="localUserSettings.aiApiKey"
                type="password"
                show-password
                placeholder="请输入 API Key (例如 sk-...)"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 保存按钮 -->
    <div class="settings-actions">
      <el-button type="primary" @click="handleSave"> 保存设置 </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserSettingStore } from "@/stores/userSetting";
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { GlobalSettingAttributes, UserSettingAttributes } from "@/types/user";
import { aiApi } from "@/api/ai";
import {
  Connection,
  Monitor,
  Position,
  Key,
  User,
  Lock,
  Plus,
  Delete,
  Cpu,
  Link,
} from "@element-plus/icons-vue";

const settingStore = useUserSettingStore();
const isTestingAi = ref(false);

const handleTestAi = async () => {
  if (!localUserSettings.value.aiApiKey) {
    ElMessage.warning("请先填写 AI API Key 后再进行测试");
    return;
  }
  isTestingAi.value = true;
  try {
    const res = await aiApi.testConnection({
      aiApiUrl: localUserSettings.value.aiApiUrl,
      aiApiKey: localUserSettings.value.aiApiKey,
      aiModel: localUserSettings.value.aiModel,
    });
    if (res.code === 0) {
      ElMessage.success(res.message || "AI 接口测试成功！");
    } else {
      ElMessage.error(res.message || "测试失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "连接失败");
  } finally {
    isTestingAi.value = false;
  }
};

// 本地状态
const localGlobalSetting = ref<GlobalSettingAttributes>({
  httpProxyHost: "127.0.0.1",
  httpProxyPort: "7890",
  isProxyEnabled: false,
  AdminUserCode: "012101",
  CommonUserCode: "5549",
  teleChannels: "",
  jiaofuCookie: "",
});

const channelList = ref<{ id: string; name: string }[]>([]);

const syncChannels = () => {
  localGlobalSetting.value.teleChannels =
    channelList.value.length > 0 ? JSON.stringify(channelList.value) : "";
};

const addChannel = () => {
  channelList.value.push({ id: "", name: "" });
  syncChannels();
};

const removeChannel = (index: number) => {
  channelList.value.splice(index, 1);
  syncChannels();
};

const localUserSettings = ref<UserSettingAttributes>({
  cloud115Cookie: "",
  quarkCookie: "",
  aiApiUrl: "https://api.deepseek.com/v1",
  aiApiKey: "",
  aiModel: "deepseek-chat",
});

// 监听 store 变化,更新本地状态
watch(
  () => settingStore.globalSetting,
  (newVal) => {
    if (newVal) {
      localGlobalSetting.value = { ...newVal };
      if (newVal.teleChannels) {
        try {
          const parsed = JSON.parse(newVal.teleChannels);
          channelList.value = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          channelList.value = [];
        }
      } else {
        channelList.value = [];
      }
    }
  },
  { immediate: true }
);

watch(
  () => settingStore.userSettings,
  (newVal) => {
    if (newVal) {
      localUserSettings.value = { ...newVal };
    }
  },
  { immediate: true }
);

// 初始化获取设置
settingStore.getSettings();

// 处理代理开关变化并立即保存
const handleProxyChange = async (val: boolean) => {
  try {
    localGlobalSetting.value.isProxyEnabled = val;
    await settingStore.saveSettings({
      globalSetting: localGlobalSetting.value,
      userSettings: localUserSettings.value,
    });
    ElMessage.success("设置保存成功");
  } catch (error) {
    // 保存失败时恢复开关状态
    ElMessage.error("设置保存失败");
    localGlobalSetting.value.isProxyEnabled = !val;
  }
};

// 处理代理地址,去除协议前缀
const handleProxyHostChange = (val: string) => {
  // 移除 http:// 或 https:// 前缀
  const cleanHost = val.replace(/^(https?:\/\/)/i, "");
  // 更新状态
  localGlobalSetting.value.httpProxyHost = cleanHost;
};

// 其他设置的保存
const handleSave = async () => {
  try {
    syncChannels();
    await settingStore.saveSettings({
      globalSetting: localGlobalSetting.value,
      userSettings: localUserSettings.value,
    });
    ElMessage.success("设置保存成功");
  } catch (error) {
    console.error("保存设置失败:", error);
  }
};
</script>

<style lang="scss" scoped>
@use "@/styles/common.scss" as *;

.settings-page {
  max-width: 880px;
  margin: 0 auto;
  padding-bottom: 36px;
}

.settings-card {
  margin-bottom: 16px;
  border-radius: 14px;
  background: rgba(20, 25, 36, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
    border-color: rgba(255, 255, 255, 0.12);
  }

  :deep(.el-card__header) {
    padding: 12px 18px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;

  .el-icon {
    font-size: 18px;
    color: var(--theme-primary, #3b82f6);
  }

  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #f8fafc;
    letter-spacing: -0.2px;
  }
}

.settings-section {
  padding: 16px 18px;
}

.settings-group {
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .empty-tip {
    font-size: 12px;
    color: #64748b;
    padding: 8px 0;
  }

  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h3 {
      margin: 0;
    }
  }
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-item {
  flex: 1;
  min-width: 0;

  &.full-width {
    width: 100%;
  }

  .field-tip {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    color: #64748b;
    line-height: 1.4;
  }

  label {
    display: block;
    margin-bottom: 5px;
    font-size: 12px;
    font-weight: 500;
    color: #94a3b8;
  }

  :deep(.el-input),
  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      background: rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      padding: 2px 12px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
      transition: all 0.25s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.07);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
      }

      &.is-focus {
        background: rgba(255, 255, 255, 0.08);
        box-shadow: inset 0 0 0 1px #3b82f6, 0 0 0 3px rgba(59, 130, 246, 0.2);
      }
    }

    .el-input__inner {
      color: #f8fafc;
      font-size: 13px;
      height: 36px;

      &::placeholder {
        color: #475569;
      }
    }

    .el-input__prefix-inner {
      .el-icon {
        margin-right: 6px;
        color: #64748b;
      }
    }
  }
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;

  .el-button {
    min-width: 130px;
    height: 40px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
    color: #ffffff;
    transition: all 0.25s ease;

    &:hover {
      background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
      transform: translateY(-1px);
    }
  }
}

@media screen and (max-width: 768px) {
  .settings-page {
    padding: 0 8px 95px !important; // 预留安全距离，杜绝底部保存按钮被移动端底部导航遮挡
  }

  .form-row {
    flex-direction: column;
    gap: 10px;
  }

  .settings-section {
    padding: 12px 14px;
  }
}
</style>
