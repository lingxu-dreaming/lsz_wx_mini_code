<script setup lang="ts">
/**
 * 审批流程时间轴：竖向展示节点。
 * 已通过（绿）/ 处理中（蓝高亮）/ 未开始（灰）/ 已驳回（红）；
 * 每个节点显示处理人、处理时间、处理意见；「我的处理」节点高亮标注。
 */
import type { TimelineNode, TimelineStatus } from "@/types/order";
import { formatRelativeTime } from "@/utils/date";

defineProps<{
  nodes: TimelineNode[];
}>();

/** 节点状态 → 圆点颜色 */
const DOT_COLOR: Record<TimelineStatus, string> = {
  passed: "#00a870",
  processing: "#2f6bff",
  pending: "#c4c9cf",
  rejected: "#e5484d",
};

/** 节点状态 → 文案 */
const STATUS_LABEL: Record<TimelineStatus, string> = {
  passed: "已通过",
  processing: "处理中",
  pending: "未开始",
  rejected: "已驳回",
};

function dotColor(status: TimelineStatus): string {
  return DOT_COLOR[status];
}

function timeOf(node: TimelineNode): string {
  return node.operateTime ? formatRelativeTime(node.operateTime) : "";
}
</script>

<template>
  <view class="timeline">
    <view
      v-for="(node, i) in nodes"
      :key="i"
      class="timeline__node"
      :class="`timeline__node--${node.status}`"
    >
      <view class="timeline__left">
        <view
          class="timeline__dot"
          :class="{ 'timeline__dot--hollow': node.status === 'pending' }"
          :style="{ backgroundColor: node.status === 'pending' ? 'transparent' : dotColor(node.status), borderColor: dotColor(node.status) }"
        />
        <view v-if="i < nodes.length - 1" class="timeline__line" />
      </view>

      <view class="timeline__content">
        <view class="timeline__header">
          <text class="timeline__name">{{ node.nodeName }}</text>
          <text class="timeline__status" :style="{ color: dotColor(node.status) }">
            {{ STATUS_LABEL[node.status] }}
          </text>
          <text v-if="node.isMine" class="timeline__mine">我的处理</text>
        </view>
        <view class="timeline__meta">
          <text class="timeline__operator">{{ node.operatorName }}</text>
          <text v-if="timeOf(node)" class="timeline__time">{{ timeOf(node) }}</text>
        </view>
        <view v-if="node.opinion" class="timeline__opinion">{{ node.opinion }}</view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.timeline {
  &__node {
    display: flex;

    &--pending {
      opacity: 0.75;
    }
  }

  &__left {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 32rpx;
  }

  &__dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    flex-shrink: 0;

    &--hollow {
      border-width: 4rpx;
      border-style: solid;
      box-sizing: border-box;
    }
  }

  &__line {
    flex: 1;
    width: 4rpx;
    min-height: 40rpx;
    background-color: $color-border;
    margin: 8rpx 0;
  }

  &__content {
    flex: 1;
    padding: 0 0 40rpx 24rpx;
    margin-top: -4rpx;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  &__name {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text;
  }

  &__status {
    font-size: $font-size-sm;
  }

  &__mine {
    padding: 2rpx 12rpx;
    border-radius: 6rpx;
    background-color: $color-primary-light;
    color: $color-primary;
    font-size: 20rpx;
  }

  &__meta {
    display: flex;
    gap: 24rpx;
    margin-top: 8rpx;
  }

  &__operator,
  &__time {
    font-size: $font-size-sm;
    color: $color-text-placeholder;
  }

  &__opinion {
    margin-top: 12rpx;
    padding: 16rpx 20rpx;
    border-radius: $radius-md;
    background-color: $color-bg;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.6;
  }
}
</style>
