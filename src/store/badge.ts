/**
 * 待办角标状态。
 */
import { defineStore } from "pinia";
import { fetchBadge } from "@/api/approval";
import { syncTabBarBadge } from "@/utils/tab-bar";
import { safeError } from "@/utils/logger";

export const useBadgeStore = defineStore("badge", {
  state: () => ({
    count: 0,
  }),
  actions: {
    /**
     * 刷新角标数（失败静默，不影响主流程）。
     */
    async refresh(): Promise<void> {
      try {
        const res = await fetchBadge();
        this.count = res.count;
        syncTabBarBadge(res.count);
      } catch (err) {
        safeError("badge refresh", err);
      }
    },
    /** 本地清零并移除 TabBar 角标 */
    clear(): void {
      this.count = 0;
      syncTabBarBadge(0);
    },
  },
});
