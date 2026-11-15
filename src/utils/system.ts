/**
 * 系统信息工具：跨端安全读取窗口信息。
 */

/** 状态栏高度 CSS 兜底值（px，与各页 CSS 中 var() 的 fallback 保持一致） */
const STATUS_BAR_HEIGHT_FALLBACK_PX = 20;

/**
 * 读取真实状态栏高度，输出为 CSS 自定义属性值。
 * 背景真机（mp-weixin）上 uni-app 注入的 --status-bar-height 为固定值，
 * 全面屏（灵动岛机型）真实状态栏约 54~59px，自定义导航必须动态注入。
 * @returns 如 "54px"；读取失败时返回兜底值 "20px"
 */
export function getStatusbarHeightCss(): string {
  try {
    const height = uni.getWindowInfo().statusBarHeight;
    if (height !== undefined && height > 0) {
      return `${height}px`;
    }
  } catch {
    /* 非小程序端或读取失败：降级到兜底值 */
  }
  return `${STATUS_BAR_HEIGHT_FALLBACK_PX}px`;
}
