# 审批中心 · 微信小程序

基于 Uni-app (Vue 3 `<script setup>` + TypeScript + Vite) + Pinia + SCSS 开发的「审批单查看」微信小程序（一期：只读查询）。

## 功能范围（一期）

- **登录绑定**：微信一键静默登录、账号密码登录 + 首次自动绑定、401 无感续期、退出/解绑
- **待处置审批单**：列表（分页/下拉刷新/搜索 300ms 防抖/类型多选/时间范围筛选）、超时红色角标、未读角标
- **历史审批单**：我处理过的单据，处理结果/类型/时间筛选，按我的处理时间倒序
- **审批单详情**：动态表单字段、附件列表（仅名称大小）、四色审批时间轴、单号复制
- **我的**：账号信息、退出登录、解除微信绑定、隐私政策

明确不做（一期）：小程序内审批操作、附件预览下载、订阅消息推送。

## 开发

```bash
npm install

# 微信小程序（开发，启用 Mock；需保持此命令运行，开发者工具才能读取 dist/dev 产物）
npm run dev:mp-weixin
# 用微信开发者工具导入项目根目录，appid: wx0276ad8afd3c47a2
# project.config.json 已配置 miniprogramRoot 指向 dist/dev/mp-weixin

# H5（开发）
npm run dev:h5

# 类型检查
npm run type-check

# 生产构建（VITE_USE_MOCK=false，指向 .env.production 中的真实后端地址）
npm run build:mp-weixin
```

## 后端联调

1. 修改 `.env.production` 中 `VITE_BASE_URL` 为真实后端地址（全链路 HTTPS）。
2. 请求层与接口签名已实现文档第 7 章全部 10 个接口（见 `src/api/`），统一响应 `{ code, msg, data, traceId }`。
3. 密码加密：`src/utils/crypto.ts` 当前为开发期占位实现（DevCipher），后端公钥接口 `GET /api/auth/public-key` 就绪后实现 `PasswordCipher` 并通过 `setPasswordCipher()` 注入 RSA 实现。
4. 切回 Mock 开发：改 `.env.production` 的 `VITE_USE_MOCK=true` 或运行 dev 脚本。

## Mock 调试面板（验收演示）

1. `npm run dev:mp-weixin` 启动并进入「我的」页；
2. 连点版本号 5 次打开调试面板；
3. 可切换场景：一键登录结果（免密/未绑定/停用/code 失败）、密码错误次数与锁定、绑定冲突、401 无感续期、详情 403、网络异常、角标数 —— 覆盖需求文档验收标准 1~12 的全部演示路径。

## 目录结构

```
src/
├── api/            # 按模块划分的接口（auth/approval/dict）
├── components/     # 通用组件（kebab-case.vue）
├── composables/    # usePagedList / useOrderList 列表复用逻辑
├── config/         # 环境常量（USE_MOCK / BASE_URL）
├── mock/           # Mock 分发器、造数器、场景开关（仅开发期）
├── pages/          # launch / login / pending / history / detail / mine
├── store/          # Pinia（auth / badge / dict / read）
├── styles/         # SCSS 变量与 mixin（uni.scss 自动注入）
├── types/          # 全局 TypeScript 类型
└── utils/          # request 封装 / token / 日期 / 防抖 / 埋点 / 加密占位 / 脱敏日志
```

## 安全红线（已落实）

- Storage 仅存 token 与临时票据；不存 openid / session_key / 明文密码
- 密码加密后提交（占位实现，接口已隔离，可无缝替换 RSA）
- 业务接口严禁前端传 userId；日志统一经 `utils/logger.ts` 脱敏
- 不强制获取头像、昵称、手机号授权
