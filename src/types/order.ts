/**
 * 审批单相关类型：列表项、详情、时间轴节点、附件。
 */

/** 我的处理结果（历史列表筛选用，同时作为卡片标签） */
export const HandleResult = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RETURNED: "RETURNED",
} as const;
export type HandleResult = (typeof HandleResult)[keyof typeof HandleResult];

/** 单据当前状态 */
export type OrderStatus = "processing" | "approved" | "rejected" | "returned" | "archived";

/** 时间轴节点状态（颜色：绿/蓝/灰/红） */
export type TimelineStatus = "passed" | "processing" | "pending" | "rejected";

/** 审批流程时间轴节点 */
export interface TimelineNode {
  nodeName: string;
  status: TimelineStatus;
  operatorName: string;
  operateTime?: string;
  opinion?: string;
  /** 是否「我的处理」节点（高亮标注） */
  isMine?: boolean;
}

/** 附件元数据（一期仅展示名称与大小，不支持预览下载） */
export interface AttachmentMeta {
  name: string;
  /** 文件大小（字节） */
  size: number;
}

/** 动态表单字段（详情按业务类型渲染） */
export interface FormField {
  label: string;
  value: string;
  type: "text" | "amount" | "date" | "longtext";
}

/** 审批单列表项（待处置/历史共用） */
export interface ApprovalOrderItem {
  id: string;
  orderNo: string;
  title: string;
  /** 业务类型 code（对应字典） */
  bizType: string;
  applicantName: string;
  deptName: string;
  /** 提交时间，格式 YYYY-MM-DD HH:mm:ss */
  applyTime: string;
  /** 是否超时未处理（>24h） */
  overdue: boolean;
  /** 关键字段摘要（金额/天数/事由等 1~3 条） */
  summary: string[];
  /** 历史列表：我的处理结果 */
  myResult?: HandleResult;
  /** 历史列表：我的处理时间 */
  myHandleTime?: string;
  /** 历史列表：单据当前状态 */
  currentStatus?: OrderStatus;
}

/** 审批单详情 */
export interface OrderDetail {
  id: string;
  orderNo: string;
  title: string;
  bizType: string;
  status: OrderStatus;
  applicantName: string;
  deptName: string;
  applyTime: string;
  urgency: "normal" | "urgent";
  formFields: FormField[];
  attachments: AttachmentMeta[];
  timeline: TimelineNode[];
}
