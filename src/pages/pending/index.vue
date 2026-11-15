<script setup lang="ts">
/**
 * 待处置审批单列表（Tab 1）：搜索 / 筛选 / 分页 / 下拉刷新 / 触底加载。
 */
import { ref } from "vue";
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from "@dcloudio/uni-app";
import {
  createDefaultFilters,
  useOrderList,
  type OrderListFilters,
} from "@/composables/useOrderList";
import type { ApprovalOrderItem } from "@/types/order";
import { useBadgeStore } from "@/store/badge";
import { useDictStore } from "@/store/dict";
import { useReadStore } from "@/store/read";
import SearchBar from "@/components/search-bar.vue";
import FilterPanel from "@/components/filter-panel.vue";
import LoadState from "@/components/load-state.vue";
import OrderListItem from "@/components/order-list-item.vue";

const { list, status, loadingMore, noMore, refresh, loadMore, search, applyFilters } =
  useOrderList("pending");

const keyword = ref("");
const panelShow = ref(false);
const currentFilters = ref<OrderListFilters>(createDefaultFilters("pending"));
const badgeStore = useBadgeStore();
const dictStore = useDictStore();
const readStore = useReadStore();

onLoad(() => {
  void dictStore.ensureLoaded();
  void refresh();
});

onShow(() => {
  // 角标同步（不刷新列表数据，避免打断阅读）
  void badgeStore.refresh();
});

onPullDownRefresh(async () => {
  await refresh();
  await badgeStore.refresh();
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  void loadMore();
});

function onSearchInput(value: string): void {
  search(value);
}

function onFilterConfirm(filters: OrderListFilters): void {
  currentFilters.value = filters;
  applyFilters(filters);
}

function goDetail(item: ApprovalOrderItem): void {
  readStore.mark(item.orderNo);
  uni.navigateTo({ url: `/pages/detail/index?id=${item.id}&from=pending` });
}
</script>

<template>
  <view class="page">
    <view class="page__nav">
      <text class="page__nav-title">待处置</text>
    </view>

    <view class="page__toolbar">
      <search-bar
        :model-value="keyword"
        @update:model-value="keyword = $event"
        @input="onSearchInput"
      />
      <view class="page__filter-btn" @click="panelShow = true">
        <text>筛选</text>
        <text v-if="currentFilters.bizTypes.length" class="page__filter-dot" />
      </view>
    </view>

    <load-state :status="status" empty-text="暂无待处置审批单" @retry="refresh">
      <view v-if="list.length" class="page__list">
        <order-list-item
          v-for="item in list"
          :key="item.id"
          :item="item"
          mode="pending"
          :read="readStore.isRead(item.orderNo)"
          @click="goDetail"
        />
        <view class="page__footer">
          <text v-if="loadingMore">加载中…</text>
          <text v-else-if="noMore">没有更多了</text>
        </view>
      </view>
    </load-state>

    <filter-panel
      v-model:show="panelShow"
      mode="pending"
      :current="currentFilters"
      @confirm="onFilterConfirm"
    />
  </view>
</template>

<style lang="scss">
.page {
  min-height: 100vh;
  background-color: $color-bg;
  padding-bottom: 140rpx;

  &__nav {
    padding: calc(var(--status-bar-height, 20px) + 16rpx) 32rpx 16rpx;
    background-color: $color-white;

    &-title {
      font-size: $font-size-xl;
      font-weight: 600;
      color: $color-text;
    }
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background-color: $color-white;
    padding-bottom: 16rpx;

    .search-bar {
      flex: 1;
      margin: 0 0 0 24rpx;
    }
  }

  &__filter-btn {
    display: flex;
    align-items: center;
    padding: 0 28rpx;
    height: 72rpx;
    color: $color-text-secondary;
    font-size: $font-size-base;
    position: relative;
  }

  &__filter-dot {
    position: absolute;
    top: 14rpx;
    right: 16rpx;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background-color: $color-danger;
  }

  &__list {
    padding-top: 20rpx;
  }

  &__footer {
    display: flex;
    justify-content: center;
    padding: 32rpx 0 48rpx;
    color: $color-text-placeholder;
    font-size: $font-size-sm;
  }
}
</style>
