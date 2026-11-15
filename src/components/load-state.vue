<script setup lang="ts">
/**
 * 三态容器：加载中 / 空数据 / 网络异常（可重试）。杜绝白屏。
 */
import type { ListStatus } from "@/composables/usePagedList";

withDefaults(
  defineProps<{
    status: ListStatus;
    emptyText?: string;
  }>(),
  {
    emptyText: "暂无数据",
  },
);

const emit = defineEmits<{
  (e: "retry"): void;
}>();
</script>

<template>
  <view class="load-state">
    <slot v-if="status === 'ok'" />
    <view v-else-if="status === 'loading'" class="load-state__box">
      <view class="load-state__spinner" />
      <text class="load-state__text">加载中…</text>
    </view>
    <view v-else-if="status === 'empty'" class="load-state__box">
      <view class="load-state__empty-icon">📄</view>
      <text class="load-state__text">{{ emptyText }}</text>
    </view>
    <view v-else class="load-state__box">
      <view class="load-state__empty-icon">⚠️</view>
      <text class="load-state__text">网络不给力，请重试</text>
      <button class="load-state__retry" size="mini" @click="emit('retry')">重新加载</button>
    </view>
  </view>
</template>

<style lang="scss">
.load-state {
  &__box {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0;
  }

  &__spinner {
    width: 56rpx;
    height: 56rpx;
    border: 6rpx solid $color-primary-light;
    border-top-color: $color-primary;
    border-radius: 50%;
    animation: load-state-spin 0.8s linear infinite;
  }

  &__empty-icon {
    font-size: 72rpx;
    margin-bottom: 24rpx;
  }

  &__text {
    color: $color-text-placeholder;
    font-size: $font-size-base;
  }

  &__retry {
    margin-top: 32rpx;
    color: $color-primary;
    background-color: $color-primary-light;
    border: none;
    font-size: $font-size-base;
  }
}

@keyframes load-state-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
