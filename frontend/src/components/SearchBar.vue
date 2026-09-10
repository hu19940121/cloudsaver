<template>
  <div class="pc-search">
    <!-- 搜索输入区域 (流媒体发光胶囊搜索栏) -->
    <div class="pc-search__input">
      <div class="search-bar-shell" :class="{ 'is-focused': isInputFocused, 'has-val': !!keyword }">
        <div class="search-lens-box">
          <el-icon class="search-prefix-icon"><Search /></el-icon>
        </div>
        <input
          v-model="keyword"
          class="custom-search-input"
          placeholder="搜索影视剧集、电影、动漫，或粘贴夸克/115网盘链接..."
          autocomplete="off"
          @focus="isInputFocused = true"
          @blur="isInputFocused = false"
          @keyup.enter="handleSearch"
        />
        <div class="search-right-actions">
          <button
            v-if="keyword"
            type="button"
            class="clear-text-btn"
            title="清空输入"
            @click="keyword = ''"
          >
            <el-icon><CircleClose /></el-icon>
          </button>
          <span class="shortcut-tag">↵ Enter</span>
          <button
            type="button"
            class="search-submit-btn"
            :class="{ 'has-keyword': !!keyword }"
            @click="handleSearch"
          >
            <span>搜索</span>
            <el-icon class="btn-arrow"><ArrowRight /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 用户与退出操作区 -->
    <div class="pc-search__actions">
      <el-tooltip effect="dark" content="退出登录" placement="bottom">
        <button type="button" class="action-btn logout-btn" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useResourceStore } from "@/stores/resource";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Search,
  ArrowRight,
  SwitchButton,
  CircleClose,
} from "@element-plus/icons-vue";
import { STORAGE_KEYS } from "@/constants/storage";

const route = useRoute();
const router = useRouter();
const resourcStore = useResourceStore();

const keyword = ref("");
const isInputFocused = ref(false);
const routeKeyword = computed(() => route.query.keyword as string);

const handleLogout = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  router.push("/login");
  ElMessage.success("已安全退出登录");
};

const handleSearch = async () => {
  const searchText = keyword.value.trim();
  if (!searchText) {
    ElMessage.warning("请输入搜索关键词或网盘链接");
    return;
  }

  // 链接解析处理
  if (searchText.startsWith("http")) {
    await resourcStore.parsingCloudLink(searchText);
    return;
  }

  // 关键词搜索
  await resourcStore.searchResources(searchText);
  if (route.path !== "/resource") {
    router.push("/resource");
  }
};

watch(
  () => routeKeyword.value,
  (newKeyword) => {
    if (newKeyword) {
      keyword.value = newKeyword;
      handleSearch();
    } else {
      keyword.value = resourcStore.keyword;
    }
  }
);
watch(
  () => resourcStore.keyword,
  (newKeyword) => {
    keyword.value = newKeyword;
  }
);
</script>

<style lang="scss" scoped>
@use "@/styles/common.scss" as *;

.pc-search {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;

  // 搜索输入区域
  &__input {
    flex: 1;
    max-width: 820px;

    .search-bar-shell {
      position: relative;
      display: flex;
      align-items: center;
      height: 46px;
      padding: 0 4px 0 16px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.09);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);

      &:hover {
        background: rgba(255, 255, 255, 0.07);
        border-color: rgba(255, 255, 255, 0.18);
      }

      &.is-focused {
        background: rgba(20, 26, 38, 0.95);
        border-color: #3b82f6;
        box-shadow:
          0 0 0 3px rgba(59, 130, 246, 0.2),
          0 8px 25px rgba(0, 0, 0, 0.45);

        .search-lens-box .search-prefix-icon {
          color: #3b82f6;
          filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.6));
        }
      }

      .search-lens-box {
        display: flex;
        align-items: center;
        margin-right: 10px;
        flex-shrink: 0;

        .search-prefix-icon {
          font-size: 18px;
          color: #64748b;
          transition: all 0.25s;
        }
      }

      .custom-search-input {
        flex: 1;
        min-width: 0;
        height: 100%;
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
        font-weight: 500;
        color: #f8fafc;
        letter-spacing: 0.2px;

        &::placeholder {
          color: #64748b;
          font-weight: 400;
        }
      }

      .search-right-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;

        .clear-text-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          border-radius: 50%;
          transition: all 0.2s;

          &:hover {
            color: #f8fafc;
            background: rgba(255, 255, 255, 0.1);
          }
        }

        .shortcut-tag {
          font-size: 11px;
          color: #475569;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          padding: 2px 7px;
          border-radius: 6px;
          user-select: none;
        }

        .search-submit-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 38px;
          padding: 0 16px;
          border-radius: 20px;
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);

          .btn-arrow {
            font-size: 14px;
            transition: transform 0.2s;
          }

          &:hover,
          &.has-keyword {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
            transform: translateY(-1px);

            .btn-arrow {
              transform: translateX(2px);
            }
          }

          &:active {
            transform: translateY(1px);
          }
        }
      }
    }
  }

  // 退出等操作区域
  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;

    .action-btn {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.04);
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

      .el-icon {
        font-size: 18px;
        transition: transform 0.2s;
      }

      &:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
        color: #f87171;
        transform: translateY(-1px);

        .el-icon {
          transform: scale(1.1);
        }
      }
    }
  }
}

// 移动端自适应优化
@media screen and (max-width: 768px) {
  .pc-search {
    gap: 8px;

    &__input .search-bar-shell {
      height: 40px;
      padding: 0 3px 0 12px;

      .search-lens-box {
        margin-right: 6px;
        .search-prefix-icon {
          font-size: 16px;
        }
      }

      .custom-search-input {
        font-size: 13px;
      }

      .search-right-actions {
        gap: 4px;

        .shortcut-tag {
          display: none; // 手机端隐藏键盘快捷提示
        }

        .search-submit-btn {
          height: 32px;
          padding: 0 10px;
          font-size: 12px;

          span {
            display: inline;
          }
        }
      }
    }

    &__actions .action-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      .el-icon {
        font-size: 16px;
      }
    }
  }
}
</style>
