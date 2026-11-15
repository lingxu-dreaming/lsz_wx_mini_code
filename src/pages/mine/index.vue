<script setup lang="ts">
/**
 * 我的页面：当前账号信息、退出登录、解除微信绑定、隐私政策。
 * Mock 模式下连点版本号 5 次打开调试面板（验收演示场景开关）。
 */
import { ref } from "vue";
import { useAuthStore } from "@/store/auth";
import { USE_MOCK } from "@/config";
import { resetScenario, scenario, type WxLoginOutcome } from "@/mock/scenario";
import { getStatusbarHeightCss } from "@/utils/system";

/** 自定义导航顶部动态注入真实状态栏高度（真机 --status-bar-height 非真实值） */
const statusBarHeightCss = getStatusbarHeightCss();

const authStore = useAuthStore();
const version = ref("1.0.0");

/** 隐私政策弹层 */
const showPrivacy = ref(false);

/** 调试面板（仅 Mock 模式） */
const showDebug = ref(false);
const versionTapCount = ref(0);

const APP_VERSION_TEXT = `审批中心 ${version.value}`;

/** 解除绑定：二次确认 */
function onUnbind(): void {
  uni.showModal({
    title: "解除微信绑定",
    content: "解除后本微信将无法一键登录，确定解除吗？",
    confirmText: "解除绑定",
    confirmColor: "#e5484d",
    success: async (res) => {
      if (!res.confirm) {
        return;
      }
      try {
        await authStore.unbind();
        uni.reLaunch({ url: "/pages/login/index?reason=need_bind" });
      } catch {
        uni.showToast({ title: "解绑失败，请重试", icon: "none" });
      }
    },
  });
}

/** 退出登录：清 token 回到启动页（已绑定会再次免密进入，故仅用于刷新登录态） */
function onLogout(): void {
  uni.showModal({
    title: "退出登录",
    content: "退出后将重新校验登录状态",
    success: async (res) => {
      if (!res.confirm) {
        return;
      }
      await authStore.logout();
      uni.reLaunch({ url: "/pages/launch/index" });
    },
  });
}

/** 版本号连点 5 次开启调试面板 */
function onVersionTap(): void {
  if (!USE_MOCK) {
    return;
  }
  versionTapCount.value += 1;
  if (versionTapCount.value >= 5) {
    versionTapCount.value = 0;
    showDebug.value = true;
  }
}

/** 切换 wxLoginOutcome 场景 */
function selectWxOutcome(outcome: WxLoginOutcome): void {
  scenario.wxLoginOutcome = outcome;
}

/** 数字场景步进 */
function stepScenario(field: "pwdFailRemaining" | "accountLockedMinutes" | "badgeCount", delta: number): void {
  scenario[field] = Math.max(field === "badgeCount" ? -1 : 0, scenario[field] + delta);
}

/** 布尔场景开关 */
function toggleScenario(field: "bindConflict" | "force401Once" | "detailForbidden" | "networkError"): void {
  scenario[field] = !scenario[field];
}

function onResetScenario(): void {
  resetScenario();
}
</script>

<template>
  <view class="mine" :style="{ '--status-bar-height': statusBarHeightCss }">
    <view class="mine__nav">
      <text class="mine__nav-title">我的</text>
    </view>

    <!-- 账号卡片 -->
    <view class="mine__card">
      <view class="mine__avatar">{{ authStore.user?.name?.slice(0, 1) ?? "?" }}</view>
      <view class="mine__info">
        <text class="mine__name">{{ authStore.user?.name ?? "未登录" }}</text>
        <text class="mine__sub">
          {{ authStore.user?.deptName ?? "" }} · {{ authStore.user?.username ?? "" }}
        </text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="mine__menu">
      <view class="mine__menu-item" @click="showPrivacy = true">
        <text>隐私政策</text>
        <text class="mine__menu-arrow">›</text>
      </view>
      <view class="mine__menu-item" @click="onUnbind">
        <text>解除微信绑定</text>
        <text class="mine__menu-arrow">›</text>
      </view>
      <view class="mine__menu-item" @click="onLogout">
        <text class="mine__menu-item--danger">退出登录</text>
        <text class="mine__menu-arrow">›</text>
      </view>
    </view>

    <!-- 版本号：Mock 模式连点 5 次开调试面板 -->
    <view class="mine__version" @click="onVersionTap">
      <text>{{ APP_VERSION_TEXT }}</text>
      <text v-if="USE_MOCK" class="mine__version-hint">（连点 5 次打开调试面板）</text>
    </view>

    <!-- 隐私政策弹层 -->
    <view v-if="showPrivacy" class="mine__modal" @click="showPrivacy = false">
      <view class="mine__modal-body" @click.stop>
        <text class="mine__modal-title">隐私政策</text>
        <scroll-view scroll-y class="mine__modal-content">
          <text class="mine__modal-text">
            1. 本小程序仅收集微信 openid 与登录态信息，用于账号绑定与免密登录。
            2. 不强制获取您的头像、昵称、手机号等信息。
            3. 审批单数据仅向当前登录人及其权限范围内的处理人展示。
            4. 本地仅存储登录 token 与临时票据，不包含 openid、session_key 或明文密码。
            5. 如对本政策有疑问，请联系管理员。
          </text>
        </scroll-view>
        <button class="mine__modal-btn" @click="showPrivacy = false">我知道了</button>
      </view>
    </view>

    <!-- 调试面板（仅 Mock） -->
    <view v-if="showDebug" class="mine__modal" @click="showDebug = false">
      <view class="mine__modal-body" @click.stop>
        <text class="mine__modal-title">Mock 调试面板</text>
        <scroll-view scroll-y class="mine__modal-content">
          <view class="debug-section">
            <text class="debug-section__title">一键登录结果（验收 1/2/5）</text>
            <view class="debug-section__chips">
              <text
                v-for="opt in (['success', 'need_bind', 'disabled', 'code_fail'] as WxLoginOutcome[])"
                :key="opt"
                class="chip"
                :class="{ 'chip--active': scenario.wxLoginOutcome === opt }"
                @click="selectWxOutcome(opt)"
              >{{ opt }}</text>
            </view>
          </view>

          <view class="debug-section">
            <text class="debug-section__title">密码错误剩余次数（验收 4）</text>
            <view class="debug-section__stepper">
              <text class="stepper-btn" @click="stepScenario('pwdFailRemaining', -1)">−</text>
              <text class="stepper-value">{{ scenario.pwdFailRemaining }}</text>
              <text class="stepper-btn" @click="stepScenario('pwdFailRemaining', 1)">＋</text>
            </view>
          </view>

          <view class="debug-section">
            <text class="debug-section__title">账号锁定剩余分钟（验收 4）</text>
            <view class="debug-section__stepper">
              <text class="stepper-btn" @click="stepScenario('accountLockedMinutes', -1)">−</text>
              <text class="stepper-value">{{ scenario.accountLockedMinutes }}</text>
              <text class="stepper-btn" @click="stepScenario('accountLockedMinutes', 1)">＋</text>
            </view>
          </view>

          <view class="debug-section">
            <text class="debug-section__title">场景开关</text>
            <view class="debug-switch" @click="toggleScenario('bindConflict')">
              <text>绑定冲突 1003（验收 6）</text>
              <text class="debug-switch__state">{{ scenario.bindConflict ? "开" : "关" }}</text>
            </view>
            <view class="debug-switch" @click="toggleScenario('force401Once')">
              <text>下次业务请求 401（验收 11）</text>
              <text class="debug-switch__state">{{ scenario.force401Once ? "开" : "关" }}</text>
            </view>
            <view class="debug-switch" @click="toggleScenario('detailForbidden')">
              <text>详情返回 403（验收 10）</text>
              <text class="debug-switch__state">{{ scenario.detailForbidden ? "开" : "关" }}</text>
            </view>
            <view class="debug-switch" @click="toggleScenario('networkError')">
              <text>网络异常（验收 12）</text>
              <text class="debug-switch__state">{{ scenario.networkError ? "开" : "关" }}</text>
            </view>
          </view>

          <view class="debug-section">
            <text class="debug-section__title">角标数（验收 7，-1 自动）</text>
            <view class="debug-section__stepper">
              <text class="stepper-btn" @click="stepScenario('badgeCount', -1)">−</text>
              <text class="stepper-value">{{ scenario.badgeCount }}</text>
              <text class="stepper-btn" @click="stepScenario('badgeCount', 1)">＋</text>
            </view>
          </view>
        </scroll-view>
        <view class="mine__modal-footer">
          <button class="mine__modal-btn mine__modal-btn--reset" @click="onResetScenario">重置场景</button>
          <button class="mine__modal-btn" @click="showDebug = false">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.mine {
  min-height: 100vh;
  background-color: $color-bg;

  &__nav {
    padding: calc(var(--status-bar-height, 20px) + 16rpx) 32rpx 16rpx;
    background-color: $color-white;

    &-title {
      font-size: $font-size-xl;
      font-weight: 600;
      color: $color-text;
    }
  }

  &__card {
    display: flex;
    align-items: center;
    margin: 24rpx;
    padding: 32rpx;
    border-radius: $radius-lg;
    background-color: $color-white;
  }

  &__avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background-color: $color-primary;
    color: $color-white;
    font-size: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
  }

  &__info {
    display: flex;
    flex-direction: column;
  }

  &__name {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text;
  }

  &__sub {
    margin-top: 8rpx;
    font-size: $font-size-sm;
    color: $color-text-placeholder;
  }

  &__menu {
    margin: 0 24rpx;
    border-radius: $radius-lg;
    background-color: $color-white;
    overflow: hidden;
  }

  &__menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    font-size: $font-size-base;
    color: $color-text;
    border-bottom: 2rpx solid $color-bg;

    &:last-child {
      border-bottom: none;
    }

    &--danger {
      color: $color-danger;
    }
  }

  &__menu-arrow {
    color: $color-text-placeholder;
    font-size: 36rpx;
  }

  &__version {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48rpx 0;
    color: $color-text-placeholder;
    font-size: $font-size-sm;

    &-hint {
      margin-top: 8rpx;
      font-size: 20rpx;
      opacity: 0.7;
    }
  }

  &__modal {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.45);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__modal-body {
    width: 80vw;
    max-height: 70vh;
    background-color: $color-white;
    border-radius: $radius-lg;
    display: flex;
    flex-direction: column;
    padding: 32rpx;
  }

  &__modal-title {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text;
    text-align: center;
    margin-bottom: 24rpx;
  }

  &__modal-content {
    flex: 1;
  }

  &__modal-text {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.8;
    white-space: pre-wrap;
  }

  &__modal-footer {
    display: flex;
    gap: 24rpx;
    margin-top: 24rpx;
  }

  &__modal-btn {
    flex: 1;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
    background-color: $color-primary;
    color: $color-white;
    font-size: $font-size-base;
    border: none;

    &--reset {
      background-color: $color-info-light;
      color: $color-text-secondary;
    }
  }
}

.debug-section {
  margin-bottom: 32rpx;

  &__title {
    display: block;
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text;
    margin-bottom: 16rpx;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
  }

  &__stepper {
    display: flex;
    align-items: center;
    gap: 24rpx;
  }
}

.chip {
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  background-color: $color-info-light;
  color: $color-text-secondary;
  font-size: $font-size-sm;

  &--active {
    background-color: $color-primary-light;
    color: $color-primary;
  }
}

.stepper-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: $color-info-light;
  color: $color-text;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.stepper-value {
  min-width: 80rpx;
  text-align: center;
  font-size: $font-size-lg;
  color: $color-text;
}

.debug-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  border-bottom: 2rpx solid $color-bg;

  &__state {
    color: $color-primary;
    font-weight: 500;
  }
}
</style>
