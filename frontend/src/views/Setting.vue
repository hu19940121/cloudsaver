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
              <el-input-number
                id="AdminUserCode"
                v-model="localGlobalSetting.AdminUserCode"
                :controls="false"
                :precision="0"
                placeholder="设置管理员注册码"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input-number>
            </div>

            <div class="form-item">
              <label for="CommonUserCode">普通用户注册码</label>
              <el-input-number
                id="CommonUserCode"
                v-model="localGlobalSetting.CommonUserCode"
                :controls="false"
                :precision="0"
                placeholder="设置普通用户注册码"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input-number>
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
import {
  Connection,
  Monitor,
  Position,
  Key,
  User,
  Lock,
  Plus,
  Delete,
} from "@element-plus/icons-vue";

const settingStore = useUserSettingStore();

// 本地状态
const localGlobalSetting = ref<GlobalSettingAttributes>({
  httpProxyHost: "127.0.0.1",
  httpProxyPort: "7890",
  isProxyEnabled: false,
  AdminUserCode: 230713,
  CommonUserCode: 9527,
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
  // max-width: 1000px;
  margin: 0;
  padding-bottom: 40px;
}

.settings-card {
  margin-bottom: 24px;
  border-radius: var(--theme-radius);
  transition: var(--theme-transition);
  border: 1px solid rgba(0, 0, 0, 0.08);

  &:hover {
    box-shadow: var(--theme-shadow);
  }

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
}

.card-header {
  @include flex-center;
  gap: 12px;

  .el-icon {
    font-size: 20px;
    color: var(--theme-primary);
  }

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--theme-text-primary);
  }
}

.settings-section {
  padding: 20px;
}

.settings-group {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    margin: 0 0 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--theme-text-regular);
  }

  .empty-tip {
    font-size: 13px;
    color: var(--theme-text-secondary);
    padding: 12px 0;
  }

  .group-header {
    @include flex-center;
    justify-content: space-between;
    margin-bottom: 16px;

    h3 {
      margin: 0;
    }
  }
}

.form-row {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;

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
    margin-top: 6px;
    font-size: 12px;
    color: var(--theme-text-secondary);
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--theme-text-secondary);
  }

  :deep(.el-input),
  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
      transition: var(--theme-transition);

      &:hover {
        box-shadow: 0 0 0 1px var(--theme-primary);
      }

      &.is-focus {
        box-shadow:
          0 0 0 1px var(--theme-primary),
          0 0 0 3px rgba(0, 102, 204, 0.1);
      }
    }

    .el-input__prefix-inner {
      .el-icon {
        margin-right: 8px;
        color: var(--theme-text-secondary);
      }
    }
  }
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;

  .el-button {
    min-width: 120px;
    height: 40px;
    border-radius: 20px;
    font-size: 14px;
    transition: var(--theme-transition);

    .el-icon {
      margin-right: 6px;
      font-size: 16px;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--theme-shadow-sm);
    }
  }
}
</style>
