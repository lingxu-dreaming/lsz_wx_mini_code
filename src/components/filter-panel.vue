<script setup lang="ts">
/**
 * 筛选面板（底部抽屉）：业务类型多选 + 时间范围（近7天/近30天/自定义）+ 重置/确定。
 * 历史模式额外提供处理结果单选。
 */
import { reactive, watch } from "vue";
import type { OrderListFilters, OrderListMode } from "@/composables/useOrderList";
import type { HandleResult } from "@/types/order";
import { createDefaultFilters } from "@/composables/useOrderList";
import { useDictStore } from "@/store/dict";

const props = defineProps<{
  show: boolean;
  mode: OrderListMode;
  current: OrderListFilters;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "confirm", filters: OrderListFilters): void;
}>();

const dictStore = useDictStore();

/** 面板草稿状态（打开时从 current 拷贝） */
const draft = reactive<OrderListFilters>(createDefaultFilters(props.mode));

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      Object.assign(draft, createDefaultFilters(props.mode), props.current);
      void dictStore.ensureLoaded();
    }
  },
);

/** 业务类型多选切换 */
function toggleBizType(code: string): void {
  const idx = draft.bizTypes.indexOf(code);
  if (idx >= 0) {
    draft.bizTypes.splice(idx, 1);
  } else {
    draft.bizTypes.push(code);
  }
}

/** 选择自定义日期 */
function onPickDate(field: "dateFrom" | "dateTo", e: { detail: { value: string } }): void {
  draft[field] = e.detail.value;
  if (draft.dateRange !== "custom") {
    draft.dateRange = "custom";
  }
}

/** 处理结果单选（仅历史） */
function selectResult(result: HandleResult | "all"): void {
  draft.result = result;
}

/** 重置 */
function onReset(): void {
  Object.assign(draft, createDefaultFilters(props.mode));
}

/** 确定 */
function onConfirm(): void {
  emit("confirm", { ...draft, bizTypes: [...draft.bizTypes] });
  emit("update:show", false);
}

function onClose(): void {
  emit("update:show", false);
}
</script>

<template>
  <view v-if="props.show" class="filter-mask" @click="onClose">
    <view class="filter-panel" @click.stop>
      <view class="filter-panel__header">
        <text class="filter-panel__title">筛选</text>
        <text class="filter-panel__close" @click="onClose">✕</text>
      </view>

      <scroll-view scroll-y class="filter-panel__body">
        <view class="filter-section">
          <text class="filter-section__title">业务类型</text>
          <view class="filter-section__chips">
            <text
              v-for="biz in dictStore.bizTypes"
              :key="biz.code"
              class="chip"
              :class="{ 'chip--active': draft.bizTypes.includes(biz.code) }"
              @click="toggleBizType(biz.code)"
            >{{ biz.label }}</text>
          </view>
        </view>

        <view v-if="props.mode === 'history'" class="filter-section">
          <text class="filter-section__title">处理结果</text>
          <view class="filter-section__chips">
            <text
              class="chip"
              :class="{ 'chip--active': draft.result === 'all' }"
              @click="selectResult('all')"
            >全部</text>
            <text
              class="chip"
              :class="{ 'chip--active': draft.result === 'APPROVED' }"
              @click="selectResult('APPROVED')"
            >通过</text>
            <text
              class="chip"
              :class="{ 'chip--active': draft.result === 'REJECTED' }"
              @click="selectResult('REJECTED')"
            >驳回</text>
            <text
              class="chip"
              :class="{ 'chip--active': draft.result === 'RETURNED' }"
              @click="selectResult('RETURNED')"
            >退回</text>
          </view>
        </view>

        <view class="filter-section">
          <text class="filter-section__title">提交时间</text>
          <view class="filter-section__chips">
            <text
              class="chip"
              :class="{ 'chip--active': draft.dateRange === '7d' }"
              @click="draft.dateRange = '7d'"
            >近 7 天</text>
            <text
              class="chip"
              :class="{ 'chip--active': draft.dateRange === '30d' }"
              @click="draft.dateRange = '30d'"
            >近 30 天</text>
            <text
              class="chip"
              :class="{ 'chip--active': draft.dateRange === 'custom' }"
              @click="draft.dateRange = 'custom'"
            >自定义</text>
          </view>
          <view v-if="draft.dateRange === 'custom'" class="filter-section__dates">
            <picker mode="date" :value="draft.dateFrom" @change="onPickDate('dateFrom', $event)">
              <view class="date-input">{{ draft.dateFrom || "开始日期" }}</view>
            </picker>
            <text class="date-sep">至</text>
            <picker mode="date" :value="draft.dateTo" @change="onPickDate('dateTo', $event)">
              <view class="date-input">{{ draft.dateTo || "结束日期" }}</view>
            </picker>
          </view>
        </view>
      </scroll-view>

      <view class="filter-panel__footer">
        <button class="filter-panel__btn filter-panel__btn--reset" @click="onReset">重置</button>
        <button class="filter-panel__btn filter-panel__btn--confirm" @click="onConfirm">确定</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.filter-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.filter-panel {
  background-color: $color-white;
  border-radius: $radius-lg $radius-lg 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 32rpx 16rpx;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text;
  }

  &__close {
    padding: 8rpx;
    color: $color-text-placeholder;
    font-size: 32rpx;
  }

  &__body {
    flex: 1;
    padding: 0 32rpx;
    box-sizing: border-box;
  }

  &__footer {
    display: flex;
    gap: 24rpx;
    padding: 24rpx 32rpx;
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  }

  &__btn {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    font-size: $font-size-lg;
    border: none;

    &--reset {
      background-color: $color-info-light;
      color: $color-text-secondary;
    }

    &--confirm {
      background-color: $color-primary;
      color: $color-white;
    }
  }
}

.filter-section {
  padding: 24rpx 0;

  &__title {
    display: block;
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text;
    margin-bottom: 20rpx;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  &__dates {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 20rpx;
  }
}

.chip {
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  background-color: $color-info-light;
  color: $color-text-secondary;
  font-size: $font-size-base;

  &--active {
    background-color: $color-primary-light;
    color: $color-primary;
    font-weight: 500;
  }
}

.date-input {
  flex: 1;
  padding: 16rpx 24rpx;
  border-radius: $radius-md;
  background-color: $color-info-light;
  color: $color-text-secondary;
  font-size: $font-size-base;
  min-width: 200rpx;
  text-align: center;
}

.date-sep {
  color: $color-text-placeholder;
  font-size: $font-size-sm;
}
</style>
