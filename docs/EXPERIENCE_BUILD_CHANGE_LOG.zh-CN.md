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

## 追加：分页稳定游标与列表语义收紧（2026-07-31，远端验收返工）

### 背景

远端验收（`1d87cbc`）判定：offset 游标在同 `createdAt` 或并发删除时可能重复/漏项；编辑深分页记录后返回列表被第一页覆盖；小日子"下一次"基于已加载子集；筛选补页期间误显最终空态且无上限；统计在未就绪时用已加载数冒充全量；首载与刷新存在竞态；缓存命中后不再后台校验新鲜度。

### 本次变更

- `cloudbase.ts` 新增查询条件 builder（`where` 可传 `(command) => ...`，command 仅在封装内部解析，不向仓库泄漏原生对象）与多字段 `orderBy`；`wx-cloud.d.ts` 补 `Command` 类型。既有 CRUD 行为不变。
- 四个仓库（memos/songs/tasks/moments）改为 `createdAt desc + _id desc` keyset 游标（`{createdAt, id}`），`or` 两个分支均带完整等值条件；游标取自最后一个原始文档并做运行时校验（缺失/非法 `createdAt`/`_id` 时显式报错，不静默截断）；分页缓存版本升至 v2，旧 offset 缓存自动失效重拉。
- 引擎 `usePaginatedList`：generation 全闭环（loadInitial/refresh/syncFromCache 递增并校验，loadMore/后台重校验捕获校验，过期响应不得改状态或写缓存）；refresh 在首载期间不再并发；缓存恢复统一去重+重排。
- 引擎新增 `syncFromCache()`：编辑/删除/置顶后返回列表时从分页缓存恢复完整已加载深度（仓库写穿透已含变更），零网络、不覆盖深分页。
- 引擎新增后台重校验（`revalidateOnCacheRestore`，仅四个业务列表开启，首页保持冻结行为）：缓存命中后从顶部按旧 `nextCursor` 边界（`compareCursors`）重建已加载深度，跨设备新增可收敛，旧深度不丢失。
- 四个列表页 onShow 消费信号改为 `syncFromCache()`；tasks/moments 同时后台刷新 count。
- 筛选补页（memos/songs/tasks）：连续 4 页未命中即暂停并提供"继续翻找"手动入口；补页期间显示"正在翻找"中间态；仅数据穷尽后显示最终空状态。
- moments：进页自动补齐（上限 10 页/200 条）后才计算"今天就是/下一次"，未拉全时显示中性摘要"正在整理最近的小日子…"，绝不声称局部"下一次"。
- 统计三态（tasks/moments）：loading/ready/error 显式状态机——loading"正在整理…数量"、ready 显示真实数字、error"数量暂时没整理好"；不再用已加载数冒充全量。memos 简介计数改为 hasMore 感知文案（未加载完显示"已加载 N 张"）。

### 保留不变

- 首页行为、`entries.ts` rawOffset 查询、CloudBase CRUD/上传/临时链接/心动反应、路由与访问控制冻结状态均未改动。

### 发布阻断项（手动）

- 云控制台需为 `love_entries` 建立组合索引：`coupleId ASC + kind ASC + createdAt DESC + _id DESC`，否则 keyset 查询会报错。

### 验证命令

```bash
pnpm type-check
pnpm type-check:strict
pnpm scan:project-ui
pnpm scan:design-tokens
pnpm scan:ui-copy
pnpm build:mp-weixin
```

## 追加：分页异步一致性修正（2026-07-31，远端二次验收返工）

### 背景

远端验收（`9f27572`）判定 keyset 主体通过，但剩三处异步一致性问题：仓库写穿透可能被后台重校验覆盖、小日子自动补齐预算在主动刷新后不重置、云端统计请求存在旧响应覆盖新结果；另有游标边界比较使用 `localeCompare`（与 CloudBase `_id` ASCII 排序不同合同）及游标修复提示被包装层吞掉两处硬化项。

### 本次变更

- 分页缓存 payload 新增 `mutationRevision` 单调递增字段：读取时缺失规范为 0、存在则校验非负安全整数（非法整包判坏），对外合同为必填 `number`，全部写入持久化该字段；版本保持 v2 不升级。仓库 `upsert/remove` 写穿透仅在实际改写时 +1。
- 引擎四个网络路径（`loadInitial`/`refresh`/`loadMore`/后台重校验）统一在请求开始捕获 `generation + mutationRevision`，应用响应、改状态或写缓存前重新核验，任一过期即丢弃；引擎 `prependItem/replaceItem/removeItem` 同时递增 generation 与 revision。覆盖列表页内行内变更与隐藏期间编辑页写穿透两类窗口。
- 小日子页：`loadMoments` 主动刷新前重置自动补齐预算；onShow 信号路径同样重置并在 `syncFromCache()` 完成后主动恢复自动补齐（原 watcher 在 hasMore 不变时不会重触发）。
- 统计请求（tasks/moments）增加独立 requestId 守卫，仅最新请求可写状态；Task 勾选成功后保留本地即时增量并立即发起权威重数；重数失败不再把已确认数字降级为"数量暂时没整理好"。
- 新增中立模块 `src/services/pagination-cursor.ts`：`_id` 改用码元关系比较（替代 `localeCompare`），四页 `compareCursors` 统一接入。
- 游标修复提示真正可见：四个仓库 `wrapXxxCloudError` 对"部分旧记录暂时无法继续翻页，请先修复记录时间。"原样重抛；引擎 load-more 失败同时写 `errorMessage`，四页重试 footer 改为动态文案，重试时清除、成功后由 `updateStateFromPage` 清除。

### 保留不变

- 首页行为与 `rawOffset` 适配、产品范围、CloudBase CRUD/上传/临时链接/心动反应、路由及访问控制冻结状态均未改动；首页重试 footer 维持固定文案（首页无 keyset 游标错误路径）。

### 发布阻断项（手动，未变化）

- 云控制台需为 `love_entries` 建立组合索引：`coupleId ASC + kind ASC + createdAt DESC + _id DESC`。

### 验证命令

```bash
pnpm type-check
pnpm type-check:strict
pnpm scan:project-ui
pnpm scan:design-tokens
pnpm scan:ui-copy
pnpm scan:security-baseline
pnpm scan:access-control
pnpm build:mp-weixin
```
