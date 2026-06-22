# 最终 UI 修复收口报告

## 1. Metadata

- 审计时间：2026-06-23 07:24:30 CST
- 分支：`main`
- 提交：`7f796005e9c86dddd7d198d51a256e90406d09b4`
- 工作区状态：
  - 报告生成前：`git status --short` 无输出，工作区干净。
  - 报告生成后：仅新增本文件；未修改 `src/**`、`scripts/**`、package、`src/pages.json`、设计系统、CloudBase 或构建配置。
- 审计类型：audit-only closure pass；源码静态审计 + 项目验证命令；未进行微信开发者工具或真机验证。
- 验证命令：
  - `git status --short`
  - `git rev-parse --abbrev-ref HEAD`
  - `git rev-parse HEAD`
  - `pnpm scan:ui-copy`
  - `pnpm scan:design-tokens`
  - `pnpm type-check`
  - `pnpm type-check:strict`
  - `pnpm build:mp-weixin`
  - `git diff --check`
  - 指定 `rg` 源码复扫与 AppID / CloudBase envId / AppSecret / UnoCSS 检查。

## 2. Overall decision

`GO_WITH_MANUAL_QA`

自动验证通过，关键源码证据已覆盖本轮收口范围；但微信开发者工具、真机、弱网、CloudBase 失败注入、系统返回与 WXSS 实际渲染仍未跑，不能标记为完全 GO。

## 3. Completed items

| area | task/finding | status | evidence file/path | validation status | notes |
| --- | --- | --- | --- | --- | --- |
| 反馈 | FEEDBACK-001 保存/删除后目标页反馈 | 源码证据完成 | `src/composables/useRouteFeedback.ts`; `src/pages/song-edit/song-edit.vue`; `src/pages/task-edit/task-edit.vue`; `src/pages/memo-edit/memo-edit.vue`; `src/pages/detail/detail.vue`; `src/pages/index/index.vue`; `src/pages/songs/songs.vue`; `src/pages/tasks/tasks.vue`; `src/pages/memos/memos.vue` | 自动验证通过；手动未跑 | `setRouteSuccessFeedback` 写入一次性反馈，目标页 `consumeRouteFeedback` 展示；Toast host 仍需 DevTools/真机确认生命周期。 |
| 上传 | UPLOAD-001 取消选图不报错 | 源码证据完成 | `src/composables/useFileUpload.ts` | 自动验证通过；手动未跑 | `chooseImage` fail 识别 `cancel/canceled/cancelled/abort/用户取消` 并 resolve 空数组。 |
| 上传 | UPLOAD-002 9 张满额反馈 | 源码证据完成 | `src/composables/useFileUpload.ts`; `src/pages/create/create.vue`; `src/pages/detail/detail.vue` | 自动验证通过；手动未跑 | `maxUploadReached` / `remainingUploadCount` 被页面消费，上传按钮禁用并显示“照片已经放满啦”。 |
| 数据一致性 | DATA-001 删除回忆先删库后清理文件 | 源码证据完成 | `src/services/repositories/entries.ts`; `src/services/cloud-file-cleanup.ts`; `src/App.vue` | 自动验证通过；手动未跑 | `deleteEntry` 先 `removeDocument` 和清缓存，再将文件入队清理；失败保留队列待重试。 |
| 数据一致性 | DATA-001 per-file delete follow-up | 源码证据完成 | `src/services/cloudbase.ts`; `src/services/cloud-file-cleanup.ts` | 自动验证通过；手动未跑 | `deleteCloudFilesWithResult` 记录 `deletedFileIDs` 与 `failures`；部分失败保留待重试。 |
| 数据一致性 | DATA-002 编辑保存与旧文件清理拆分 | 源码证据完成 | `src/pages/detail/detail.vue`; `src/services/repositories/entries.ts`; `src/services/cloud-file-cleanup.ts` | 自动验证通过；手动未跑 | `updateEntry` 成功后先刷新页面/缓存/编辑态，再将移除旧文件入队清理。 |
| 上传 | UPLOAD-003 预上传孤儿文件回收 | 源码证据完成 | `src/composables/useFileUpload.ts`; `src/pages/create/create.vue`; `src/pages/detail/detail.vue` | 自动验证通过；手动未跑 | 新上传文件以 `uncommittedUploadedFileIDs` 跟踪；保存成功 mark committed；返回/取消/卸载入队清理。 |
| 日期 | DATE-001 真实日期校验 | 源码证据完成 | `src/utils/date.ts`; `src/pages/create/create.vue`; `src/pages/detail/detail.vue`; `src/pages/task-edit/task-edit.vue`; `src/services/repositories/tasks.ts` | 自动验证通过；手动未跑 | `isValidCalendarDate` 校验真实年月日；任务空 due date 允许，详情空日期阻止。 |
| 导航 | NAV-001 未保存离页确认 | 源码证据完成 | `src/components/AppCustomNav.vue`; `src/components/AppShell.vue`; `src/pages/song-edit/song-edit.vue`; `src/pages/task-edit/task-edit.vue`; `src/pages/memo-edit/memo-edit.vue`; `src/pages/detail/detail.vue` | 自动验证通过；手动未跑 | 自定义返回通过 `nav-auto-back=false` 交给页面；系统返回接 `onBackPress`；需真机确认系统返回行为。 |
| UI | UI-001 图片移除点击热区 | 源码证据完成 | `src/components/ImageGrid.vue` | 自动验证通过；手动未跑 | 移除控件使用 Wot `wd-button`，热区使用 `--app-image-remove-touch-size`。 |
| UI | UI-002 选项组响应式降级 | 源码证据完成 | `src/components/AppOptionGroup.vue`; `src/components/ThemeSwatchPicker.vue`; `src/pages/settings/settings.vue`; `src/pages/tasks/tasks.vue`; `src/pages/memos/memos.vue`; `src/pages/songs/songs.vue`; `src/pages/song-edit/song-edit.vue`; `src/pages/task-edit/task-edit.vue`; `src/pages/memo-edit/memo-edit.vue`; `src/pages/design-preview/design-preview.vue` | 自动验证通过；手动未跑 | 所有复扫命中的业务 call site 已显式 `responsive`；`AppOptionGroup` 不再命中 `:deep(text)`。 |
| UI | UI-003 日期/心情双列降级 | 源码证据完成 | `src/pages/create/create.vue`; `src/pages/detail/detail.vue` | 自动验证通过；手动未跑 | `.paper-tag-row` 使用 `auto-fit + minmax(min(...))`；需要 DevTools/真机确认 WXSS 兼容。 |
| UI | UI-004 字号预览轨道 | 源码证据完成 | `src/pages/settings/settings.vue` | 自动验证通过；手动未跑 | `font-card__rail-fill--large` 与 dot 位置联动；视觉仍需 DevTools/真机确认。 |
| 文案 | COPY-001 首页测试残留 | 源码证据完成 | `src/pages/index/index.vue` | `rg -n "本人测试" src` 无输出；`pnpm scan:ui-copy` 通过 | 首页 stamp 当前为“私密”。 |
| 文档/产品边界 | COPY-002 owner-only design-preview 决策 | 源码证据完成 | `docs/DESIGN_SYSTEM.zh-CN.md`; `src/pages.json` | 自动验证通过 | 文档记录 `design-preview` 是 owner-only QA 页面，不是公开功能入口。 |
| 文案 | COPY-004 CloudBase 错误文案分域 | 源码证据完成 | `src/services/cloudbase.ts`; `src/services/repositories/songs.ts`; `src/services/repositories/tasks.ts`; `src/services/repositories/memos.ts`; `src/pages/task-edit/task-edit.vue`; `src/pages/memo-edit/memo-edit.vue` | 指定旧错误文案扫描无输出；自动验证通过 | `.env` / `VITE_CLOUDBASE_ENV_ID` 仅出现在配置读取、类型声明和 DEV 日志。 |
| 表单一致性 | task-edit 标题输入 P1 | 源码证据完成 | `src/pages/task-edit/task-edit.vue`; `src/styles/mixins.scss` | 自动验证通过；手动未跑 | 标题输入已改用 `wot-paper-input-root` 与 `wot-paper-title-input-inner`，不再命中 `wot-paper-inline-input-root`。 |
| 表单一致性 | song-edit 标题输入 | 源码证据完成 | `src/pages/song-edit/song-edit.vue` | 自动验证通过；手动未跑 | 保留书名号装饰，输入本体使用同一 title input 规则。 |
| 表单一致性 | memo-edit 标题输入 | 源码证据完成 | `src/pages/memo-edit/memo-edit.vue` | 自动验证通过；手动未跑 | 标题输入使用同一 title input 规则。 |
| 选项组 follow-up | `:deep(text)` 与漏掉 call site | 源码证据完成 | `src/components/AppOptionGroup.vue`; `src/pages/songs/songs.vue`; `src/pages/task-edit/task-edit.vue` | 指定扫描未命中 `:deep(text)`；自动验证通过 | `rg "*"` 的噪声仅来自 TS 乘法、CSS 注释和 `calc()`。 |
| 删除按钮一致性 | task/memo delete loading/disabled | 源码证据完成 | `src/pages/task-edit/task-edit.vue`; `src/pages/memo-edit/memo-edit.vue` | 自动验证通过；手动未跑 | 两处删除按钮均有 `:loading="deleting"` 和保存/已保存/删除中 disabled。 |
| 设置文案 | COPY-003 设置页柔化 | 源码证据显示已柔化；task.md 未勾选 | `src/pages/settings/settings.vue`; `task.md` | `pnpm scan:ui-copy` 通过；手动未跑 | 当前页面文案已是“小纸样本 / 悄悄设置 / 小纸样颜色 / 云端小仓库”。本次 audit-only 未改 task.md checkbox。 |

## 4. Remaining manual QA

| area | scenario | priority | platform | status | expected result |
| --- | --- | --- | --- | --- | --- |
| 反馈 | save/delete song | P2 | DevTools + real device | not run | 返回小歌单后成功 Toast 完整显示，不被页面销毁截断。 |
| 反馈 | save/delete task | P2 | DevTools + real device | not run | 返回小清单后成功 Toast 完整显示。 |
| 反馈 | save/delete memo | P2 | DevTools + real device | not run | 返回小档案后成功 Toast 完整显示。 |
| 反馈 | delete memory | P2 | DevTools + real device | not run | 回到首页后成功 Toast 完整显示。 |
| 上传 | cancel picker | P2 | DevTools + real device | not run | 取消相册/相机不出现错误 Toast。 |
| 上传 | 9 image max | P2 | DevTools + real device | not run | 第 9 张后上传按钮禁用，文案显示满额。 |
| 上传 | 8 to 9 image transition | P2 | DevTools + real device | not run | 第 9 张上传成功后按钮立即进入满额状态。 |
| 上传 | 9 to 8 removal | P2 | DevTools + real device | not run | 移除一张后上传按钮恢复可用。 |
| 上传 | abandoned upload cleanup | P2 | CloudBase + real device | not run | 新增页上传后直接返回，未关联云文件被加入清理队列并可重试。 |
| 上传 | detail edit upload cancel/save/fail boundaries | P2 | CloudBase + real device | not run | 取消编辑清理新上传；保存失败保留草稿；保存成功不误删原文件。 |
| 数据一致性 | delete memory with file cleanup failure | P2 | CloudBase failure injection | not run | 记录删除成功后不再出现，文件清理失败仅进入待重试队列。 |
| 数据一致性 | old file cleanup failure after edit save | P2 | CloudBase failure injection | not run | 保存成功状态不被旧文件清理失败改成保存失败。 |
| 数据一致性 | per-file delete partial success | P2 | CloudBase failure injection | not run | 成功删除项移出队列，失败项保留待重试。 |
| 日期 | create blank date fallback | P2 | DevTools + real device | not run | 新增页空日期使用当天日期。 |
| 日期 | detail blank date blocked | P2 | DevTools + real device | not run | 详情编辑空日期阻止保存并提示中文。 |
| 日期 | task blank due date allowed | P2 | DevTools + real device | not run | 小约定空 due date 可保存。 |
| 日期 | 2026-02-31 / 2026-99-99 blocked | P2 | DevTools + real device | not run | 非真实日期阻止保存。 |
| 日期 | 2028-02-29 allowed | P2 | DevTools + real device | not run | 闰年日期允许保存。 |
| 导航 | dirty leave confirmation for song/task/memo/detail | P2 | DevTools + real device | not run | 修改后离开先弹 Wot MessageBox。 |
| 导航 | custom nav back | P2 | DevTools + real device | not run | 左上返回被页面拦截，确认后再离开。 |
| 导航 | system back | P2 | Android/iOS real device | needs real device | 系统返回触发同一未保存确认。 |
| 导航 | cancel button in detail edit | P2 | DevTools + real device | not run | 有改动时先确认，无改动时直接取消编辑。 |
| UI | task/song/memo title input padding | P2 | DevTools + real device | not run | 标题文字、placeholder 内距舒适，与 create/detail 视觉一致。 |
| UI | create/detail paper fields | P2 | DevTools + real device | not run | 标题/正文/日期/心情字段不拥挤、不截断。 |
| UI | image remove tap target | P2 | real device | needs real device | 右下角“移除”易点且不误触图片预览主体。 |
| UI | option group responsive layout | P2 | DevTools + real device | not run | 窄屏、大字号、紧凑模式下不重叠、不截断。 |
| UI | date/mood row responsive layout | P2 | DevTools + real device | not run | 小屏或大字号下降级为稳定布局。 |
| UI | settings font rail | P2 | DevTools + real device | not run | 切换字号时填充条和圆点对齐。 |
| 文案 | homepage stamp no test copy | P3 | DevTools | not run | 首页首屏显示“私密”，无“本人测试”。 |
| 文案 | design-preview owner-only decision accepted | P3 | Source + product review | run/pass for source | 继续保留为 owner-only QA 页面，不进普通入口推广。 |
| 文案 | CloudBase errors are domain-specific | P2 | CloudBase failure injection | not run | 点歌/任务/备忘错误分别显示业务域中文提示。 |
| 文案 | settings copy if still not softened | P3 | Product review | source pass; manual not run | 当前源码已柔化，若产品仍觉得偏功能化再另起 COPY-003。 |

## 5. Remaining issues

| ID | priority | issue | evidence | recommendation | can defer? |
| --- | --- | --- | --- | --- | --- |
| R-001 | P2 | 手动 QA 未完成，尤其是系统返回、Toast 生命周期、相册取消、CloudBase 删除失败和真机 tap target。 | 本报告未接入 WeChat DevTools、真机或 CloudBase failure injection。 | 先跑微信开发者工具/真机 QA 矩阵。 | 否，发布前不建议跳过。 |
| R-002 | P2 | WXSS 兼容仍需实机确认：`min()` 嵌套 `minmax()`、Wot 内部类名 `:deep(.wd-input__*)` / `:deep(.wd-button__*)`。 | `src/components/AppOptionGroup.vue`; `src/pages/create/create.vue`; `src/pages/detail/detail.vue`; title/input/ImageGrid 样式。 | 在 DevTools 编译后的 WXSS 和真机页面检查；若失败再改保守 fallback。 | 发布前不建议跳过。 |
| R-003 | P3 | `AppOptionButton` 仍是项目级原生 `<button>` wrapper。 | `src/components/AppOptionButton.vue:2`; 指定 `<button>` 扫描唯一命中。 | 保持为已批准 app-level wrapper 例外；未来若执行零原生控件策略再迁移。 | 是。 |
| R-004 | P3 | 仍有一个旧回忆 fallback 文案“未命名纪念”。 | `rg -n "纪念" src` 仅命中 `src/services/repositories/entries.ts:122`。 | 后续文案清理时改为“未命名回忆”或“小回忆”；不阻塞本轮错误文案分域。 | 是。 |
| R-005 | P3 | `task.md` 的 COPY-003 checkbox 仍未勾选，但当前 settings 源码已较明显柔化。 | `task.md`; `src/pages/settings/settings.vue`。 | 不在本轮 audit-only 中改 checkbox；若需要正式关闭 COPY-003，单独确认后更新。 | 是。 |

P0/P1：本轮收口审计未发现实际 blocker。

## 6. Risk notes

- WeChat DevTools warnings：未运行 DevTools，因此未采集编译器、基础库、体验评分、WXSS 或运行时 warning。
- CloudBase timeout/network：源码已做业务域错误包装和文件清理重试队列；但弱网、超时、部分删除成功需要 CloudBase failure injection 验证。
- WXSS selector risk：自动构建通过，但 `min()` / `auto-fit` / `:deep()` / Wot 内部类名仍属于 Mini Program 端实机风险面。
- Owner-only design-preview：`docs/DESIGN_SYSTEM.zh-CN.md` 已接受 `pages/design-preview/design-preview` 继续注册并可见；该页不是公开功能或常规入口。
- AppSecret：源码/package/config/build 检查未命中 AppSecret。文档中的 AppSecret 只作为禁止项说明，不计入源码泄漏。
- UnoCSS：源码/package/config 检查未命中 UnoCSS；`pnpm-lock.yaml` 中 `sunos` 字符串不是 UnoCSS。

## 7. Recommended next step

run WeChat DevTools/real-device QA first

## 8. Appendix: command output summary

| command | result | summary |
| --- | --- | --- |
| `git status --short` | pass | 报告生成前无输出，工作区干净。 |
| `git rev-parse --abbrev-ref HEAD` | pass | `main` |
| `git rev-parse HEAD` | pass | `7f796005e9c86dddd7d198d51a256e90406d09b4` |
| `rg -n "本人测试" src` | pass | 无输出。 |
| `rg -n "message\\.includes\\(\"纪念\"\\)|message\\.includes\\('纪念'\\)" src` | pass | 无输出。 |
| `rg -n "读取纪念|保存纪念|更新纪念|删除纪念" src` | pass | 无输出。 |
| `rg -n "\\.env|VITE_CLOUDBASE_ENV_ID" src` | warning only | 命中 `src/config/app.ts`、`src/env.d.ts`、DEV 日志和 `import.meta.env.DEV`；未见普通用户 Toast 技术泄漏。 |
| `rg -n "<input|<textarea|<checkbox|<radio|<switch|<picker|<slider|<form" src/pages src/components` | pass | 无输出。 |
| `rg -n "<button" src/pages src/components` | warning only | 仅命中 `src/components/AppOptionButton.vue:2`，为项目级 wrapper 例外。 |
| `rg -n "wot-paper-inline-input-root" src/pages src/components` | pass | 无输出。 |
| `rg -n ":deep\\(text\\)|:deep\\([^)]*> \\*\\)|\\*" src/pages src/components` | warning only | 未命中目标 `:deep(text)` / `:deep(... > *)`；输出为 TS 乘法、CSS 注释、`calc()` 等噪声。 |
| `rg -n "uni.showToast|uni.showModal|uni.showLoading|uni.showActionSheet" src` | pass | 无输出。 |
| `rg -n "wd-message-box|wd-toast|showAppSuccess|showAppWarning|showAppError|useMessage" src` | pass | 命中均为 Wot/app feedback wrapper。 |
| `pnpm scan:ui-copy` | pass | `No likely English user-facing strings found.` |
| `pnpm scan:design-tokens` | pass | `No likely hardcoded design-token violations found.` |
| `pnpm type-check` | pass | `vue-tsc --noEmit` exit 0。 |
| `pnpm type-check:strict` | pass | `vue-tsc --noEmit -p tsconfig.strict.json` exit 0。 |
| `pnpm build:mp-weixin` | pass | `DONE Build complete.` |
| CloudBase envId / AppID check | pass | `dist/build/mp-weixin/config/app.js` 含 `love-d4g006mox4b78e5c6` 与 `wx04b0ef4f0de5c5c5`；`dist/build/mp-weixin/project.config.json` 含 AppID。 |
| AppSecret check | pass | `src dist/build/mp-weixin package.json vite.config.ts src/pages.json src/manifest.json .env .env.example` 无输出。 |
| UnoCSS check | pass | `src package.json vite.config.ts src/pages.json src/manifest.json` 无输出。 |
| `git diff --check` | pass | 无输出。 |
