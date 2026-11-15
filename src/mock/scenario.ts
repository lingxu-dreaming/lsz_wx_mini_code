/**
 * Mock 场景开关：联调/验收演示用。
 * 在「我的」页连点版本号 5 次打开调试面板即可可视化切换。
 * 仅 VITE_USE_MOCK=true 时生效。
 */
import { reactive } from "vue";

/** 微信一键登录预置结果 */
export type WxLoginOutcome = "success" | "need_bind" | "disabled" | "code_fail";

/** Mock 场景状态 */
export interface MockScenario {
  /** 一键登录结果（默认 success：已绑定免密进入） */
  wxLoginOutcome: WxLoginOutcome;
  /** 密码错误剩余次数（>0 时下次密码登录返回 1004 并减 1；0 表示密码正确） */
  pwdFailRemaining: number;
  /** 账号锁定剩余分钟数（>0 时密码登录直接返回 1005） */
  accountLockedMinutes: number;
  /** 是否模拟绑定冲突（1003） */
  bindConflict: boolean;
  /** 下一个业务请求返回 401（触发无感续期重放演示，随后自动复位） */
  force401Once: boolean;
  /** 详情接口返回 403（越权演示） */
  detailForbidden: boolean;
  /** 网络异常（请求直接失败，演示重试与错误态） */
  networkError: boolean;
  /** 角标数（-1 表示自动取待办列表总数） */
  badgeCount: number;
}

const defaults: MockScenario = {
  wxLoginOutcome: "success",
  pwdFailRemaining: 0,
  accountLockedMinutes: 0,
  bindConflict: false,
  force401Once: false,
  detailForbidden: false,
  networkError: false,
  badgeCount: -1,
};

/** 响应式场景状态 */
export const scenario = reactive<MockScenario>({ ...defaults });

/** 重置全部场景为默认 */
export function resetScenario(): void {
  Object.assign(scenario, defaults);
}
