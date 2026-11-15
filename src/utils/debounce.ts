/**
 * 防抖工具：搜索输入统一 300ms 防抖。
 */

/**
 * 创建防抖函数。
 * @param fn 目标函数
 * @param wait 等待毫秒数（默认 300）
 * @returns 防抖包装函数（返回取消函数）
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait = 300,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
}
