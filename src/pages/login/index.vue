<script setup lang="ts">
/**
 * 登录绑定页：账号密码登录 + 首次自动绑定微信。
 * 顶部横幅展示进入本页的原因（未绑定/微信登录失败/账号停用）。
 */
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useAuthStore } from "@/store/auth";
import { BizCode, BizError } from "@/types/api";
import type { LoginReason, PwdLockedData, PwdWrongData } from "@/types/auth";
import {
  BIND_TICKET_KEY,
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
  USERNAME_MAX_LEN,
  USERNAME_MIN_LEN,
} from "@/utils/constants";
import { track } from "@/utils/track";

const authStore = useAuthStore();

/** 顶部横幅 */
const reason = ref<LoginReason>("");
const bannerText = ref("");

/** 表单 */
const username = ref("");
const password = ref("");
const showPassword = ref(false);
const submitting = ref(false);
const errorText = ref("");

/** 绑定票据（query 或本地存储） */
let bindTicket = "";

/** 表单是否可提交 */
const canSubmit = computed(() => {
  const name = username.value.trim();
  return (
    name.length >= USERNAME_MIN_LEN &&
    name.length <= USERNAME_MAX_LEN &&
    password.value.length >= PASSWORD_MIN_LEN &&
    password.value.length <= PASSWORD_MAX_LEN &&
    !submitting.value
  );
});

/** 根据 reason 渲染横幅文案 */
function resolveBanner(r: LoginReason, msg: string): void {
  reason.value = r;
  if (r === "need_bind") {
    bannerText.value = "该微信尚未绑定账号，请先登录（首次使用需绑定微信，绑定后下次可直接进入）";
    return;
  }
  if (r === "disabled") {
    bannerText.value = msg !== "" ? msg : "账号已停用，请联系管理员";
    return;
  }
  if (r === "wx_fail") {
    bannerText.value = msg !== "" ? msg : "微信登录未成功，请使用账号密码登录";
    return;
  }
  bannerText.value = "";
}

onLoad((query) => {
  const q = (query ?? {}) as Record<string, string | undefined>;
  resolveBanner((q.reason ?? "") as LoginReason, decodeURIComponent(q.msg ?? ""));
  bindTicket = q.ticket ?? (uni.getStorageSync(BIND_TICKET_KEY) as string) ?? "";
});

/** 处理业务错误（1004 剩余次数 / 1005 锁定 / 1001 票据过期重取） */
function handleBizError(err: unknown): void {
  if (!(err instanceof BizError)) {
    errorText.value = "网络不给力，请重试";
    return;
  }
  if (err.code === BizCode.PWD_WRONG) {
    const data = err.data as PwdWrongData | null;
    const remaining = data?.remaining ?? 0;
    errorText.value = `账号或密码错误，还可尝试 ${remaining} 次`;
    track("login_pwd_fail", { remaining });
    return;
  }
  if (err.code === BizCode.PWD_LOCKED) {
    const data = err.data as PwdLockedData | null;
    errorText.value = `已锁定，${data?.lockMinutes ?? 15} 分钟后重试`;
    return;
  }
  if (err.code === BizCode.NEED_BIND) {
    // bindTicket 过期：读取请求层重新换取并暂存的新票据，提示用户重试
    bindTicket = (uni.getStorageSync(BIND_TICKET_KEY) as string) ?? "";
    errorText.value = "登录状态已刷新，请再次点击登录";
    return;
  }
  errorText.value = err.message;
}

/** 提交登录 */
async function onSubmit(): Promise<void> {
  if (!canSubmit.value) {
    return;
  }
  submitting.value = true;
  errorText.value = "";
  try {
    const bound = await authStore.pwdLogin(username.value.trim(), password.value, bindTicket);
    if (bound) {
      uni.showToast({ title: "绑定成功", icon: "success" });
    }
    uni.reLaunch({ url: "/pages/pending/index" });
  } catch (err) {
    handleBizError(err);
    submitting.value = false;
  }
}

/** 忘记密码 */
function onForgot(): void {
  uni.showToast({ title: "请在 PC 端重置密码", icon: "none" });
}
</script>

<template>
  <view class="login">
    <view class="login__header">
      <view class="login__logo">审</view>
      <view class="login__title">审批中心</view>
    </view>

    <view v-if="bannerText" class="login__banner">{{ bannerText }}</view>

    <view class="login__form">
      <view class="field">
        <text class="field__label">账号</text>
        <input
          v-model="username"
          class="field__input"
          placeholder="工号或手机号"
          :maxlength="USERNAME_MAX_LEN"
          placeholder-class="field__placeholder"
        />
      </view>
      <view class="field">
        <text class="field__label">密码</text>
        <input
          v-model="password"
          class="field__input"
          :password="!showPassword"
          placeholder="请输入密码"
          :maxlength="PASSWORD_MAX_LEN"
          placeholder-class="field__placeholder"
        />
        <text class="field__eye" @click="showPassword = !showPassword">
          {{ showPassword ? "隐藏" : "显示" }}
        </text>
      </view>

      <view v-if="errorText" class="login__error">{{ errorText }}</view>

      <button
        class="login__submit"
        :class="{ 'login__submit--disabled': !canSubmit }"
        :disabled="!canSubmit"
        :loading="submitting"
        @click="onSubmit"
      >
        {{ submitting ? "登录中…" : "登录" }}
      </button>

      <view class="login__forgot" @click="onForgot">忘记密码？请在 PC 端重置</view>
    </view>
  </view>
</template>

<style lang="scss">
.login {
  min-height: 100vh;
  padding: 120rpx 48rpx 48rpx;
  background-color: $color-white;
  box-sizing: border-box;

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 48rpx;
  }

  &__logo {
    width: 120rpx;
    height: 120rpx;
    border-radius: 28rpx;
    background-color: $color-primary;
    color: $color-white;
    font-size: 56rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    margin-top: 24rpx;
    font-size: $font-size-xl;
    font-weight: 600;
    color: $color-text;
  }

  &__banner {
    padding: 20rpx 24rpx;
    border-radius: $radius-md;
    background-color: $color-warning-light;
    color: $color-warning;
    font-size: $font-size-sm;
    line-height: 1.5;
    margin-bottom: 32rpx;
  }

  &__form {
    display: flex;
    flex-direction: column;
  }

  &__error {
    margin-top: 16rpx;
    color: $color-danger;
    font-size: $font-size-sm;
  }

  &__submit {
    margin-top: 48rpx;
    height: 96rpx;
    line-height: 96rpx;
    border-radius: 48rpx;
    background-color: $color-primary;
    color: $color-white;
    font-size: $font-size-lg;

    &--disabled {
      background-color: $color-border;
      color: $color-white;
    }
  }

  &__forgot {
    margin-top: 32rpx;
    text-align: center;
    color: $color-text-placeholder;
    font-size: $font-size-sm;
  }
}

.field {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 2rpx solid $color-border;

  &__label {
    width: 100rpx;
    color: $color-text;
    font-size: $font-size-base;
  }

  &__input {
    flex: 1;
    font-size: $font-size-base;
    color: $color-text;
  }

  &__placeholder {
    color: $color-text-placeholder;
  }

  &__eye {
    padding: 8rpx 0 8rpx 24rpx;
    color: $color-text-placeholder;
    font-size: $font-size-sm;
  }
}
</style>
