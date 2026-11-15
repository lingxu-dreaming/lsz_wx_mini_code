/**
 * 列表查询条件类型。
 */
import type { HandleResult } from "./order";

/** 时间范围快捷项 */
export type DateRangeKey = "7d" | "30d" | "custom";

/** 待处置列表查询 */
export interface PendingQuery {
  page: number;
  size: number;
  keyword?: string;
  bizTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
}

/** 历史列表查询（增加处理结果筛选） */
export interface HistoryQuery extends PendingQuery {
  result?: HandleResult | "all";
}
