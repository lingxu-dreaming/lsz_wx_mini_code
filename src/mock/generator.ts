/**
 * Mock 数据造数器：确定性伪随机（同序号生成相同数据，便于演示与断言）。
 */
import type { OrderStatus } from "@/types/order";

/** 业务类型字典（与 handlers/dict.ts 保持一致） */
export const BIZ_TYPES = [
  { code: "purchase", label: "采购", color: "#2f6bff" },
  { code: "leave", label: "请假", color: "#00a870" },
  { code: "expense", label: "费用报销", color: "#ff8800" },
  { code: "contract", label: "合同", color: "#7b2ff7" },
  { code: "travel", label: "出差", color: "#00b4d8" },
  { code: "seal", label: "用章", color: "#e5484d" },
] as const;

const SURNAMES = ["张", "王", "李", "赵", "陈", "刘", "杨", "黄", "周", "吴", "徐", "孙"];
const GIVEN_NAMES = ["伟", "芳", "娜", "敏", "静", "磊", "军", "洋", "勇", "艳", "杰", "涛"];
const DEPTS = ["综合管理部", "财务部", "采购部", "技术研发部", "市场营销部", "人力资源部"];
const TITLES: Record<string, string[]> = {
  purchase: ["办公用品采购申请", "服务器设备采购申请", "实验耗材采购申请", "办公家具采购申请"],
  leave: ["年假申请", "病假申请", "事假申请", "调休申请"],
  expense: ["差旅费用报销", "业务招待费报销", "市内交通费报销", "办公费用报销"],
  contract: ["采购合同审批", "服务合同审批", "租赁合同审批", "合作协议审批"],
  travel: ["出差申请", "驻外出差申请", "出差延期申请"],
  seal: ["公章使用申请", "合同专用章使用申请", "法人章使用申请"],
};

/** mulberry32 伪随机（种子确定则序列确定） */
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 格式化为 YYYY-MM-DD HH:mm:ss（后端统一格式） */
export function formatBackendTime(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/** 取整到 5 分钟，时间更自然 */
function roundToFiveMinutes(date: Date): Date {
  date.setMinutes(Math.floor(date.getMinutes() / 5) * 5, 0, 0);
  return date;
}

/**
 * 生成一条待处置列表项（索引确定性）。
 * @param index 序号（种子）
 * @param now 当前时间基准
 */
export function makePendingItem(index: number, now: Date) {
  const rng = createRng(index * 7919 + 13);
  const biz = BIZ_TYPES[index % BIZ_TYPES.length];
  const applyDate = new Date(now.getTime() - Math.floor(rng() * 30 * 24 * 3600 * 1000));
  roundToFiveMinutes(applyDate);
  const overdue = now.getTime() - applyDate.getTime() > 24 * 3600 * 1000;
  const seq = `${10000 + index}`;
  const ymd = `${applyDate.getFullYear()}${pad(applyDate.getMonth() + 1)}${pad(applyDate.getDate())}`;
  const applicant = SURNAMES[index % SURNAMES.length] + GIVEN_NAMES[Math.floor(rng() * GIVEN_NAMES.length)];
  const titles = TITLES[biz.code];
  const amount = Math.floor(rng() * 50000) + 500;

  return {
    id: `pending-${index}`,
    orderNo: `SP${ymd}${seq}`,
    title: titles[Math.floor(rng() * titles.length)],
    bizType: biz.code,
    applicantName: applicant,
    deptName: DEPTS[index % DEPTS.length],
    applyTime: formatBackendTime(applyDate),
    overdue,
    summary: makeSummary(biz.code, amount, rng),
  };
}

/** 按业务类型生成 2~3 条摘要 */
function makeSummary(bizCode: string, amount: number, rng: () => number): string[] {
  const amountStr = `金额：¥${amount.toLocaleString("zh-CN")}.00`;
  switch (bizCode) {
    case "purchase":
      return [amountStr, `数量：${Math.floor(rng() * 50) + 1} 件`, "期望交期：本月内"];
    case "leave":
      return [`天数：${Math.floor(rng() * 10) + 1} 天`, "事由：个人事务"];
    case "expense":
      return [amountStr, "事由：见发票明细"];
    case "contract":
      return [amountStr, "相对方：见合同文本"];
    case "travel":
      return [`天数：${Math.floor(rng() * 7) + 1} 天`, "目的地：上海市"];
    default:
      return ["用途：业务办理"];
  }
}

/**
 * 生成一条历史列表项（索引确定性）。
 */
export function makeHistoryItem(index: number, now: Date) {
  const rng = createRng(index * 104729 + 7);
  const results = ["APPROVED", "REJECTED", "RETURNED"] as const;
  const myResult = results[index % results.length];
  const handleDate = new Date(now.getTime() - Math.floor(rng() * 365 * 24 * 3600 * 1000));
  roundToFiveMinutes(handleDate);
  const base = makePendingItem(index * 3 + 1, now);
  const statuses: OrderStatus[] =
    myResult === "APPROVED" ? ["processing", "approved", "archived"] : ["processing", "rejected", "archived"];
  return {
    ...base,
    id: `history-${index}`,
    myResult,
    myHandleTime: formatBackendTime(handleDate),
    currentStatus: statuses[index % statuses.length],
  };
}
