<template>
  <div class="resource-select">
    <!-- 面包屑路径导航 -->
    <div class="breadcrumb-container">
      <div class="breadcrumb-nav">
        <el-icon class="folder-root-icon"><FolderOpened /></el-icon>
        <div class="breadcrumb-list">
          <span
            v-for="(crumb, idx) in pathHistory"
            :key="crumb.pdirFid"
            class="crumb-item"
          >
            <span
              class="crumb-text"
              :class="{
                'is-active': idx === pathHistory.length - 1,
                'is-clickable': idx < pathHistory.length - 1,
              }"
              @click="idx < pathHistory.length - 1 && navigateTo(idx)"
            >
              {{ crumb.name }}
            </span>
            <span v-if="idx < pathHistory.length - 1" class="crumb-separator">/</span>
          </span>
        </div>
      </div>
      <el-button
        v-if="pathHistory.length > 1"
        type="primary"
        link
        size="small"
        :loading="isLoading"
        @click="goBack"
      >
        <el-icon><Back /></el-icon>
        <span>返回上一级</span>
      </el-button>
    </div>

    <!-- 顶部操作栏 -->
    <div class="select-header">
      <div class="select-info">
        <el-icon><Document /></el-icon>
        <span class="info-text">{{ selectInfoText }}</span>
        <el-tooltip
          v-if="selectedFolderCount > 0 && selectedFileCount === 0"
          content="转存将自动包含该文件夹下的全部子文件"
          placement="top"
        >
          <el-icon class="info-tip-icon"><InfoFilled /></el-icon>
        </el-tooltip>
        <span v-if="totalSize" class="total-size">({{ formattedFileSize(totalSize) }})</span>
      </div>
      <div class="header-actions">
        <el-button
          v-if="hasRenamedItems"
          type="info"
          link
          size="small"
          @click="resetAllRenames"
        >
          还原
        </el-button>
        <el-button
          type="success"
          size="small"
          plain
          round
          :disabled="currentList.length === 0"
          @click="openAiRenameDialog"
        >
          <el-icon><MagicStick /></el-icon>
          <span>AI 智能重命名</span>
        </el-button>
        <el-button
          type="primary"
          link
          size="small"
          :disabled="currentList.length === 0"
          @click="handleSelectAll(!hasSelectedCurrentAll)"
        >
          {{ hasSelectedCurrentAll ? "取消全选" : "全选" }}
        </el-button>
      </div>
    </div>

    <!-- 文件与文件夹列表 -->
    <div v-loading="isLoading" class="file-list">
      <div v-if="currentList.length === 0" class="empty-folder">
        <el-empty description="当前目录为空" :image-size="80" />
      </div>

      <div
        v-for="file in currentList"
        :key="file.fileId"
        class="file-item"
        :class="{
          'is-checked': isChecked(file.fileId),
          'is-folder': file.isDir,
        }"
        @click="handleRowClick(file)"
      >
        <el-checkbox
          :model-value="isChecked(file.fileId)"
          @click.stop="toggleSelect(file)"
        />

        <div class="file-info" :title="file.fileName">
          <el-icon v-if="file.isDir" class="icon-folder"><Folder /></el-icon>
          <el-icon v-else class="icon-file"><Document /></el-icon>

          <!-- 行内编辑模式 -->
          <div v-if="editingFileId === file.fileId" class="inline-edit-box" @click.stop>
            <el-input
              v-model="editingName"
              size="small"
              autofocus
              @keyup.enter="saveEdit(file)"
              @keyup.esc="cancelEdit"
            />
            <el-button type="primary" size="small" circle @click="saveEdit(file)">
              <el-icon><Check /></el-icon>
            </el-button>
            <el-button size="small" circle @click="cancelEdit">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>

          <!-- 常规文件名展示与改名按钮 -->
          <template v-else>
            <span class="file-name">{{ file.customName || file.fileName }}</span>
            <el-tag
              v-if="file.customName && file.customName !== file.fileName"
              size="small"
              type="success"
              effect="plain"
              class="rename-tag"
            >
              已改名
            </el-tag>
            <el-tooltip content="修改转存名称" placement="top">
              <el-button
                type="primary"
                link
                size="small"
                class="rename-btn"
                @click.stop="startEdit(file)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>
            <span v-if="file.fileSize && !file.isDir" class="file-size">
              {{ formattedFileSize(file.fileSize) }}
            </span>
          </template>
        </div>

        <div v-if="file.isDir" class="folder-action">
          <el-button
            type="primary"
            link
            size="small"
            @click.stop="enterFolder(file)"
          >
            <span>打开</span>
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- AI 智能重命名弹窗 -->
    <el-dialog
      v-model="aiDialogVisible"
      title="AI 智能重命名 (影视标准化)"
      width="680px"
      append-to-body
      destroy-on-close
      class="ai-rename-dialog"
    >
      <div class="ai-rename-content">
        <!-- 模式配置 -->
        <div class="ai-config-box">
          <div class="ai-option-item">
            <span class="option-label">命名模式：</span>
            <el-radio-group v-model="aiMode" size="small">
              <el-radio-button label="auto">🤖 智能识别</el-radio-button>
              <el-radio-button label="movie">🎬 电影标准</el-radio-button>
              <el-radio-button label="tv">📺 电视剧/动漫</el-radio-button>
              <el-radio-button label="clean">🧹 极简去广告</el-radio-button>
            </el-radio-group>
          </div>

          <div class="ai-option-item">
            <span class="option-label">处理范围：</span>
            <el-radio-group v-model="aiScope" size="small">
              <el-radio-button label="all_tree">🌐 全局穿透(全部层级)</el-radio-button>
              <el-radio-button label="all">📂 当前目录 ({{ currentList.length }})</el-radio-button>
              <el-radio-button label="selected">☑️ 仅已勾选 ({{ currentSelectedInDir.length }})</el-radio-button>
            </el-radio-group>
          </div>

          <div class="ai-option-item">
            <span class="option-label">特殊要求：</span>
            <el-input
              v-model="aiCustomPrompt"
              placeholder="选填，如：指定剧名《庆余年》按 S02Exx 命名，去广告"
              size="small"
              clearable
            />
          </div>

          <div class="ai-action-bar">
            <el-button
              type="primary"
              size="small"
              :icon="MagicStick"
              :loading="isAiProcessing"
              @click="handleStartAiRename"
            >
              {{ isAiProcessing ? "AI 深度分析重命名中..." : "开始 AI 分析重命名" }}
            </el-button>
          </div>
        </div>

        <!-- 预览对比列表 -->
        <div v-if="aiPreviewList.length > 0" class="ai-preview-section">
          <div class="preview-header">
            <h4>重命名预览与确认 ({{ aiPreviewList.length }} 项)</h4>
            <span class="preview-tip">可直接在输入框修改微调，确认后应用</span>
          </div>
          <div class="preview-table-wrapper">
            <el-table :data="aiPreviewList" size="small" max-height="240" border>
              <el-table-column width="45" align="center">
                <template #default="{ row }">
                  <el-checkbox v-model="row.apply" />
                </template>
              </el-table-column>
              <el-table-column label="类型" width="75" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.isDir ? 'warning' : 'primary'" size="small">
                    {{ row.isDir ? "文件夹" : "文件" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="原名称 / 层级路径" min-width="190" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.path" style="color: #409eff; font-size: 11px; margin-right: 4px;">{{ row.path }} /</span>
                  <span style="color: #909399; font-size: 12px;">{{ row.originalName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="新文件名 (支持微调)" min-width="220">
                <template #default="{ row }">
                  <el-input v-model="row.newName" size="small" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="aiDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="aiPreviewList.filter(x => x.apply).length === 0"
            @click="applyAiRename"
          >
            确认应用新名称 ({{ aiPreviewList.filter(x => x.apply).length }})
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useResourceStore } from "@/stores/resource";
import { formattedFileSize } from "@/utils/index";
import { ref, computed, watch } from "vue";
import type { ShareInfo, ResourceItem } from "@/types";
import { aiApi } from "@/api/ai";
import { ElMessage } from "element-plus";
import {
  Document,
  Folder,
  FolderOpened,
  ArrowRight,
  Back,
  Edit,
  Check,
  Close,
  MagicStick,
  InfoFilled,
} from "@element-plus/icons-vue";

const props = defineProps<{
  cloudType?: string;
  resource?: ResourceItem | null;
}>();

const resourceStore = useResourceStore();
const isLoading = ref(false);

// 行内重命名状态
const editingFileId = ref<string | null>(null);
const editingName = ref<string>("");

// 路径历史栈（支持返回上一级）
interface PathNode {
  name: string;
  pdirFid: string;
}
const pathHistory = ref<PathNode[]>([
  { name: "全部文件", pdirFid: "0" },
]);

// 当前目录展示的文件列表
const currentList = ref<ShareInfo[]>([]);

// 全局已选中项的 Map（以 fileId 为键，跨目录记忆已选）
const selectedMap = ref<Map<string, ShareInfo>>(new Map());

// 记忆所有重命名的 Map（以 fileId 为键，跨层级持久保留）
const customNameMap = ref<Map<string, string>>(new Map());

// 同步到 store
function syncToStore() {
  const allSelected = Array.from(selectedMap.value.values());
  resourceStore.setSelectedResource(allSelected);
}

// 初始化：首次进入时展示顶层文件
watch(
  () => resourceStore.shareInfo.list,
  async (newList) => {
    if (newList && newList.length) {
      currentList.value = newList.map((item) => {
        const customName = customNameMap.value.get(item.fileId) || item.customName;
        return { ...item, customName };
      });
      // 默认将顶层项全部选中
      if (selectedMap.value.size === 0) {
        newList.forEach((item) => {
          const customName = customNameMap.value.get(item.fileId) || item.customName;
          selectedMap.value.set(item.fileId, { ...item, customName, isChecked: true });
        });
        syncToStore();
      }

      // 如果顶层只有一个根文件夹，自动深入展开其内容，直接展示内部文件
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

// 已选数量统计
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
    return `已选 ${folders} 个文件夹`;
  }
  return `已选择 ${files} 项`;
});

// 已选总大小
const totalSize = computed(() =>
  Array.from(selectedMap.value.values()).reduce(
    (sum, item) => sum + (item.fileSize || 0),
    0
  )
);

// 是否已全选当前目录
const hasSelectedCurrentAll = computed(() => {
  if (currentList.value.length === 0) return false;
  return currentList.value.every((item) => selectedMap.value.has(item.fileId));
});

// 判断单项是否勾选
const isChecked = (fileId: string) => {
  return selectedMap.value.has(fileId);
};

// 切换单项勾选
const toggleSelect = (file: ShareInfo) => {
  if (selectedMap.value.has(file.fileId)) {
    selectedMap.value.delete(file.fileId);
  } else {
    const customName = customNameMap.value.get(file.fileId) || file.customName;
    selectedMap.value.set(file.fileId, { ...file, customName, isChecked: true });
  }
  syncToStore();
};

// 点击整行：如果是文件夹则进入，若是文件则切换选中
const handleRowClick = (file: ShareInfo) => {
  if (editingFileId.value === file.fileId) return;
  if (file.isDir) {
    enterFolder(file);
  } else {
    toggleSelect(file);
  }
};

// 进入子文件夹
async function enterFolder(folder: ShareInfo) {
  if (!props.resource) return;
  isLoading.value = true;
  try {
    const list = await resourceStore.fetchShareFolder(props.resource, folder.fileId);
    pathHistory.value.push({
      name: folder.customName || folder.fileName,
      pdirFid: folder.fileId,
    });

    // 点入子级目录，默认全部自动勾选子目录里的全部文件
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

// 面包屑跳转
async function navigateTo(targetIdx: number) {
  if (!props.resource || targetIdx >= pathHistory.value.length - 1) return;
  const targetNode = pathHistory.value[targetIdx];
  isLoading.value = true;
  try {
    let list: any[] = [];
    if (targetNode.pdirFid === "0") {
      list = resourceStore.shareInfo.list;
      resourceStore.currentPdirFid = "0";
    } else {
      list = await resourceStore.fetchShareFolder(props.resource, targetNode.pdirFid);
    }
    pathHistory.value = pathHistory.value.slice(0, targetIdx + 1);
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

// 返回上一级
async function goBack() {
  if (pathHistory.value.length <= 1) return;
  await navigateTo(pathHistory.value.length - 2);
}

// 全选/取消全选当前目录
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

// 开始编辑文件名
const startEdit = (file: ShareInfo) => {
  editingFileId.value = file.fileId;
  editingName.value = file.customName || file.fileName;
};

// 保存编辑文件名
const saveEdit = (file: ShareInfo) => {
  if (!editingName.value.trim()) return;
  const newName = editingName.value.trim();
  file.customName = newName;
  customNameMap.value.set(file.fileId, newName);
  if (selectedMap.value.has(file.fileId)) {
    const item = selectedMap.value.get(file.fileId)!;
    item.customName = newName;
    selectedMap.value.set(file.fileId, { ...item });
  }
  syncToStore();
  editingFileId.value = null;
};

// 取消编辑
const cancelEdit = () => {
  editingFileId.value = null;
};

// ==================== AI 智能重命名逻辑 ====================
const aiDialogVisible = ref(false);
const aiMode = ref<"auto" | "movie" | "tv" | "clean">("auto");
const aiScope = ref<"all_tree" | "current" | "selected">("all_tree");
const aiCustomPrompt = ref("");
const isAiProcessing = ref(false);

interface PreviewItem {
  id: string;
  originalName: string;
  newName: string;
  isDir: boolean;
  path: string;
  apply: boolean;
  itemRef?: ShareInfo;
}

const aiPreviewList = ref<PreviewItem[]>([]);

// 当前目录下已选中的项目
const currentSelectedInDir = computed(() => {
  return currentList.value.filter((item) => selectedMap.value.has(item.fileId));
});

// 是否存在已改名项目
const hasRenamedItems = computed(() => {
  return currentList.value.some(
    (x) => x.customName && x.customName.trim() !== x.fileName.trim()
  );
});

// 还原当前目录下所有改名
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
  ElMessage.info("已还原默认名称");
};

// 打开 AI 重命名弹窗
const openAiRenameDialog = () => {
  aiCustomPrompt.value = "";
  aiPreviewList.value = [];
  // 默认推荐全局穿透重命名全部层级，一次性解决全部文件
  aiScope.value = "all_tree";
  aiDialogVisible.value = true;
};

// 递归获取整个分享资源树的所有项目（含所有子文件夹及文件）
interface ScannedItem {
  id: string;
  name: string;
  isDir: boolean;
  path: string;
  itemRef?: ShareInfo;
}

const fetchAllShareItemsRecursively = async (): Promise<ScannedItem[]> => {
  const result: ScannedItem[] = [];
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

// 开始 AI 重命名分析
const handleStartAiRename = async () => {
  isAiProcessing.value = true;
  try {
    let targetItems: ScannedItem[] = [];

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
      ElMessage.warning(
        aiScope.value === "selected" ? "请先在列表中勾选需要重命名的文件" : "没有找到可处理的项目"
      );
      return;
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
      const targetMap = new Map<string, ScannedItem>();
      targetItems.forEach((t) => targetMap.set(t.id, t));

      aiPreviewList.value = res.data.map((item) => {
        const originalMeta = targetMap.get(item.id);
        return {
          id: item.id,
          originalName: item.originalName,
          newName: item.newName,
          isDir: originalMeta ? originalMeta.isDir : false,
          path: originalMeta ? originalMeta.path : "",
          apply: true,
          itemRef: originalMeta?.itemRef,
        };
      });
      ElMessage.success(`AI 分析完成，共识别 ${aiPreviewList.value.length} 项，请核对预览后应用`);
    } else {
      ElMessage.warning("未能获取到重命名结果");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "AI 分析失败，请确认【设置】中的 AI 配置");
  } finally {
    isAiProcessing.value = false;
  }
};

// 确认应用 AI 重命名
const applyAiRename = () => {
  const applyMap = new Map<string, string>();
  aiPreviewList.value.forEach((p) => {
    if (p.apply && p.newName.trim()) {
      applyMap.set(p.id, p.newName.trim());
      customNameMap.value.set(p.id, p.newName.trim());
    }
  });

  // 同步当前视图列表
  currentList.value.forEach((file) => {
    if (applyMap.has(file.fileId)) {
      file.customName = applyMap.get(file.fileId)!;
    }
  });

  // 同步已选集合
  selectedMap.value.forEach((item, fileId) => {
    if (applyMap.has(fileId)) {
      item.customName = applyMap.get(fileId)!;
    }
  });

  // 如果包含全局子层级项，确保对应子项也加入 selectedMap，使转存时全量带上重命名
  aiPreviewList.value.forEach((p) => {
    if (p.apply && p.itemRef && !selectedMap.value.has(p.id)) {
      selectedMap.value.set(p.id, {
        ...p.itemRef,
        customName: p.newName.trim(),
        isChecked: true,
      });
    }
  });

  syncToStore();
  aiDialogVisible.value = false;
  ElMessage.success(`成功为 ${applyMap.size} 个项目 (含子层级) 应用新名称`);
};
</script>

<style lang="scss" scoped>
@use "@/styles/responsive.scss" as *;

.resource-select {
  min-height: 280px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  // 面包屑栏
  .breadcrumb-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: var(--theme-radius);
    font-size: 13px;

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      max-width: 80%;

      .folder-root-icon {
        font-size: 16px;
        color: #f59e0b;
        flex-shrink: 0;
      }

      .breadcrumb-list {
        display: flex;
        align-items: center;
        white-space: nowrap;

        .crumb-item {
          display: flex;
          align-items: center;

          .crumb-text {
            color: #94a3b8;
            transition: color 0.2s;

            &.is-clickable {
              cursor: pointer;
              &:hover {
                color: #3b82f6;
                text-decoration: underline;
              }
            }

            &.is-active {
              color: #f8fafc;
              font-weight: 600;
            }
          }

          .crumb-separator {
            margin: 0 6px;
            color: #475569;
          }
        }
      }
    }
  }

  .select-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: var(--theme-radius);

    .select-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #cbd5e1;
      font-size: 13px;

      .el-icon {
        font-size: 15px;
      }

      .info-tip-icon {
        color: #94a3b8;
        font-size: 14px;
        cursor: pointer;
      }

      .total-size {
        color: #64748b;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;

      :deep(.el-button.is-link) {
        padding: 0;
        font-size: 13px;
      }
    }
  }

  .file-list {
    flex: 1;
    overflow-y: auto;
    max-height: 380px;
    background: rgba(14, 19, 29, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--theme-radius);
    padding: 6px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      &:hover {
        background: rgba(59, 130, 246, 0.5);
      }
    }

    .empty-folder {
      padding: 30px 0;
    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      gap: 10px;
      border: 1px solid transparent;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      &.is-checked {
        background: rgba(59, 130, 246, 0.12);
        border-color: rgba(59, 130, 246, 0.25);
      }

      &.is-folder {
        cursor: pointer;
      }

      .file-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;

        .icon-folder {
          font-size: 18px;
          color: #f59e0b;
          flex-shrink: 0;
        }

        .icon-file {
          font-size: 18px;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .inline-edit-box {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;

          :deep(.el-input) {
            max-width: 320px;
          }
        }

        .file-name {
          flex: 1;
          font-size: 13px;
          color: #f8fafc;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rename-tag {
          font-size: 10px;
          height: 18px;
          padding: 0 4px;
        }

        .rename-btn {
          opacity: 0.6;
          color: #3b82f6;
          transition: opacity 0.2s;
          &:hover {
            opacity: 1;
          }
        }

        .file-size {
          font-size: 12px;
          color: #64748b;
          flex-shrink: 0;
          margin-left: 8px;
        }
      }

      .folder-action {
        flex-shrink: 0;
        margin-left: 8px;

        :deep(.el-button) {
          padding: 2px 8px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 2px;
        }
      }
    }
  }
}

.ai-rename-content {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .ai-config-box {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    padding: 14px 16px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .ai-option-item {
      display: flex;
      align-items: center;
      gap: 10px;

      .option-label {
        width: 80px;
        font-size: 13px;
        font-weight: 500;
        color: #cbd5e1;
        flex-shrink: 0;
      }
    }

    .ai-action-bar {
      display: flex;
      justify-content: flex-end;
      margin-top: 4px;
    }
  }

  .ai-preview-section {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #f8fafc;
      }

      .preview-tip {
        font-size: 12px;
        color: #64748b;
      }
    }

    .preview-table-wrapper {
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);

      :deep(.el-table) {
        --el-table-bg-color: #141924;
        --el-table-tr-bg-color: #141924;
        --el-table-header-bg-color: #182030;
        --el-table-border-color: rgba(255, 255, 255, 0.07);
        color: #cbd5e1;

        .el-table__header th {
          color: #94a3b8;
          font-weight: 600;
        }

        .el-input__wrapper {
          background: rgba(255, 255, 255, 0.05);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }
      }
    }
  }
}
</style>
