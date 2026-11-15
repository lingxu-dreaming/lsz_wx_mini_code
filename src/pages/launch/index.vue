<script setup lang="ts">
/**
 * 启动页：仅做登录判定与跳转（无业务 UI，仅 loading）。
 * 流程：基础库校验 → 静默一键登录 → 命中绑定 reLaunch 待办首页；
 * 未命中/失败 redirectTo 登录绑定页（不留启动页栈）。
 */
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useAuthStore, type SilentLoginOutcome } from "@/store/auth";
import { MINI_PROGRAM_LIB_MIN } from "@/utils/constants";
import { compareVersion } from "@/utils/version";
import { BIND_TICKET_KEY } from "@/utils/constants";

const authStore = useAuthStore();
const lowVersion = ref(false);
const sdkVersion = ref("");

/** 读取微信基础库版本（非小程序端可能为空） */
function getSdkVersion(): string {
  try {
    const info = uni.getSystemInfoSync();
    return (info as { SDKVersion?: string }).SDKVersion ?? "";
  } catch {
    return "";
  }
}

/** 根据静默登录结果跳转 */
function navigateByOutcome(outcome: SilentLoginOutcome): void {
  if (outcome.type === "home") {
    uni.reLaunch({ url: "/pages/pending/index" });
    return;
  }
  if (outcome.ticket !== undefined && outcome.ticket !== "") {
    authStore.saveBindTicket(outcome.ticket);
  }
  const query =
    `reason=${outcome.reason}&msg=${encodeURIComponent(outcome.message ?? "")}`;
  uni.redirectTo({ url: `/pages/login/index?${query}` });
}

/** 启动编排 */
async function bootstrap(): Promise<void> {
  sdkVersion.value = getSdkVersion();
  if (
    sdkVersion.value !== "" &&
    compareVersion(sdkVersion.value, MINI_PROGRAM_LIB_MIN) < 0
  ) {
    lowVersion.value = true;
    return;
  }
  const outcome = await authStore.silentLogin();
  navigateByOutcome(outcome);
}

onLoad(() => {
  void bootstrap();
});
</script>

<template>
  <view class="launch">
    <block v-if="lowVersion">
      <view class="launch__icon">⚠️</view>
      <view class="launch__text">请升级微信后重试</view>
      <view class="launch__sub">当前基础库 {{ sdkVersion }}，需 ≥ {{ MINI_PROGRAM_LIB_MIN }}</view>
    </block>
    <block v-else>
      <view class="launch__loading" />
      <view class="launch__text launch__text--light">正在进入…</view>
    </block>
  </view>
</template>

<style lang="scss">
.launch {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: $color-white;

  &__loading {
    width: 64rpx;
    height: 64rpx;
    border: 6rpx solid $color-primary-light;
    border-top-color: $color-primary;
    border-radius: 50%;
    animation: launch-spin 0.8s linear infinite;
  }

  &__icon {
    font-size: 80rpx;
    margin-bottom: 24rpx;
  }

  &__text {
    margin-top: 32rpx;
    font-size: $font-size-lg;
    color: $color-text;

    &--light {
      color: $color-text-placeholder;
      font-size: $font-size-base;
    }
  }

  &__sub {
    margin-top: 16rpx;
    font-size: $font-size-sm;
    color: $color-text-placeholder;
  }
}

@keyframes launch-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
