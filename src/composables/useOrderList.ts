/**
 * 审批单列表组装层：基于 usePagedList 组装 pending/history 的请求与筛选状态。
 */
import { fetchHistory, fetchPending } from "@/api/approval";
import type { HistoryQuery, PendingQuery, DateRangeKey } from "@/types/filter";
import type { ApprovalOrderItem, HandleResult } from "@/types/order";
import type { PageResult } from "@/types/api";
import { getDateBefore } from "@/utils/date";
import { track } from "@/utils/track";
import { usePagedList } from "./usePagedList";

/** 列表模式 */
export type OrderListMode = "pending" | "history";

/** 列表筛选状态（filter-panel 双向绑定） */
export interface OrderListFilters {
  /** 业务类型多选（空 = 全部） */
  bizTypes: string[];
  /** 时间范围快捷项 */
  dateRange: DateRangeKey;
  /** 自定义开始日期（YYYY-MM-DD） */
  dateFrom?: string;
  /** 自定义结束日期（YYYY-MM-DD） */
  dateTo?: string;
  /** 处理结果筛选（仅历史列表） */
  result: HandleResult | "all";
}

/** 解析时间范围为接口参数 */
function resolveDateRange(
  filters: OrderListFilters,
): { dateFrom?: string; dateTo?: string } {
  if (filters.dateRange === "custom") {
    return { dateFrom: filters.dateFrom, dateTo: filters.dateTo };
  }
  const days = filters.dateRange === "7d" ? 7 : 30;
  return { dateFrom: getDateBefore(days) };
}

/** 创建默认筛选 */
export function createDefaultFilters(mode: OrderListMode): OrderListFilters {
  return {
    bizTypes: [],
    dateRange: "30d",
    result: mode === "history" ? "all" : "all",
  };
}

/**
 * 审批单列表 Hook。
 */
export function useOrderList(mode: OrderListMode) {
  const fetcher = (
    page: number,
    size: number,
    keyword: string,
    filters: OrderListFilters,
  ): Promise<PageResult<ApprovalOrderItem>> => {
    const range = resolveDateRange(filters);
    if (mode === "history") {
      const query: HistoryQuery = {
        page,
        size,
        keyword,
        bizTypes: filters.bizTypes,
        result: filters.result,
        ...range,
      };
      return fetchHistory(query);
    }
    const query: PendingQuery = {
      page,
      size,
      keyword,
      bizTypes: filters.bizTypes,
      ...range,
    };
    return fetchPending(query);
  };

  return usePagedList<ApprovalOrderItem, OrderListFilters>({
    fetcher,
    initialFilters: createDefaultFilters(mode),
    onLoaded: (total, duration) => {
      if (mode === "pending") {
        track("pending_list_view", { count: total, duration });
      }
    },
  });
}
