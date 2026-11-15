<script setup lang="ts">
/**
 * 审批单详情页：待处置/历史列表共用。
 * 一期只读：无审批操作按钮，底部预留「去 PC 处理」（复制单号）。
 */
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { fetchDetail } from "@/api/approval";
import { BizCode, BizError } from "@/types/api";
import type { OrderDetail } from "@/types/order";
import { formatRelativeTime, formatFileSize } from "@/utils/date";
import { track } from "@/utils/track";
import StatusTag from "@/components/status-tag.vue";
import ApprovalTimeline from "@/components/approval-timeline.vue";
import LoadState from "@/components/load-state.vue";

/** 页面视图状态（403 为越权空态） */
type DetailStatus = "loading" | "error" | "forbidden" | "ok";

const detail = ref<OrderDetail | null>(null);
const status = ref<DetailStatus>("loading");

let orderNo = "";
let currentId = "";
let currentFrom = "pending";

/** 加载详情 */
async function loadDetail(): Promise<void> {
  status.value = "loading";
  try {
    detail.value = await fetchDetail(currentId);
    orderNo = detail.value.orderNo;
    status.value = "ok";
    track("detail_view", {
      orderId: currentId,
      from: currentFrom === "history" ? "history" : "pending",
    });
  } catch (err) {
    if (err instanceof BizError && err.code === BizCode.UNAUTHORIZED) {
      return; // 401 已由请求层静默处理（重放或跳转登录）
    }
    if (err instanceof BizError && err.code === 403) {
      status.value = "forbidden";
      return;
    }
    status.value = "error";
  }
}

onLoad((query) => {
  const q = (query ?? {}) as Record<string, string | undefined>;
  const id = q.id ?? "";
  if (id === "") {
    status.value = "error";
    return;
  }
  currentId = id;
  currentFrom = q.from ?? "pending";
  void loadDetail();
});

/** 长按复制单号 */
function copyOrderNo(): void {
  if (orderNo === "") {
    return;
  }
  uni.setClipboardData({ data: orderNo });
}

/** 附件点击：一期不支持预览 */
function onAttachmentClick(): void {
  uni.showToast({ title: "请在 PC 端查看附件", icon: "none" });
}

/** 去 PC 处理：复制单号便于在 PC 后台检索 */
function onGoPc(): void {
  if (orderNo === "") {
    return;
  }
  uni.setClipboardData({
    data: orderNo,
    success: () => uni.showToast({ title: "单号已复制，请在 PC 端处理", icon: "none" }),
  });
}
</script>

<template>
  <view class="detail">
    <load-state
      v-if="status === 'loading' || status === 'error'"
      :status="status"
      empty-text=""
      @retry="loadDetail"
    />

    <view v-else-if="status === 'forbidden'" class="detail__forbidden">
      <text class="detail__forbidden-icon">🔒</text>
      <text class="detail__forbidden-text">无权限查看该审批单</text>
    </view>

    <block v-else-if="detail !== null">
      <!-- 头部 -->
      <view class="detail__header">
        <view class="detail__header-top">
          <text class="detail__title">{{ detail.title }}</text>
          <status-tag type="status" :value="detail.status" />
        </view>
        <view class="detail__no-row" @longpress="copyOrderNo">
          <text class="detail__no">单号：{{ detail.orderNo }}（长按复制）</text>
        </view>
      </view>

      <!-- 基础信息 -->
      <view class="detail__section">
        <text class="detail__section-title">基础信息</text>
        <view class="kv">
          <text class="kv__label">申请人</text>
          <text class="kv__value">{{ detail.applicantName }}</text>
        </view>
        <view class="kv">
          <text class="kv__label">所属部门</text>
          <text class="kv__value">{{ detail.deptName }}</text>
        </view>
        <view class="kv">
          <text class="kv__label">提交时间</text>
          <text class="kv__value">{{ formatRelativeTime(detail.applyTime) }}</text>
        </view>
        <view class="kv">
          <text class="kv__label">业务类型</text>
          <text class="kv__value">{{ detail.bizType }}</text>
        </view>
        <view class="kv">
          <text class="kv__label">紧急程度</text>
          <text class="kv__value" :class="{ 'kv__value--danger': detail.urgency === 'urgent' }">
            {{ detail.urgency === "urgent" ? "紧急" : "普通" }}
          </text>
        </view>
      </view>

      <!-- 表单内容 -->
      <view class="detail__section">
        <text class="detail__section-title">申请内容</text>
        <view v-for="(field, i) in detail.formFields" :key="i" class="kv">
          <text class="kv__label">{{ field.label }}</text>
          <text class="kv__value" :class="{ 'kv__value--wrap': field.type === 'longtext' }">
            {{ field.value }}
          </text>
        </view>
      </view>

      <!-- 附件 -->
      <view v-if="detail.attachments.length" class="detail__section">
        <text class="detail__section-title">附件（{{ detail.attachments.length }}）</text>
        <view
          v-for="(file, i) in detail.attachments"
          :key="i"
          class="attachment"
          @click="onAttachmentClick"
        >
          <text class="attachment__icon">📎</text>
          <view class="attachment__info">
            <text class="attachment__name">{{ file.name }}</text>
            <text class="attachment__size">{{ formatFileSize(file.size) }}</text>
          </view>
        </view>
      </view>

      <!-- 审批流程 -->
      <view class="detail__section">
        <text class="detail__section-title">审批流程</text>
        <approval-timeline :nodes="detail.timeline" />
      </view>

      <!-- 底部：一期无操作按钮，仅预留「去 PC 处理」 -->
      <view class="detail__footer">
        <button class="detail__pc-btn" @click="onGoPc">去 PC 处理</button>
      </view>
    </block>
  </view>
</template>

<style lang="scss">
.detail {
  min-height: 100vh;
  background-color: $color-bg;
  padding-bottom: 160rpx;

  &__forbidden {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 160rpx 0;

    &-icon {
      font-size: 80rpx;
      margin-bottom: 24rpx;
    }

    &-text {
      color: $color-text-placeholder;
      font-size: $font-size-base;
    }
  }

  &__header {
    padding: 32rpx;
    background-color: $color-white;

    &-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16rpx;
    }
  }

  &__title {
    flex: 1;
    font-size: $font-size-xl;
    font-weight: 600;
    color: $color-text;
    line-height: 1.4;
  }

  &__no-row {
    margin-top: 16rpx;
  }

  &__no {
    font-size: $font-size-sm;
    color: $color-text-placeholder;
  }

  &__section {
    margin: 20rpx 24rpx 0;
    padding: 28rpx;
    border-radius: $radius-lg;
    background-color: $color-white;

    &-title {
      display: block;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $color-text;
      margin-bottom: 12rpx;
    }
  }

  &__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 24rpx 32rpx;
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
    background-color: $color-white;
    border-top: 2rpx solid $color-border;
  }

  &__pc-btn {
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    background-color: $color-primary;
    color: $color-white;
    font-size: $font-size-lg;
    border: none;
  }
}

.kv {
  display: flex;
  padding: 18rpx 0;

  &__label {
    width: 160rpx;
    flex-shrink: 0;
    color: $color-text-placeholder;
    font-size: $font-size-base;
  }

  &__value {
    flex: 1;
    color: $color-text;
    font-size: $font-size-base;

    &--wrap {
      line-height: 1.6;
    }

    &--danger {
      color: $color-danger;
      font-weight: 500;
    }
  }
}

.attachment {
  display: flex;
  align-items: center;
  padding: 20rpx 0;

  &__icon {
    font-size: 36rpx;
    margin-right: 16rpx;
  }

  &__info {
    display: flex;
    flex-direction: column;
  }

  &__name {
    font-size: $font-size-base;
    color: $color-text;
  }

  &__size {
    margin-top: 4rpx;
    font-size: $font-size-sm;
    color: $color-text-placeholder;
  }
}
</style>
