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

## 追加：列表分页统一修复（2026-07-31）

### 背景

小线索、小歌单、小约定、小日子四个列表页此前只发一次 `limit: 100` 查询，而微信云开发小程序端单次最多返回 20 条，导致超过 20 条的记录永远无法加载；四个页面也没有触底加载、筛选只作用于已加载子集，任务进度与小日子总数统计同样失真。

### 本次变更

- 新增通用分页引擎 `src/composables/usePaginatedList.ts`，从首页 `usePaginatedTimeline` 提取：首载、下拉刷新、触底追加、`hasMore`、加载更多错误、ID 去重、分页缓存恢复、请求互斥与过期响应丢弃、`prependItem`/`replaceItem`/`removeItem` 变更接口。
- 新增分页缓存结构 `src/services/paginated-cache.ts`（`{version, items, nextCursor, hasMore}`），各列表使用独立缓存 key（`memo/song/task/moment` 的 `pagination` scope）；首页时间线缓存由 `usePaginatedTimeline` 适配旧格式，不丢既有缓存。
- 首页 `usePaginatedTimeline` 改为通用引擎的薄适配器，对外接口与行为不变，`index.vue` 与 `entries.ts` 的 rawOffset 查询逻辑未改动。
- 四个仓库（`memos/songs/tasks/moments`）的 `listXxx` 替换为 `listXxxPage(cursor)`：保留 `coupleId + kind` 服务端过滤，按不可变字段 `createdAt` 倒序 + offset 游标翻页，每页 20 条；写穿透切换为分页缓存；moments 移除了旧 `mergeStableList` 合并缓存逻辑。
- 四个列表页接入引擎：新增 `onReachBottom` 触底加载与底部三态（加载中/点击重试/没有更多啦）；`onShow` 改为消费刷新信号后才刷新，未变更时保留已加载数据；行内变更（置顶、状态、勾选）通过引擎 `replaceItem` 自动归位。
- 编辑/详情页（`memo-edit`、`song-edit`、`task-edit`、`moment-edit`、`moment-detail`）在保存、删除、置顶成功后写入 `setTimelineNeedsRefresh` 信号。
- `src/pages.json` 为小线索、小歌单、小约定三页补开 `enablePullDownRefresh`（此前 `onPullDownRefresh` 为死代码）。
- 筛选自动补页：筛选结果为空且还有更多数据时自动加载下一页（小线索/小歌单/小约定）。
- 统计真实全量：`cloudbase.ts` 新增 `countDocuments`（纯新增封装，未改动既有 CRUD）；任务进度 X/Y 与小日子总数改为云端 count，行内勾选本地 ±1。
- 修正小歌单页刷新失败提示的错域文案（"小纸条"→"小歌单"）。

### 保留不变

- CloudBase CRUD、上传、临时链接、心动反应、路由结构、`love_entries` 集合、`coupleId: "main"`、存储前缀均未改动。
- 首页行为逐项不变；四页游标本阶段使用 offset 方案，后续如需 keyset 只需替换各仓库 loader。

### 验证命令

```bash
pnpm type-check
pnpm scan:project-ui
pnpm scan:design-tokens
pnpm scan:ui-copy
pnpm build:mp-weixin
```
