/**
 * 字典接口：对应需求文档第 7 章接口 10。
 */
import type { BizTypeOption } from "@/types/dict";
import { request } from "@/utils/request";

/**
 * 业务类型字典。
 */
export function fetchBizTypes(): Promise<BizTypeOption[]> {
  return request<BizTypeOption[]>({ url: "/api/dict/biz-type" });
}
