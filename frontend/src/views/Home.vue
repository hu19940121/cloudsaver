<template>
  <div class="pc-home" :class="{ 'is-loading': resourcStore.loading }">
    <!-- 主布局容器 -->
    <el-container class="pc-home__container">
      <!-- 侧边栏 (移动端自动隐藏) -->
      <el-aside width="230px" class="pc-home__aside">
        <aside-menu />
      </el-aside>

      <!-- 主内容区 -->
      <el-container class="pc-home__main">
        <!-- 顶部搜索栏 -->
        <el-header class="pc-home__header" :class="{ 'is-scrolled': !store.scrollTop }">
          <search-bar />
        </el-header>

        <!-- 内容区域 -->
        <el-main class="pc-home__content">
          <div class="content-wrapper">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>

    <!-- 移动端自适应底部导航栏 (仅在屏幕宽度 <= 768px 时显示) -->
    <nav class="mobile-bottom-nav">
      <router-link
        to="/resource"
        class="mobile-nav-item"
        :class="{ 'is-active': route.path === '/resource' }"
      >
        <el-icon><Search /></el-icon>
        <span>资源搜索</span>
      </router-link>
      <router-link
        to="/douban"
        class="mobile-nav-item"
        :class="{ 'is-active': route.path.startsWith('/douban') }"
      >
        <el-icon><Film /></el-icon>
        <span>豆瓣榜</span>
      </router-link>
      <router-link
        to="/setting"
        class="mobile-nav-item"
        :class="{ 'is-active': route.path === '/setting' }"
      >
        <el-icon><Setting /></el-icon>
        <span>系统设置</span>
      </router-link>
    </nav>

    <!-- 全局加载 -->
    <div v-if="resourcStore.loading" class="pc-home__loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span class="loading-text">正在检索影视资源...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useResourceStore } from "@/stores/resource";
import { useStore } from "@/stores/index";
import { useUserSettingStore } from "@/stores/userSetting";
import { useRoute } from "vue-router";
import { throttle } from "@/utils/index";
import { Loading, Search, Film, Setting } from "@element-plus/icons-vue";
import "element-plus/es/components/loading/style/css";
import AsideMenu from "@/components/AsideMenu.vue";
import SearchBar from "@/components/SearchBar.vue";

// 状态管理
const resourcStore = useResourceStore();
const store = useStore();
const settingStore = useUserSettingStore();
const route = useRoute();

// 初始化设置
onMounted(() => {
  settingStore.getSettings();
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

// 滚动处理
const handleScroll = throttle(() => {
  const scrollTop = window.scrollY;
  store.setScrollTop(scrollTop <= 50);
}, 100);
</script>

<style lang="scss" scoped>
@use "@/styles/common.scss" as *;

.pc-home {
  position: relative;
  height: 100vh;
  background: radial-gradient(circle at 50% 0%, #161c2b 0%, #0c0f17 75%);
  color: var(--theme-text-primary);
  overflow: hidden;

  // 主容器
  &__container {
    height: 100%;
  }

  // 侧边栏
  &__aside {
    background: rgba(14, 18, 26, 0.95);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-right: 1px solid rgba(255, 255, 255, 0.07);
    overflow: hidden;
    transition: all 0.3s ease;
    z-index: 12;
  }

  // 主内容区
  &__main {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 0;
    height: 100%;
    min-width: 0;
  }

  // 顶部搜索栏
  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    height: auto;
    padding: 16px 24px;
    background: rgba(12, 15, 23, 0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    transition: all 0.25s ease;

    &.is-scrolled {
      padding: 12px 24px;
      background: rgba(10, 13, 20, 0.92);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }
  }

  // 内容区域
  &__content {
    flex: 1;
    padding: 24px;
    height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    .content-wrapper {
      max-width: 1560px;
      width: 100%;
      margin: 0 auto;
      height: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
    }
  }

  // 移动端底部导航
  .mobile-bottom-nav {
    display: none;
  }

  // 加载状态
  &__loading {
    @include flex-center;
    position: fixed;
    inset: 0;
    z-index: 2000;
    flex-direction: column;
    gap: 16px;
    background: rgba(10, 13, 20, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    animation: fadeIn 0.3s ease;

    .loading-text {
      color: #f8fafc;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .is-loading {
      font-size: 32px;
      color: var(--theme-primary, #3b82f6);
      animation: rotating 1.5s linear infinite;
      filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.6));
    }
  }
}

// 移动端响应式适配
@media screen and (max-width: 768px) {
  .pc-home {
    max-width: 100vw;
    overflow-x: hidden;

    &__container {
      max-width: 100vw;
      overflow-x: hidden;
    }

    &__aside {
      display: none !important; // 彻底隐藏 230px 侧边栏，防止挤压屏幕
    }

    &__main {
      max-width: 100vw;
      overflow-x: hidden;
    }

    &__header {
      padding: 8px 10px;
      max-width: 100vw;
      overflow-x: hidden;
      box-sizing: border-box;
    }

    &__content {
      padding: 10px 8px calc(80px + env(safe-area-inset-bottom, 0px)) !important;
      max-width: 100vw;
      overflow-x: hidden;
      box-sizing: border-box;
    }

    .mobile-bottom-nav {
      display: flex;
      align-items: center;
      justify-content: space-around;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: calc(52px + env(safe-area-inset-bottom, 0px));
      padding-bottom: env(safe-area-inset-bottom, 0px);
      background: rgba(14, 18, 26, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 100;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.4);

      .mobile-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        color: #94a3b8;
        text-decoration: none;
        font-size: 11px;
        transition: color 0.2s;

        .el-icon {
          font-size: 18px;
        }

        &.is-active {
          color: #3b82f6;
          font-weight: 600;

          .el-icon {
            filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.6));
          }
        }
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
