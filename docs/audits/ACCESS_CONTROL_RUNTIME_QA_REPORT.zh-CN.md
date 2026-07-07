# 访问控制运行时 QA 证据报告

报告状态：`RUNTIME_QA_BLOCKED`

生成日期：2026-07-05

## 1. 结论

本轮已完成 Phase 5 的本地部署就绪检查和安全扫描证据收集；未完成真实 CloudBase 部署、云开发控制台配置、微信开发者工具运行时验证或真机验证。

阻塞原因：

- 当前会话没有暴露 CloudBase MCP 管理工具。
- 本机 PATH 未发现可直接使用的 CloudBase / TCB CLI。
- 本轮没有读取或使用 `.env` 中的任何私有值。
- 真实 owner / partner OpenID、函数环境变量、数据库规则、存储规则和函数权限必须在云开发控制台或私有部署通道配置。
- 微信开发者工具应用存在，但本轮没有可用的已登录账号、私有云开发配置和手工操作授权来完成模拟器/真机测试。

Phase 6 配对码 UI：不允许开始。必须先完成本报告中阻塞的真实 CloudBase 和微信运行时 QA，并把结果补充为通过或明确遗留问题。

## 2. 环境状态

| 项目 | 状态 | 证据 |
| --- | --- | --- |
| Phase 1 占位安全规则 | 已在工作区 | `cloudbase/security/database.rules.json`、`cloudbase/security/storage.rules.json` 仍为占位模板 |
| Phase 2 云函数源码 | 已在工作区 | `cloudfunctions/access-control/index.js` 存在，语法检查通过 |
| Phase 3 访问页和守卫 | 已在工作区 | `src/pages/access/access.vue` 存在，且 `pages/access/access` 是 `src/pages.json` 第一项 |
| Phase 4 运行时错误安全提示 | 已在工作区 | `src/services/access-control.ts` 包含运行时错误分类，`src/pages/access/access.vue` 包含配置缺失、未放行、停用、撤销、需配对状态 |
| CloudBase 部署工具 | 阻塞 | 当前会话无 CloudBase MCP；PATH 未发现可直接使用的 CloudBase / TCB CLI |
| 微信开发者工具 | 部分可用 | 本机发现 WeChat DevTools 应用；未完成登录态、模拟器、真机和私有云开发配置验证 |
| 私有 OpenID / 配对码 / 密钥 | 未读取 | 未读取 `.env`，报告只使用 `OWNER_OPENID_REDACTED`、`PARTNER_OPENID_REDACTED` 等红acted 标签 |

## 3. 本地验证结果

| 检查 | 结果 |
| --- | --- |
| `pnpm scan:ui-copy` | 通过 |
| `pnpm scan:design-tokens` | 通过 |
| `pnpm scan:security-baseline` | 通过 |
| `pnpm scan:access-control` | 通过 |
| `pnpm type-check` | 通过 |
| `pnpm type-check:strict` | 通过 |
| `pnpm build:mp-weixin` | 通过 |
| `node --check cloudfunctions/access-control/index.js` | 通过 |
| build-output security sanity check | 通过 |
| `git diff --check` | 通过 |

本地验证未发现真实 OpenID、配对码、密码、AppSecret 或 token 字面量进入扫描范围。构建产物安全检查确认必要公开标识存在，并未发现 AppSecret、真实 OpenID、UnoCSS 或应用侧凭据形态字面量。

## 4. 运行时 QA 用例状态

| 用例 | 结果 | 说明 |
| --- | --- | --- |
| owner 授权访问 | 阻塞 | 需要私有配置 `OWNER_OPENID_REDACTED` 并在微信开发者工具或真机验证 |
| partner 授权访问 | 阻塞 | 需要私有配置 `PARTNER_OPENID_REDACTED` 并在微信开发者工具或真机验证 |
| 未知账号拒绝 | 阻塞 | 需要未知微信账号和真实云开发环境 |
| revoked 账号拒绝 | 阻塞 | 需要在私有配置中临时设置 `revoked` 状态 |
| disabled 账号拒绝 | 阻塞 | 需要在私有配置中临时设置 `disabled` 状态 |
| 云函数未部署处理 | 阻塞 | 需要私有测试环境中临时移除或改名 `access-control` |
| 云函数已部署但未配置处理 | 阻塞 | 需要私有测试环境中临时移除 owner / partner 配置或保留占位值 |
| 函数权限失败处理 | 阻塞 | 需要私有测试环境临时收紧函数调用权限 |
| 网络超时或离线处理 | 阻塞 | 需要微信开发者工具或真机弱网/断网验证 |
| 业务页直达拦截 | 阻塞 | 需要微信开发者工具编译模式逐页直达验证 Network / Console |
| 授权后列表/详情/创建/更新/删除 | 阻塞 | 需要真实授权账号和真实 CloudBase 数据库 |
| 授权后上传/临时图片链接 | 阻塞 | 需要真实授权账号、真实云存储和 `love-entries/main/` 权限 |

## 5. 截图与人工观察

本轮没有可用的微信开发者工具截图或真机截图。原因是 CloudBase 部署、私有访问名单配置、函数权限配置和测试账号切换均未在当前会话中完成。

可保留的安全观察：

- 访问页源码仍为状态展示，不包含配对码输入框。
- 页面源码未直接调用 `wx.cloud.callFunction`。
- 访问页源码未调用 `verifyPairingCode`。
- 业务页守卫扫描通过，访问页仍为首个路由。

## 6. 未解决运行时问题

以下问题不是源码问题，但必须在 Phase 6 前关闭：

1. 部署或更新 `access-control` Event Function。
2. 在云开发私有配置中设置 owner / partner OpenID 槽位与状态。
3. 私下应用真实数据库白名单规则。
4. 私下应用真实云存储白名单与 `love-entries/main/` 路径规则。
5. 用 owner、partner、未知账号、停用账号、撤销账号完成微信运行时验证。
6. 验证 missing function、unconfigured function、permission failure、network timeout/offline 的安全错误展示。
7. 验证业务页直达时，在授权确认前不发生列表、详情、上传或临时链接请求。
8. 验证授权后 `love_entries`、`coupleId: "main"`、`love-entries/main/` 和现有 CRUD/上传行为保持不变。

## 7. 下一步手工流程

1. 在私有环境完成 `docs/ACCESS_CONTROL_RUNTIME_QA.zh-CN.md` 中的准备步骤。
2. 使用微信开发者工具导入：
   ```text
   dist/build/mp-weixin
   ```
3. 按 `docs/ACCESS_CONTROL_RUNTIME_QA.zh-CN.md` 的 4.1 到 4.12 逐项测试。
4. 只把红acted 结论补充到本报告，不写入真实 OpenID、配对码、密码、AppSecret、token、哈希、盐、函数日志原文或环境变量真实值。
