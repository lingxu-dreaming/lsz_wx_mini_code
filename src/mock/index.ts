/**
 * Mock 分发器：按 url 路由到对应 handler，模拟网络延迟与异常场景。
 * 仅当 VITE_USE_MOCK=true 时由请求层接入；真实后端联调时此模块零路径。
 */
import { BizCode } from "@/types/api";
import type { ApiResponse } from "@/types/api";
import type { RequestOptions } from "@/utils/request";
import { MOCK_DELAY_MAX, MOCK_DELAY_MIN } from "@/utils/constants";
import { scenario } from "./scenario";
import { dispatchAuth } from "./handlers/auth";
import { dispatchApproval } from "./handlers/approval";
import { dispatchDict } from "./handlers/dict";

/** 判断该 url 是否可走 Mock */
export function isMockable(url: string): boolean {
  return url.startsWith("/api/");
}

/** 随机延迟，模拟真实网络 */
function randomDelay(): Promise<void> {
  const ms = MOCK_DELAY_MIN + Math.floor(Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 路由到具体 handler */
function route(url: string, data: unknown): ApiResponse<unknown> {
  if (url.startsWith("/api/auth/")) {
    return dispatchAuth(url, data);
  }
  if (url.startsWith("/api/approval")) {
    return dispatchApproval(url, data);
  }
  if (url.startsWith("/api/dict/")) {
    return dispatchDict(url);
  }
  return { code: 404, msg: `mock: unknown url ${url}`, data: {}, traceId: `mock-${Date.now()}` };
}

/**
 * Mock 请求入口：返回与真实后端一致的 ApiResponse 结构。
 * @throws 模拟网络异常时 reject（走真实请求的网络失败分支）
 */
export async function mockDispatch<T, D>(options: RequestOptions<D>): Promise<ApiResponse<T>> {
  await randomDelay();
  if (scenario.networkError) {
    throw new Error("mock network error");
  }
  // force401Once 只对业务接口生效，且消费后自动复位
  if (scenario.force401Once && !options.url.startsWith("/api/auth/")) {
    scenario.force401Once = false;
    return {
      code: BizCode.UNAUTHORIZED,
      msg: "登录态已过期",
      data: {} as T,
      traceId: `mock-${Date.now()}`,
    };
  }
  return route(options.url, options.data) as ApiResponse<T>;
}
