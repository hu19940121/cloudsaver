<template>
  <div class="pc-aside">
    <!-- Logo 区域 -->
    <div class="pc-aside__logo">
      <div class="brand-box">
        <span class="brand-glow-dot"></span>
        <h1 class="logo__title">Cloud Saver</h1>
      </div>
      <span class="brand-sub">CINEMATIC STUDIO</span>
    </div>

    <!-- 菜单区域 -->
    <div class="pc-aside__menu-wrapper">
      <el-menu
        :default-active="currentMenu?.index || '1'"
        :default-openeds="currentMenuOpen"
        class="pc-aside__menu"
      >
        <template v-for="menu in menuList" :key="menu.index">
          <!-- 子菜单 -->
          <el-sub-menu v-if="menu.children" :index="menu.index">
            <template #title>
              <el-icon class="menu-icon"><component :is="menu.icon" /></el-icon>
              <span class="menu-label">{{ menu.title }}</span>
            </template>

            <el-menu-item
              v-for="child in menu.children"
              :key="child.index"
              :index="child.index"
              class="sub-menu-item"
              @click="handleMenuClick(child)"
            >
              <span class="sub-dot"></span>
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
            <el-icon class="menu-icon"><component :is="menu.icon" /></el-icon>
            <span class="menu-label">{{ menu.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>

    <!-- 侧边栏底部版本 -->
    <div class="pc-aside__footer">
      <span class="version-tag">v0.2.5 Pro</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Search, Film, Setting } from "@element-plus/icons-vue";

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
    title: "豆瓣影视榜",
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
        title: "最新上映",
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
    title: "系统设置",
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
@use "@/styles/common.scss" as *;

.pc-aside {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;

  // Logo 区域
  &__logo {
    display: flex;
    flex-direction: column;
    padding: 24px 22px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .brand-box {
      display: flex;
      align-items: center;
      gap: 9px;

      .brand-glow-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #3b82f6;
        box-shadow: 0 0 10px #3b82f6;
      }

      .logo__title {
        margin: 0;
        font-size: 19px;
        font-weight: 700;
        letter-spacing: -0.3px;
        color: #f8fafc;
        @include text-overflow;
      }
    }

    .brand-sub {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 1.5px;
      margin-top: 5px;
      margin-left: 17px;
    }
  }

  // 菜单区域
  &__menu-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 14px 10px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
    }
  }

  &__menu {
    border-right: none;
    background: transparent;

    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      height: 44px;
      line-height: 44px;
      border-radius: 10px;
      margin-bottom: 4px;
      color: #94a3b8;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

      &:hover {
        color: #f1f5f9;
        background: rgba(255, 255, 255, 0.06);
      }

      .menu-icon {
        font-size: 17px;
        margin-right: 10px;
        color: inherit;
      }
    }

    :deep(.el-menu-item.is-active) {
      color: #60a5fa !important;
      background: rgba(59, 130, 246, 0.14) !important;
      font-weight: 600;
      box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.25);

      .menu-icon {
        color: #3b82f6;
      }
    }

    :deep(.el-sub-menu.is-active .el-sub-menu__title) {
      color: #f1f5f9;
    }

    :deep(.el-sub-menu .el-menu) {
      background: transparent;
      padding-left: 12px;
    }

    .sub-menu-item {
      height: 38px;
      line-height: 38px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;

      .sub-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #64748b;
        transition: all 0.2s;
      }

      &.is-active .sub-dot {
        background: #3b82f6;
        box-shadow: 0 0 6px #3b82f6;
      }
    }
  }

  // 底部
  &__footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);

    .version-tag {
      font-size: 11px;
      color: #475569;
      background: rgba(255, 255, 255, 0.03);
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
  }
}
</style>
