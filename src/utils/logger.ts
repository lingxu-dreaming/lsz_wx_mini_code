/**
 * 脱敏日志工具：严禁打印 token、密码、wx.login 原始 code。
 */
const SENSITIVE_KEY_PATTERN = /(token|password|code)/i;

/** 将字符串中的敏感值替换为 ***（粗略防泄，关键靠调用方不传敏感值） */
function maskValue(key: string, value: unknown): unknown {
  if (typeof value === "string" && SENSITIVE_KEY_PATTERN.test(key)) {
    return "***";
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const k of Object.keys(record)) {
      result[k] = maskValue(k, record[k]);
    }
    return result;
  }
  return value;
}

/**
 * 安全日志：自动对 key 含 token/password/code 的字段脱敏。
 */
export function safeLog(label: string, payload?: unknown): void {
  if (payload === undefined) {
    console.log(`[app] ${label}`);
    return;
  }
  console.log(`[app] ${label}`, maskValue("", payload));
}

/**
 * 安全错误日志。
 */
export function safeError(label: string, payload?: unknown): void {
  if (payload === undefined) {
    console.error(`[app:error] ${label}`);
    return;
  }
  console.error(`[app:error] ${label}`, maskValue("", payload));
}
