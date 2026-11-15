/**
 * 审批单接口：对应需求文档第 7 章接口 6~9。
 */
import type { PageResult } from "@/types/api";
import type { HistoryQuery, PendingQuery } from "@/types/filter";
import type { ApprovalOrderItem, OrderDetail } from "@/types/order";
import { request } from "@/utils/request";

/** 待办角标数据 */
export interface BadgeData {
  count: number;
}

/**
 * 待办数量（TabBar 角标）。
 */
export function fetchBadge(): Promise<BadgeData> {
  return request<BadgeData>({ url: "/api/approval/badge" });
}

/**
 * 待处置列表（分页 + 关键字 + 类型 + 时间范围）。
 */
export function fetchPending(query: PendingQuery): Promise<PageResult<ApprovalOrderItem>> {
  return request<PageResult<ApprovalOrderItem>, PendingQuery>({
    url: "/api/approval/pending",
    data: query,
  });
}

/**
 * 历史列表（增加处理结果筛选）。
 */
export function fetchHistory(query: HistoryQuery): Promise<PageResult<ApprovalOrderItem>> {
  return request<PageResult<ApprovalOrderItem>, HistoryQuery>({
    url: "/api/approval/history",
    data: query,
  });
}

/**
 * 审批单详情（含时间轴与附件元数据）。
 * @throws BizError code=403 越权时上抛，由详情页展示空态
 */
export function fetchDetail(id: string): Promise<OrderDetail> {
  return request<OrderDetail>({ url: `/api/approval/${encodeURIComponent(id)}` });
}
