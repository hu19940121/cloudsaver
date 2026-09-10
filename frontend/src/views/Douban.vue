<template>
  <div class="douban-page">
    <!-- 空状态 -->
    <div v-if="doubanStore.hotList.length === 0" class="empty-box">
      <el-empty description="正在加载或暂无豆瓣榜单数据..." />
    </div>

    <!-- 电影海报墙 -->
    <div v-else class="movie-gallery">
      <div
        v-for="movie in doubanStore.hotList"
        :key="movie.id"
        class="movie-card"
      >
        <!-- 海报区域 -->
        <div class="poster-container" @click="searchMovie(movie.title)">
          <el-image
            class="poster-img"
            :src="getDoubanImageUrl(movie.cover)"
            fit="cover"
            lazy
            :alt="movie.title"
          >
            <template #placeholder>
              <div class="poster-skeleton"></div>
            </template>
            <template #error>
              <div class="poster-error">
                <el-image :src="defaultImage" fit="contain" class="fallback-img" />
              </div>
            </template>
          </el-image>

          <!-- 评分徽章 (右上角毛玻璃胶囊) -->
          <div class="rate-badge">
            <el-icon class="star-icon"><StarFilled /></el-icon>
            <span class="rate-num">{{ movie.rate || "暂无" }}</span>
          </div>

          <!-- 悬浮微遮罩与快捷搜索 -->
          <div class="poster-hover-overlay">
            <div class="search-action-pill">
              <el-icon><Search /></el-icon>
              <span>搜网盘资源</span>
            </div>
          </div>
        </div>

        <!-- 电影标题与豆瓣外链 -->
        <div class="movie-meta">
          <a
            :href="movie.url"
            target="_blank"
            class="movie-title"
            :title="movie.title"
            @click.stop
          >
            <span>{{ movie.title }}</span>
            <el-icon class="external-icon"><TopRight /></el-icon>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useDoubanStore } from "@/stores/douban";
import { getDoubanImageUrl, defaultImage } from "@/utils/image";
import { Search, StarFilled, TopRight } from "@element-plus/icons-vue";

interface CurrentParams {
  type: string;
  tag?: string;
}

const router = useRouter();
const route = useRoute();

const routeParams = computed(
  (): CurrentParams => ({ ...route.query }) as unknown as CurrentParams
);
const doubanStore = useDoubanStore();

if (routeParams.value) {
  doubanStore.setCurrentParams(routeParams.value);
}

watch(
  () => routeParams.value,
  () => {
    doubanStore.setCurrentParams(routeParams.value);
  }
);

const searchMovie = (title: string) => {
  router.push({ path: "/", query: { keyword: title } });
};
</script>

<style lang="scss" scoped>
@use "@/styles/common.scss" as *;

.douban-page {
  height: calc(100vh - 170px);
  overflow-y: auto;
  padding: 6px 8px 30px;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.18);
    border-radius: 4px;

    &:hover {
      background: rgba(0, 0, 0, 0.28);
    }
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.empty-box {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.movie-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 22px 18px;
  width: 100%;
}

.movie-card {
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    transform: translateY(-6px);

    .poster-container {
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.16);

      .poster-img {
        transform: scale(1.06);
      }

      .poster-hover-overlay {
        opacity: 1;

        .search-action-pill {
          transform: translateY(0);
        }
      }
    }

    .movie-meta .movie-title {
      color: var(--theme-primary, #409eff);
    }
  }

  .poster-container {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 3;
    border-radius: 12px;
    overflow: hidden;
    background: #20242a;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: box-shadow 0.3s ease;

    .poster-img {
      width: 100%;
      height: 100%;
      transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1);
    }

    .poster-error {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: #2c3038;

      .fallback-img {
        width: 50%;
        opacity: 0.5;
      }
    }

    // 豆瓣评分徽章
    .rate-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 2px 7px;
      background: rgba(18, 18, 18, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      color: #ffb800;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

      .star-icon {
        font-size: 11px;
      }

      .rate-num {
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
    }

    // 悬浮交互遮罩
    .poster-hover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 3;
      background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.88) 0%,
        rgba(0, 0, 0, 0.4) 50%,
        transparent 100%
      );
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 16px;
      opacity: 0;
      transition: opacity 0.28s ease;

      .search-action-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--theme-primary, #409eff);
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        padding: 6px 14px;
        border-radius: 20px;
        box-shadow: 0 4px 14px rgba(64, 158, 255, 0.45);
        transform: translateY(8px);
        transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);

        &:hover {
          background: #66b1ff;
          transform: scale(1.04) translateY(0);
        }
      }
    }
  }

  .movie-meta {
    padding: 10px 4px 2px;

    .movie-title {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 600;
      color: #f8fafc;
      text-decoration: none;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
      transition: color 0.2s ease;

      .external-icon {
        font-size: 11px;
        color: #64748b;
        opacity: 0;
        transition: all 0.2s;
      }

      &:hover {
        .external-icon {
          opacity: 1;
          color: var(--theme-primary, #3b82f6);
        }
      }
    }
  }
}

// 图片加载底色与骨架屏，杜绝刷新时闪烁白块
:deep(.el-image) {
  background: #151922 !important;
  width: 100%;
  height: 100%;
}

:deep(.el-image__placeholder) {
  background: #151922 !important;
}

:deep(.el-image__inner) {
  background: #151922 !important;
}

.poster-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #151922 25%, #222a3a 50%, #151922 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
}

@keyframes skeletonShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// 移动端响应式适配
@media screen and (max-width: 768px) {
  .douban-page {
    padding: 6px 6px 95px !important; // 预留 95px，避免底部被导航遮挡
    height: auto !important;
    overflow-y: visible !important;
  }

  .movie-gallery {
    grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
    gap: 12px 10px;
  }

  .movie-card {
    .poster-container {
      border-radius: 8px;

      .rate-badge {
        top: 5px;
        right: 5px;
        padding: 1px 5px;
        font-size: 10px;
        .star-icon {
          font-size: 9px;
        }
        .rate-num {
          font-size: 10px;
        }
      }

      .poster-hover-overlay .search-action-pill {
        padding: 4px 10px;
        font-size: 11px;
      }
    }

    .movie-meta {
      padding: 6px 2px 0;
      .movie-title {
        font-size: 12px;
      }
    }
  }
}
</style>
