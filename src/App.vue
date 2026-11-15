<script setup lang="ts">
/**
 * 应用入口：onShow 轻校验登录态（不刷新页面数据，避免打断阅读）。
 */
import { onShow, onLaunch } from "@dcloudio/uni-app";
import { useAuthStore } from "@/store/auth";
import { hasToken } from "@/utils/token";
import { safeLog } from "@/utils/logger";

const authStore = useAuthStore();

function checkSession(): Promise<void> {
  return new Promise((resolve) => {
    uni.checkSession({
      success: () => resolve(),
      fail: () => resolve(),
    });
  });
}

onLaunch(() => {
  safeLog("app launch");
});

onShow(async () => {
  // 文档 F1-3：切前台校验一次登录态，不刷新页面数据
  if (!hasToken()) {
    return;
  }
  await checkSession();
  // session 失效时静默换新 token（silentLogin 内部处理），不打断当前页面
  if (!authStore.isLoggedIn) {
    await authStore.silentLogin();
  }
});
</script>

<style lang="scss">
/* 全局基础样式 */
page {
  background-color: #f5f6f8;
  font-size: 28rpx;
  color: #1f2329;
  font-family: -apple-system, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
}
</style>
