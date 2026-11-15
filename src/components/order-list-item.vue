<script setup lang="ts">
/**
 * 审批单列表卡片：待处置/历史列表共用。
 * 展示单号、标题、业务类型、申请人、相对提交时间、超时角标、摘要；
 * 历史模式额外展示我的处理结果 / 处理时间 / 当前状态。
 */
import type { ApprovalOrderItem } from "@/types/order";
import type { OrderListMode } from "@/composables/useOrderList";
import { formatRelativeTime } from "@/utils/date";
import StatusTag from "@/components/status-tag.vue";

const props = defineProps<{
  item: ApprovalOrderItem;
  mode: OrderListMode;
  read: boolean;
}>();

const emit = defineEmits<{
  (e: "click", item: ApprovalOrderItem): void;
}>();

const relativeTime = formatRelativeTime(props.item.applyTime);
const handleTime = props.item.myHandleTime
  ? formatRelativeTime(props.item.myHandleTime)
  : "";
</script>

<template>
  <view
    class="order-item"
    :class="{ 'order-item--read': props.read }"
    @click="emit('click', props.item)"
  >
    <view class="order-item__top">
      <text class="order-item__title">{{ props.item.title }}</text>
      <status-tag type="biz" :value="props.item.bizType" />
    </view>

    <view class="order-item__meta">
      <text class="order-item__no">{{ props.item.orderNo }}</text>
      <text v-if="props.item.overdue" class="order-item__overdue">超时</text>
    </view>

    <view v-if="props.item.summary.length" class="order-item__summary">
      <text v-for="(line, i) in props.item.summary" :key="i" class="order-item__summary-line">
        {{ line }}
      </text>
    </view>

    <view class="order-item__bottom">
      <text class="order-item__applicant">
        {{ props.item.applicantName }} · {{ props.item.deptName }}
      </text>
      <template v-if="props.mode === 'pending'">
        <text class="order-item__time">{{ relativeTime }}</text>
      </template>
      <template v-else>
        <view class="order-item__history">
          <status-tag type="result" :value="props.item.myResult ?? ''" />
          <text class="order-item__time">{{ handleTime }}</text>
        </view>
      </template>
    </view>

    <view v-if="props.mode === 'history' && props.item.currentStatus" class="order-item__status">
      <text class="order-item__status-label">当前状态：</text>
      <status-tag type="status" :value="props.item.currentStatus" />
    </view>
  </view>
</template>

<style lang="scss">
.order-item {
  margin: 0 24rpx 20rpx;
  padding: 28rpx;
  border-radius: $radius-lg;
  background-color: $color-white;

  &--read {
    opacity: 0.6;
  }

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16rpx;
  }

  &__title {
    flex: 1;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text;
    @include ellipsis-multi(2);
  }

  &__meta {
    display: flex;
    align-items: center;
    margin-top: 12rpx;
  }

  &__no {
    font-size: $font-size-sm;
    color: $color-text-placeholder;
  }

  &__overdue {
    margin-left: 16rpx;
    padding: 2rpx 12rpx;
    border-radius: 6rpx;
    background-color: $color-danger;
    color: $color-white;
    font-size: 20rpx;
    line-height: 1.8;
  }

  &__summary {
    margin-top: 16rpx;
    padding: 16rpx 20rpx;
    border-radius: $radius-md;
    background-color: $color-bg;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__summary-line {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    @include ellipsis;
  }

  &__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20rpx;
  }

  &__applicant {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    @include ellipsis;
  }

  &__time {
    font-size: $font-size-sm;
    color: $color-text-placeholder;
    white-space: nowrap;
  }

  &__history {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__status {
    display: flex;
    align-items: center;
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 2rpx solid $color-bg;
  }

  &__status-label {
    font-size: $font-size-sm;
    color: $color-text-placeholder;
  }
}
</style>
