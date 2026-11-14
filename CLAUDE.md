# CLAUDE.md - 微信小程序开发规范

## 1. 技术栈与运行环境
- **框架与语言：** Uni-app (Vue 3 `<script setup>` + TypeScript + Vite) / 原生微信小程序（若使用原生请将 `uni.*` 映射为 `wx.*`）
- **状态与样式：** Pinia + Tailwind CSS / SCSS（需适配 `rpx` 与底部安全区 `env(safe-area-inset-bottom)`）
- **兼容基准：** 微信客户端 ≥ 8.0，基础库 ≥ 2.20.0；适配 320px ~ 430px 主流屏幕[cite: 1]

## 2. 目录结构与命名
- `src/pages/` - 页面视图（如 `launch/`、`login/`、`pending/`、`history/`、`detail/`、`mine/`）[cite: 1]
- `src/components/` - 通用组件（统一使用 `kebab-case.vue` 命名，模板中以 `PascalCase` 引用）
- `src/api/` - 按模块划分的接口请求函数
- `src/types/` - 全局 TypeScript 接口与枚举定义
- `src/store/` - Pinia 状态管理
- `src/utils/` - 通用工具（请求拦截器、加密、日期格式化、埋点）
- **命名约定：** 文件/目录用 `kebab-case`，变量/函数用 `camelCase`，常量/枚举用 `UPPER_SNAKE_CASE`。

## 3. 编码与架构规范
- **严格类型：** 禁止使用 `any`，所有 API 入参、出参及组件 Props 必须在 `src/types/` 中明确定义类型。
- **状态与数据流：** 列表页必须实现分页加载（每页 20 条，触底加载）与下拉刷新；搜索输入统一做 300ms 防抖[cite: 1]。
- **弱网与状态兜底：** 必须完整覆盖加载中（Skeleton/Loading）、空数据（Empty）与网络异常（支持点击重试，严禁白屏）三种视图状态[cite: 1]。
- **iOS 兼容：** 日期字符串解析前必须将 `-` 替换为 `/`，避免 iOS 端出现 `NaN`。

## 4. 网络层与鉴权机制
- **请求配置：** 全局超时 5000ms，网络异常自动重试 1 次[cite: 1]；统一响应结构 `{ code, msg, data, traceId }`[cite: 1]。
- **401 无感续期：** 遇到 HTTP 401 或业务 `code === 401` 时，自动清理本地 Token，静默执行 `wx.login()` 换取新 Token 并**重放原请求 1 次**；重放仍失败则跳转登录页且不弹重复错误提示[cite: 1]。
- **业务码拦截：** 拦截器统一处理 `1001`（跳转绑定页）及 `1002/1003`（阻断并提示），其余表单级错误交由具体页面处理[cite: 1]。
- **表单防重：** 所有提交按钮点击后必须立即禁用并展示 Loading，防止重复提交[cite: 1]。

## 5. 安全与合规红线
- **敏感数据隔离：** 本地 Storage 仅允许存储 JWT Token 与临时票据，**严禁存储 `openid`、`session_key` 或明文密码**[cite: 1]。
- **传输加密：** 密码等敏感字段提交前必须经 RSA 公钥加密[cite: 1]；所有业务接口严禁前端传递 `userId`[cite: 1]。
- **日志脱敏：** `console.log` 与埋点上报严禁打印 Token、密码或 `wx.login` 原始 `code`[cite: 1]。
- **低打扰原则：** 严禁调用强制获取用户头像、昵称或手机号的授权弹窗[cite: 1]。

## 6. AI 协作指令
- 新增或修改页面后，同步更新 `pages.json` 路由配置。
- 严格遵循「只读查询」定位，不擅自添加未要求的数据修改或写操作入口[cite: 1]。