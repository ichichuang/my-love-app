# 小珊的树洞：界面体验与合规修复清单

> 状态：已完成
> 完成日期：2026-06-18
> 生成日期：2026-06-18
> 审计基线：GitHub `ichichuang/my-love-app` 当前 `main` 源码与近期真机 / 微信开发者工具截图
> 文档性质：后续 Codex / AI 修复任务的唯一问题清单与验收基线

---

## 1. 当前结论

当前项目的业务架构、CloudBase 边界、owner-only 约束、自定义导航、数据缓存、键盘避让、统一反馈、设置页选项组件、小宠物避让与主要业务闭环已经稳定。

本清单对应的 `UX Runtime Repair` 已验收通过。`Final Compliance` 在完成文档去重、设计系统契约同步、视觉烟测证据固化和 CloudBase envId 笔误校正后，记录为 `Final Compliance Accepted`。

### 当前问题等级

| 等级 | 数量 | 说明 |
|---|---:|---|
| P0 | 0 | 暂未发现构建、数据安全、CloudBase 或业务不可用阻断 |
| P1 | 0 | 已关闭 |
| P2 | 0 | 已关闭 |
| P3 | 0 | 已关闭 |

---

## 2. 修复总原则

所有修复必须继续遵守：

- `AGENTS.md`
- `docs/AI_CODING_GUIDELINES.md`
- `docs/AI_FEATURE_STYLE_GUIDELINES.zh-CN.md`
- `docs/DESIGN_SYSTEM.zh-CN.md`
- `docs/PRODUCT_REQUIREMENTS.zh-CN.md`

所有新增或调整后的 UI 必须保持：

- 俏皮、可爱、克制
- 手绘感、小纸条感、小票根感
- 私密树洞与长期记录感
- 全部用户可见文案使用简体中文
- 错误、删除、权限等高风险文案温柔但明确
- Wot UI / app-level 组件优先
- 不写 raw hex、`rgba()`、固定 `px/rpx`、直接阴影、固定圆角、固定字号、固定动画时长
- 不新增未登记 `--app-*` token
- 不修改 CloudBase env、collection、storage prefix、owner-only 边界

---

## 3. 问题总表

| ID | 优先级 | 问题 | 主要影响范围 | 推荐修复批次 | 状态 |
|---|---|---|---|---|---|
| FORM-001 | P1 | 输入框 / 文本域内边距不足，内容贴边，视觉粗糙 | create、detail、song-edit、task-edit、memo-edit | Form Polish 1.0 | [x] |
| FORM-002 | P1 | 键盘弹出后遮挡内容、保存按钮或后续字段 | 所有创建 / 编辑页 | Form Polish 1.0 | [x] |
| FEEDBACK-001 | P1 | 业务代码大量使用 `uni.showToast`，提示风格与 Wot / 小纸条体系割裂 | pages、`useFileUpload.ts` | Feedback UI 1.0 | [x] |
| NAV-001 | P1 | 自定义导航只占位但不持续吸顶，滚动后内容进入状态栏 / 胶囊区域 | 全部页面 | Custom Nav Sticky 1.0 | [x] |
| NAV-002 | P1/P2 | 列表页关键筛选 / 标题区未吸顶，长列表滚动体验不稳 | index、songs、tasks、memos | List Sticky Sections 1.0 | [x] |
| SETTINGS-001 | P2 | 设置页模式 / 密度 / 字号仍使用自定义 view 卡片，未统一到 AppOption 体系 | settings | Settings Control Polish 1.0 | [x] |
| SETTINGS-002 | P2 | 主题色板选中徽标、倾角、三列布局在真机 / 大字号下存在裁切和拥挤风险 | ThemeSwatchPicker | Settings Control Polish 1.0 | [x] |
| PET-001 | P2 | 首页小宠物会遮挡回忆卡片图片、文字或统计信息 | index、AppPetNavigator | Pet Clearance 1.1 | [x] |
| FORM-003 | P2 | Wot 输入框 deep selector 分散在多页，样式不一致且维护成本高 | create、detail、song-edit、task-edit、memo-edit | Form Polish 1.0 | [x] |
| COPY-001 | P2 | 原生提示文案与部分上传 / 失败文案不够统一、俏皮或清晰 | 全业务提示 | Feedback UI 1.0 | [x] |
| QA-001 | P3 | DevTools automator 握手不稳定，缺少完整真机截图回归 | 全页面 | Visual Smoke 1.0 | [x] |

---

# 4. P1 必修问题

## FORM-001：统一纸条输入框与文本域内边距

### 现象

- 点歌便签标题输入区域左右空间不足。
- 小线索标题输入框光标和文字贴近边缘。
- 文本域像普通白色系统输入框，不像纸页。
- 不同页面的输入高度、placeholder 位置、正文留白不一致。

### 已知影响文件

- `src/pages/create/create.vue`
- `src/pages/detail/detail.vue`
- `src/pages/song-edit/song-edit.vue`
- `src/pages/task-edit/task-edit.vue`
- `src/pages/memo-edit/memo-edit.vue`

### 可能根因

- 多个页面使用 `wd-input no-border` / `wd-textarea no-border`。
- 页面分别通过 `custom-class`、`custom-input-class` 和 `:deep()` 调整 Wot 内部结构。
- 某些 input root 使用 `padding: var(--app-space-0)`，但 inner 没有补齐可靠的横向内边距。
- 外层纸条容器与 Wot 内层同时承担边距，导致规则不统一。

### 修复方向

- 统一创建纸条输入样式 mixin，或新增可复用的 app-level 纸条字段组件。
- 明确三类规格：
  - 大标题输入
  - 普通单行输入
  - 多行文本域
- 统一以下行为：
  - 横向内边距
  - 上下内边距
  - 最小高度
  - placeholder 颜色与位置
  - disabled 状态
  - 大字号状态
  - 深色模式
- 避免 root 和 inner 双重 padding。
- 不修改字段、校验、保存和数据结构。

### 验收标准

- [x] 所有输入内容与容器边缘有稳定留白。
- [x] 光标不贴边。
- [x] placeholder 不贴边、不漂移。
- [x] 文本域首行位置自然。
- [x] 标准 / 偏大字号均不裁切。
- [x] 深色和 6 套主题均清晰。
- [x] `pnpm scan:design-tokens` 通过。

---

## FORM-002：键盘避让与聚焦滚动

### 现象

- 小线索编辑页弹出键盘后，后续分类、置顶和保存区域被遮挡。
- 长文本输入时，当前字段可能被键盘或自定义导航压缩。
- 现有 `env(safe-area-inset-bottom)` 只能避让 Home Indicator，不能代表键盘高度。

### 影响页面

- `src/pages/create/create.vue`
- `src/pages/detail/detail.vue`
- `src/pages/song-edit/song-edit.vue`
- `src/pages/task-edit/task-edit.vue`
- `src/pages/memo-edit/memo-edit.vue`

### 修复方向

- 使用 `uni.onKeyboardHeightChange` / `uni.offKeyboardHeightChange` 获取真实键盘高度。
- 不写死键盘高度。
- 在编辑页底部增加动态 keyboard spacer。
- 字段聚焦时，确保当前字段滚入可视区域。
- 避免后台静默刷新覆盖用户正在输入的内容。
- 关闭键盘后恢复正常布局，不残留空白。

### 验收标准

- [x] 每个字段聚焦后完整可见。
- [x] 保存按钮可通过滚动抵达。
- [x] 键盘关闭后页面不跳动、不留大空白。
- [x] iOS / Android 常见机型均可用。
- [x] 不写固定键盘 px。

---

## FEEDBACK-001：清除业务层原生 Toast

### 现象

当前多个页面和组合式仍直接调用：

```ts
uni.showToast(...)
```

原生微信 Toast 与当前 Wot UI、纸条和手绘风格不一致。

### 已知影响范围

至少包括：

- `src/pages/index/index.vue`
- `src/pages/create/create.vue`
- `src/pages/detail/detail.vue`
- `src/pages/songs/songs.vue`
- `src/pages/song-edit/song-edit.vue`
- `src/pages/tasks/tasks.vue`
- `src/pages/task-edit/task-edit.vue`
- `src/pages/memos/memos.vue`
- `src/pages/memo-edit/memo-edit.vue`
- `src/composables/useFileUpload.ts`

### 当前保留项

- 删除确认已使用 `wd-message-box`，继续保留。
- `uni.chooseImage` 是微信平台图片选择能力，不属于需要清除的原生提示控件。
- 页面导航 API 可以继续使用。

### 修复方向

- 在 AppShell 或 approved app-level host 中统一挂载 `wd-toast`。
- 新增统一 `useAppToast()` 或同等 composable。
- 将所有业务 `uni.showToast` 替换为 Wot / app toast。
- 新增扫描规则，阻止未来在业务层重新引入：
  - `uni.showToast`
  - `uni.showModal`
  - `uni.showActionSheet`
  - `uni.showLoading`
  - `uni.hideLoading`
- 不得通过关闭 scanner 或全局忽略解决。

### 文案规范

普通反馈可以俏皮：

- `小线索已经轻轻收好`
- `这首歌已经放进小歌单`
- `这件小事已经勾上啦`

错误和删除必须明确：

- `这条小线索暂时没删掉，请稍后再试。`
- `可能是网络慢了一点，稍后再试一次。`

### 验收标准

- [x] `grep -R "uni.showToast" src/pages src/components src/composables` 无业务命中。
- [x] 确认框继续使用 Wot message box。
- [x] Toast 在浅色、深色、6 套主题下可读。
- [x] 所有用户可见反馈均为简体中文。
- [x] 上传失败、保存失败、删除失败文案清楚克制。

---

## NAV-001：全局自定义导航持续吸顶

### 现象

- 当前自定义导航可以正确计算状态栏和胶囊高度，但滚动时会离开顶部。
- 页面内容继续上滑后进入状态栏 / 刘海 / 微信胶囊区域。
- 设置页和编辑页截图已出现状态栏时间压在内容上的情况。

### 已知结构

- `src/components/AppCustomNav.vue`
- `src/components/AppShell.vue`
- `src/composables/useCustomNavMetrics.ts`

### 修复方向

可选择以下一种方案，必须经过 DevTools / 真机验证：

1. `position: sticky` 导航；或
2. fixed 导航 + 等高 spacer。

要求：

- 继续复用 `getWindowInfo()` 与 `getMenuButtonBoundingClientRect()`。
- 保持真实动态状态栏高度和胶囊避让。
- 不使用 `getSystemInfoSync`。
- 不让页面 body 重复增加导航高度。
- 不覆盖微信胶囊。
- 自定义导航背景要随主题，滚动后不能完全透明导致内容穿透。
- 首页无返回按钮；非首页保留手绘返回箭头。

### 验收标准

- [x] 所有页面滚动时导航始终处于顶部安全区。
- [x] 内容不进入状态栏和胶囊区域。
- [x] 返回箭头始终可见可点。
- [x] 导航无首帧跳动。
- [x] 浅色 / 深色 / 6 套主题背景正确。
- [x] iPhone 刘海、安卓状态栏、iPad 竖屏均正确。

---

## NAV-002：列表页关键区域轻量吸顶

### 目标

不是把大 Hero 卡片全部固定，而是让长列表中的关键筛选和栏目标题在滚动时保持可操作。

### 页面与建议区域

| 页面 | 推荐吸顶内容 | 不应吸顶 |
|---|---|---|
| 首页 | `回忆时间线 + 条数` 的 compact 标题行 | Hero、三个入口卡 |
| 小歌单 | 状态筛选条，必要时附轻量新增入口 | 介绍卡、空态大卡 |
| 小约定 | 筛选条；进度可缩成 compact summary | 完整进度大卡 |
| 小档案 | 分类小标签条 | 顶部引导大纸条 |
| 设置页 | 仅全局自定义导航 | 设置分区本身 |
| 编辑页 | 仅全局自定义导航 | 表单内部区块 |

### 技术要求

- sticky top 必须基于运行时自定义导航总高度。
- 不写死顶部 px。
- 不新增未登记 `--app-*` token。
- 可以通过运行时 inline style 或现有 metrics helper 提供 top。
- sticky 容器不得被祖先 `overflow: hidden` 破坏。
- 背景必须可读，不能让下方内容透穿。

### 验收标准

- [x] 滚动后筛选仍可操作。
- [x] 吸顶区域不遮挡首条卡片。
- [x] 与微信胶囊和自定义导航无冲突。
- [x] 大字号下不挤压。
- [x] 只固定必要内容，不占据过多屏幕。

---

# 5. P2 视觉与维护性问题

## SETTINGS-001：设置选择器统一为 AppOption 体系

### 现状

设置页仍存在：

- `mode-card`
- `density-card`
- `font-choice`

这些是自定义 `view` 选择卡，未完全遵守设置选择器统一组件路径。

### 修复方向

- 外观模式：`AppOptionGroup + AppOptionButton`
- 界面密度：`AppOptionGroup + AppOptionButton`
- 字号大小：`AppOptionGroup + AppOptionButton`
- 保留当前中文文案、图标和小纸片气质。
- 不改变 theme store、状态字段和行为。
- `AppOptionButton` 内部原生 button 属于已批准 app-level 基础组件，不在本轮重写。

### 验收标准

- [x] 设置页不再保留 `mode-card / density-card / font-choice` 主交互结构。
- [x] 所有选择项键盘 / 点击状态一致。
- [x] 不退化为系统设置风。
- [x] 主题、密度、字号切换行为不变。

---

## SETTINGS-002：主题色板细节修复

### 已知风险

- 旧版 `ThemeSwatchPicker` 使用自定义 cell。
- 旧版选中徽标位于负 top / right，同时色块容器存在 `overflow: hidden`，真机可能裁切“已选”。
- 旧版三列布局在偏大字号下可能拥挤。
- 旧版倾角与选中聚焦环可能在边缘出现裁切。

### 修复方向

- 收敛到 `AppOptionGroup / AppOptionButton variant="swatch"`。
- 修复“已选”印章裁切。
- 保持 6 套主题与当前 palette id 不变。
- 使用两列布局检查标准字号、偏大字号和紧凑模式。
- 不新增任意颜色输入。

### 验收标准

- [x] 选中徽标完整显示。
- [x] 卡片倾角不导致溢出或重叠。
- [x] 偏大字号下主题名和说明可读。
- [x] 6 套主题选择行为正确。

---

## PET-001：首页小宠物内容避让

### 现象

- 小宠物可能压住回忆卡图片、标题、正文或条数。
- 用户虽可拖拽，但默认位置不应首先挡住内容。

### 修复方向

- 调整首页默认锚点到安全边缘。
- 宠物拖动结束后可考虑吸附到最近屏幕边缘。
- 首页列表增加适量宠物安全留白，但不能形成巨大空白。
- 继续只在首页挂载。
- 保持位置记忆、菜单气泡、导航和关闭行为。
- 不重新挂载到其他页面。

### 验收标准

- [x] 默认位置不遮挡卡片核心内容。
- [x] 拖动后仍被限制在安全区。
- [x] 菜单气泡贴近宠物且不超出屏幕。
- [x] 首页底部最后一张卡可完整阅读。

---

## FORM-003：收敛分散的 Wot deep selector

### 现状

多个页面分别维护类似样式：

- `__input-root`
- `__input-inner`
- `__textarea-root`
- `__textarea-box`
- `__textarea-inner`

### 风险

- Wot 升级后内部 DOM 变更需要多处修改。
- 页面之间边距、字号、禁用态和背景容易漂移。
- 同一类输入控件在不同页面呈现不一致。

### 修复方向

- 在 `src/styles/mixins.scss` 增加受控纸条字段 mixin；或
- 新增小型 app-level `AppPaperInput` / `AppPaperTextarea` 组件。
- 不要同时大范围改业务表单结构。
- 保留 Wot 作为底层交互控件。

### 验收标准

- [x] 页面不再重复维护大段相同 deep selector。
- [x] 所有编辑页控件视觉一致。
- [x] 未来修改字段样式只需改一个中心位置。

---

## COPY-001：反馈文案统一审校

### 范围

在迁移 Toast 时同步审校：

- 保存成功
- 保存失败
- 删除成功
- 删除失败
- 上传失败
- 图片过大
- 列表刷新失败
- 无缓存加载失败
- 状态切换失败

### 原则

普通场景：俏皮可爱。

高风险场景：温柔但明确。

禁止：

- 英文 UI
- 过度卖萌
- `宝贝 / 亲亲 / 呜呜 / 哭哭 / 冲鸭`
- 含糊删除后果

### 验收标准

- [x] 全部用户可见反馈为简体中文。
- [x] 同类型操作使用一致词汇。
- [x] 按钮、Toast、MessageBox 不互相矛盾。

---

# 6. P3 质量保障问题

## QA-001：完整视觉烟测与截图基线

### 现状

- DevTools automator 曾出现 `Failed to connect to runtime`。
- 部分页面只有源码、构建和人工截图验证，缺少稳定的自动截图矩阵。

### 修复方向

建立不提交到仓库的截图输出流程：

```text
/tmp/my-love-app-visual-smoke/
```

至少覆盖：

- 首页
- 回忆创建
- 回忆详情
- 小歌单
- 点歌编辑
- 小约定
- 事项编辑
- 小档案
- 小线索编辑
- 设置页
- 小宠物菜单

主题矩阵至少覆盖：

- 浅色默认
- 深色默认
- 一套非默认主题
- 偏大字号
- 紧凑密度

### 验收标准

- [x] 关键页面截图齐全。
- [x] 导航、状态栏、键盘、safe area 无遮挡。
- [x] 没有英文 UI。
- [x] 偏大字号不截断。
- [x] 深色模式可读。

### 2026-06-18 自动截图证据

- 输出目录：`/tmp/my-love-app-visual-smoke/`
- 已生成 75 张截图：11 个页面 / 状态 × 5 套视觉变体、5 张 contact sheet、3 张创建页键盘 / 聚焦截图、12 张六套主题补充截图。
- 覆盖页面 / 状态：首页、回忆创建、回忆详情、小歌单、点歌编辑、小约定、事项编辑、小档案、小线索编辑、设置页、小宠物菜单。
- 覆盖变体：浅色默认、深色默认、桃雾蓝灰、偏大字号、紧凑密度。
- 额外截图：`light-default__create-focus.png` 覆盖创建页聚焦状态。
- 键盘避让截图：`light-default__create-keyboard-event.png` 与 `light-default__create-keyboard-spacer-bottom.png`。
- 键盘避让运行证据：对原生 `input` 触发 `keyboardheightchange` 后，`.keyboard-spacer` 从 `height:0;` 变为 `height:320px;`，底部截图确认保存按钮与安全留白同时可见。
- 六套主题补充烟测：`palette-1-warm-paper-red-blue__home.png` 至 `palette-6-indigo-letter__home.png`，以及对应 `__settings.png`。
- 长期证据清单：`docs/qa/VISUAL_SMOKE_REPORT.zh-CN.md`。
- 限制：`@dcloudio/uni-automator` 在当前 `mp-weixin` 目标返回 `App.keyboardInput unimplemented`，因此键盘文字输入本身未自动化；本批验证使用原生键盘高度事件与可视 spacer 作为遮挡证明。

---

# 7. 推荐实施顺序

严格按小步修复，不要一次性塞入全部改动。

## 第一批：Feedback UI 1.0

处理：

- FEEDBACK-001
- COPY-001

目标：

- 清除业务 `uni.showToast`
- 建立统一 AppToast / Wot Toast
- 统一反馈文案

## 第二批：Form Polish 1.0

处理：

- FORM-001
- FORM-002
- FORM-003

目标：

- 统一输入内边距
- 统一文本域视觉
- 键盘避让
- 收敛 deep selectors

## 第三批：Custom Nav Sticky 1.0

处理：

- NAV-001

目标：

- 全局导航吸顶
- 动态状态栏 / 胶囊兼容

## 第四批：List Sticky Sections 1.0

处理：

- NAV-002

目标：

- 首页、歌单、事项、小档案的关键栏轻量吸顶

## 第五批：Settings Control Polish 1.0

处理：

- SETTINGS-001
- SETTINGS-002

目标：

- 设置选择器统一
- 修复主题色板裁切和大字号布局

## 第六批：Pet Clearance 1.0

处理：

- PET-001

目标：

- 默认位置避让
- 边缘吸附 / 安全留白

## 第七批：Visual Smoke 1.0

处理：

- QA-001

目标：

- 完成 DevTools / 真机截图矩阵
- 最终视觉收口

---

# 8. 已解决基线：禁止回归

以下内容当前已经稳定，后续修复不得破坏：

- [x] 产品名为 `小珊的树洞`
- [x] 全页面 `navigationStyle: custom`
- [x] 自定义导航高度通过 API 获取并正确首屏占位
- [x] 首页无重复设置按钮
- [x] 非首页有手绘返回箭头
- [x] 小宠物只在首页
- [x] 小宠物菜单包含写回忆、小歌单、小约定、小档案、换样子
- [x] `design-preview` 不再作为设置页用户入口
- [x] memory / song / task / memo 类型隔离
- [x] 回忆删除仍清理云端图片
- [x] song / task / memo 不清理图片
- [x] 本地持久缓存 + 静默刷新已覆盖数据页
- [x] 无真实变化时不重绘列表
- [x] 仅 `tempFileURL` 变化时不闪烁图片
- [x] 编辑页后台刷新不覆盖用户输入
- [x] CloudBase collection 仍为 `love_entries`
- [x] storage prefix 仍为 `love-entries/main/`
- [x] owner-only 边界未变
- [x] 无 AppSecret
- [x] 无 UnoCSS

---

# 9. 批次通用验证命令

任何一批修改完成后必须完整运行：

```bash
pnpm scan:ui-copy
pnpm scan:design-tokens
pnpm type-check
pnpm type-check:strict
pnpm build:mp-weixin
git diff --check
```

额外检查：

```bash
grep -R "uni.showToast\|uni.showModal\|uni.showActionSheet\|uni.showLoading\|uni.hideLoading" src/pages src/components src/composables || true
grep -R "wx.cloud" src/pages src/components src/stores || true
grep -R "getSystemInfoSync" src || true
grep -R "<项目禁用真实姓名词表>" src/pages src/components src/services docs dist/build/mp-weixin || true
grep -R "珊瑚行动" src/pages src/components src/services dist/build/mp-weixin || true
grep -R "AppSecret" src dist || true
grep -R "appsecret" src dist || true
grep -R "unocss\|UnoCSS" src package.json vite.config.ts || true
grep -R "<app-pet-navigator" src/pages || true
grep -R "love-d4g006mox4b78e5c6" dist/build/mp-weixin
grep -R "wx04b0ef4f0de5c5c5" dist/build/mp-weixin
grep -R "love_entries" src dist/build/mp-weixin
grep -R "love-entries\|main" src/config src/services dist/build/mp-weixin
```

---

# 10. 页面级最终验收清单

## 首页

- [x] 自定义导航持续吸顶。
- [x] 回忆时间线标题行可轻量吸顶。
- [x] 小宠物不遮挡卡片核心内容。
- [x] 卡片和图片静默刷新无闪烁。

## 回忆创建 / 详情编辑

- [x] 单行输入和文本域有统一内边距。
- [x] 键盘不遮挡当前字段和保存入口。
- [x] 图片上传提示使用统一 Wot / AppToast。
- [x] 删除确认使用 Wot MessageBox。

## 小歌单 / 点歌便签

- [x] 筛选区可轻量吸顶。
- [x] 歌名输入不贴边。
- [x] 展开详情后键盘不遮挡保存按钮。
- [x] 保存、删除、状态切换反馈不使用原生 Toast。

## 小约定 / 小约定票根

- [x] 筛选区可轻量吸顶。
- [x] 进度和筛选滚动体验稳定。
- [x] 输入和日期字段内边距一致。
- [x] 键盘避让正常。

## 小档案 / 小线索编辑

- [x] 分类标签可轻量吸顶。
- [x] 标题输入和正文文本域不贴边。
- [x] 键盘打开后可滚到标签、置顶和保存区域。
- [x] 保存 / 删除提示使用统一反馈组件。

## 设置页

- [x] 自定义导航持续吸顶。
- [x] 模式、密度、字号统一使用 AppOption 体系。
- [x] 主题“已选”徽标无裁切。
- [x] 偏大字号下 3 列色卡不拥挤。
- [x] 无 design-preview 用户入口。

---

# 11. 完成定义（Definition of Done）

只有同时满足以下条件，才可将本清单标记为完成：

- [x] 所有 P1 已关闭。
- [x] 所有 P2 已关闭或由用户明确接受为视觉债。
- [x] 业务层无原生 Toast / Modal / ActionSheet / Loading 提示 API。
- [x] 所有表单字段有一致的纸条输入体验。
- [x] 所有编辑页通过键盘避让测试。
- [x] 自定义导航在所有页面持续吸顶且不遮挡胶囊。
- [x] 首页、歌单、事项、小档案的关键操作区吸顶正确。
- [x] 设置页选择器符合统一组件路径。
- [x] 小宠物不默认遮挡内容。
- [x] 浅色、深色、6 套主题、标准 / 偏大字号、舒适 / 紧凑密度完成烟测。
- [x] 所有规定命令通过。
- [x] CloudBase、owner-only、缓存和业务闭环无回归。

---

# 12. 修复记录

| 日期 | 批次 | 处理问题 | 结果 | 备注 |
|---|---|---|---|---|
| 2026-06-18 | Feedback UI 1.0 | FEEDBACK-001、COPY-001 | 已完成 | 建立 AppShell 级 Wot Toast host，替换业务 `uni.showToast`，并把原生反馈 API 纳入扫描。 |
| 2026-06-18 | Form Polish 1.0 | FORM-001、FORM-002、FORM-003 | 已完成 | 统一 Wot 纸条字段 mixin，编辑页接入真实键盘高度 spacer 与聚焦滚动；仍需 Visual Smoke 批次做真机截图确认。 |
| 2026-06-18 | Custom Nav Sticky 1.0 | NAV-001 | 已完成 | 自定义导航改为 sticky，继续使用运行时状态栏 / 胶囊高度，并在编译产物中确认 sticky 样式存在；仍需 Visual Smoke 批次做真机截图确认。 |
| 2026-06-18 | List Sticky Sections 1.0 | NAV-002 | 已完成 | 首页时间线标题、歌单 / 约定筛选条、小档案分类标签条接入运行时导航高度 sticky offset，并在编译产物中确认 sticky 样式存在；仍需 Visual Smoke 批次做真机截图确认。 |
| 2026-06-18 | Settings Control Polish 1.0 | SETTINGS-001、SETTINGS-002 | 已完成 | 设置页模式 / 密度 / 字号改用 AppOption 体系；主题色板改为两列、选中印章不再负偏移并修复色块圆角；仍需 Visual Smoke 批次做真机截图确认。 |
| 2026-06-18 | Pet Clearance 1.0 | PET-001 | 已完成 | 默认锚点移至左下安全边缘，拖动结束吸附最近边缘，首页列表增加安全阅读留白；Visual Smoke 发现旧位置仍可能遮挡首张卡片。 |
| 2026-06-18 | Pet Clearance 1.1 | PET-001 | 已完成 | 小宠物位置存储升为 v2，废弃旧右侧停靠缓存；关闭态改为屏幕边缘小露出，打开 / 触摸 / 拖动时再完整出现，截图确认不再遮挡卡片文字和日期。 |
| 2026-06-18 | Visual Smoke 1.0 | QA-001 | 已完成 | 通过 `@dcloudio/uni-automator` 启动源码自动化构建后，完成 `/tmp/my-love-app-visual-smoke/` 下 75 张截图，覆盖页面矩阵、contact sheet、创建页聚焦、键盘避让和六套主题补充截图；原生键盘高度事件确认 spacer 从 `height:0;` 变为 `height:320px;`。 |
| 2026-06-18 | Final Documentation Sync 1.0 | 文档去重、完成状态同步、设计系统契约同步、视觉烟测证据固化、CloudBase envId 笔误校正 | 已完成 | 权威清单迁入 `docs/UX_REPAIR_CHECKLIST.zh-CN.md`；根目录旧清单删除；`docs/UX_REMEDIATION_CHECKLIST.zh-CN.md` 改为归档指针；`ThemeSwatchPicker` 收敛到 `AppOptionGroup / AppOptionButton variant="swatch"`；正确 envId 为 `love-d4g006mox4b78e5c6`。 |
