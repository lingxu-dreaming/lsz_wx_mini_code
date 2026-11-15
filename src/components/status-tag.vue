<script setup lang="ts">
/**
 * 状态标签：单据状态 / 业务类型 / 我的处理结果 统一标签（枚举→颜色集中映射）。
 */
import { computed } from "vue";
import { useDictStore } from "@/store/dict";

type TagType = "status" | "biz" | "result";

interface ColorMap {
  [key: string]: { label: string; color: string; bg: string };
}

/** 单据当前状态映射 */
const STATUS_MAP: ColorMap = {
  processing: { label: "处理中", color: "#2f6bff", bg: "#e8efff" },
  approved: { label: "已通过", color: "#00a870", bg: "#e6f7f0" },
  rejected: { label: "已驳回", color: "#e5484d", bg: "#fdecec" },
  returned: { label: "已退回", color: "#ff8800", bg: "#fff3e5" },
  archived: { label: "已归档", color: "#8a8f99", bg: "#f2f3f5" },
};

/** 我的处理结果映射 */
const RESULT_MAP: ColorMap = {
  APPROVED: { label: "通过", color: "#00a870", bg: "#e6f7f0" },
  REJECTED: { label: "驳回", color: "#e5484d", bg: "#fdecec" },
  RETURNED: { label: "退回", color: "#ff8800", bg: "#fff3e5" },
};

const props = defineProps<{
  type: TagType;
  value: string;
}>();

const dictStore = useDictStore();

const meta = computed(() => {
  if (props.type === "status") {
    return STATUS_MAP[props.value] ?? { label: props.value, color: "#8a8f99", bg: "#f2f3f5" };
  }
  if (props.type === "result") {
    return RESULT_MAP[props.value] ?? { label: props.value, color: "#8a8f99", bg: "#f2f3f5" };
  }
  return {
    label: dictStore.labelOf(props.value),
    color: dictStore.colorOf(props.value),
    bg: "#f2f3f5",
  };
});
</script>

<template>
  <text
    class="status-tag"
    :style="{ color: meta.color, backgroundColor: meta.bg }"
  >{{ meta.label }}</text>
</template>

<style lang="scss">
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  line-height: 1.6;
  white-space: nowrap;
}
</style>
