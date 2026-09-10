<template>
  <div class="resource-feed">
    <div
      v-for="group in store.resources"
      :key="group.id"
      class="channel-section"
    >
      <!-- 频道头部卡片 -->
      <div
        class="channel-header"
        :class="{ 'is-collapsed': !group.displayList }"
        @click="group.displayList = !group.displayList"
      >
        <div class="channel-info">
          <el-image
            :src="getProxyImageUrl(group.channelInfo.channelLogo as string)"
            class="channel-avatar"
            :fit="group.channelInfo.channelLogo ? 'cover' : 'contain'"
            loading="lazy"
          >
            <template #error>
              <div class="channel-avatar-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="channel-meta">
            <span class="channel-name">{{ group.channelInfo.name }}</span>
            <el-tag size="small" type="info" effect="plain" class="count-badge">
              {{ group.list.length }} 条资源
            </el-tag>
          </div>
        </div>

        <div class="channel-actions">
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
          <div class="expand-icon" :class="{ 'is-active': group.displayList }">
            <el-icon><ArrowDown /></el-icon>
          </div>
        </div>
      </div>

      <!-- 频道下的资源列表 -->
      <transition name="fade">
        <div v-if="group.displayList" class="channel-body">
          <div v-if="group.list.length === 0" class="empty-tip">
            暂无资源数据
          </div>

          <div class="media-list">
            <div
              v-for="resource in group.list"
              :key="resource.messageId"
              class="media-item"
            >
              <!-- 左侧海报图 -->
              <div class="media-poster" @click="handleJump(resource)">
                <el-image
                  :src="getProxyImageUrl(resource.image as string)"
                  class="poster-img"
                  fit="cover"
                  loading="lazy"
                >
                  <template #error>
                    <div class="poster-placeholder">
                      <el-image :src="defaultImage" fit="contain" class="fallback-img" />
                    </div>
                  </template>
                </el-image>
                <div class="poster-overlay">
                  <el-icon><TopRight /></el-icon>
                </div>
              </div>

              <!-- 中间内容信息 -->
              <div class="media-content">
                <div class="content-top">
                  <el-tag
                    :type="store.tagColor[resource.cloudType as keyof TagColor]"
                    effect="dark"
                    round
                    size="small"
                    class="cloud-tag"
                  >
                    {{ resource.cloudType }}
                  </el-tag>
                  <a
                    :href="resource.cloudLinks[0]"
                    target="_blank"
                    class="media-title"
                    :title="resource.title"
                  >
                    {{ resource.title }}
                  </a>
                </div>

                <!-- 描述文本 -->
                <div
                  class="media-desc"
                  v-html="resource.content"
                />

                <!-- 底部标签栏 -->
                <div class="content-bottom">
                  <div v-if="resource.tags && resource.tags.length > 0" class="tag-chips">
                    <span
                      v-for="tag in resource.tags"
                      :key="tag"
                      class="tag-chip"
                      @click.stop="searchMovieforTag(tag)"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                  <span v-else class="no-tag-tip">暂无标签</span>
                </div>
              </div>

              <!-- 右侧快捷操作按钮 -->
              <div class="media-actions">
                <el-button
                  v-if="resource.isSupportSave"
                  type="primary"
                  size="default"
                  class="save-btn"
                  @click.stop="handleSave(resource)"
                >
                  <el-icon><FolderAdd /></el-icon>
                  <span>一键转存</span>
                </el-button>
                <el-button
                  type="default"
                  size="default"
                  class="link-btn"
                  @click.stop="handleJump(resource)"
                >
                  <span>直达链接</span>
                  <el-icon><TopRight /></el-icon>
                </el-button>
              </div>
            </div>
          </div>

          <!-- 加载更多 -->
          <div class="load-more-box">
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
import type { ResourceItem, TagColor } from "@/types";
import { getProxyImageUrl, defaultImage } from "@/utils/image";
import {
  ArrowDown,
  Plus,
  TopRight,
  Picture,
  FolderAdd,
} from "@element-plus/icons-vue";

const store = useResourceStore();
const emit = defineEmits(["save", "loadMore", "searchMovieforTag", "jump"]);

const handleSave = (resource: ResourceItem) => {
  emit("save", resource);
};

const handleJump = (resource: ResourceItem) => {
  emit("jump", resource);
};

const handleLoadMore = (channelId: string) => {
  emit("loadMore", channelId);
};

const searchMovieforTag = (tag: string) => {
  emit("searchMovieforTag", tag);
};
</script>

<style lang="scss" scoped>
@use "@/styles/common.scss" as *;

.resource-feed {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.channel-section {
  background: rgba(18, 23, 34, 0.85);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.5);
  }
}

.channel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: rgba(26, 33, 48, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(32, 41, 60, 0.75);
  }

  &.is-collapsed {
    border-bottom: none;
  }

  .channel-info {
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

      .channel-avatar-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: #1e293b;
        color: #64748b;
      }
    }

    .channel-meta {
      display: flex;
      align-items: center;
      gap: 10px;

      .channel-name {
        font-size: 15px;
        font-weight: 600;
        color: #f8fafc;
      }

      .count-badge {
        font-size: 11px;
        border-radius: 10px;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.06);
        color: #94a3b8;
        border: none;
      }
    }
  }

  .channel-actions {
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

    .expand-icon {
      font-size: 16px;
      color: #64748b;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &.is-active {
        transform: rotate(180deg);
      }
    }
  }
}

.channel-body {
  padding: 12px 18px 20px;
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.media-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.media-item {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(22, 28, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
  transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    background: rgba(28, 36, 54, 0.98);
    border-color: rgba(59, 130, 246, 0.35);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);

    .media-poster .poster-overlay {
      opacity: 1;
    }
  }

  .media-poster {
    width: 80px;
    height: 106px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
    background: #0f131c;

    .poster-img {
      width: 100%;
      height: 100%;
      transition: transform 0.35s ease;
    }

    &:hover .poster-img {
      transform: scale(1.08);
    }

    .poster-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #111520, #192030);

      .fallback-img {
        width: 60%;
        opacity: 0.5;
      }
    }

    .poster-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      opacity: 0;
      transition: opacity 0.25s ease;
      backdrop-filter: blur(2px);
    }
  }

  .media-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .content-top {
      display: flex;
      align-items: center;
      gap: 10px;

      .cloud-tag {
        font-weight: 600;
        font-size: 11px;
        flex-shrink: 0;
      }

      .media-title {
        font-size: 15px;
        font-weight: 600;
        color: #f8fafc;
        text-decoration: none;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: color 0.2s;

        &:hover {
          color: var(--theme-primary, #3b82f6);
        }
      }
    }

    .media-desc {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.55;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
      max-height: 42px;

      :deep(p) {
        margin: 0;
        display: inline;
      }
      :deep(br) {
        display: none;
      }
      :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
        font-size: 13px;
        font-weight: normal;
        margin: 0;
        display: inline;
      }
    }

    .content-bottom {
      display: flex;
      align-items: center;

      .tag-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .tag-chip {
          font-size: 11px;
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 2px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: #3b82f6;
            color: #ffffff;
            transform: translateY(-1px);
          }
        }
      }

      .no-tag-tip {
        font-size: 11px;
        color: #64748b;
      }
    }
  }

  .media-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    margin-left: 12px;

    .save-btn {
      font-weight: 600;
      border-radius: 8px;
      padding: 8px 16px;
      border: none;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      box-shadow: 0 3px 12px rgba(59, 130, 246, 0.35);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
        box-shadow: 0 5px 16px rgba(59, 130, 246, 0.5);
      }
    }

    .link-btn {
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 12px;
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);

      &:hover {
        color: #f8fafc;
        border-color: rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.09);
      }
    }
  }
}

// 移动端响应式适配
@media screen and (max-width: 768px) {
  .channel-section {
    border-radius: 12px;
  }

  .channel-header {
    padding: 10px 14px;

    .channel-info .channel-meta .channel-name {
      font-size: 14px;
    }
  }

  .channel-body {
    padding: 10px;
  }

  .media-item {
    padding: 10px 12px;
    gap: 12px;

    .media-poster {
      width: 65px;
      height: 88px;
    }

    .media-content .content-top .media-title {
      font-size: 14px;
    }

    .media-actions {
      margin-left: 6px;

      .save-btn,
      .link-btn {
        padding: 5px 10px;
        font-size: 11px;
      }
    }
  }
}

.load-more-box {
  display: flex;
  justify-content: center;
  margin-top: 18px;

  .load-more-btn {
    padding: 9px 24px;
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
</style>
