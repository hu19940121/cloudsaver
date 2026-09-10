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
        <span>已选择 {{ selectedCount }} 个项目</span>
        <span v-if="totalSize" class="total-size">({{ formattedFileSize(totalSize) }})</span>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          link
          size="small"
          :disabled="currentList.length === 0"
          @click="handleSelectAll(!hasSelectedCurrentAll)"
        >
          {{ hasSelectedCurrentAll ? "取消全选当前目录" : "全选当前目录" }}
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
  </div>
</template>

<script setup lang="ts">
import { useResourceStore } from "@/stores/resource";
import { formattedFileSize } from "@/utils/index";
import { ref, computed, watch } from "vue";
import type { ShareInfo, ResourceItem } from "@/types";
import {
  Document,
  Folder,
  FolderOpened,
  ArrowRight,
  Back,
  Edit,
  Check,
  Close,
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

// 同步到 store
function syncToStore() {
  const allSelected = Array.from(selectedMap.value.values());
  resourceStore.setSelectedResource(allSelected);
}

// 初始化：首次进入时展示顶层文件
watch(
  () => resourceStore.shareInfo.list,
  (newList) => {
    if (newList && newList.length) {
      currentList.value = [...newList];
      // 默认将顶层项全部选中
      if (selectedMap.value.size === 0) {
        newList.forEach((item) => {
          selectedMap.value.set(item.fileId, { ...item, isChecked: true });
        });
        syncToStore();
      }
    }
  },
  { immediate: true }
);

// 已选数量
const selectedCount = computed(() => selectedMap.value.size);

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
    selectedMap.value.set(file.fileId, { ...file, isChecked: true });
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
const enterFolder = async (folder: ShareInfo) => {
  if (!props.resource) return;
  isLoading.value = true;
  try {
    const list = await resourceStore.fetchShareFolder(props.resource, folder.fileId);
    pathHistory.value.push({
      name: folder.fileName,
      pdirFid: folder.fileId,
    });

    // 点入子级目录，默认全部自动勾选子目录里的全部文件
    list.forEach((item) => {
      selectedMap.value.set(item.fileId, { ...item, isChecked: true });
    });
    syncToStore();

    currentList.value = list.map((item) => ({
      ...item,
      isChecked: true,
    }));
  } finally {
    isLoading.value = false;
  }
};

// 面包屑跳转
const navigateTo = async (targetIdx: number) => {
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
    currentList.value = list.map((item) => ({
      ...item,
      isChecked: isChecked(item.fileId),
    }));
  } finally {
    isLoading.value = false;
  }
};

// 返回上一级
const goBack = async () => {
  if (pathHistory.value.length <= 1) return;
  await navigateTo(pathHistory.value.length - 2);
};

// 全选/取消全选当前目录
const handleSelectAll = (checked: boolean) => {
  currentList.value.forEach((file) => {
    if (checked) {
      selectedMap.value.set(file.fileId, { ...file, isChecked: true });
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
</script>

<style lang="scss" scoped>
@import "@/styles/responsive.scss";

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
    background: var(--el-fill-color-lighter, #f5f7fa);
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
        color: var(--el-color-primary);
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
            color: var(--theme-text-secondary);
            transition: color 0.2s;

            &.is-clickable {
              cursor: pointer;
              &:hover {
                color: var(--el-color-primary);
                text-decoration: underline;
              }
            }

            &.is-active {
              color: var(--theme-text-primary);
              font-weight: 600;
            }
          }

          .crumb-separator {
            margin: 0 6px;
            color: var(--theme-text-placeholder, #c0c4cc);
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
    background: var(--el-fill-color-light);
    border-radius: var(--theme-radius);

    .select-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--theme-text-regular);
      font-size: 13px;

      .el-icon {
        font-size: 15px;
      }

      .total-size {
        color: var(--theme-text-secondary);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;

      :deep(.el-button) {
        padding: 0;
        font-size: 13px;
      }
    }
  }

  .file-list {
    flex: 1;
    overflow-y: auto;
    max-height: 380px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--theme-radius);
    padding: 4px;

    .empty-folder {
      padding: 30px 0;
    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      gap: 10px;

      &:hover {
        background: var(--el-fill-color-light);
      }

      &.is-checked {
        background: rgba(64, 158, 255, 0.08);
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
          color: #e6a23c;
          flex-shrink: 0;
        }

        .icon-file {
          font-size: 18px;
          color: #409eff;
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
          color: var(--theme-text-primary);
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
          transition: opacity 0.2s;
          &:hover {
            opacity: 1;
          }
        }

        .file-size {
          font-size: 12px;
          color: var(--theme-text-secondary);
          flex-shrink: 0;
          margin-left: 8px;
        }
      }

      .folder-action {
        flex-shrink: 0;
        margin-left: 8px;

        :deep(.el-button) {
          padding: 2px 6px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 2px;
        }
      }
    }
  }
}
</style>
