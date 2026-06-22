# 审计问题修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将审计附件中确认的交互、反馈、数据一致性、日期校验、文案和响应式问题逐项修复。

**Architecture:** 保持现有 UniApp + Vue 3 + Wot UI + CloudBase 分层。优先修共享 composable / repository / design-system，再在页面接入；不得改变 `love_entries`、`coupleId: "main"`、`love-entries/main/`、owner-only Stage 1 边界。

**Tech Stack:** UniApp `mp-weixin`、Vue 3、TypeScript、Pinia、Wot Design Uni、SCSS、CloudBase native `wx.cloud` wrappers。

---

## 基线与执行约束

- 审计基线：默认分支提交 `1609632c69d2cd8cc09b8b2a5537fcf365e7e1bc`，提交信息“美化”。
- 本清单来源：`/Users/cc/.codex/attachments/6a3f84f5-366f-46f9-98b9-06815d1e97b0/pasted-text.txt`。
- 修复前必须阅读：`AGENTS.md`、`docs/AI_CODING_GUIDELINES.md`、`docs/AI_FEATURE_STYLE_GUIDELINES.zh-CN.md`。
- UI 修复必须继续使用 Wot UI 或既有 app 组件，不新增原生业务交互控件。
- 样式修复必须使用 `--app-*` token、`src/styles/mixins.scss` 或设计系统 token，不在页面/组件内写 raw hex、固定 `rpx/px`、直接阴影、固定动画时长。
- 文案必须是简体中文；删除、失败、权限和不可恢复提示以清楚克制优先。

## 文件责任图

- 反馈生命周期：`src/composables/useAppToast.ts:18`、`src/components/AppShell.vue:35`、`src/pages/song-edit/song-edit.vue:194`、`src/pages/task-edit/task-edit.vue:171`、`src/pages/memo-edit/memo-edit.vue:168`。
- 图片上传与预览：`src/composables/useFileUpload.ts:46`、`src/components/ImageGrid.vue:18`、`src/components/ImageGrid.vue:58`、`src/config/app.ts:14`。
- 回忆数据一致性：`src/services/repositories/entries.ts:199`、`src/services/repositories/entries.ts:207`、`src/services/repositories/entries.ts:227`、`src/pages/detail/detail.vue:435`。
- 日期校验：`src/pages/create/create.vue:149`、`src/pages/detail/detail.vue:222`、`src/pages/task-edit/task-edit.vue:173`、`src/services/repositories/tasks.ts:67`。
- 未保存离页：`src/components/AppCustomNav.vue:91`、`src/pages/song-edit/song-edit.vue:207`、`src/pages/task-edit/task-edit.vue:185`、`src/pages/memo-edit/memo-edit.vue:182`、`src/pages/detail/detail.vue:390`。
- 响应式布局：`src/components/AppOptionGroup.vue:19`、`src/pages/create/create.vue:438`、`src/pages/detail/detail.vue:806`、`src/pages/settings/settings.vue:21`、`src/pages/tasks/tasks.vue:55`、`src/pages/memos/memos.vue:53`、`src/pages/song-edit/song-edit.vue:110`、`src/pages/memo-edit/memo-edit.vue:82`。
- 文案与开发页：`src/pages/index/index.vue:24`、`src/pages/settings/settings.vue:19`、`src/pages/settings/settings.vue:154`、`src/pages/design-preview/design-preview.vue:9`、`src/pages.json:77`、`docs/DESIGN_SYSTEM.zh-CN.md:156`。

## 问题总表

| ID | 优先级 | 问题 | 主要定位 |
| --- | --- | --- | --- |
| FEEDBACK-001 | P1 | 成功 Toast 被保存后的 520ms 跳转或删除后的立即跳转截断，且 Toast host 绑定在每个页面 `AppShell` 内 | `src/composables/useAppToast.ts:18`, `src/components/AppShell.vue:35`, `src/pages/song-edit/song-edit.vue:194`, `src/pages/task-edit/task-edit.vue:171`, `src/pages/memo-edit/memo-edit.vue:168`, `src/pages/detail/detail.vue:517` |
| UPLOAD-001 | P1 | 用户取消选图被统一当作错误并弹出错误 Toast | `src/composables/useFileUpload.ts:46` |
| UPLOAD-002 | P1 | 图片达到 9 张后上传按钮仍可点击，满额错误只写入未消费的 `errorMessage` | `src/composables/useFileUpload.ts:71`, `src/pages/create/create.vue:111`, `src/pages/detail/detail.vue:170`, `src/config/app.ts:14` |
| DATA-001 | P1 | 删除回忆先删云文件再删数据库，数据库删除失败会留下“记录还在、照片已删”的半删除状态 | `src/services/repositories/entries.ts:227` |
| DATA-002 | P1 | 详情编辑先更新数据库再清理旧文件，旧文件清理失败会把已保存记录误报为保存失败 | `src/pages/detail/detail.vue:457`, `src/pages/detail/detail.vue:465`, `src/services/repositories/entries.ts:234` |
| UPLOAD-003 | P2 | 新增/详情编辑中图片预上传后，取消、返回、创建失败或保存失败会遗留未关联云文件 | `src/pages/create/create.vue:161`, `src/pages/create/create.vue:220`, `src/pages/detail/detail.vue:250`, `src/pages/detail/detail.vue:390`, `src/composables/useFileUpload.ts:90` |
| DATE-001 | P2 | 日期只校验 `YYYY-MM-DD` 正则，不校验真实年月日；`2026-99-99`、`2026-02-31` 可通过 | `src/pages/create/create.vue:149`, `src/pages/detail/detail.vue:222`, `src/pages/task-edit/task-edit.vue:173`, `src/services/repositories/tasks.ts:67` |
| NAV-001 | P2 | 已维护 `draftDirty` 的编辑页离开时无确认；自定义返回会直接 `navigateBack`，系统返回也未接入确认 | `src/components/AppCustomNav.vue:105`, `src/pages/song-edit/song-edit.vue:385`, `src/pages/task-edit/task-edit.vue:332`, `src/pages/memo-edit/memo-edit.vue:334`, `src/pages/detail/detail.vue:390` |
| UI-001 | P2 | 图片“移除”按钮可视与点击区域过小，且当前为原生 `button` | `src/components/ImageGrid.vue:18`, `src/components/ImageGrid.vue:127`, `src/design-system/size-resolver.ts:127` |
| UI-002 | P2 | 公共两列/三列选项组缺少窄屏、大字号或长标签降级 | `src/components/AppOptionGroup.vue:19`, `src/components/ThemeSwatchPicker.vue:2`, `src/pages/settings/settings.vue:21`, `src/pages/tasks/tasks.vue:55`, `src/pages/memos/memos.vue:53`, `src/pages/song-edit/song-edit.vue:110`, `src/pages/memo-edit/memo-edit.vue:82` |
| UI-003 | P2 | 新增页和详情编辑页“日期 + 心情”固定双列，缺少窄屏兜底 | `src/pages/create/create.vue:64`, `src/pages/create/create.vue:438`, `src/pages/detail/detail.vue:118`, `src/pages/detail/detail.vue:806` |
| UI-004 | P3 | 设置页字号预览轨道填充宽度固定，大字号时圆点移动但填充条不跟随 | `src/pages/settings/settings.vue:90`, `src/pages/settings/settings.vue:271` |
| COPY-001 | P2 | 首页存在测试残留“本人测试” | `src/pages/index/index.vue:24` |
| COPY-002 | P2 | `design-preview` 是已注册页面且包含大量开发文案；审计要求生产路由移除或仅开发环境开放 | `src/pages.json:77`, `src/pages/design-preview/design-preview.vue:9`, `docs/DESIGN_SYSTEM.zh-CN.md:156` |
| COPY-003 | P3 | 设置页仍有偏功能性文案，可在不牺牲可理解性的前提下柔化 | `src/pages/settings/settings.vue:19`, `src/pages/settings/settings.vue:51`, `src/pages/settings/settings.vue:74`, `src/pages/settings/settings.vue:129`, `src/pages/settings/settings.vue:154` |
| COPY-004 | P3 | 底层 CloudBase 错误文案仍出现“纪念”、`.env`、通用“操作没有完成”等技术或泛化表达 | `src/services/cloudbase.ts:78`, `src/services/cloudbase.ts:101`, `src/services/cloudbase.ts:167`, `src/services/cloudbase.ts:187`, `src/pages/task-edit/task-edit.vue:355`, `src/pages/memo-edit/memo-edit.vue:357` |

## 修复任务

### Task 1: FEEDBACK-001 跨页面成功反馈

**Files:**
- Modify: `src/composables/useAppToast.ts`
- Modify: `src/components/AppShell.vue`
- Modify: `src/pages/song-edit/song-edit.vue`
- Modify: `src/pages/task-edit/task-edit.vue`
- Modify: `src/pages/memo-edit/memo-edit.vue`
- Modify: `src/pages/detail/detail.vue`
- Create: `src/composables/useRouteFeedback.ts`
- Modify: `src/pages/songs/songs.vue`
- Modify: `src/pages/tasks/tasks.vue`
- Modify: `src/pages/memos/memos.vue`
- Modify: `src/pages/index/index.vue`

- [x] 建立一次性“目标页反馈”机制：保存/删除成功后先记录目标页应展示的成功文案，跳转完成并进入目标页后再调用 `showAppSuccess`。
- [x] 移除 `saveFeedbackDelayMs = 520`、`waitForSaveFeedback()` 和依赖固定延时等待 Toast 的流程。
- [x] 将歌曲、任务、备忘删除成功后的 Toast 改为目标页展示，避免 `showAppSuccess` 后立刻 `navigateBack()`。
- [x] 将回忆详情删除成功后的反馈改为首页展示；当前 `deleteCurrentEntry()` 成功后直接 `redirectTo`。
- [x] 保留当前列表页内状态切换 Toast 行为，因为 `songs` / `tasks` / `memos` 当前页内展示不涉及页面销毁。
- [ ] 验证：保存歌曲、保存任务、保存备忘、删除歌曲、删除任务、删除备忘、删除回忆后，目标页能完整显示成功 Toast。

### Task 2: UPLOAD-001 选图取消不报错

**Files:**
- Modify: `src/composables/useFileUpload.ts`

- [x] 在 `chooseImages()` 的 `fail` 回调中读取错误对象，识别 `cancel`、`abort`、用户取消等取消语义。
- [x] 取消选择时直接 resolve 空数组或抛出内部可识别的取消结果，`chooseAndUploadImages()` 不显示错误 Toast。
- [x] 非取消失败继续走 `getFriendlyErrorMessage()` 并显示错误。
- [ ] 验证：点击上传后取消相册，不出现“操作没有完成，请稍后再试。”；断网或权限失败仍有明确提示。

### Task 3: UPLOAD-002 图片满额反馈

**Files:**
- Modify: `src/composables/useFileUpload.ts`
- Modify: `src/pages/create/create.vue`
- Modify: `src/pages/detail/detail.vue`

- [x] 暴露 `maxUploadReached` 或 `remainingUploadCount`，由页面消费。
- [x] 图片达到 `appConfig.maxUploadCount` 时禁用上传 `wd-button`，按钮文案改为“照片已经放满啦”。
- [x] 禁用状态下不打开相册；同时在按钮旁保留“最多 9 张，已经放满啦”的静态提示，不只写入未消费的 `errorMessage`。
- [ ] 验证：9 张图片时新增页和详情编辑页上传按钮不可继续触发相册。

### Task 4: DATA-001 回忆删除一致性

**Files:**
- Modify: `src/services/repositories/entries.ts`
- Create: `src/services/cloud-file-cleanup.ts`
- Modify: `src/App.vue`

- [x] 不再使用“先删云文件、再删数据库”的顺序作为唯一删除流程。
- [x] 以数据库状态为主：先删除或标记删除记录，再清理文件；文件清理失败不能让已删除记录重新出现在列表。
- [x] 对清理失败的文件记录可重试信息，至少保证失败被记录到开发日志或本地待清理队列。
- [x] 删除成功后同步移除本地缓存中的回忆详情和列表项。
- [x] 检查 deleteFile 逐文件状态；部分成功只移除成功 fileID，失败项继续保留待重试。
- [ ] 验证：模拟 `deleteCloudFiles` 失败时，数据库记录不会处于“仍存在但图片已消失”的半删除状态。

### Task 5: DATA-002 编辑保存与旧文件清理拆分

**Files:**
- Modify: `src/pages/detail/detail.vue`
- Modify: `src/services/repositories/entries.ts`
- Modify: `src/services/cloud-file-cleanup.ts`

- [x] 将“保存记录成功”和“清理用户移除的旧文件”拆成两个结果。
- [x] `updateEntry()` 成功后立即更新页面、缓存和编辑状态；旧文件清理失败只提示温和的后台清理信息或记录重试，不显示“保存失败”。
- [x] `removedFiles` 清理成功后再清空；失败时保留可重试数据或写入待清理队列。
- [ ] 验证：模拟旧文件删除失败时，用户看到保存成功，旧文件清理问题不会导致重复提交。

### Task 6: UPLOAD-003 预上传孤儿文件回收

**Files:**
- Modify: `src/composables/useFileUpload.ts`
- Modify: `src/pages/create/create.vue`
- Modify: `src/pages/detail/detail.vue`

- [x] 区分原记录文件、本次新上传文件、待删除旧文件。
- [x] 新增页创建失败时保留草稿照片以便重试；返回或页面卸载时，回收本次新上传但未关联到已保存记录的文件。
- [x] 详情页保存失败时保留编辑草稿以便重试；取消编辑、返回或页面卸载时，回收本次编辑中新上传且未保存进记录的文件。
- [x] 避免误删原记录已有文件；原记录移除只进入待删除旧文件清单，本次新上传移除走未提交上传清理。
- [ ] 验证：新增页上传图片后直接返回，云端不会残留未关联文件；详情页上传新图后取消编辑，不影响原记录文件。

### Task 7: DATE-001 真实日期校验

**Files:**
- Create: `src/utils/date.ts`
- Modify: `src/pages/create/create.vue`
- Modify: `src/pages/detail/detail.vue`
- Modify: `src/pages/task-edit/task-edit.vue`
- Modify: `src/services/repositories/tasks.ts`

- [x] 增加共享日期校验：接受空值场景由调用方决定；非空值必须匹配 `YYYY-MM-DD` 且年月日回读一致。
- [x] `2026-02-29` 在非闰年失败，`2028-02-29` 通过，`2026-02-31` 和 `2026-99-99` 失败。
- [x] 新增页、详情编辑页、任务编辑页使用共享校验，不再只用正则。
- [x] 任务仓库排序中的 `validDueDate()` 使用同一校验，避免伪日期参与排序。
- [ ] 验证：输入非法真实日期时页面阻止保存并显示中文提示。

### Task 8: NAV-001 未保存离页确认

**Files:**
- Modify: `src/components/AppCustomNav.vue`
- Modify: `src/components/AppShell.vue`
- Modify: `src/pages/song-edit/song-edit.vue`
- Modify: `src/pages/task-edit/task-edit.vue`
- Modify: `src/pages/memo-edit/memo-edit.vue`
- Modify: `src/pages/detail/detail.vue`

- [x] 让 `AppCustomNav` 的返回事件可被页面拦截；页面确认允许后再执行默认返回。
- [x] 歌曲、任务、备忘编辑页复用已有 `draftDirty`，自定义返回按钮和系统返回都先弹 Wot MessageBox。
- [x] 详情编辑页补充 dirty 状态或 draft 快照比对，点击“取消”和返回时统一确认。
- [x] 确认文案使用克制小纸条语气：标题“这张纸条还没收好”，按钮“继续写”“不保存离开”。
- [ ] 验证：编辑任意字段后点左上返回、页面按钮返回、系统返回，都会先确认；未改动时直接返回。

### Task 9: UI-001 图片移除点击热区

**Files:**
- Modify: `src/components/ImageGrid.vue`
- Modify: `src/design-system/size-resolver.ts`
- Modify: `src/design-system/token-registry.ts`

- [x] 将原生 `button` 替换为 Wot `wd-button` 或已批准的 app-level control，并满足现有 UI library policy。
- [x] 保持小巧视觉外观，同时提供约 80rpx 的透明点击热区。
- [x] 点击热区不得遮挡图片预览主体交互。
- [ ] 验证：图片右下角“移除”在真机/微信开发者工具中易点，且 `pnpm scan:design-tokens` 通过。

### Task 10: UI-002 选项组响应式降级

**Files:**
- Modify: `src/components/AppOptionGroup.vue`
- Modify: `src/components/ThemeSwatchPicker.vue`
- Modify: `src/pages/settings/settings.vue`
- Modify: `src/pages/tasks/tasks.vue`
- Modify: `src/pages/memos/memos.vue`
- Modify: `src/pages/song-edit/song-edit.vue`
- Modify: `src/pages/memo-edit/memo-edit.vue`
- Modify: `src/pages/design-preview/design-preview.vue`

- [x] 为 `AppOptionGroup` 增加响应式策略：三列在窄屏或大字号下降到两列/单列，两列在空间不足时降到单列。
- [x] 不破坏 `ThemeSwatchPicker` 的两列色板默认体验；色板可使用单独 variant 或 prop 指定降级方式。
- [x] 所有调用点显式选择合理策略，避免未来长标签默认挤压。
- [ ] 验证：窄屏、大字号、紧凑模式下选项文字不重叠、不截断、不出现高度突兀错位。

### Task 11: UI-003 日期与心情双列降级

**Files:**
- Modify: `src/pages/create/create.vue`
- Modify: `src/pages/detail/detail.vue`

- [x] 将 `.paper-tag-row` 固定双列改为可降级布局。
- [x] 在窄屏、大字号或字段内容较长时切换为单列。
- [x] 保持现有视觉节奏，不引入 raw spacing。
- [ ] 验证：新增页、详情编辑页在窄屏和大字号下日期/心情输入不拥挤。

### Task 12: UI-004 字号预览轨道

**Files:**
- Modify: `src/pages/settings/settings.vue`

- [x] 让 `.font-card__rail-fill` 宽度随 `theme.fontScale` 与圆点位置同步。
- [x] 标准与偏大状态都应表现为“填充条连接到圆点”。
- [ ] 验证：切换字号后轨道填充和圆点无脱节感。

### Task 13: COPY-001 删除首页测试残留

**Files:**
- Modify: `src/pages/index/index.vue`

- [x] 移除或替换 `本人测试`。
- [x] 替换时使用符合产品语气且不暴露测试状态的文案，例如“私密”或“小树洞”。
- [ ] 验证：`pnpm scan:ui-copy` 通过，首页首屏无测试残留。

### Task 14: COPY-002 限制开发预览页

**Files:**
- Modify: `src/pages.json`
- Modify: `src/pages/design-preview/design-preview.vue`
- Modify: `docs/DESIGN_SYSTEM.zh-CN.md`

- [ ] 从生产 `src/pages.json` 中移除 `pages/design-preview/design-preview` 注册，保留源文件作为开发参考页面。
- [ ] 文档明确该源文件不属于生产用户路径；需要开发 QA 时通过临时开发注册或本地分支使用。
- [ ] 确认设置页仍不暴露入口。
- [ ] 验证：生产构建可用，开发 QA 仍有可访问的设计系统预览方式。

### Task 15: COPY-003 设置页功能文案柔化

**Files:**
- Modify: `src/pages/settings/settings.vue`

- [ ] 柔化设置页提示文案，同时保留可理解性。
- [ ] 可保留必要功能词，如“浅色”“深色”“标准”“偏大”；不要为了俏皮牺牲设置含义。
- [ ] 云环境状态可改为更贴近产品语气，但不能隐藏配置缺失状态。
- [ ] 验证：设置页仍能清楚表达外观、密度、字号、云端配置状态。

### Task 16: COPY-004 CloudBase 错误文案分域

**Files:**
- Modify: `src/services/cloudbase.ts`
- Modify: `src/services/repositories/songs.ts`
- Modify: `src/services/repositories/tasks.ts`
- Modify: `src/services/repositories/memos.ts`
- Modify: `src/pages/task-edit/task-edit.vue`
- Modify: `src/pages/memo-edit/memo-edit.vue`

- [ ] 避免 song/task/memo 页面把底层“纪念”错误直接展示给用户。
- [ ] `.env`、`VITE_CLOUDBASE_ENV_ID` 等技术细节只在开发日志或开发诊断页展示，用户 Toast 使用克制中文。
- [ ] 保留足够诊断信息在 `CloudBaseUserError.causeDetail` 或开发日志中，避免排障信息丢失。
- [ ] 验证：保存歌曲、任务、备忘失败时分别显示对应业务文案；开发模式仍可定位原始 cause。

## 审计中提到但不列为缺陷的例外

- 首页宠物导航气泡是定制浮层，当前支持遮罩关闭，且使用 Wot 按钮；不需要强制替换为 Wot 弹窗。
- `EmptyState` 是项目级空状态组件，符合当前风格，不需要替换为第三方组件。
- `uni.chooseImage` 与 `uni.previewImage` 是平台图片能力，可以保留；本清单只要求修复取消误报和满额反馈。
- 删除确认弹窗不应自动关闭；当前使用 Wot MessageBox，保持用户明确确认/取消是正确方向。

## 统一验证清单

- [ ] `pnpm scan:ui-copy`
- [ ] `pnpm scan:design-tokens`
- [ ] `pnpm type-check`
- [ ] `pnpm type-check:strict`
- [ ] `pnpm build:mp-weixin`
- [ ] `git diff --check`
- [ ] 构建产物仍包含 CloudBase envId：`love-d4g006mox4b78e5c6`
- [ ] 构建产物仍包含 AppID：`wx04b0ef4f0de5c5c5`
- [ ] 仓库无 AppSecret / appsecret。
- [ ] 仓库无 UnoCSS。
- [ ] 重点手动回归：相册取消、9 张满额、弱网删除、文件删除失败、保存后返回、系统返回、大字号、紧凑模式、窄屏、深色模式。
