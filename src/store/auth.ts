/**
 * 认证状态机：静默登录、账号密码登录、退出/解绑。
 */
import { defineStore } from "pinia";
import { BizCode, BizError } from "@/types/api";
import type { CurrentUser, LoginReason } from "@/types/auth";
import * as authApi from "@/api/auth";
import { clearToken, setToken } from "@/utils/token";
import { getPasswordCipher } from "@/utils/crypto";
import { track } from "@/utils/track";
import { BIND_TICKET_KEY } from "@/utils/constants";
import { safeError } from "@/utils/logger";

/** 登录状态 */
export type AuthStatus = "unknown" | "guest" | "bound";

/** 静默登录结果（由启动页决定跳转目标） */
export type SilentLoginOutcome =
  | { type: "home" }
  | { type: "login"; reason: LoginReason; message?: string; ticket?: string };

/** uni.login 包装：获取一次性 code */
function wxLoginCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: "weixin",
      success: (res) => {
        if (res.code) {
          resolve(res.code);
        } else {
          reject(new Error("wx.login 未返回 code"));
        }
      },
      fail: reject,
    });
  });
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as CurrentUser | null,
    status: "unknown" as AuthStatus,
  }),
  getters: {
    isLoggedIn: (state) => state.status === "bound",
  },
  actions: {
    /**
     * 微信一键登录（静默）：命中绑定直进首页，未命中跳登录绑定页。
     * 全程不弹授权框；失败降级账号密码页并携带原因。
     */
    async silentLogin(): Promise<SilentLoginOutcome> {
      try {
        const code = await wxLoginCode();
        const res = await authApi.wxLogin(code);
        if (res.needBind) {
          track("wx_login_result", { result: "need_bind" });
          return { type: "login", reason: "need_bind", ticket: res.bindTicket };
        }
        this.applyLogin(res.token.accessToken, res.user);
        track("wx_login_result", { result: "success" });
        return { type: "home" };
      } catch (err) {
        track("wx_login_result", { result: "fail" });
        if (err instanceof BizError && err.code === BizCode.USER_DISABLED) {
          return { type: "login", reason: "disabled", message: err.message };
        }
        safeError("silentLogin", err);
        return { type: "login", reason: "wx_fail", message: "微信登录未成功，请使用账号密码登录" };
      }
    },

    /**
     * 账号密码登录：提交前加密密码；可携带 bindTicket 自动绑定。
     * 1004/1005 等 BizError 上抛由登录页处理。
     */
    async pwdLogin(username: string, plainPassword: string, bindTicket?: string): Promise<boolean> {
      const start = Date.now();
      const password = getPasswordCipher().encrypt(plainPassword);
      try {
        const res = await authApi.pwdLogin({ username, password, bindTicket });
        this.applyLogin(res.token.accessToken, res.user);
        track("bind_result", { result: "success", duration: Date.now() - start });
        return res.bound;
      } catch (err) {
        track("bind_result", { result: "fail", duration: Date.now() - start });
        throw err;
      }
    },

    /**
     * 退出登录：清本地 token（服务端作废失败不阻塞）。
     */
    async logout(): Promise<void> {
      try {
        await authApi.logoutApi();
      } catch (err) {
        safeError("logout", err);
      }
      this.clearLocal();
    },

    /**
     * 解除微信绑定：服务端清理后本地登出。
     */
    async unbind(): Promise<void> {
      await authApi.unbindWx();
      this.clearLocal();
    },

    /** 登录成功统一入口 */
    applyLogin(token: string, user: CurrentUser): void {
      setToken(token);
      this.user = user;
      this.status = "bound";
    },

    /** 清理本地登录态 */
    clearLocal(): void {
      clearToken();
      this.user = null;
      this.status = "guest";
    },

    /** 保存 bindTicket（启动页静默登录未命中时调用） */
    saveBindTicket(ticket: string): void {
      if (ticket !== "") {
        uni.setStorageSync(BIND_TICKET_KEY, ticket);
      }
    },
  },
});
