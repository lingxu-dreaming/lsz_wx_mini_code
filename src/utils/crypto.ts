/**
 * 密码加密模块。
 *
 * TODO(后端就绪后替换)：真实实现应为 RsaCipher，公钥由后端接口
 * `GET /api/auth/public-key` 下发并内存缓存（每次登录前重新拉取，防公钥轮换）。
 * 当前为开发期占位实现 DevCipher（一次性扰码混淆），仅保证「不提交明文密码」红线；
 * 后端联调时通过 setPasswordCipher() 注入 RSA 实现，或改造 getPasswordCipher()。
 */

/** 密码加密器接口：输出可直接作为 password 字段提交的密文 */
export interface PasswordCipher {
  encrypt(plain: string): string;
}

/** 开发期占位加密：异或扰码（不可用于生产，仅保证不提交明文） */
class DevCipher implements PasswordCipher {
  encrypt(plain: string): string {
    const nonce = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const scrambled = Array.from(plain)
      .map((ch, i) => ch.charCodeAt(0) ^ ((i + nonce.length) % 7))
      .join("-");
    return `dev.${nonce}.${scrambled}`;
  }
}

let instance: PasswordCipher | null = null;

/**
 * 获取密码加密器（懒加载单例）。
 */
export function getPasswordCipher(): PasswordCipher {
  if (instance === null) {
    instance = new DevCipher();
  }
  return instance;
}

/**
 * 注入自定义加密器（后端 RSA 公钥接口就绪后调用）。
 */
export function setPasswordCipher(cipher: PasswordCipher): void {
  instance = cipher;
}
