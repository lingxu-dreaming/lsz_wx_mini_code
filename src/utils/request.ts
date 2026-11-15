/**
 * 网络请求封装：统一超时/重试/鉴权头/业务码拦截/401 无感续期。
 *
 * 行为约定（见需求文档 F1-3、F1-5 与 CLAUDE.md 第 4 章）：
 * - code === 0：返回 data；
 * - code === 401：清理本地 token，单飞静默重登（wx.login → /auth/wx/login），
 *   成功后仅重放 GET 只读请求 1 次；失败跳转登录页且不弹重复错误；
 * - code === 1001：暂存 bindTicket 并跳转登录绑定页；
 * - code === 1002/1003：阻断弹窗提示；
 * - 其余业务码：抛 BizError 交由页面处理（如 1004/1005/403）。
 */
import { BASE_URL, USE_MOCK } from "@/config";
import { BizCode, BizError } from "@/types/api";
import type { ApiResponse } from "@/types/api";
import { BIND_TICKET_KEY, REQUEST_TIMEOUT, RETRY_TIMES } from "./constants";
import { clearToken, getToken } from "./token";
import { safeError, safeLog } from "./logger";
import { mockDispatch, isMockable } from "@/mock";

/** 请求方法 */
export type HttpMethod = "GET" | "POST";

/** 请求配置 */
export interface RequestOptions<D = unknown> {
  url: string;
  method?: HttpMethod;
  data?: D;
  /** 是否携带 Authorization（默认 true；登录类接口为 false） */
  auth?: boolean;
  /** 401 后是否允许重放（默认 true；/auth/* 永不重放） */
  replayable?: boolean;
}

/** 静默登录提供者（由 main.ts 注入 authStore，避免循环依赖） */
type SilentLoginProvider = () => Promise<boolean>;

let silentLoginProvider: SilentLoginProvider | null = null;
/** 401 单飞锁：并发 401 只执行一次静默重登 */
let refreshing: Promise<boolean> | null = null;
/** 跳转登录页去重锁：防止并发请求重复 redirectTo / 重复弹错 */
let isRedirecting = false;

/** 注入静默登录提供者（返回 true 表示换新 token 成功） */
export function registerSilentLogin(provider: SilentLoginProvider): void {
  silentLoginProvider = provider;
}

/** 当前请求是否携带 token */
function resolveAuth(options: RequestOptions): boolean {
  if (options.auth === false) {
    return false;
  }
  return getToken() !== "";
}

/** 构建请求头 */
function buildHeader(options: RequestOptions): Record<string, string> {
  const header: Record<string, string> = { "content-type": "application/json" };
  if (resolveAuth(options)) {
    header.Authorization = `Bearer ${getToken()}`;
  }
  return header;
}

/**
 * 发起一次真实网络请求（不做重试与剥壳，由上层编排）。
 */
function rawRequest<T, D>(options: RequestOptions<D>): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method ?? "GET",
      data: options.data as unknown as Record<string, unknown> | undefined,
      header: buildHeader(options),
      timeout: REQUEST_TIMEOUT,
      success: (res) => resolve(res.data as ApiResponse<T>),
      fail: (err) => reject(err),
    });
  });
}

/** 网络层失败重试 1 次 */
async function requestWithRetry<T, D>(options: RequestOptions<D>): Promise<ApiResponse<T>> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= RETRY_TIMES; attempt += 1) {
    try {
      return await rawRequest<T, D>(options);
    } catch (err) {
      lastError = err;
      safeLog("network retry", { url: options.url, attempt: attempt + 1 });
    }
  }
  throw lastError;
}

/** 单飞执行静默登录（模块级锁） */
function doSilentLogin(): Promise<boolean> {
  if (refreshing !== null) {
    return refreshing;
  }
  refreshing = (async () => {
    clearToken();
    if (silentLoginProvider === null) {
      return false;
    }
    try {
      return await silentLoginProvider();
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** 跳转登录页（去重 + 携带原因与票据） */
function redirectToLogin(reason: string, ticket = "", msg = ""): void {
  if (isRedirecting) {
    return;
  }
  isRedirecting = true;
  const query = `reason=${reason}&ticket=${encodeURIComponent(ticket)}&msg=${encodeURIComponent(msg)}`;
  uni.redirectTo({
    url: `/pages/login/index?${query}`,
    complete: () => {
      isRedirecting = false;
    },
  });
}

/** 处理 401：静默重登 + 重放一次（仅 GET） */
async function handleUnauthorized<T, D>(options: RequestOptions<D>): Promise<T> {
  const ok = await doSilentLogin();
  if (ok && (options.method ?? "GET") === "GET" && options.replayable !== false) {
    safeLog("401 replay", { url: options.url });
    // 重放响应若仍为 401，unwrapResponse 直接抛 BizError，不再二次重放
    return unwrapResponse<T>(await requestWithRetry<T, D>(options));
  }
  redirectToLogin("need_bind");
  throw new BizError(BizCode.UNAUTHORIZED, "登录态已失效");
}

/** 处理 1001：暂存 bindTicket 并跳登录绑定页 */
function handleNeedBind(msg: string, data: unknown): never {
  const ticket = (data as { bindTicket?: string } | null)?.bindTicket ?? "";
  if (ticket !== "") {
    uni.setStorageSync(BIND_TICKET_KEY, ticket);
  }
  redirectToLogin("need_bind", ticket, msg);
  throw new BizError(BizCode.NEED_BIND, msg);
}

/** 剥壳统一响应：按业务码分发（401 不在此处理，由 dispatchByCode 先行拦截） */
function unwrapResponse<T>(res: ApiResponse<T>): T {
  if (res.code === BizCode.OK) {
    return res.data;
  }
  if (res.code === BizCode.NEED_BIND) {
    handleNeedBind(res.msg, res.data);
  }
  if (res.code === BizCode.USER_DISABLED || res.code === BizCode.BIND_CONFLICT) {
    // 交由页面处理：登录页/启动页以横幅形式阻断提示，避免拦截器与页面重复跳转
    throw new BizError(res.code, res.msg, res.traceId, res.data);
  }
  throw new BizError(res.code, res.msg, res.traceId, res.data);
}

/**
 * 业务请求入口：返回剥壳后的 data。
 */
export async function request<T, D = unknown>(options: RequestOptions<D>): Promise<T> {
  if (USE_MOCK && isMockable(options.url)) {
    const res = await mockDispatch<T, D>(options);
    return dispatchByCode(res, options);
  }
  const res = await requestWithRetry<T, D>(options);
  return dispatchByCode(res, options);
}

/** 按业务码分发（401 进入单飞重放流程） */
async function dispatchByCode<T, D>(res: ApiResponse<T>, options: RequestOptions<D>): Promise<T> {
  if (res.code === BizCode.UNAUTHORIZED) {
    return handleUnauthorized<T, D>(options);
  }
  return unwrapResponse<T>(res);
}

/** 兜底：未被捕获的异常统一走安全日志 */
export function reportUnexpected(err: unknown, scene: string): void {
  safeError(scene, err instanceof Error ? err.message : String(err));
}
