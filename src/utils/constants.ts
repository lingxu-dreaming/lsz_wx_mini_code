/**
 * 全局常量：杜绝魔法数字。
 */

/** Storage key：登录 token（本地唯一允许存储的敏感凭证） */
export const TOKEN_KEY = "token";
/** Storage key：一次性绑定票据（临时票据，允许存储） */
export const BIND_TICKET_KEY = "bind_ticket";
/** Storage key：已读审批单号集合（非敏感） */
export const READ_ORDERS_KEY = "read_orders";

/** 列表每页条数 */
export const PAGE_SIZE = 20;
/** 请求超时时间（毫秒） */
export const REQUEST_TIMEOUT = 5000;
/** 网络异常自动重试次数 */
export const RETRY_TIMES = 1;
/** 审批单超时未处理阈值（小时），超过显示红色「超时」角标 */
export const OVERDUE_HOURS = 24;
/** 搜索输入防抖时长（毫秒） */
export const DEBOUNCE_WAIT = 300;
/** 最低微信基础库版本 */
export const MINI_PROGRAM_LIB_MIN = "2.20.0";

/** 账号长度限制 */
export const USERNAME_MIN_LEN = 4;
export const USERNAME_MAX_LEN = 32;
/** 密码长度限制 */
export const PASSWORD_MIN_LEN = 6;
export const PASSWORD_MAX_LEN = 32;
/** 连续密码错误锁定阈值（次） */
export const PWD_ERROR_LOCK_LIMIT = 5;
/** 锁定时长（分钟） */
export const PWD_LOCK_MINUTES = 15;

/** Mock 接口模拟延迟范围（毫秒） */
export const MOCK_DELAY_MIN = 300;
export const MOCK_DELAY_MAX = 600;

/** 业务类型字典缓存有效期（毫秒，5 分钟） */
export const DICT_CACHE_TTL = 5 * 60 * 1000;
