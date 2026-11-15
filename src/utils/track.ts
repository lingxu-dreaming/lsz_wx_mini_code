/**
 * 埋点上报：类型化事件参数（见需求文档第 9 章）。
 * Mock / 开发期输出到控制台；生产环境替换 REPORT_URL 为真实埋点服务。
 */
import type { TrackEvent, TrackParamsMap } from "@/types/track";
import { safeLog } from "./logger";

/** 埋点上报地址（占位） */
const REPORT_URL = "";

/**
 * 上报埋点事件。
 */
export function track<E extends TrackEvent>(event: E, params: TrackParamsMap[E]): void {
  if (REPORT_URL === "") {
    safeLog("track", { event, ...params });
    return;
  }
  uni.request({
    url: REPORT_URL,
    method: "POST",
    data: { event, params, ts: Date.now() },
    header: { "content-type": "application/json" },
  });
}
