<template>
  <div class="folder-select">
    <!-- 路径导航栏 -->
    <div class="folder-header">
      <div class="folder-path">
        <el-icon class="root-icon"><FolderOpened /></el-icon>
        <template v-if="folderPath.length">
          <span
            v-for="(folder, index) in folderPath"
            :key="folder.cid"
            class="path-item"
            :class="{ 'is-current': index === folderPath.length - 1 }"
            @click="handlePathClick(index)"
          >
            <span class="folder-name">{{ folder.name }}</span>
            <el-icon v-if="index < folderPath.length - 1" class="separator-icon"><ArrowRight /></el-icon>
          </span>
        </template>
        <span v-else class="root-path" @click="handlePathClick(-1)">根目录</span>
      </div>
    </div>

    <!-- 目录列表 -->
    <div class="folder-list">
      <div v-if="!folders.length" class="empty-folder">
        <el-empty description="此目录下暂无子文件夹" :image-size="70" />
      </div>
      <div
        v-for="folder in folders"
        :key="folder.cid"
        class="folder-item"
        :class="{ 'is-selected': folder.cid === selectedFolder?.cid }"
        @click="handleFolderClick(folder)"
      >
        <div class="folder-info">
          <el-icon class="item-folder-icon"><Folder /></el-icon>
          <span class="folder-name">{{ folder.name }}</span>
        </div>
        <div class="folder-action">
          <span class="enter-text">进入</span>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 加载浮层 -->
    <div v-if="loading" class="loading-overlay">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载目录中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from "vue";
import { cloud115Api } from "@/api/cloud115";
import { quarkApi } from "@/api/quark";
import type { Folder as FolderType } from "@/types";
import { Folder, FolderOpened, ArrowRight, Loading } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  cloudType: {
    type: String,
    required: true,
  },
});

const loading = ref(false);
const folders = ref<FolderType[]>([]);
const selectedFolder = ref<FolderType | null>(null);
const folderPath = ref<FolderType[]>([{ name: "根目录", cid: "0" }]);
const emit = defineEmits<{
  (e: "select", folderId: string): void;
  (e: "close"): void;
}>();

const cloudTypeApiMap = {
  pan115: cloud115Api,
  quark: quarkApi,
};

const getList = async (cid: string = "0") => {
  const api = cloudTypeApiMap[props.cloudType as keyof typeof cloudTypeApiMap];
  loading.value = true;
  try {
    const res = await api.getFolderList?.(cid);
    if (res?.code === 0) {
      folders.value = res.data || [];
    } else {
      throw new Error(res?.message);
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "获取目录失败");
    emit("close");
  } finally {
    loading.value = false;
  }
};

const handleFolderClick = async (folder: FolderType) => {
  selectedFolder.value = folder;
  folderPath.value = [...folderPath.value, folder];
  emit("select", folder.cid);
  await getList(folder.cid);
};

const handlePathClick = async (index: number) => {
  if (index < 0) {
    folderPath.value = [{ name: "根目录", cid: "0" }];
    selectedFolder.value = null;
    await getList("0");
    emit("select", "0");
  } else {
    const targetFolder = folderPath.value[index];
    folderPath.value = folderPath.value.slice(0, index + 1);
    selectedFolder.value = targetFolder;
    await getList(targetFolder.cid);
    emit("select", targetFolder.cid);
  }
};

// 初始化加载
getList();
</script>

<style lang="scss" scoped>
@use "@/styles/common.scss" as *;

.folder-select {
  position: relative;
  min-height: 320px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  padding: 4px;

  .folder-header {
    position: sticky;
    top: 0;
    z-index: 2;
    margin-bottom: 12px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;

    .folder-path {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      overflow-x: auto;

      &::-webkit-scrollbar {
        height: 3px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 2px;
      }

      .root-icon {
        flex-shrink: 0;
        font-size: 16px;
        color: #f59e0b;
      }

      .path-item {
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        cursor: pointer;
        color: #94a3b8;
        transition: color 0.2s;

        &:hover {
          color: #3b82f6;
        }

        &.is-current {
          color: #f8fafc;
          font-weight: 600;
        }

        .separator-icon {
          font-size: 12px;
          color: #64748b;
        }
      }

      .root-path {
        color: #94a3b8;
        cursor: pointer;
        &:hover {
          color: #3b82f6;
        }
      }
    }
  }
}

.folder-list {
  flex: 1;
  overflow-y: auto;
  padding: 2px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 3px;
  }

  .folder-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 14px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

    &:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.12);
      transform: translateX(2px);

      .folder-action {
        opacity: 1;
      }
    }

    &.is-selected {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.4);
      box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);

      .item-folder-icon {
        color: #3b82f6;
      }
      .folder-name {
        color: #60a5fa;
        font-weight: 600;
      }
    }

    .folder-info {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;

      .item-folder-icon {
        font-size: 18px;
        color: #f59e0b;
        flex-shrink: 0;
      }

      .folder-name {
        font-size: 14px;
        color: #f1f5f9;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .folder-action {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #64748b;
      opacity: 0.7;
      transition: opacity 0.2s;

      .enter-text {
        font-size: 11px;
      }
    }
  }
}

.empty-folder {
  padding: 40px 0;
}

.loading-overlay {
  @include flex-center;
  position: absolute;
  inset: 0;
  background: rgba(12, 15, 23, 0.85);
  backdrop-filter: blur(8px);
  gap: 10px;
  font-size: 14px;
  color: #f8fafc;
  z-index: 10;

  .loading-icon {
    font-size: 24px;
    color: #3b82f6;
    animation: rotating 1.5s linear infinite;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
