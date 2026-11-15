/**
 * 埋点事件类型（见需求文档第 9 章）。
 */

/** 埋点事件名 */
export type TrackEvent =
  | "wx_login_result"
  | "bind_result"
  | "login_pwd_fail"
  | "pending_list_view"
  | "detail_view";

/** 各事件参数映射（严格类型，禁止 any） */
export interface TrackParamsMap {
  wx_login_result: {
    result: "success" | "need_bind" | "fail";
    errcode?: string;
  };
  bind_result: {
    result: "success" | "fail";
    duration: number;
  };
  login_pwd_fail: {
    remaining: number;
  };
  pending_list_view: {
    count: number;
    duration: number;
  };
  detail_view: {
    orderId: string;
    from: "pending" | "history";
  };
}
