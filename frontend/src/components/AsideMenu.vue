<template>
  <div class="pc-aside">
    <!-- Logo 区域 -->
    <div class="pc-aside__logo">
      <img :src="logo" alt="Cloud Saver Logo" class="logo__image" />
      <h1 class="logo__title">Cloud Saver</h1>
    </div>

    <!-- 菜单区域 -->
    <el-menu
      :default-active="currentMenu?.index || '1'"
      :default-openeds="currentMenuOpen"
      class="pc-aside__menu"
    >
      <template v-for="menu in menuList" :key="menu.index">
        <!-- 子菜单 -->
        <el-sub-menu v-if="menu.children" :index="menu.index">
          <template #title>
            <el-icon><component :is="menu.icon" /></el-icon>
            <span>{{ menu.title }}</span>
          </template>

          <el-menu-item
            v-for="child in menu.children"
            :key="child.index"
            :index="child.index"
            @click="handleMenuClick(child)"
          >
            <span>{{ child.title }}</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 普通菜单项 -->
        <el-menu-item
          v-else
          :index="menu.index"
          :disabled="menu.disabled"
          @click="handleMenuClick(menu)"
        >
          <el-icon><component :is="menu.icon" /></el-icon>
          <span>{{ menu.title }}</span>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Search, Film, Setting } from "@element-plus/icons-vue";
import logo from "@/assets/images/logo.png";

// 类型定义
interface MenuItem {
  index: string;
  title: string;
  icon?: typeof Search | typeof Film | typeof Setting;
  router?: string;
  children?: MenuItem[];
  disabled?: boolean;
}

// 路由相关
const router = useRouter();
const route = useRoute();

// 菜单配置
const menuList: MenuItem[] = [
  {
    index: "1",
    title: "资源搜索",
    icon: Search,
    router: "/resource",
  },
  {
    index: "2",
    title: "豆瓣榜单",
    icon: Film,
    children: [
      {
        index: "2-1",
        title: "热门电影",
        router: "/douban?type=movie",
      },
      {
        index: "2-2",
        title: "热门电视剧",
        router: "/douban?type=tv",
      },
      {
        index: "2-3",
        title: "最新电影",
        router: "/douban?type=movie&tag=最新",
      },
      {
        index: "2-4",
        title: "热门综艺",
        router: "/douban?type=tv&tag=综艺",
      },
    ],
  },
  {
    index: "3",
    title: "设置",
    icon: Setting,
    router: "/setting",
    disabled: false,
  },
];

// 计算当前激活的菜单
const currentMenu = computed(() => {
  const flatMenus = menuList.reduce<MenuItem[]>((acc, menu) => {
    if (!menu.children) {
      acc.push(menu);
    } else {
      acc.push(...menu.children);
    }
    return acc;
  }, []);

  return flatMenus.find((menu) => menu.router === decodeURIComponent(route.fullPath));
});

// 计算当前展开的子菜单
const currentMenuOpen = computed(() => {
  if (currentMenu.value?.index.includes("-")) {
    return [currentMenu.value.index.split("-")[0]];
  }
  return [];
});

// 菜单点击处理
const handleMenuClick = (menu: MenuItem) => {
  if (menu.router) {
    router.push(menu.router);
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/common.scss";

.pc-aside {
  height: 100%;
  background: var(--theme-card-bg);
  border-right: 1px solid rgba(0, 0, 0, 0.1);

  // Logo 区域
  &__logo {
    @include flex-center;
    padding: 24px 16px;
    gap: 12px;

    .logo__image {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    .logo__title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--theme-text-primary);
      @include text-overflow;
    }
  }

  // 菜单区域
  &__menu {
    border-right: none;
    background: transparent;

    :deep(.el-menu-item) {
      height: 48px;
      line-height: 48px;
      color: var(--theme-text-regular);

      &.is-active {
        color: var(--theme-primary);
        background: rgba(0, 102, 204, 0.1);
      }

      &:hover {
        color: var(--theme-primary);
        background: rgba(0, 102, 204, 0.05);
      }
    }

    :deep(.el-sub-menu) {
      .el-sub-menu__title {
        color: var(--theme-text-regular);

        &:hover {
          color: var(--theme-primary);
          background: rgba(0, 102, 204, 0.05);
        }
      }
    }

    :deep(.el-icon) {
      font-size: 18px;
      margin-right: 12px;
      color: inherit;
    }
  }

}

// 自定义滚动条
.pc-aside__menu {
  height: calc(100vh - 80px); // 减去 logo 高度
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}
</style>
