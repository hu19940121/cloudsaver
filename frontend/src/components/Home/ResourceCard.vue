<template>
  <div class="resource-card-container">
    <!-- 详情弹窗 -->
    <el-dialog
      v-model="showDetail"
      :title="currentResource?.title"
      width="700px"
      class="resource-detail-dialog"
      destroy-on-close
    >
      <div v-if="currentResource" class="detail-content">
        <div class="detail-cover">
          <el-image
            class="cover-image"
            :src="getProxyImageUrl(currentResource.image as string)"
            :fit="currentResource.image ? 'cover' : 'contain'"
          >
            <template #error>
              <div class="image-slot fallback-cover">
                <el-image :src="defaultImage" fit="contain" style="width: 45%; opacity: 0.6;" />
              </div>
            </template>
          </el-image>
          <el-tag
            class="cloud-type"
            :type="store.tagColor[currentResource.cloudType as keyof TagColor]"
            effect="dark"
            round
          >
            {{ currentResource.cloudType }}
          </el-tag>
        </div>
        <div class="detail-info">
          <h3 class="detail-title">
            <a :href="currentResource.cloudLinks[0]" target="_blank">
              {{ currentResource.title }}
            </a>
          </h3>
          <div class="detail-description" v-html="currentResource.content" />
          <div v-if="currentResource.tags?.length" class="detail-tags">
            <div class="tags-list">
              <span
                v-for="tag in currentResource.tags"
                :key="tag"
                class="tag-item"
                @click="searchMovieforTag(tag)"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button plain @click="currentResource && handleJump(currentResource)">
            <span>直达链接</span>
            <el-icon><TopRight /></el-icon>
          </el-button>
          <el-button
            v-if="currentResource?.isSupportSave"
            type="primary"
            @click="currentResource && handleSave(currentResource)"
          >
            <el-icon><FolderAdd /></el-icon>
            <span>一键转存</span>
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 频道分组卡片列表 -->
    <div
      v-for="group in store.resources"
      :key="group.id"
      class="channel-group"
    >
      <!-- 分组头部 -->
      <div
        class="group-header"
        :class="{ 'is-collapsed': !group.displayList }"
        @click="group.displayList = !group.displayList"
      >
        <div class="group-left">
          <el-image
            :src="getProxyImageUrl(group.channelInfo.channelLogo)"
            :fit="group.channelInfo.channelLogo ? 'cover' : 'contain'"
            class="channel-avatar"
            loading="lazy"
          >
            <template #error>
              <div class="avatar-fallback">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="channel-info">
            <span class="channel-name">{{ group.channelInfo.name }}</span>
            <span class="channel-badge">{{ group.list.length }} 条资源</span>
          </div>
        </div>

        <div class="group-right">
          <el-link
            class="tg-link"
            :href="`https://t.me/s/${group.id}`"
            target="_blank"
            :underline="false"
            @click.stop
          >
            <span>访问频道</span>
            <el-icon><TopRight /></el-icon>
          </el-link>
          <div class="expand-btn" :class="{ 'is-active': group.displayList }">
            <el-icon><ArrowDown /></el-icon>
          </div>
        </div>
      </div>

      <!-- 分组卡片网格 -->
      <transition name="fade">
        <div v-if="group.displayList" class="group-body">
          <div class="card-grid">
            <div
              v-for="resource in group.list"
              :key="resource.messageId"
              class="resource-card-item"
            >
              <!-- 封面区 -->
              <div class="card-cover-box" @click="showResourceDetail(resource)">
                <el-image
                  loading="lazy"
                  class="cover-img"
                  :src="getProxyImageUrl(resource.image as string)"
                  fit="cover"
                  :alt="resource.title"
                >
                  <template #error>
                    <div class="image-fallback">
                      <el-image :src="defaultImage" fit="contain" style="width: 50%; opacity: 0.5;" />
                    </div>
                  </template>
                </el-image>

                <!-- 右上角悬浮云盘标签 -->
                <div class="cloud-pill">
                  <el-tag
                    :type="store.tagColor[resource.cloudType as keyof TagColor]"
                    effect="dark"
                    round
                    size="small"
                  >
                    {{ resource.cloudType }}
                  </el-tag>
                </div>

                <!-- Hover 悬浮预览遮罩 -->
                <div class="cover-hover-mask">
                  <span class="preview-text">点击查看详情</span>
                </div>
              </div>

              <!-- 卡片主体内容 -->
              <div class="card-info-box">
                <a
                  class="card-title"
                  :href="resource.cloudLinks[0]"
                  target="_blank"
                  :title="resource.title"
                >
                  {{ resource.title }}
                </a>

                <div
                  class="card-snippet"
                  @click="showResourceDetail(resource)"
                  v-html="resource.content"
                />

                <div v-if="resource.tags?.length" class="card-tags">
                  <span
                    v-for="tag in resource.tags.slice(0, 4)"
                    :key="tag"
                    class="tag-chip"
                    @click.stop="searchMovieforTag(tag)"
                  >
                    #{{ tag }}
                  </span>
                  <span v-if="resource.tags.length > 4" class="tag-more">
                    +{{ resource.tags.length - 4 }}
                  </span>
                </div>

                <!-- 底部操作按钮 -->
                <div class="card-action-bar">
                  <el-button
                    type="default"
                    size="small"
                    class="btn-jump"
                    @click.stop="handleJump(resource)"
                  >
                    <span>直达</span>
                    <el-icon><TopRight /></el-icon>
                  </el-button>
                  <el-button
                    v-if="resource.isSupportSave"
                    type="primary"
                    size="small"
                    class="btn-save"
                    @click.stop="handleSave(resource)"
                  >
                    <el-icon><FolderAdd /></el-icon>
                    <span>转存</span>
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 加载更多 -->
          <div class="load-more-container">
            <el-button
              class="load-more-btn"
              round
              :loading="group.loading"
              @click="handleLoadMore(group.id)"
            >
              <el-icon><Plus /></el-icon>
              <span>加载更多资源</span>
            </el-button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResourceStore } from "@/stores/resource";
import { ref } from "vue";
import type { ResourceItem, TagColor } from "@/types";
import {
  ArrowDown,
  Plus,
  TopRight,
  Picture,
  FolderAdd,
} from "@element-plus/icons-vue";
import { getProxyImageUrl, defaultImage } from "@/utils/image";

const store = useResourceStore();

const showDetail = ref(false);
const currentResource = ref<ResourceItem | null>(null);

const emit = defineEmits(["save", "loadMore", "jump", "searchMovieforTag"]);

const handleSave = (resource: ResourceItem) => {
  if (showDetail.value) {
    showDetail.value = false;
  }
  emit("save", resource);
};

const handleJump = (resource: ResourceItem) => {
  emit("jump", resource);
};

const showResourceDetail = (resource: ResourceItem) => {
  currentResource.value = resource;
  showDetail.value = true;
};

const searchMovieforTag = (tag: string) => {
  emit("searchMovieforTag", tag);
};

const handleLoadMore = (channelId: string) => {
  emit("loadMore", channelId);
};
</script>

<style lang="scss" scoped>
@use "@/styles/common.scss" as *;

.resource-card-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.channel-group {
  background: rgba(18, 23, 34, 0.85);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.12);
  }
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: rgba(26, 33, 48, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(32, 41, 60, 0.75);
  }

  &.is-collapsed {
    border-bottom: none;
  }

  .group-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .channel-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;

      .avatar-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: #1e293b;
        color: #64748b;
      }
    }

    .channel-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .channel-name {
        font-size: 15px;
        font-weight: 600;
        color: #f8fafc;
      }

      .channel-badge {
        font-size: 11px;
        font-weight: 500;
        color: #94a3b8;
        background: rgba(255, 255, 255, 0.06);
        padding: 2px 8px;
        border-radius: 10px;
      }
    }
  }

  .group-right {
    display: flex;
    align-items: center;
    gap: 14px;

    .tg-link {
      font-size: 13px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: color 0.2s;

      &:hover {
        color: var(--theme-primary, #3b82f6);
      }
    }

    .expand-btn {
      font-size: 16px;
      color: #64748b;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &.is-active {
        transform: rotate(180deg);
      }
    }
  }
}

.group-body {
  padding: 18px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

.resource-card-item {
  background: rgba(22, 28, 42, 0.95);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
    border-color: rgba(59, 130, 246, 0.4);

    .cover-img {
      transform: scale(1.05);
    }

    .cover-hover-mask {
      opacity: 1;
    }
  }

  .card-cover-box {
    position: relative;
    width: 100%;
    height: 155px;
    overflow: hidden;
    background: #0f131c;
    cursor: pointer;

    .cover-img {
      width: 100%;
      height: 100%;
      transition: transform 0.4s ease;
    }

    .image-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #111520, #192030);
    }

    .cloud-pill {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 2;

      :deep(.el-tag) {
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      }
    }

    .cover-hover-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
      backdrop-filter: blur(2px);
      z-index: 1;

      .preview-text {
        color: #ffffff;
        font-size: 12px;
        font-weight: 500;
        padding: 4px 12px;
        background: rgba(0, 0, 0, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
      }
    }
  }

  .card-info-box {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 8px;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #f8fafc;
      line-height: 1.4;
      text-decoration: none;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
      max-height: 42px;
      transition: color 0.2s;

      &:hover {
        color: var(--theme-primary, #3b82f6);
      }
    }

    .card-snippet {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.55;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
      max-height: 38px;
      cursor: pointer;

      :deep(p) {
        margin: 0;
        display: inline;
      }
      :deep(br) {
        display: none;
      }
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-top: auto;
      padding-top: 4px;

      .tag-chip {
        font-size: 11px;
        color: #60a5fa;
        background: rgba(59, 130, 246, 0.12);
        border: 1px solid rgba(59, 130, 246, 0.2);
        padding: 1px 7px;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #3b82f6;
          color: #ffffff;
        }
      }

      .tag-more {
        font-size: 11px;
        color: #64748b;
      }
    }

    .card-action-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);

      .btn-jump {
        flex: 1;
        border-radius: 8px;
        color: #94a3b8;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);

        &:hover {
          color: #f8fafc;
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.09);
        }
      }

      .btn-save {
        flex: 1.3;
        font-weight: 600;
        border-radius: 8px;
        border: none;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        box-shadow: 0 3px 12px rgba(59, 130, 246, 0.35);
        transition: all 0.2s;

        &:hover {
          background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
          transform: translateY(-1px);
          box-shadow: 0 5px 16px rgba(59, 130, 246, 0.5);
        }
      }
    }
  }
}

// 移动端响应式适配
@media screen and (max-width: 768px) {
  .resource-card-container {
    gap: 14px;
  }

  .channel-group {
    border-radius: 12px;
  }

  .group-header {
    padding: 10px 14px;

    .group-left .channel-info .channel-name {
      font-size: 14px;
    }
  }

  .group-body {
    padding: 10px;
  }

  .card-grid {
    grid-template-columns: 1fr; // 移动端单列流式，杜绝挤压变形
    gap: 12px;
  }

  .resource-card-item {
    border-radius: 10px;

    .card-cover-box {
      height: 140px;
    }
  }
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;

  .load-more-btn {
    padding: 10px 28px;
    font-size: 13px;
    color: #606266;
    border-color: rgba(0, 0, 0, 0.12);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    transition: all 0.2s;

    &:hover {
      color: var(--theme-primary, #409eff);
      border-color: var(--theme-primary, #409eff);
      background: #f0f7ff;
      transform: translateY(-1px);
    }
  }
}

// 详情弹窗
.detail-content {
  display: flex;
  gap: 20px;

  .detail-cover {
    width: 180px;
    height: 250px;
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    flex-shrink: 0;

    .cover-image {
      width: 100%;
      height: 100%;
    }

    .cloud-type {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }

  .detail-info {
    flex: 1;
    min-width: 0;

    .detail-title {
      margin: 0 0 12px;
      font-size: 18px;
      font-weight: 600;

      a {
        color: #1f2329;
        text-decoration: none;
        &:hover {
          color: #409eff;
        }
      }
    }

    .detail-description {
      font-size: 13px;
      color: #606266;
      line-height: 1.6;
      max-height: 150px;
      overflow-y: auto;
      margin-bottom: 12px;
    }

    .detail-tags .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .tag-item {
        font-size: 12px;
        color: #409eff;
        background: rgba(64, 158, 255, 0.08);
        padding: 3px 10px;
        border-radius: 6px;
        cursor: pointer;

        &:hover {
          background: #409eff;
          color: #ffffff;
        }
      }
    }
  }
}
</style>
