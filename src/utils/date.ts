/**
 * 日期工具：iOS 兼容处理 + 相对时间格式化。
 * 红线：iOS 无法解析 "2026-11-14 09:30" 格式，必须先将 "-" 替换为 "/"。
 */
import { OVERDUE_HOURS } from "./constants";

/**
 * 规范化后端时间字符串，兼容 iOS 解析。
 * @param dateStr 后端返回的时间字符串（YYYY-MM-DD HH:mm:ss）
 * @returns 可被所有端正确解析的时间字符串
 */
export function normalizeDateStr(dateStr: string): string {
  return dateStr.replace(/-/g, "/");
}

/** 解析后端时间字符串为 Date（先走 iOS 兼容处理） */
export function parseBackendTime(dateStr: string): Date {
  return new Date(normalizeDateStr(dateStr));
}

/** 两位补零 */
function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * 相对时间格式化：
 * 今天 → "今天 09:30"；昨天 → "昨天"；今年 → "11-05"；跨年 → "2025-11-05"。
 */
export function formatRelativeTime(dateStr: string, now: Date = new Date()): string {
  const date = parseBackendTime(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }
  const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isSameDay) {
    return `今天 ${hm}`;
  }
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) {
    return "昨天";
  }
  const md = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  if (date.getFullYear() === now.getFullYear()) {
    return md;
  }
  return `${date.getFullYear()}-${md}`;
}

/**
 * 判断提交时间是否超时未处理（>24h）。
 */
export function isOverdue(applyTime: string, now: Date = new Date()): boolean {
  const apply = parseBackendTime(applyTime);
  if (Number.isNaN(apply.getTime())) {
    return false;
  }
  return now.getTime() - apply.getTime() > OVERDUE_HOURS * 60 * 60 * 1000;
}

/**
 * 格式化文件大小（字节 → KB/MB）。
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 格式化为 YYYY-MM-DD（后端 dateFrom/dateTo 参数格式） */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 获取 n 天前的日期字符串（YYYY-MM-DD） */
export function getDateBefore(days: number, now: Date = new Date()): string {
  return formatDate(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
}
