/**
 * 字典接口 Mock：/api/dict/*
 */
import { BizCode } from "@/types/api";
import type { ApiResponse } from "@/types/api";
import type { BizTypeOption } from "@/types/dict";
import { BIZ_TYPES } from "../generator";

function makeTraceId(): string {
  return `mock-${Date.now()}`;
}

/** GET /api/dict/biz-type */
export function dispatchDict(url: string): ApiResponse<unknown> {
  if (url === "/api/dict/biz-type") {
    const list: BizTypeOption[] = BIZ_TYPES.map((b) => ({ ...b }));
    return { code: BizCode.OK, msg: "ok", data: list, traceId: makeTraceId() };
  }
  return { code: 404, msg: `mock: unknown dict url ${url}`, data: {}, traceId: makeTraceId() };
}
