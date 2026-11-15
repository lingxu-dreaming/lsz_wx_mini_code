/**
 * Token 读写：本地 Storage 唯一允许存储的敏感凭证。
 * 安全红线：严禁在此存储 openid / session_key / 明文密码。
 */
import { TOKEN_KEY } from "./constants";

/** 读取本地 token（无则返回空串） */
export function getToken(): string {
  const value: string = uni.getStorageSync(TOKEN_KEY) as string;
  return value ?? "";
}

/** 写入 token */
export function setToken(token: string): void {
  uni.setStorageSync(TOKEN_KEY, token);
}

/** 清除 token */
export function clearToken(): void {
  uni.removeStorageSync(TOKEN_KEY);
}

/** 是否存在本地 token */
export function hasToken(): boolean {
  return getToken() !== "";
}
