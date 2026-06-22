# UI 表单与交互一致性审计报告

## 2. Metadata

- 审计日期：2026-06-22
- 当前分支：`main`
- 当前提交：`9cabd1d19e6a666540c8ac51a330cd7ceb6dc1dd`
- 工作区是否干净：否。审计开始前已有 `src/components/AppOptionGroup.vue` 未提交修改；本审计未修改该文件。
- 审计方式：源码静态审计 + 项目扫描/类型检查/构建验证；未进行微信开发者工具或真机视觉走查。
- 源码是否改动：否。仅新增本审计报告。
- 验证命令：
  - `git status --short`
  - `git rev-parse --abbrev-ref HEAD`
  - `git rev-parse HEAD`
  - `rg -n "<input|<textarea|<button|<checkbox|<radio|<switch|<picker|<slider|<form" src`
  - `rg -n "wd-input|wd-textarea|custom-input-class|custom-textarea-class|custom-textarea-container-class|custom-class=" src/pages src/components`
  - `rg -n "uni.showToast|uni.showModal|uni.showLoading|uni.showActionSheet|wd-message-box|wd-toast|showAppSuccess|showAppWarning|showAppError|useMessage" src`
  - `rg -n ":deep\\(|\\*|:has\\(|rgba\\(|#[0-9a-fA-F]{3,8}|[0-9]+rpx|[0-9]+px" src/pages src/components`
  - `pnpm scan:ui-copy`
  - `pnpm scan:design-tokens`
  - `pnpm type-check`
  - `pnpm type-check:strict`
  - `pnpm build:mp-weixin`
  - `rg -n "appsecret|AppSecret|APPSECRET|secret" src dist/build/mp-weixin package.json vite.config.ts`
  - `rg -n "uno|unocss|UnoCSS" src package.json vite.config.ts`
  - `rg -n "love-d4g006mox4b78e5c6|wx04b0ef4f0de5c5c5" src/manifest.json dist/build/mp-weixin/config dist/build/mp-weixin/project.config.json .env .env.example`
  - `git diff --check`

## 3. Executive summary

- 发现问题总数：13
- P0：0
- P1：1
- P2：8
- P3：4
- 本轮是否修改源代码：否，仅新增审计文档。
- 最高优先级结论：`src/pages/task-edit/task-edit.vue` 的“小约定票根”标题输入虽然使用 `wd-input`，但视觉结构与“写下此刻”创建页的基线表单不同，标题输入根使用 `wot-paper-inline-input-root`，该 mixin 明确将根内边距置零，导致输入与占位文字不像创建/详情页的纸条输入一样拥有统一舒适的内边距。

## 4. Confirmed screenshot issue

用户观察到的“小约定票根”标题输入内边距不足问题成立。

- 问题字段：`src/pages/task-edit/task-edit.vue:48` 的 `#task-title-field`。
- 输入组件：`src/pages/task-edit/task-edit.vue:51` 的 `wd-input`。
- 自定义类：`src/pages/task-edit/task-edit.vue:58` `task-title-slip__input-root`，`src/pages/task-edit/task-edit.vue:59` `task-title-slip__input-inner`。
- 包裹层样式：`src/pages/task-edit/task-edit.vue:635` `.task-title-slip` 使用独立票根容器；`src/pages/task-edit/task-edit.vue:638` 只在容器层使用 `var(--app-field-padding-x)`。
- 分歧选择器：`src/pages/task-edit/task-edit.vue:673` `:deep(.task-title-slip__input-root)` 使用 `@include wot-paper-inline-input-root`。
- 根因 mixin：`src/styles/mixins.scss:43` 的 `wot-paper-inline-input-root` 在 `src/styles/mixins.scss:47` 设置 `padding: var(--app-space-0)`。
- 创建页基线：`src/pages/create/create.vue:33` `#create-title-field` 使用 `paper-field paper-field--title`；`src/pages/create/create.vue:41` `paper-field__input-root paper-field__input-root--title`；`src/pages/create/create.vue:42` `paper-field__input-inner paper-field__input-inner--title`。
- 创建页基线样式：`src/pages/create/create.vue:432` 将 `.paper-field__input-root` 接入 `wot-paper-input-root`；`src/styles/mixins.scss:34` 到 `src/styles/mixins.scss:40` 的 `wot-paper-input-root` 包含 `padding: var(--app-space-0) var(--app-field-padding-x)`；`src/pages/create/create.vue:455` 标题内层使用 `wot-paper-title-input-inner`。
- 详情编辑基线：`src/pages/detail/detail.vue:94` 到 `src/pages/detail/detail.vue:103` 与创建页保持同一 `paper-field` 结构；`src/pages/detail/detail.vue:916` 到 `src/pages/detail/detail.vue:940` 复用同一套 mixin。
- 任务备注与日期字段：`src/pages/task-edit/task-edit.vue:80` 的备注 `wd-textarea` 和 `src/pages/task-edit/task-edit.vue:98` 的日期 `wd-input` 使用 `task-field__textarea-root` / `task-field__input-root`，在 `src/pages/task-edit/task-edit.vue:721` 到 `src/pages/task-edit/task-edit.vue:746` 接入纸条字段 mixin，问题轻于标题字段，但仍是页面私有类体系。
- 推荐修复方向：优先在下一轮修复 `task-edit` 标题字段，让其复用创建/详情页的 paper-field 结构或扩展共享 mixin，使任务、点歌、备忘标题输入共享同一根内边距、标题内层字号、占位 inset、禁用态和焦点稳定规则；若后续复用点超过 2 个，再抽 `AppPaperField`。

## 5. Native control inventory

| ID | priority | file | line | control | classification | reason | recommended action |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| NC-001 | P3 | `src/components/AppOptionButton.vue` | 2 | `<button>` | Existing app-level wrapper | 这是项目级选项按钮封装，页面未直接使用原生按钮；但源码层仍是原生 `button`，会被原生控件扫描命中。 | 保持为显式项目例外，或在后续按钮统一阶段评估改为 Wot `wd-button` 封装；不要在页面新增原生控件。 |

结论：页面与业务组件中未发现原生 `<input>`、`<textarea>`、`<checkbox>`、`<radio>`、`<switch>`、`<picker>`、`<slider>`、`<form>`。唯一原生交互控件位于项目级 `AppOptionButton` wrapper。

## 6. Wot input/textarea inventory

| ID | page/component | field | component | custom classes | mixins used | padding status | consistency result | recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WOT-001 | `src/pages/create/create.vue:35` | 回忆标题 | `wd-input` | `custom-class="paper-field__input-root paper-field__input-root--title"`；`custom-input-class="paper-field__input-inner paper-field__input-inner--title"` | `wot-paper-input-root`、`wot-paper-control-value`、`wot-paper-input-inner`、`wot-paper-title-input-inner` | 根内边距来自 `--app-field-padding-x`；标题内层高度/字号来自 token | 通过，当前 canonical baseline | 保持为标题输入基线。 |
| WOT-002 | `src/pages/create/create.vue:50` | 回忆正文 | `wd-textarea` | `paper-field__textarea-root`；`paper-field__textarea-box`；`paper-field__textarea-inner` | `wot-paper-input-root`、`wot-paper-textarea-root`、`wot-paper-control-value`、`wot-paper-textarea-inner` | 根 padding 和 textarea inner 高度均 token 化 | 通过 | 保持为长文本基线。 |
| WOT-003 | `src/pages/create/create.vue:67` | 回忆日期 | `wd-input` | `paper-field__input-root`；`paper-field__input-inner` | `wot-paper-input-root`、`wot-paper-control-value`、`wot-paper-input-inner` | 通过 | 与创建页基线一致 | 保持。 |
| WOT-004 | `src/pages/create/create.vue:82` | 心情 | `wd-input` | `paper-field__input-root`；`paper-field__input-inner` | `wot-paper-input-root`、`wot-paper-control-value`、`wot-paper-input-inner` | 通过 | 与创建页基线一致 | 保持。 |
| WOT-005 | `src/pages/detail/detail.vue:96` | 详情编辑标题 | `wd-input` | `paper-field__input-root paper-field__input-root--title`；`paper-field__input-inner paper-field__input-inner--title` | 同 WOT-001 | 通过 | 与创建页标题一致 | 保持。 |
| WOT-006 | `src/pages/detail/detail.vue:111` | 详情编辑正文 | `wd-textarea` | `paper-field__textarea-root`；`paper-field__textarea-box`；`paper-field__textarea-inner` | 同 WOT-002 | 通过 | 与创建页正文一致 | 保持。 |
| WOT-007 | `src/pages/detail/detail.vue:128` / `src/pages/detail/detail.vue:143` | 详情编辑日期/心情 | `wd-input` | `paper-field__input-root`；`paper-field__input-inner` | `wot-paper-input-root`、`wot-paper-control-value`、`wot-paper-input-inner` | 通过 | 与创建页基线一致 | 保持。 |
| WOT-008 | `src/pages/song-edit/song-edit.vue:50` | 歌名标题 | `wd-input` | `song-title-slip__input-root`；`song-title-slip__input-inner` | `wot-paper-inline-input-root`、`wot-paper-control-value`、`wot-paper-input-inner` | 容器有 padding，但 input root 自身 padding 为 0；未使用 title inner | P2：与 create/detail 标题基线不一致 | 后续统一标题输入结构；保留书名号装饰时也应让 input 使用同一内距/标题字号规则。 |
| WOT-009 | `src/pages/song-edit/song-edit.vue:81` | 歌手/版本 | `wd-input` | `song-field__input-root`；`song-field__input-inner` | `wot-paper-input-root`、`wot-paper-control-value`、`wot-paper-input-inner` | 通过 | 视觉接近基线，但类名为页面私有 | 可在 Phase 2 收敛到共享字段类或组件。 |
| WOT-010 | `src/pages/song-edit/song-edit.vue:97` | 点歌理由 | `wd-textarea` | `song-field__textarea-root`；`song-field__textarea-box`；`song-field__textarea-inner` | `wot-paper-input-root`、`wot-paper-textarea-root`、`wot-paper-control-value`、`wot-paper-textarea-inner` | 通过 | 视觉接近基线 | 可在 Phase 2 收敛。 |
| WOT-011 | `src/pages/task-edit/task-edit.vue:51` | 小约定标题 | `wd-input` | `task-title-slip__input-root`；`task-title-slip__input-inner` | `wot-paper-inline-input-root`、`wot-paper-control-value`、`wot-paper-input-inner` | P1：root padding 为 0，未使用 title inner；占位 inset 依赖外层 slip，视觉不等同 create/detail | 不通过，确认用户截图问题 | 下一轮第一优先级修复。 |
| WOT-012 | `src/pages/task-edit/task-edit.vue:80` | 小约定备注 | `wd-textarea` | `task-field__textarea-root`；`task-field__textarea-box`；`task-field__textarea-inner` | `wot-paper-input-root`、`wot-paper-textarea-root`、`wot-paper-control-value`、`wot-paper-textarea-inner` | 通过 | 视觉接近基线 | Phase 2 收敛类名/组件。 |
| WOT-013 | `src/pages/task-edit/task-edit.vue:98` | 小约定日期 | `wd-input` | `task-field__input-root`；`task-field__input-inner` | `wot-paper-input-root`、`wot-paper-control-value`、`wot-paper-input-inner` | 通过 | 视觉接近基线 | 保持并纳入共享字段规则。 |
| WOT-014 | `src/pages/memo-edit/memo-edit.vue:46` | 小线索标题 | `wd-input` | `memo-title-slip__input-root`；`memo-title-slip__input-inner` | `wot-paper-inline-input-root`、`wot-paper-control-value`、`wot-paper-input-inner` | 容器有 padding，但 input root padding 为 0；未使用 title inner | P2：与 create/detail 标题基线不一致 | 与 task/song title 一起统一。 |
| WOT-015 | `src/pages/memo-edit/memo-edit.vue:67` | 小线索正文 | `wd-textarea` | `memo-field__textarea-root`；`memo-field__textarea-box`；`memo-field__textarea-inner` | `wot-paper-textarea-root`、`wot-paper-control-value`、`wot-paper-textarea-inner` | 通过；`wot-paper-textarea-root` 已包含 field 基础 | 视觉接近基线 | Phase 2 收敛。 |

## 7. Form/card spacing issues

| ID | priority | page | selector | problem | expected baseline | recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| FORM-001 | P1 | `src/pages/task-edit/task-edit.vue:48` | `.task-title-slip`、`:deep(.task-title-slip__input-root)` | 标题字段使用独立 slip wrapper + inline input root；input root padding 为 0，标题占位/文本不具备 create/detail 的统一内距和标题内层规则。 | `src/pages/create/create.vue:33` / `src/pages/detail/detail.vue:94` 的 `paper-field paper-field--title`。 | 直接复用 paper-field title 结构，或扩展共享 title-field mixin；先修 task title。 |
| FORM-002 | P2 | `src/pages/song-edit/song-edit.vue:47` | `.song-title-slip`、`.song-title-slip__line` | 歌名标题字段为私有 slip 结构，input root padding 为 0，且未使用 `wot-paper-title-input-inner`。 | 创建/详情标题输入统一的 root padding + title inner。 | 保留书名号装饰，但让输入本体接入共享 title 规则。 |
| FORM-003 | P2 | `src/pages/memo-edit/memo-edit.vue:44` | `.memo-title-slip` | 标题字段同样使用 inline root；容器有 padding，但输入本体与 canonical title 字号/内距体系不同。 | 创建/详情标题输入统一结构。 | 与 task/song 标题统一处理。 |
| FORM-004 | P2 | `src/pages/songs/songs.vue:41` | `<app-option-group :columns="2">` | 点歌筛选组未开启 `responsive="auto"`，与任务/备忘筛选条不一致；长标签、大字号、窄屏下更容易挤压。 | `src/pages/tasks/tasks.vue:55`、`src/pages/memos/memos.vue:53`。 | 加入明确 responsive 策略，验证窄屏和大字号。 |
| FORM-005 | P2 | `src/pages/task-edit/task-edit.vue:117` | `<app-option-group :columns="2">` | 小约定状态选择未开启 responsive；同类编辑页的 song/memo 选项组已使用 `responsive="auto"`。 | `src/pages/song-edit/song-edit.vue:117` / `src/pages/memo-edit/memo-edit.vue:108`。 | 加入 `responsive="auto"` 或明确单列降级策略。 |
| FORM-006 | P2 | `src/components/AppOptionGroup.vue:54` | `.app-option-group--auto :deep(text)` | 审计开始前工作区 diff 删除了 `.app-option-button > * { min-width: 0; }`；当前只给 `text` 设置换行，嵌套 `view` 内容仍可能撑开网格。 | 选项组内部所有直接子内容都应可收缩。 | 恢复或替换等效 child `min-width: 0` 规则，并用大字号/长标签验证。 |
| FORM-007 | P3 | `src/components/AppPetNavigator.vue:908` | `.app-pet-bubble__actions` | 小宠物浮层按钮固定两列；当前标签较短，源码未显示明显问题，但大字号/窄屏仍需真机确认。 | 浮层按钮应在窄屏或大字号下不重叠、不截断。 | Phase 5 手动验证；如有挤压再加 auto-fit 或单列降级。 |

已确认无新增问题：`create.vue` 与 `detail.vue` 的日期/心情行已使用 `repeat(auto-fit, minmax(min(100%, var(--app-paper-tag-field-min-width)), 1fr))`；卡片外层大多使用 `@include panel`、`var(--app-card-padding)`、`var(--app-form-gap)`，未发现 raw spacing 违规。

2026-06-22 跟进：FORM-002 与 FORM-003 已按已修复的 `task-edit` 标题输入方向处理；`song-edit` 与 `memo-edit` 标题仍保留各自 wrapper，并改用 `wot-paper-input-root`、`wot-paper-title-input-inner` 提供统一内距与标题输入视觉。

## 8. Button/action issues

| ID | priority | page | selector | problem | expected baseline | recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| BTN-001 | P2 | `src/pages/task-edit/task-edit.vue:140` | `wd-button type="text" custom-class="task-delete-button"` | 删除按钮使用 Wot，但缺少 `:loading="deleting"` 和与保存/已保存状态联动的 disabled；点歌删除按钮已有 `:loading="deleting"`、`:disabled="saving || saved"`。 | `src/pages/song-edit/song-edit.vue:157` 到 `src/pages/song-edit/song-edit.vue:164`。 | 为任务删除按钮补齐 loading/disabled 状态。 |
| BTN-002 | P2 | `src/pages/memo-edit/memo-edit.vue:135` | `wd-button type="text" custom-class="memo-delete-button"` | 备忘删除按钮同样缺少 deleting loading 与保存状态 disabled。 | 点歌删除按钮一致性。 | 为备忘删除按钮补齐 loading/disabled 状态。 |
| BTN-003 | P3 | `src/components/AppOptionButton.vue:2` | `.app-option-button` | 项目级 wrapper 内部仍是原生 `button`，虽然页面调用是 app 组件，但需要明确长期例外或迁移方向。 | 新业务页不直接使用原生按钮；CTA/显式动作使用 Wot。 | 保持例外记录；若后续执行零原生控件策略，改造 wrapper。 |

已确认无新增问题：显式 CTA、上传按钮、列表状态按钮、详情编辑/删除按钮、小宠物浮层按钮、图片移除按钮均使用 Wot `wd-button`；`src/components/ImageGrid.vue:18` 的移除控件已是 Wot，并在 `src/components/ImageGrid.vue:129` 到 `src/components/ImageGrid.vue:170` 通过 token 化热区和视觉胶囊处理。

## 9. Toast/modal/feedback issues

| ID | priority | page | selector | problem | expected baseline | recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| FB-OK-001 | 无 | `src/components/AppShell.vue:36` | `<wd-toast />` | 未发现问题；Toast host 为 Wot 组件，挂在 AppShell 内。 | Wot/app feedback。 | 保持；保存/删除后目标页反馈仍需真机确认。 |
| FB-OK-002 | 无 | `src/composables/useAppToast.ts:75` / `:79` / `:83` | `showAppSuccess` / `showAppWarning` / `showAppError` | 未发现原生 toast 违规；统一走 Wot toast。 | app composable feedback。 | 保持。 |
| FB-OK-003 | 无 | `src/pages/song-edit/song-edit.vue:173`、`src/pages/task-edit/task-edit.vue:154`、`src/pages/memo-edit/memo-edit.vue:149`、`src/pages/detail/detail.vue:203` | `<wd-message-box />` + `useMessage` | 删除/离开确认使用 Wot MessageBox；手动确认不应自动关闭，当前方向正确。 | Wot modal confirmation。 | 保持并真机验证返回拦截。 |
| FB-OK-004 | 无 | `src/composables/useRouteFeedback.ts:70` / `:91` | `setRouteSuccessFeedback` / `consumeRouteFeedback` | 未发现代码级生命周期问题；成功反馈已改为目标页消费。 | 目标页展示成功反馈，避免源页销毁截断。 | 继续用真机验证保存/删除后目标页 Toast 完整显示。 |
| FB-OK-005 | 无 | `src/pages/create/create.vue:202`、`:216`、`:221`、`:226`、`:246` | `showAppWarning` / `showAppError` | 表单校验和保存失败走 app toast；无原生反馈。 | Wot/app feedback。 | 保持。 |
| FB-OK-006 | 无 | `src/pages/tasks/tasks.vue:245`、`:287`、`:289`；`src/pages/memos/memos.vue:276`、`:318`、`:320`；`src/pages/songs/songs.vue:251`、`:297` | 列表内成功/警告 toast | 当前页内状态切换不涉及页面销毁；无原生反馈。 | Wot/app feedback。 | 保持。 |

检索结论：`uni.showToast`、`uni.showModal`、`uni.showLoading`、`uni.showActionSheet` 在 `src` 中未命中。保留的 `uni.previewImage`、相册选择、导航等属于平台能力，不属于反馈违规。

## 10. WXSS compatibility risks

| ID | priority | page | selector | problem | expected baseline | recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| WXSS-001 | P2 | `src/components/AppOptionGroup.vue:37` / `:42`、`src/pages/create/create.vue:473`、`src/pages/detail/detail.vue:957` | `minmax(min(100%, var(...)), 1fr)` | CSS `min()` 嵌在 `minmax()` 内，Vite/build 可通过，但 mp-weixin/WXSS 兼容性仍需微信开发者工具和真机确认。 | 小程序端稳定渲染 auto-fit 降级。 | Phase 5 在微信开发者工具确认；如失败，改为更保守的 token/grid fallback。 |
| WXSS-002 | P2 | `src/pages/task-edit/task-edit.vue:677`、`src/pages/song-edit/song-edit.vue:696`、`src/pages/memo-edit/memo-edit.vue:652`、`src/pages/create/create.vue:445`、`src/pages/detail/detail.vue:929` | `:deep(.xxx .wd-input__body)` / `:deep(.xxx .wd-input__value)` | 多处依赖 Wot 内部类名和 `:deep` 后代选择器；这是当前 Wot 样式定制方式，但也是输入内距失效时的主要风险面。 | 共享字段组件或集中 mixin 只维护一处 Wot 内部选择器。 | Phase 2 收敛到共享组件/集中选择器，并用 DevTools 验证编译后的 WXSS。 |
| WXSS-003 | P3 | `src/components/ImageGrid.vue:156`、`:165`、`:170` | `:deep(.image-grid__remove .wd-button__content)` | 图片移除按钮依赖 Wot button 内部结构；当前视觉正确性需跟随 Wot 版本验证。 | 自定义类能稳定命中 Wot 内部内容。 | 保持，但升级 Wot 或调整 button 时回归。 |
| WXSS-004 | P3 | `src/components/AppPetNavigator.vue:934`、`:940`、`:944` | `:deep(.app-pet-bubble__action-button:nth-child(...))` | `:deep()` 与 `nth-child` 组合在小程序端需要视觉确认；当前构建通过。 | 小宠物浮层按钮纸条倾角稳定。 | Phase 5 真机/DevTools 确认。 |

补充结论：未发现 `:has()`、通配符样式选择器、raw `rgba()`、raw hex、raw `px/rpx`、页面/组件本地 `--app-*` token 定义。`src/components/AppOptionGroup.vue:23` 的 `--app-option-group-columns` 是已允许的组件运行时变量。

## 11. Copy/tone issues

| ID | priority | page | selector | problem | expected baseline | recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| COPY-001 | P2 | `src/services/cloudbase.ts:179`、`:188`、`:199`、`:213`、`:221` | `读取/保存/更新/删除纪念...` | 底层 CloudBase 通用错误仍使用“纪念”，会通过 `getFriendlyErrorMessage()` 直接在 `create`、`detail`、`song-edit`、`index` 等页面显示到用户。 | 回忆/点歌/小约定/小线索分域文案，错误清楚克制。 | 分域包装 repository 错误；保留技术 causeDetail，用户 toast 不出现泛化“纪念”。 |
| COPY-002 | P2 | `src/services/cloudbase.ts:95`、`:101`、`:114`、`:135`、`:143` | `操作没有完成`、`.env`、`VITE_CLOUDBASE_ENV_ID`、开发者工具配置 | 技术/泛化错误可能被页面 toast 或状态展示；`.env` 不应作为普通用户提示。 | 用户看到克制中文，开发诊断留在日志或 QA 页。 | 把技术细节限制在开发日志/诊断页；toast 使用业务语境。 |
| COPY-003 | P3 | `src/pages/design-preview/design-preview.vue:9`、`:13`、`:26` | `开发校验`、`运行诊断`、`实时主题控制` | 这是已接受的 owner-only QA 页面，但如果作为普通产品入口出现，会显得开发化。 | 设计预览页只作为 QA 工具，不进入常规产品导航。 | 保持文档决策；不要在首页/小宠物/设置常规入口推广。 |
| COPY-004 | P3 | `src/components/EntryCard.vue:63` | `...` | 长回忆摘要截断使用 ASCII 三点，视觉上不如中文省略号精致。 | 中文 UI 细节统一。 | 后续文案清理时改为 `…`。 |

检索结论：`pnpm scan:ui-copy` 通过，未发现英文用户可见字符串；首页“本人测试”未命中，当前首页为 `私密`。

## 12. Recommended repair phases

- Phase 1: form input unification
  - 修复 `src/pages/task-edit/task-edit.vue` 标题字段，优先解决“小约定票根”输入内边距。
  - 对齐 create/detail 的标题输入 root padding、title inner、placeholder inset、disabled/focus/keyboard behavior。

- Phase 2: shared form field component or mixin hardening
  - 将 task/song/memo title slip 字段收敛到共享结构、共享 mixin 或 `AppPaperField`。
  - 集中维护 Wot 内部 `:deep(.wd-input__*)` / `:deep(.wd-textarea__*)` 选择器。
  - 恢复/修复 `AppOptionGroup` 子内容 `min-width: 0` 收缩规则，并给缺失调用点加 responsive 策略。

- Phase 3: buttons/action consistency
  - 为 task/memo 删除按钮补齐 loading/disabled 状态。
  - 决定 `AppOptionButton` 原生 wrapper 是否作为长期例外。
  - 回归 ImageGrid remove、小宠物浮层、列表 action button 的 tap target。

- Phase 4: copy cleanup
  - CloudBase/repository 错误分域，避免“纪念”、`.env`、泛化“操作没有完成”泄漏到业务页面。
  - 仅保留 design-preview 的 owner-only QA 文案，不作为普通入口。
  - 微调中文标点和截断符号。

- Phase 5: visual regression/manual testing
  - 在微信开发者工具和真机上验证 mp-weixin WXSS：`min()`、`:deep()`、Wot 内部选择器、浮层按钮、键盘聚焦滚动。
  - 覆盖浅色/深色、大字号、紧凑密度、窄屏、键盘开合、顶部胶囊区域。

## 13. Proposed next implementation task

只做一个下一步任务：修复 `src/pages/task-edit/task-edit.vue` 的“小约定票根”标题输入，让它复用 create/detail 的 paper title field 内距与 inner class 规则；同时把 task title、song title、memo title 的共享字段策略写清楚，但本轮实现只落地 task title，避免扩大改动面。

建议验收命令：

```bash
pnpm scan:ui-copy
pnpm scan:design-tokens
pnpm type-check
pnpm type-check:strict
pnpm build:mp-weixin
git diff --check
```

建议手动验收：微信开发者工具中打开 `task-edit` 新增与编辑态，聚焦标题、备注、日期，确认 placeholder 与输入文本都有舒适内距，并与 `create` 页面“写下此刻”标题输入一致。

## 14. Manual QA checklist

- `src/pages/create/create.vue`
  - 标题、正文、日期、心情字段内距。
  - 上传按钮满额状态。
  - 键盘打开/关闭后保存按钮不被遮挡。

- `src/pages/detail/detail.vue`
  - 查看态与编辑态切换。
  - 标题/正文/日期/心情字段与 create 基线一致。
  - 删除确认弹窗清楚克制。

- `src/pages/task-edit/task-edit.vue`
  - 小约定标题字段内距。
  - 展开备注后的 textarea 与日期输入。
  - 状态选择组大字号/窄屏降级。
  - “先不写了”与顶部胶囊不碰撞。

- `src/pages/song-edit/song-edit.vue`
  - 歌名字段在书名号装饰中不挤压。
  - 歌手/理由字段内距。
  - 优先级/状态选择组大字号不重叠。

- `src/pages/memo-edit/memo-edit.vue`
  - 标题 slip 与正文 textarea 内距。
  - 分类/置顶选项组大字号不重叠。
  - 删除按钮 loading/disabled。

- `src/pages/settings/settings.vue`
  - 外观、色板、密度、字号选项在大字号/窄屏下不挤压。
  - 字号轨道填充与圆点对齐。
  - 云端状态文案不暴露技术细节。

- `src/pages/songs/songs.vue`
  - 筛选条在大字号/窄屏下不挤压。

- `src/pages/tasks/tasks.vue`
  - 任务筛选条和任务卡 action button tap target。

- `src/pages/memos/memos.vue`
  - 备忘筛选条、置顶按钮、大字号卡片布局。

- `src/components/AppPetNavigator.vue`
  - 小宠物浮层不遮挡顶部胶囊、关键表单按钮或键盘区域。
  - 浮层按钮在窄屏、大字号、深色模式下可读可点。

- 全局模式
  - 浅色模式。
  - 深色模式。
  - 标准字号。
  - 偏大字号。
  - 舒适密度。
  - 紧凑密度。
  - 窄屏模拟。
  - 真机预览。
