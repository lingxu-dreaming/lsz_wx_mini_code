/**
 * 已读状态：列表项点击后本地标记已读（仅前端，不上报后端）。
 * 数据非敏感，storage 备份防止内存丢失。
 */
import { defineStore } from "pinia";
import { READ_ORDERS_KEY } from "@/utils/constants";

function loadFromStorage(): string[] {
  const value = uni.getStorageSync(READ_ORDERS_KEY) as string[] | "";
  return Array.isArray(value) ? value : [];
}

export const useReadStore = defineStore("read", {
  state: () => ({
    orderNos: new Set<string>(loadFromStorage()),
  }),
  actions: {
    /** 标记单号已读 */
    mark(orderNo: string): void {
      if (this.orderNos.has(orderNo)) {
        return;
      }
      this.orderNos.add(orderNo);
      uni.setStorageSync(READ_ORDERS_KEY, Array.from(this.orderNos));
    },
    /** 是否已读 */
    isRead(orderNo: string): boolean {
      return this.orderNos.has(orderNo);
    },
  },
});
