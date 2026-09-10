<template>
  <div class="resource-select">
    <!-- 顶部面包屑与返回导航 -->
    <div class="resource-select__nav">
      <div class="nav-path">
        <van-icon name="folder-o" class="nav-root-icon" />
        <div class="nav-crumbs">
          <span
            v-for="(crumb, idx) in pathHistory"
            :key="crumb.pdirFid"
            class="crumb-item"
            :class="{ 'crumb-item--active': idx === pathHistory.length - 1 }"
            @click="idx < pathHistory.length - 1 && navigateTo(idx)"
          >
            {{ crumb.name }}
            <span v-if="idx < pathHistory.length - 1" class="crumb-separator">/</span>
          </span>
        </div>
      </div>
      <div class="nav-actions">
        <van-button
          v-if="pathHistory.length > 1"
          size="mini"
          type="primary"
          plain
          round
          :loading="isLoading"
          @click="goBack"
        >
          上一级
        </van-button>
      </div>
    </div>

    <!-- 移动端操作工具栏 -->
    <div class="resource-select__toolbar">
      <div class="toolbar-stats">
        <span>{{ selectInfoText }}</span>
      </div>
      <div class="toolbar-actions">
        <van-button
          v-if="hasRenamedItems"
          size="mini"
          round
          plain
          @click="resetAllRenames"
        >
          还原
        </van-button>
        <van-button
          size="mini"
          type="success"
          round
          plain
          icon="gem-o"
          :disabled="currentList.length === 0"
          @click="openAiRenamePopup"
        >
          AI重命名
        </van-button>
        <van-button
          size="mini"
          type="primary"
          round
          plain
          :disabled="currentList.length === 0"
          @click="handleSelectAll(!hasSelectedCurrentAll)"
        >
          {{ hasSelectedCurrentAll ? "全不选" : "全选" }}
        </van-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="resource-select__loading">
      <van-loading size="24px" vertical>加载目录中...</van-loading>
    </div>

    <!-- 列表展示 -->
    <div v-else-if="currentList.length" class="resource-select__list">
      <van-cell-group :border="false">
        <van-cell
          v-for="item in currentList"
          :key="item.fileId"
          class="resource-item"
          :class="{ 'resource-item--checked': isChecked(item.fileId) }"
          :border="false"
          center
          @click="handleRowClick(item)"
        >
          <template #icon>
            <van-checkbox
              :model-value="isChecked(item.fileId)"
              class="item-checkbox"
              @click.stop="toggleSelect(item)"
            />
          </template>

          <template #title>
            <div class="item-title">
              <van-icon
                :name="item.isDir ? 'folder-o' : 'description'"
                :class="item.isDir ? 'icon-folder' : 'icon-file'"
              />
              <span class="item-name">{{ item.customName || item.fileName }}</span>
              <van-tag
                v-if="item.customName && item.customName !== item.fileName"
                type="success"
                style="margin-left: 4px; font-size: 10px;"
              >
                已改名
              </van-tag>
            </div>
          </template>

          <template #label>
            <span v-if="item.fileSize && !item.isDir" class="item-size">
              {{ formattedFileSize(item.fileSize) }}
            </span>
          </template>

          <template #right-icon>
            <div class="item-actions" @click.stop>
              <van-button
                v-if="!item.isDir"
                size="mini"
                plain
                round
                class="rename-btn"
                @click="openRename(item)"
              >
                改名
              </van-button>
              <van-button
                v-if="item.isDir"
                size="mini"
                type="primary"
                plain
                round
                class="folder-enter-btn"
                @click="enterFolder(item)"
              >
                打开
              </van-button>
            </div>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 空状态 -->
    <van-empty v-else description="当前目录为空" />

    <!-- 手机端改名对话框 -->
    <van-dialog
      v-model:show="showRenameDialog"
      title="修改转存名称"
      show-cancel-button
      @confirm="handleConfirmRename"
    >
      <div style="padding: 16px;">
        <van-field
          v-model="editingName"
          placeholder="请输入新的文件名"
          rows="2"
          autosize
          type="textarea"
          style="background: #f7f8fa; border-radius: 8px;"
        />
      </div>
    </van-dialog>

    <!-- 移动端 AI 智能重命名对话框 -->
    <van-dialog
      v-model:show="showAiRenamePopup"
      title="AI 智能重命名 (影视标准化)"
      show-cancel-button
      :confirm-button-text="aiPreviewList.length > 0 ? '应用新名称' : (isAiProcessing ? '分析中...' : '开始分析')"
      :confirm-button-disabled="isAiProcessing"
      :before-close="handleAiDialogClose"
    >
      <div class="mobile-ai-box">
        <van-cell-group inset style="margin: 8px 0;">
          <van-field name="aiMode" label="模式">
            <template #input>
              <van-radio-group v-model="aiMode" direction="horizontal" style="gap: 8px;">
                <van-radio name="auto">智能</van-radio>
                <van-radio name="movie">电影</van-radio>
                <van-radio name="tv">剧集</van-radio>
                <van-radio name="clean">去广告</van-radio>
              </van-radio-group>
            </template>
          </van-field>

          <van-field name="aiScope" label="范围">
            <template #input>
              <van-radio-group v-model="aiScope" direction="horizontal" style="gap: 8px;">
                <van-radio name="all_tree">全局穿透(含子目录)</van-radio>
                <van-radio name="all">当前全部</van-radio>
                <van-radio name="selected">已选({{ currentSelectedInDir.length }})</van-radio>
              </van-radio-group>
            </template>
          </van-field>

          <van-field
            v-model="aiCustomPrompt"
            label="特别要求"
            placeholder="选填: 如指定剧名按S01Exx命名"
            clearable
          />
        </van-cell-group>

        <!-- 加载状态 -->
        <div v-if="isAiProcessing" style="padding: 16px; text-align: center;">
          <van-loading size="20px" vertical>AI 深度分析重命名中...</van-loading>
        </div>

        <!-- 预览结果列表 -->
        <div v-else-if="aiPreviewList.length > 0" class="mobile-ai-preview">
          <div class="preview-title">
            <span>分析结果预览 (可微调)</span>
            <span style="font-size: 11px; color: #969799;">共 {{ aiPreviewList.length }} 项</span>
          </div>
          <div class="preview-list">
            <div v-for="item in aiPreviewList" :key="item.id" class="preview-item">
              <div class="orig-name">
                <span :style="{ color: item.isDir ? '#ff976a' : '#1989fa', fontWeight: 'bold', marginRight: '4px' }">
                  [{{ item.isDir ? '目录' : '文件' }}]
                </span>
                <span v-if="item.path" style="color: #1989fa; font-size: 10px; margin-right: 2px;">{{ item.path }}/</span>
                {{ item.originalName }}
              </div>
              <van-field
                v-model="item.newName"
                style="background: #f7f8fa; border-radius: 4px; padding: 4px 8px;"
              />
            </div>
          </div>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useResourceStore } from "@/stores/resource";
import { formattedFileSize } from "@/utils/index";
import type { ShareInfo, ResourceItem } from "@/types";
import { showNotify } from "vant";
import { aiApi } from "@/api/ai";

const props = defineProps<{
  cloudType?: string;
  resource?: ResourceItem | null;
}>();

const resourceStore = useResourceStore();
const isLoading = ref(false);

// 路径历史栈
interface PathNode {
  name: string;
  pdirFid: string;
}
const pathHistory = ref<PathNode[]>([
  { name: "全部文件", pdirFid: "0" },
]);

// 当前目录下的展示列表
const currentList = ref<ShareInfo[]>([]);

// 已选中项 Map
const selectedMap = ref<Map<string, ShareInfo>>(new Map());

// 记忆所有重命名的 Map（以 fileId 为键，跨层级持久保留）
const customNameMap = ref<Map<string, string>>(new Map());

// 改名弹窗
const showRenameDialog = ref(false);
const editingItem = ref<ShareInfo | null>(null);
const editingName = ref("");

function syncToStore() {
  resourceStore.setSelectedResource(Array.from(selectedMap.value.values()));
}

// 初始化
watch(
  () => resourceStore.shareInfo.list,
  async (newList) => {
    if (newList && newList.length) {
      currentList.value = newList.map((item) => {
        const customName = customNameMap.value.get(item.fileId) || item.customName;
        return { ...item, customName };
      });
      if (selectedMap.value.size === 0) {
        newList.forEach((item) => {
          const customName = customNameMap.value.get(item.fileId) || item.customName;
          selectedMap.value.set(item.fileId, { ...item, customName, isChecked: true });
        });
        syncToStore();
      }

      // 如果顶层只有一个根文件夹，自动深入展开
      if (
        newList.length === 1 &&
        newList[0].isDir &&
        props.resource &&
        pathHistory.value.length === 1
      ) {
        await enterFolder(newList[0]);
      }
    }
  },
  { immediate: true }
);

const isChecked = (fileId: string) => {
  return selectedMap.value.has(fileId);
};

const toggleSelect = (item: ShareInfo) => {
  if (selectedMap.value.has(item.fileId)) {
    selectedMap.value.delete(item.fileId);
  } else {
    const customName = customNameMap.value.get(item.fileId) || item.customName;
    selectedMap.value.set(item.fileId, { ...item, customName, isChecked: true });
  }
  syncToStore();
};

const handleRowClick = (item: ShareInfo) => {
  if (item.isDir) {
    enterFolder(item);
  } else {
    toggleSelect(item);
  }
};

async function enterFolder(folder: ShareInfo) {
  if (!props.resource) return;
  isLoading.value = true;
  try {
    const list = await resourceStore.fetchShareFolder(props.resource, folder.fileId);
    pathHistory.value.push({
      name: folder.customName || folder.fileName,
      pdirFid: folder.fileId,
    });

    // 默认全选子目录文件
    list.forEach((item) => {
      const customName = customNameMap.value.get(item.fileId) || item.customName;
      selectedMap.value.set(item.fileId, { ...item, customName, isChecked: true });
    });
    syncToStore();

    currentList.value = list.map((item) => {
      const customName = customNameMap.value.get(item.fileId) || item.customName;
      return {
        ...item,
        customName,
        isChecked: true,
      };
    });
  } finally {
    isLoading.value = false;
  }
}

async function navigateTo(idx: number) {
  if (!props.resource || idx >= pathHistory.value.length - 1) return;
  const target = pathHistory.value[idx];
  isLoading.value = true;
  try {
    let list: any[] = [];
    if (target.pdirFid === "0") {
      list = resourceStore.shareInfo.list;
      resourceStore.currentPdirFid = "0";
    } else {
      list = await resourceStore.fetchShareFolder(props.resource, target.pdirFid);
    }
    pathHistory.value = pathHistory.value.slice(0, idx + 1);
    currentList.value = list.map((item) => {
      const customName =
        customNameMap.value.get(item.fileId) ||
        selectedMap.value.get(item.fileId)?.customName ||
        item.customName;
      return {
        ...item,
        customName,
        isChecked: isChecked(item.fileId),
      };
    });
  } finally {
    isLoading.value = false;
  }
}

async function goBack() {
  if (pathHistory.value.length <= 1) return;
  await navigateTo(pathHistory.value.length - 2);
}

// 打开改名
const openRename = (item: ShareInfo) => {
  editingItem.value = item;
  editingName.value = item.customName || item.fileName;
  showRenameDialog.value = true;
};

// 确认改名
const handleConfirmRename = () => {
  if (!editingItem.value || !editingName.value.trim()) return;
  const newName = editingName.value.trim();
  editingItem.value.customName = newName;
  customNameMap.value.set(editingItem.value.fileId, newName);
  if (selectedMap.value.has(editingItem.value.fileId)) {
    const target = selectedMap.value.get(editingItem.value.fileId)!;
    target.customName = newName;
    selectedMap.value.set(editingItem.value.fileId, { ...target });
  }
  syncToStore();
};

// ================= 顶部操作与全选 =================
const selectedFolderCount = computed(() => {
  return Array.from(selectedMap.value.values()).filter((x) => x.isDir).length;
});
const selectedFileCount = computed(() => {
  return Array.from(selectedMap.value.values()).filter((x) => !x.isDir).length;
});
const selectInfoText = computed(() => {
  const folders = selectedFolderCount.value;
  const files = selectedFileCount.value;
  if (folders > 0 && files > 0) {
    return `已选 ${folders} 目录, ${files} 文件`;
  }
  if (folders > 0 && files === 0) {
    return `已选 ${folders} 目录(含全部文件)`;
  }
  return `已选 ${files} 项`;
});

const hasSelectedCurrentAll = computed(() => {
  if (currentList.value.length === 0) return false;
  return currentList.value.every((item) => selectedMap.value.has(item.fileId));
});

const handleSelectAll = (checked: boolean) => {
  currentList.value.forEach((file) => {
    if (checked) {
      const customName = customNameMap.value.get(file.fileId) || file.customName;
      selectedMap.value.set(file.fileId, { ...file, customName, isChecked: true });
    } else {
      selectedMap.value.delete(file.fileId);
    }
  });
  syncToStore();
};

const currentSelectedInDir = computed(() => {
  return currentList.value.filter((item) => selectedMap.value.has(item.fileId));
});

const hasRenamedItems = computed(() => {
  return currentList.value.some(
    (x) => x.customName && x.customName.trim() !== x.fileName.trim()
  );
});

const resetAllRenames = () => {
  currentList.value.forEach((item) => {
    delete item.customName;
    customNameMap.value.delete(item.fileId);
    if (selectedMap.value.has(item.fileId)) {
      const selected = selectedMap.value.get(item.fileId)!;
      delete selected.customName;
      selectedMap.value.set(item.fileId, { ...selected });
    }
  });
  syncToStore();
  showNotify({ type: "primary", message: "已还原默认名称" });
};

// ================= AI 重命名逻辑 =================
const showAiRenamePopup = ref(false);
const aiMode = ref<"auto" | "movie" | "tv" | "clean">("auto");
const aiScope = ref<"all_tree" | "all" | "selected">("all_tree");
const aiCustomPrompt = ref("");
const isAiProcessing = ref(false);

interface MobilePreviewItem {
  id: string;
  originalName: string;
  newName: string;
  isDir: boolean;
  path: string;
  itemRef?: ShareInfo;
}

const aiPreviewList = ref<MobilePreviewItem[]>([]);

const openAiRenamePopup = () => {
  aiCustomPrompt.value = "";
  aiPreviewList.value = [];
  aiScope.value = "all_tree";
  showAiRenamePopup.value = true;
};

interface MobileScannedItem {
  id: string;
  name: string;
  isDir: boolean;
  path: string;
  itemRef?: ShareInfo;
}

const fetchAllShareItemsRecursively = async (): Promise<MobileScannedItem[]> => {
  const result: MobileScannedItem[] = [];
  const rootList = resourceStore.shareInfo.list || [];

  async function traverse(items: ShareInfo[], currentPath: string) {
    for (const item of items) {
      result.push({
        id: item.fileId,
        name: customNameMap.value.get(item.fileId) || item.customName || item.fileName,
        isDir: !!item.isDir,
        path: currentPath,
        itemRef: item,
      });

      if (item.isDir && props.resource) {
        try {
          const children = await resourceStore.fetchShareFolder(props.resource, item.fileId);
          if (children && children.length > 0) {
            const folderName =
              customNameMap.value.get(item.fileId) || item.customName || item.fileName;
            const nextPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            await traverse(children, nextPath);
          }
        } catch (e) {
          console.warn("递归获取子目录失败:", item.fileName, e);
        }
      }
    }
  }

  await traverse(rootList, "");
  return result;
};

const handleStartAiRename = async (): Promise<boolean> => {
  isAiProcessing.value = true;
  try {
    let targetItems: MobileScannedItem[] = [];

    if (aiScope.value === "all_tree") {
      targetItems = await fetchAllShareItemsRecursively();
    } else if (aiScope.value === "selected") {
      targetItems = currentSelectedInDir.value.map((item) => ({
        id: item.fileId,
        name: customNameMap.value.get(item.fileId) || item.customName || item.fileName,
        isDir: !!item.isDir,
        path: "",
        itemRef: item,
      }));
    } else {
      targetItems = currentList.value.map((item) => ({
        id: item.fileId,
        name: customNameMap.value.get(item.fileId) || item.customName || item.fileName,
        isDir: !!item.isDir,
        path: "",
        itemRef: item,
      }));
    }

    if (targetItems.length === 0) {
      showNotify({
        type: "warning",
        message: aiScope.value === "selected" ? "请先勾选需要重命名的文件" : "没有找到可处理的项目",
      });
      return false;
    }

    const res = await aiApi.renameFiles({
      items: targetItems.map((item) => ({
        id: item.id,
        name: item.name,
        isDir: item.isDir,
      })),
      mode: aiMode.value,
      customPrompt: aiCustomPrompt.value,
    });

    if (res.data && res.data.length > 0) {
      const targetMap = new Map<string, MobileScannedItem>();
      targetItems.forEach((t) => targetMap.set(t.id, t));

      aiPreviewList.value = res.data.map((item) => {
        const originalMeta = targetMap.get(item.id);
        return {
          id: item.id,
          originalName: item.originalName,
          newName: item.newName,
          isDir: originalMeta ? originalMeta.isDir : false,
          path: originalMeta ? originalMeta.path : "",
          itemRef: originalMeta?.itemRef,
        };
      });
      showNotify({ type: "success", message: `AI 分析完成 (${aiPreviewList.value.length} 项)` });
      return true;
    } else {
      showNotify({ type: "warning", message: "未能获取重命名结果" });
      return false;
    }
  } catch (error: any) {
    showNotify({ type: "danger", message: error.message || "AI分析失败，请检查AI配置" });
    return false;
  } finally {
    isAiProcessing.value = false;
  }
};

const applyAiRename = () => {
  const applyMap = new Map<string, string>();
  aiPreviewList.value.forEach((p) => {
    if (p.newName.trim()) {
      applyMap.set(p.id, p.newName.trim());
      customNameMap.value.set(p.id, p.newName.trim());
    }
  });

  currentList.value.forEach((file) => {
    if (applyMap.has(file.fileId)) {
      file.customName = applyMap.get(file.fileId)!;
    }
  });

  selectedMap.value.forEach((item, fileId) => {
    if (applyMap.has(fileId)) {
      item.customName = applyMap.get(fileId)!;
    }
  });

  aiPreviewList.value.forEach((p) => {
    if (p.itemRef && !selectedMap.value.has(p.id)) {
      selectedMap.value.set(p.id, {
        ...p.itemRef,
        customName: p.newName.trim(),
        isChecked: true,
      });
    }
  });

  syncToStore();
  showNotify({ type: "success", message: `已应用 ${applyMap.size} 个项目的新名称` });
};

const handleAiDialogClose = async (action: string) => {
  if (action === "confirm") {
    if (aiPreviewList.value.length === 0) {
      // 首次点击：执行 AI 分析
      await handleStartAiRename();
      return false; // 保持弹窗打开，显示预览结果
    } else {
      // 二次点击：确认应用
      applyAiRename();
      return true; // 关闭弹窗
    }
  }
  return true; // 取消操作，直接关闭
};
</script>

<style lang="scss" scoped>
.resource-select {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 50vh;
  overflow: hidden;

  &__nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--theme-other_background, #f7f8fa);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    .nav-path {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      max-width: 75%;

      .nav-root-icon {
        font-size: 16px;
        color: var(--van-primary-color, #1989fa);
      }

      .nav-crumbs {
        display: flex;
        align-items: center;
        white-space: nowrap;
        font-size: 13px;

        .crumb-item {
          color: #969799;

          &--active {
            color: #323233;
            font-weight: 600;
          }

          .crumb-separator {
            margin: 0 4px;
            color: #dcdee0;
          }
        }
      }
    }
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 0;
  }

  &__list {
    flex: 1;
    overflow-y: auto;

    .resource-item {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.03);

      &--checked {
        background-color: rgba(25, 137, 250, 0.05);
      }

      .item-checkbox {
        margin-right: 8px;
      }

      .item-title {
        display: flex;
        align-items: center;
        gap: 6px;

        .icon-folder {
          font-size: 18px;
          color: #ff976a;
        }

        .icon-file {
          font-size: 18px;
          color: #1989fa;
        }

        .item-name {
          font-size: 13px;
          color: #323233;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .item-size {
        font-size: 11px;
        color: #969799;
        margin-left: 24px;
      }

      .item-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    .toolbar-stats {
      font-size: 12px;
      color: #646566;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}

.mobile-ai-box {
  padding: 8px 12px;
  max-height: 55vh;
  overflow-y: auto;

  .mobile-ai-preview {
    margin-top: 12px;
    border-top: 1px dashed #ebedf0;
    padding-top: 8px;

    .preview-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: bold;
      color: #323233;
      margin-bottom: 8px;
    }

    .preview-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .preview-item {
        background: #f7f8fa;
        padding: 6px 8px;
        border-radius: 6px;

        .orig-name {
          font-size: 11px;
          color: #969799;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
