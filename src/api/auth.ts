/**
 * 认证接口：对应需求文档第 7 章接口 1~5。
 */
import type {
  PwdLoginReq,
  PwdLoginRes,
  TokenInfo,
  WxLoginReq,
  WxLoginRes,
} from "@/types/auth";
import { request } from "@/utils/request";

/**
 * 微信一键登录：code 换登录态 / 返回 NEED_BIND。
 */
export function wxLogin(code: string): Promise<WxLoginRes> {
  const data: WxLoginReq = { code };
  return request<WxLoginRes, WxLoginReq>({
    url: "/api/auth/wx/login",
    method: "POST",
    data,
    auth: false,
    replayable: false,
  });
}

/**
 * 账号密码登录（可携带 bindTicket 完成自动绑定）。
 */
export function pwdLogin(data: PwdLoginReq): Promise<PwdLoginRes> {
  return request<PwdLoginRes, PwdLoginReq>({
    url: "/api/auth/login",
    method: "POST",
    data,
    auth: false,
    replayable: false,
  });
}

/**
 * 解除当前微信与账号的绑定。
 */
export function unbindWx(): Promise<void> {
  return request<void>({ url: "/api/auth/unbind", method: "POST" });
}

/**
 * 刷新 access token。
 */
export function refreshToken(): Promise<TokenInfo> {
  return request<TokenInfo>({ url: "/api/auth/refresh", method: "POST" });
}

/**
 * 退出登录（服务端作废 refresh token）。
 */
export function logoutApi(): Promise<void> {
  return request<void>({ url: "/api/auth/logout", method: "POST" });
}
