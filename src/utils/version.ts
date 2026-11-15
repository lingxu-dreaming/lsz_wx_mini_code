/**
 * 版本比较工具。
 */

/**
 * 比较两个语义化版本号。
 * @returns a > b → 1；a < b → -1；相等 → 0
 */
export function compareVersion(a: string, b: string): number {
  const pa = a.split(".");
  const pb = b.split(".");
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const na = Number(pa[i] ?? 0);
    const nb = Number(pb[i] ?? 0);
    if (na > nb) {
      return 1;
    }
    if (na < nb) {
      return -1;
    }
  }
  return 0;
}
