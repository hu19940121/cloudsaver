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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useResourceStore } from "@/stores/resource";
import { formattedFileSize } from "@/utils/index";
import type { ShareInfo, ResourceItem } from "@/types";

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
  (newList) => {
    if (newList && newList.length) {
      currentList.value = [...newList];
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

const isChecked = (fileId: string) => {
  return selectedMap.value.has(fileId);
};

const toggleSelect = (item: ShareInfo) => {
  if (selectedMap.value.has(item.fileId)) {
    selectedMap.value.delete(item.fileId);
  } else {
    selectedMap.value.set(item.fileId, { ...item, isChecked: true });
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

const enterFolder = async (folder: ShareInfo) => {
  if (!props.resource) return;
  isLoading.value = true;
  try {
    const list = await resourceStore.fetchShareFolder(props.resource, folder.fileId);
    pathHistory.value.push({
      name: folder.fileName,
      pdirFid: folder.fileId,
    });

    // 默认全选子目录文件
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

const navigateTo = async (idx: number) => {
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
    currentList.value = list.map((item) => ({
      ...item,
      isChecked: isChecked(item.fileId),
    }));
  } finally {
    isLoading.value = false;
  }
};

const goBack = async () => {
  if (pathHistory.value.length <= 1) return;
  await navigateTo(pathHistory.value.length - 2);
};

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
  if (selectedMap.value.has(editingItem.value.fileId)) {
    const target = selectedMap.value.get(editingItem.value.fileId)!;
    target.customName = newName;
    selectedMap.value.set(editingItem.value.fileId, { ...target });
  }
  syncToStore();
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
}
</style>
