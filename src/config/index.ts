/**
 * 全局运行配置：从 Vite 环境变量读取，编译期注入。
 * 切换真实后端只需修改 .env.* 中的 VITE_USE_MOCK / VITE_BASE_URL。
 */

/** 是否启用本地 Mock（开发期无后端时使用） */
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK === "true";

/** 后端服务基础地址（Mock 模式下仅为占位） */
export const BASE_URL: string = import.meta.env.VITE_BASE_URL ?? "";
