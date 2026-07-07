# 体验版构建切换记录

## 背景

本项目从“启动访问控制加固”切换为“仅用于体验版构建”的微信小程序，使用者为所有者和伴侣两人。`cloudfunctions/access-control/` 云函数未部署，因此需要停止所有运行时的访问校验拦截，避免阻断体验版使用。

## 本次变更

### 已禁用

- **`src/pages.json` 路由顺序**：
  - 已移除 `pages/access/access` 作为首页。
  - `pages/index/index` 现在为小程序首页，启动后直接进入。
- **业务页访问守卫**：以下页面已移除 `useAccessGuard` / `requireAccess` 的调用，打开时不再执行访问校验：
  - `src/pages/index/index.vue`
  - `src/pages/detail/detail.vue`
  - `src/pages/create/create.vue`
  - `src/pages/songs/songs.vue`
  - `src/pages/song-edit/song-edit.vue`
  - `src/pages/tasks/tasks.vue`
  - `src/pages/task-edit/task-edit.vue`
  - `src/pages/memos/memos.vue`
  - `src/pages/memo-edit/memo-edit.vue`
  - `src/pages/settings/settings.vue`
  - `src/pages/design-preview/design-preview.vue`

### 保留不变

- 未删除以下访问控制相关源文件，仅在顶部添加“运行时已冻结”注释：
  - `src/composables/useAccessGuard.ts`
  - `src/stores/access.ts`
  - `src/services/access-control.ts`
  - `src/types/access-control.ts`
  - `src/pages/access/access.vue`
- CloudBase 数据与存储规则文件保持用户已修改的状态，未回退为公开规则：
  - `cloudbase/security/database.rules.json`
  - `cloudbase/security/storage.rules.json`
- `cloudfunctions/access-control/` 目录未改动。
- 所有业务逻辑、CloudBase CRUD、错误提示、临时图片链接恢复、未上传文件清理等保持原行为。
- `love_entries` collection、`coupleId: "main"`、`love-entries/main/` 存储前缀保持原样。
- Wot UI 组件、主题系统、视觉设计、中文用户文案保持原样。

### 文档

- `docs/ACCESS_CONTROL_SETUP.zh-CN.md` 与 `docs/ACCESS_CONTROL_RUNTIME_QA.zh-CN.md` 已前置冻结说明，原有技术内容保留作为历史参考。
- 新增本文件 `docs/EXPERIENCE_BUILD_CHANGE_LOG.zh-CN.md` 记录切换详情。

### 扫描脚本

- `scripts/scan-access-control.mjs` 已更新：
  - 不再要求 `pages/access/access` 为首页或必须存在。
  - 不再要求业务页导入 `useAccessGuard` 或调用 `requireAccess`。
  - 仍保留对页面/组件中直接调用 `wx.cloud.callFunction` 的检查。
  - `scripts/scan-security-baseline.mjs` 的密钥字面量检查未改动。

## 已知后续工作（已停止）

Phase 5B/6 及任何面向公开发布的访问控制、配对码 UI、社交/账号/安全流程开发已停止。如需重新启用启动访问控制，需恢复 `src/pages.json` 中的访问页首页位置，并在业务页重新接入 `useAccessGuard`。

## 验证命令

```bash
pnpm type-check
pnpm build:mp-weixin
pnpm scan:access-control
pnpm scan:security-baseline
```
