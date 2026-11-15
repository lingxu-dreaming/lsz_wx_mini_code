/**
 * 认证类接口 Mock：/api/auth/*
 */
import { BizCode } from "@/types/api";
import type { ApiResponse } from "@/types/api";
import type {
  CurrentUser,
  PwdLockedData,
  PwdLoginReq,
  PwdLoginRes,
  PwdWrongData,
  TokenInfo,
  WxLoginReq,
  WxLoginRes,
} from "@/types/auth";
import { PWD_ERROR_LOCK_LIMIT } from "@/utils/constants";
import { scenario } from "../scenario";

const MOCK_USER: CurrentUser = {
  username: "zhangsan",
  name: "张三",
  deptName: "综合管理部",
};

let tokenSeq = 0;

/** 生成 mock token */
function makeToken(): TokenInfo {
  tokenSeq += 1;
  return { accessToken: `mock_access_${Date.now()}_${tokenSeq}`, expiresIn: 7200 };
}

/** wx/login：按场景开关返回不同结果 */
function handleWxLogin(data: WxLoginReq): ApiResponse<WxLoginRes> {
  void data;
  switch (scenario.wxLoginOutcome) {
    case "need_bind":
      return {
        code: BizCode.NEED_BIND,
        msg: "该微信尚未绑定账号，请先登录",
        data: { needBind: true, bindTicket: `mock_ticket_${Date.now()}` },
        traceId: makeTraceId(),
      };
    case "disabled":
      return {
        code: BizCode.USER_DISABLED,
        msg: "账号已停用，请联系管理员",
        data: {} as WxLoginRes,
        traceId: makeTraceId(),
      };
    case "code_fail":
      // code2Session 失败：降级账号密码页，由 banner 提示具体原因
      return {
        code: BizCode.NEED_BIND,
        msg: "微信登录未成功，请使用账号密码登录",
        data: {} as WxLoginRes,
        traceId: makeTraceId(),
      };
    default:
      return {
        code: BizCode.OK,
        msg: "ok",
        data: { needBind: false, token: makeToken(), user: MOCK_USER },
        traceId: makeTraceId(),
      };
  }
}

/** login：密码错误计数 / 锁定 / 绑定冲突 / 成功 */
function handlePwdLogin(data: PwdLoginReq): ApiResponse<PwdLoginRes | PwdWrongData | PwdLockedData> {
  if (scenario.accountLockedMinutes > 0) {
    return {
      code: BizCode.PWD_LOCKED,
      msg: "已锁定，请稍后再试",
      data: { lockMinutes: scenario.accountLockedMinutes },
      traceId: makeTraceId(),
    };
  }
  if (scenario.pwdFailRemaining > 0) {
    scenario.pwdFailRemaining -= 1;
    return {
      code: BizCode.PWD_WRONG,
      msg: "账号或密码错误",
      data: { remaining: scenario.pwdFailRemaining },
      traceId: makeTraceId(),
    };
  }
  if (scenario.bindConflict && data.bindTicket) {
    return {
      code: BizCode.BIND_CONFLICT,
      msg: "该账号已绑定其他微信，请先解绑",
      data: {} as PwdLoginRes,
      traceId: makeTraceId(),
    };
  }
  // 登录成功：复位错误计数
  scenario.pwdFailRemaining = 0;
  return {
    code: BizCode.OK,
    msg: "ok",
    data: { token: makeToken(), user: MOCK_USER, bound: Boolean(data.bindTicket) },
    traceId: makeTraceId(),
  };
}

/** 统一 traceId（开发期可回溯） */
function makeTraceId(): string {
  return `mock-${Date.now()}`;
}

/** 按 url 分发 auth 请求 */
export function dispatchAuth(url: string, data: unknown): ApiResponse<unknown> {
  switch (url) {
    case "/api/auth/wx/login":
      return handleWxLogin(data as WxLoginReq) as ApiResponse<unknown>;
    case "/api/auth/login":
      return handlePwdLogin(data as PwdLoginReq) as ApiResponse<unknown>;
    case "/api/auth/unbind":
    case "/api/auth/logout":
      return { code: BizCode.OK, msg: "ok", data: {}, traceId: makeTraceId() };
    case "/api/auth/refresh":
      return {
        code: BizCode.OK,
        msg: "ok",
        data: makeToken(),
        traceId: makeTraceId(),
      };
    default:
      return { code: 404, msg: `mock: unknown auth url ${url}`, data: {}, traceId: makeTraceId() };
  }
}

/** 供调试面板展示的错误次数上限 */
export function getPwdLockLimit(): number {
  return PWD_ERROR_LOCK_LIMIT;
}
