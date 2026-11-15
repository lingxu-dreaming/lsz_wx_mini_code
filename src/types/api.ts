/**
 * 接口层通用类型：统一响应结构、分页结构、业务码。
 * 见需求文档第 7 章「接口清单」与「统一响应」。
 */

/** 后端统一响应结构 */
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
  traceId: string;
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

/**
 * 业务码枚举。
 * 401 与 1001~1005 由请求拦截器统一处理或上抛，其余为服务端自定义。
 */
export enum BizCode {
  /** 成功 */
  OK = 0,
  /** 登录态失效（HTTP 401 或业务 401） */
  UNAUTHORIZED = 401,
  /** 需绑定（NEED_BIND），data 中可能携带 bindTicket */
  NEED_BIND = 1001,
  /** 账号已停用 */
  USER_DISABLED = 1002,
  /** 绑定冲突（该账号已绑定其他微信） */
  BIND_CONFLICT = 1003,
  /** 账号或密码错误，data 中携带剩余次数 */
  PWD_WRONG = 1004,
  /** 连续错误已锁定 */
  PWD_LOCKED = 1005,
}

/** 业务错误（code !== 0 时由请求层抛出，页面按 code 捕获处理） */
export class BizError extends Error {
  readonly code: number;
  readonly traceId: string;
  /** 错误响应附带数据（如 1004 剩余次数、1005 锁定分钟） */
  readonly data: unknown;

  constructor(code: number, msg: string, traceId = "", data: unknown = null) {
    super(msg);
    this.code = code;
    this.traceId = traceId;
    this.data = data;
  }
}
