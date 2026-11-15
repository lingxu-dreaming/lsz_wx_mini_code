/**
 * 审批单接口 Mock：/api/approval/*
 * 分页/筛选语义与真实后端保持一致，便于切换。
 */
import { BizCode } from "@/types/api";
import type { ApiResponse, PageResult } from "@/types/api";
import type { HistoryQuery, PendingQuery } from "@/types/filter";
import type {
  ApprovalOrderItem,
  FormField,
  OrderDetail,
  OrderStatus,
  TimelineNode,
  TimelineStatus,
} from "@/types/order";
import { makeHistoryItem, makePendingItem, BIZ_TYPES, formatBackendTime } from "../generator";
import { scenario } from "../scenario";

/** 待办池规模 */
const PENDING_POOL_SIZE = 57;
/** 历史池规模（单账号可能上万条，此处演示用） */
const HISTORY_POOL_SIZE = 230;

let pendingPool: ApprovalOrderItem[] | null = null;
let historyPool: ApprovalOrderItem[] | null = null;
const detailCache = new Map<string, OrderDetail>();

function makeTraceId(): string {
  return `mock-${Date.now()}`;
}

/** 懒加载待办池（生成时刻固定，保证分页稳定） */
function getPendingPool(): ApprovalOrderItem[] {
  if (pendingPool === null) {
    const now = new Date();
    pendingPool = Array.from({ length: PENDING_POOL_SIZE }, (_, i) => makePendingItem(i, now));
  }
  return pendingPool;
}

/** 懒加载历史池 */
function getHistoryPool(): ApprovalOrderItem[] {
  if (historyPool === null) {
    const now = new Date();
    historyPool = Array.from({ length: HISTORY_POOL_SIZE }, (_, i) => makeHistoryItem(i, now));
  }
  return historyPool;
}

/** 关键字模糊匹配：单号 / 标题 / 申请人 */
function matchKeyword(item: ApprovalOrderItem, keyword: string): boolean {
  if (keyword === "") {
    return true;
  }
  return (
    item.orderNo.includes(keyword) ||
    item.title.includes(keyword) ||
    item.applicantName.includes(keyword)
  );
}

/** 类型多选过滤（空 = 全部） */
function matchBizTypes(item: ApprovalOrderItem, bizTypes?: string[]): boolean {
  if (bizTypes === undefined || bizTypes.length === 0) {
    return true;
  }
  return bizTypes.includes(item.bizType);
}

/** 时间范围过滤（含边界，按日期字符串比较） */
function matchDateRange(time: string, dateFrom?: string, dateTo?: string): boolean {
  if (dateFrom !== undefined && time < `${dateFrom} 00:00:00`) {
    return false;
  }
  if (dateTo !== undefined && time > `${dateTo} 23:59:59`) {
    return false;
  }
  return true;
}

/** 通用分页 */
function paginate<T>(list: T[], page: number, size: number): PageResult<T> {
  const start = (page - 1) * size;
  return {
    list: list.slice(start, start + size),
    total: list.length,
    page,
    size,
  };
}

/** GET /api/approval/badge */
function handleBadge(): ApiResponse<{ count: number }> {
  const count = scenario.badgeCount >= 0 ? scenario.badgeCount : getPendingPool().length;
  return { code: BizCode.OK, msg: "ok", data: { count }, traceId: makeTraceId() };
}

/** GET /api/approval/pending */
function handlePending(query: PendingQuery): ApiResponse<PageResult<ApprovalOrderItem>> {
  const filtered = getPendingPool()
    .filter(
      (item) =>
        matchKeyword(item, query.keyword ?? "") &&
        matchBizTypes(item, query.bizTypes) &&
        matchDateRange(item.applyTime, query.dateFrom, query.dateTo),
    )
    .sort((a, b) => b.applyTime.localeCompare(a.applyTime));
  return {
    code: BizCode.OK,
    msg: "ok",
    data: paginate(filtered, query.page, query.size),
    traceId: makeTraceId(),
  };
}

/** GET /api/approval/history */
function handleHistory(query: HistoryQuery): ApiResponse<PageResult<ApprovalOrderItem>> {
  const filtered = getHistoryPool()
    .filter((item) => {
      if (query.result !== undefined && query.result !== "all" && item.myResult !== query.result) {
        return false;
      }
      return (
        matchKeyword(item, query.keyword ?? "") &&
        matchBizTypes(item, query.bizTypes) &&
        matchDateRange(item.myHandleTime ?? "", query.dateFrom, query.dateTo)
      );
    })
    .sort((a, b) => (b.myHandleTime ?? "").localeCompare(a.myHandleTime ?? ""));
  return {
    code: BizCode.OK,
    msg: "ok",
    data: paginate(filtered, query.page, query.size),
    traceId: makeTraceId(),
  };
}

/** 按业务类型生成动态表单字段 */
function makeFormFields(bizType: string, seed: number): FormField[] {
  const rng = (n: number): number => {
    const x = Math.sin(seed * 97 + n * 13) * 10000;
    return x - Math.floor(x);
  };
  const amount = `¥${(Math.floor(rng(1) * 90000) + 1000).toLocaleString("zh-CN")}.00`;
  const common: FormField[] = [
    { label: "申请事由", value: "详见申请说明，因业务需要特申请审批。", type: "longtext" },
  ];
  switch (bizType) {
    case "purchase":
      return [
        { label: "采购物品", value: "联想 ThinkPad X1 Carbon 笔记本电脑", type: "text" },
        { label: "预算金额", value: amount, type: "amount" },
        { label: "期望到货", value: "2026-11-30", type: "date" },
        ...common,
      ];
    case "leave":
      return [
        { label: "请假类型", value: "年假", type: "text" },
        { label: "开始时间", value: "2026-11-20 09:00", type: "date" },
        { label: "结束时间", value: "2026-11-25 18:00", type: "date" },
        { label: "共计", value: "5 天", type: "text" },
        ...common,
      ];
    case "expense":
      return [
        { label: "报销类别", value: "差旅费", type: "text" },
        { label: "报销金额", value: amount, type: "amount" },
        { label: "发票张数", value: `${Math.floor(rng(2) * 8) + 1} 张`, type: "text" },
        ...common,
      ];
    case "contract":
      return [
        { label: "合同名称", value: "2026 年度办公用品集中采购框架协议", type: "text" },
        { label: "合同金额", value: amount, type: "amount" },
        { label: "合同期限", value: "一年", type: "text" },
        ...common,
      ];
    case "travel":
      return [
        { label: "出差地点", value: "上海市", type: "text" },
        { label: "出差天数", value: `${Math.floor(rng(3) * 6) + 2} 天`, type: "text" },
        ...common,
      ];
    default:
      return [
        { label: "用章类型", value: "公章", type: "text" },
        { label: "文件份数", value: "2 份", type: "text" },
        ...common,
      ];
  }
}

/** 生成时间轴：提交 → 部门审批（我的处理）→ 分管领导 → 归档 */
function makeTimeline(item: ApprovalOrderItem): TimelineNode[] {
  const statusToTimeline = (s: OrderStatus): TimelineStatus => {
    if (s === "processing") return "processing";
    if (s === "approved" || s === "archived") return "passed";
    return "rejected";
  };
  const nodes: TimelineNode[] = [
    {
      nodeName: "提交申请",
      status: "passed",
      operatorName: item.applicantName,
      operateTime: item.applyTime,
      opinion: "提交审批",
    },
    {
      nodeName: "部门负责人审批",
      status: statusToTimeline(item.currentStatus ?? "processing"),
      operatorName: "李四",
      operateTime: item.myHandleTime ?? item.applyTime,
      opinion: item.myResult === "REJECTED" ? "不符合预算要求，驳回" : "同意",
      isMine: true,
    },
    {
      nodeName: "分管领导审批",
      status: item.currentStatus === "processing" ? "pending" : "passed",
      operatorName: "王五",
    },
    {
      nodeName: "归档",
      status: "pending",
      operatorName: "系统",
    },
  ];
  return nodes;
}

/** GET /api/approval/{id} */
function handleDetail(id: string): ApiResponse<OrderDetail> {
  if (scenario.detailForbidden) {
    return {
      code: 403,
      msg: "无权限查看该审批单",
      data: {} as OrderDetail,
      traceId: makeTraceId(),
    };
  }
  const cached = detailCache.get(id);
  if (cached !== undefined) {
    return { code: BizCode.OK, msg: "ok", data: cached, traceId: makeTraceId() };
  }
  const all = [...getPendingPool(), ...getHistoryPool()];
  const item = all.find((o) => o.id === id);
  if (item === undefined) {
    return {
      code: 403,
      msg: "无权限查看该审批单",
      data: {} as OrderDetail,
      traceId: makeTraceId(),
    };
  }
  const seed = parseInt(id.replace(/\D/g, ""), 10) || 1;
  const bizLabel = BIZ_TYPES.find((b) => b.code === item.bizType)?.label ?? item.bizType;
  const detail: OrderDetail = {
    id: item.id,
    orderNo: item.orderNo,
    title: item.title,
    bizType: bizLabel,
    status: item.currentStatus ?? "processing",
    applicantName: item.applicantName,
    deptName: item.deptName,
    applyTime: item.applyTime,
    urgency: seed % 5 === 0 ? "urgent" : "normal",
    formFields: makeFormFields(item.bizType, seed),
    attachments: [
      { name: "申请材料.pdf", size: 245760 },
      { name: "报价单.xlsx", size: 35840 },
      { name: "相关说明.docx", size: 18944 },
    ].slice(0, (seed % 3) + 1),
    timeline: makeTimeline(item),
  };
  detailCache.set(id, detail);
  return { code: BizCode.OK, msg: "ok", data: detail, traceId: makeTraceId() };
}

/** 按 url 分发 approval 请求 */
export function dispatchApproval(url: string, query: unknown): ApiResponse<unknown> {
  const q = (query ?? {}) as Record<string, unknown>;
  if (url === "/api/approval/badge") {
    return handleBadge() as ApiResponse<unknown>;
  }
  if (url === "/api/approval/pending") {
    return handlePending(q as unknown as PendingQuery) as ApiResponse<unknown>;
  }
  if (url === "/api/approval/history") {
    return handleHistory(q as unknown as HistoryQuery) as ApiResponse<unknown>;
  }
  const match = url.match(/^\/api\/approval\/(.+)$/);
  if (match !== null) {
    return handleDetail(decodeURIComponent(match[1])) as ApiResponse<unknown>;
  }
  return { code: 404, msg: `mock: unknown approval url ${url}`, data: {}, traceId: makeTraceId() };
}

/** 供 badge 场景使用：导出造数时间格式化 */
export { formatBackendTime };
