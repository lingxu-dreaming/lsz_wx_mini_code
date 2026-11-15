/**
 * 字典状态：业务类型字典（内存缓存 5 分钟）。
 */
import { defineStore } from "pinia";
import type { BizTypeOption } from "@/types/dict";
import { fetchBizTypes } from "@/api/dict";
import { DICT_CACHE_TTL } from "@/utils/constants";
import { safeError } from "@/utils/logger";

export const useDictStore = defineStore("dict", {
  state: () => ({
    bizTypes: [] as BizTypeOption[],
    loadedAt: 0,
  }),
  actions: {
    /**
     * 确保字典已加载（缓存有效期内不重复请求）。
     */
    async ensureLoaded(): Promise<void> {
      if (this.bizTypes.length > 0 && Date.now() - this.loadedAt < DICT_CACHE_TTL) {
        return;
      }
      try {
        this.bizTypes = await fetchBizTypes();
        this.loadedAt = Date.now();
      } catch (err) {
        safeError("dict load", err);
      }
    },
    /** 按 code 查标签 */
    labelOf(code: string): string {
      return this.bizTypes.find((item) => item.code === code)?.label ?? code;
    },
    /** 按 code 查颜色 */
    colorOf(code: string): string {
      return this.bizTypes.find((item) => item.code === code)?.color ?? "#2f6bff";
    },
  },
});
