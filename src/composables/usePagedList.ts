/**
 * 分页列表复用核心：分页加载 / 下拉刷新 / 触底加载 / 防抖搜索 / 筛选 / 三态。
 * pending 与 history 两个列表页共用。
 */
import { ref, type Ref } from "vue";
import type { PageResult } from "@/types/api";
import { DEBOUNCE_WAIT, PAGE_SIZE } from "@/utils/constants";
import { debounce } from "@/utils/debounce";

/** 列表视图状态 */
export type ListStatus = "loading" | "error" | "empty" | "ok";

/** 泛型过滤器（由各列表自行定义结构） */
export interface UsePagedListOptions<T, F> {
  /** 拉取一页数据 */
  fetcher: (page: number, size: number, keyword: string, filters: F) => Promise<PageResult<T>>;
  /** 初始过滤器 */
  initialFilters: F;
  /** 每页条数（默认 20） */
  pageSize?: number;
  /** 每页加载成功回调（total, durationMs）——用于埋点 */
  onLoaded?: (total: number, duration: number) => void;
}

export interface PagedListApi<T, F> {
  list: Ref<T[]>;
  status: Ref<ListStatus>;
  loadingMore: Ref<boolean>;
  noMore: Ref<boolean>;
  keyword: Ref<string>;
  /** 下拉刷新 / 首屏加载 / 重试 */
  refresh: () => Promise<void>;
  /** 触底加载下一页 */
  loadMore: () => Promise<void>;
  /** 搜索输入（内部 300ms 防抖，触发后回到第一页） */
  search: (keyword: string) => void;
  /** 应用筛选（回到第一页重新拉取） */
  applyFilters: (filters: F) => void;
}

/**
 * 分页列表逻辑 Hook。
 */
export function usePagedList<T, F>(options: UsePagedListOptions<T, F>): PagedListApi<T, F> {
  const size = options.pageSize ?? PAGE_SIZE;
  const list: Ref<T[]> = ref<T[]>([]) as unknown as Ref<T[]>;
  const status = ref<ListStatus>("loading");
  const loadingMore = ref(false);
  const noMore = ref(false);
  const keyword = ref("");
  let currentPage = 0;
  let filters: F = { ...options.initialFilters };
  /** 请求序号：防抖/快速切换时丢弃过期响应 */
  let requestSeq = 0;
  /** refresh 与 loadMore 互斥 */
  let busy = false;

  async function fetchPage(page: number, replace: boolean): Promise<void> {
    const seq = ++requestSeq;
    const start = Date.now();
    try {
      const result = await options.fetcher(page, size, keyword.value.trim(), filters);
      if (seq !== requestSeq) {
        return; // 过期响应直接丢弃
      }
      list.value = replace ? result.list : [...list.value, ...result.list];
      currentPage = result.page;
      noMore.value = list.value.length >= result.total;
      status.value = list.value.length === 0 ? "empty" : "ok";
      options.onLoaded?.(result.total, Date.now() - start);
    } catch (err) {
      if (seq !== requestSeq) {
        return;
      }
      if (replace && list.value.length === 0) {
        status.value = "error"; // 首屏失败整页错误态（含重试按钮）
      } else {
        // 已有数据：保留数据，轻提示
        uni.showToast({ title: "加载失败，请重试", icon: "none" });
      }
      throw err;
    } finally {
      if (seq === requestSeq) {
        busy = false;
        loadingMore.value = false;
      }
    }
  }

  /** 回到第一页重新拉取 */
  async function refresh(): Promise<void> {
    if (busy) {
      return;
    }
    busy = true;
    noMore.value = false;
    if (list.value.length === 0) {
      status.value = "loading";
    }
    try {
      await fetchPage(1, true);
    } catch {
      /* 错误态已由 fetchPage 设置 */
    }
  }

  /** 触底加载 */
  async function loadMore(): Promise<void> {
    if (busy || loadingMore.value || noMore.value || status.value === "error") {
      return;
    }
    loadingMore.value = true;
    busy = true;
    try {
      await fetchPage(currentPage + 1, false);
    } catch {
      /* toast 已提示 */
    }
  }

  /** 防抖搜索 */
  const search = debounce((kw: string) => {
    keyword.value = kw;
    void refresh();
  }, DEBOUNCE_WAIT);

  /** 应用筛选 */
  function applyFilters(next: F): void {
    filters = { ...next };
    void refresh();
  }

  return {
    list,
    status,
    loadingMore,
    noMore,
    keyword,
    refresh,
    loadMore,
    search,
    applyFilters,
  };
}
