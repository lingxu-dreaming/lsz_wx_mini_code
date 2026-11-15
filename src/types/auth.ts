/**
 * 登录/鉴权相关类型。
 * 安全红线：前端严禁持有或传递 userId / openid / session_key。
 */

/** 登录票据（JWT） */
export interface TokenInfo {
  accessToken: string;
  /** 有效期（秒） */
  expiresIn: number;
}

/** 当前登录人信息（不含 userId） */
export interface CurrentUser {
  username: string;
  name: string;
  deptName: string;
}

/** 微信一键登录请求 */
export interface WxLoginReq {
  code: string;
}

/** 已绑定：直接返回登录态 */
export interface WxLoginSuccess {
  needBind: false;
  token: TokenInfo;
  user: CurrentUser;
}

/** 未绑定：返回一次性绑定票据（5 分钟有效） */
export interface NeedBind {
  needBind: true;
  bindTicket: string;
}

/** 微信一键登录响应（判别联合） */
export type WxLoginRes = WxLoginSuccess | NeedBind;

/** 账号密码登录请求（password 为加密后的密文） */
export interface PwdLoginReq {
  username: string;
  password: string;
  /** 首次绑定时由 wx/login 下发的一次性票据 */
  bindTicket?: string;
}

/** 账号密码登录响应 */
export interface PwdLoginRes {
  token: TokenInfo;
  user: CurrentUser;
  /** 本次登录是否同时完成了微信绑定 */
  bound: boolean;
}

/** 密码错误（1004）data：剩余可尝试次数 */
export interface PwdWrongData {
  remaining: number;
}

/** 密码锁定（1005）data：剩余锁定分钟数 */
export interface PwdLockedData {
  lockMinutes: number;
}

/** 登录页顶部横幅原因 */
export type LoginReason = "need_bind" | "wx_fail" | "disabled" | "";
