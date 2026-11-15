<script setup lang="ts">
/**
 * 搜索栏：纯 UI，防抖逻辑在 usePagedList 内。
 * 支持审批单号 / 标题 / 申请人姓名模糊匹配。
 */
const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "input", value: string): void;
}>();

function onInput(e: Event): void {
  const value = (e.target as HTMLInputElement).value;
  emit("update:modelValue", value);
  emit("input", value);
}

function onClear(): void {
  emit("update:modelValue", "");
  emit("input", "");
}
</script>

<template>
  <view class="search-bar">
    <text class="search-bar__icon">🔍</text>
    <input
      class="search-bar__input"
      :value="props.modelValue"
      :placeholder="props.placeholder ?? '搜索单号 / 标题 / 申请人'"
      placeholder-class="search-bar__placeholder"
      @input="onInput"
    />
    <text v-if="props.modelValue" class="search-bar__clear" @click="onClear">✕</text>
  </view>
</template>

<style lang="scss">
.search-bar {
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 24rpx;
  margin: 16rpx 24rpx;
  border-radius: 36rpx;
  background-color: $color-white;
  border: 2rpx solid $color-border;

  &__icon {
    font-size: 28rpx;
    margin-right: 12rpx;
  }

  &__input {
    flex: 1;
    font-size: $font-size-base;
    color: $color-text;
  }

  &__placeholder {
    color: $color-text-placeholder;
  }

  &__clear {
    padding: 8rpx;
    color: $color-text-placeholder;
    font-size: 28rpx;
  }
}
</style>
