/**
 * TabBar 角标同步：待处置 Tab 显示未读数（跨端统一走原生 tabBar 接口）。
 * 在非 tabBar 页面调用会失败，统一静默处理。
 */

/** 待处置 Tab 下标（与 pages.json tabBar.list 顺序一致） */
const PENDING_TAB_INDEX = 0;

/**
 * 同步未读角标到 TabBar。
 * @param count 未读数；<= 0 时移除角标
 */
export function syncTabBarBadge(count: number): void {
  if (count > 0) {
    uni.setTabBarBadge({
      index: PENDING_TAB_INDEX,
      text: count > 99 ? "99+" : String(count),
      fail: () => undefined,
    });
    return;
  }
  uni.removeTabBarBadge({ index: PENDING_TAB_INDEX, fail: () => undefined });
}
