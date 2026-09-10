<template>
  <div class="setting">
    <!-- 全局设置 -->
    <div v-if="settingStore.globalSetting" class="setting__section">
      <div class="setting__title">项目配置</div>
      <div class="setting__card">
        <van-cell-group inset>
          <van-field
            v-model="localGlobalSetting.httpProxyHost"
            label="代理服务器IP"
            placeholder="127.0.0.1"
            @update:model-value="handleProxyHostChange"
          />
          <van-field
            v-model="localGlobalSetting.httpProxyPort"
            label="代理端口"
            placeholder="7890"
          />
          <van-field
            v-model.number="localGlobalSetting.AdminUserCode"
            label="管理员码"
            type="digit"
            placeholder="设置管理员注册码"
          />
          <van-field
            v-model.number="localGlobalSetting.CommonUserCode"
            label="用户注册码"
            type="digit"
            placeholder="设置普通用户注册码"
          />
          <van-cell center title="启用代理">
            <template #right-icon>
              <van-switch
                v-model="localGlobalSetting.isProxyEnabled"
                size="24px"
                @change="handleProxyChange"
              />
            </template>
          </van-cell>
          <van-field
            v-model="localGlobalSetting.jiaofuCookie"
            :type="showJiaofuCookie ? 'text' : 'password'"
            label="教父Cookie"
            rows="2"
            autosize
            placeholder="请输入教父资源站Cookie"
          >
            <template #right-icon>
              <van-icon
                :name="showJiaofuCookie ? 'eye-o' : 'closed-eye'"
                @click="showJiaofuCookie = !showJiaofuCookie"
              />
            </template>
          </van-field>
          <van-field
            v-model="localGlobalSetting.teleChannels"
            label="TG频道配置"
            type="textarea"
            rows="2"
            autosize
            placeholder='[{"id":"Quark_Movies","name":"夸克云盘影视资源频道"}]'
          />
        </van-cell-group>
      </div>
    </div>

    <!-- 用户设置 -->
    <div class="setting__section">
      <div class="setting__title">用户配置</div>
      <div class="setting__card">
        <van-cell-group inset>
          <van-field
            v-model="localUserSettings.cloud115Cookie"
            :type="showCloud115Cookie ? 'text' : 'password'"
            label="115网盘"
            rows="2"
            autosize
            placeholder="请输入115网盘Cookie"
          >
            <template #right-icon>
              <van-icon
                :name="showCloud115Cookie ? 'eye-o' : 'closed-eye'"
                @click="showCloud115Cookie = !showCloud115Cookie"
              />
            </template>
          </van-field>

          <van-field
            v-model="localUserSettings.quarkCookie"
            :type="showQuarkCookie ? 'text' : 'password'"
            label="夸克网盘"
            rows="2"
            autosize
            placeholder="请输入夸克网盘Cookie"
          >
            <template #right-icon>
              <van-icon
                :name="showQuarkCookie ? 'eye-o' : 'closed-eye'"
                @click="showQuarkCookie = !showQuarkCookie"
              />
            </template>
          </van-field>
        </van-cell-group>
      </div>
    </div>

    <!-- AI 智能命名配置 -->
    <div class="setting__section">
      <div class="setting__title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>AI 智能命名配置</span>
        <van-button
          size="mini"
          type="success"
          plain
          round
          :loading="isTestingAi"
          @click="handleTestAi"
        >
          测试连接
        </van-button>
      </div>
      <div class="setting__card">
        <van-cell-group inset>
          <van-field
            v-model="localUserSettings.aiApiUrl"
            label="API 地址"
            placeholder="默认: https://api.deepseek.com/v1"
          />
          <van-field
            v-model="localUserSettings.aiModel"
            label="模型名称"
            placeholder="默认: deepseek-chat"
          />
          <van-field
            v-model="localUserSettings.aiApiKey"
            :type="showAiApiKey ? 'text' : 'password'"
            label="API Key"
            placeholder="请输入 API Key"
          >
            <template #right-icon>
              <van-icon
                :name="showAiApiKey ? 'eye-o' : 'closed-eye'"
                @click="showAiApiKey = !showAiApiKey"
              />
            </template>
          </van-field>
        </van-cell-group>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="setting__submit">
      <van-button round block type="primary" @click="handleSave"> 保存设置 </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserSettingStore } from "@/stores/userSetting";
import { ref, watch } from "vue";
import { showNotify } from "vant";
import type { GlobalSettingAttributes, UserSettingAttributes } from "@/types/user";
import { aiApi } from "@/api/ai";

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

const localUserSettings = ref<UserSettingAttributes>({
  cloud115Cookie: "",
  quarkCookie: "",
  aiApiUrl: "https://api.deepseek.com/v1",
  aiApiKey: "",
  aiModel: "deepseek-chat",
});

// 添加显示/隐藏密码的状态
const showCloud115Cookie = ref(false);
const showQuarkCookie = ref(false);
const showJiaofuCookie = ref(false);
const showAiApiKey = ref(false);
const isTestingAi = ref(false);

const handleTestAi = async () => {
  if (!localUserSettings.value.aiApiKey) {
    showNotify({ type: "warning", message: "请先填写 AI API Key" });
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
      showNotify({ type: "success", message: res.message || "AI 测试连接成功！" });
    } else {
      showNotify({ type: "danger", message: res.message || "测试失败" });
    }
  } catch (error: any) {
    showNotify({ type: "danger", message: error.message || "连接失败" });
  } finally {
    isTestingAi.value = false;
  }
};

// 监听 store 变化
watch(
  () => settingStore.globalSetting,
  (newVal) => {
    if (newVal) {
      localGlobalSetting.value = { ...newVal };
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
    showNotify({ type: "success", message: "代理设置已更新" });
  } catch (error) {
    showNotify({ type: "danger", message: "代理设置更新失败" });
    // 保存失败时恢复开关状态
    localGlobalSetting.value.isProxyEnabled = !val;
  }
};

// 其他设置的保存
const handleSave = async () => {
  try {
    await settingStore.saveSettings({
      globalSetting: localGlobalSetting.value,
      userSettings: localUserSettings.value,
    });
    showNotify({ type: "success", message: "设置保存成功" });
  } catch (error) {
    showNotify({ type: "danger", message: "设置保存失败" });
  }
};

// 处理代理地址,去除协议前缀
const handleProxyHostChange = (val: string) => {
  // 移除 http:// 或 https:// 前缀
  const cleanHost = val.replace(/^(https?:\/\/)/i, "");
  // 更新状态
  localGlobalSetting.value.httpProxyHost = cleanHost;
};
</script>

<style lang="scss" scoped>
.setting {
  min-height: 100vh;
  background: var(--theme-background);
  padding: var(--spacing-base);
  padding-bottom: 90px; // 为底部导航栏和按钮留出空间

  &__section {
    margin-bottom: var(--spacing-lg);
  }

  &__title {
    font-size: 16px; // 统一字体大小
    font-weight: 500;
    margin-bottom: var(--spacing-base);
    color: var(--theme-color);
  }

  &__card {
    background: var(--theme-other_background);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
  }

  &__submit {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 50px; // tabbar 高度
    padding: var(--spacing-base);
    background: var(--theme-other_background);
    z-index: 99;
  }
}

// 深度修改 Vant 组件样式
:deep(.van-field) {
  font-size: 14px; // 统一字体大小
}

:deep(.van-field__label) {
  width: 6em;
  color: var(--theme-color);
}

:deep(.van-cell) {
  font-size: 14px; // 统一字体大小
  padding: 12px var(--spacing-base);
}

:deep(.van-button) {
  height: 40px; // 统一按钮高度
  font-size: 14px; // 统一字体大小
}

:deep(.van-cell-group--inset) {
  margin: 0;
}

// 添加图标样式
:deep(.van-field__right-icon) {
  padding: 0 8px;
  cursor: pointer;
  color: var(--theme-color);

  .van-icon {
    font-size: 18px;
  }
}
</style>
