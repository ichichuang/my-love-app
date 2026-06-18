# 小珊的树洞：体验与视觉修复清单

> 状态：待分阶段修复  
> 适用阶段：Stage 1 owner-only 真机烟测与体验收口  
> 建立日期：2026-06-18

本文件汇总当前真机截图、GitHub 源码审计和全局合规检查中发现的体验问题，作为后续 Codex / AI 修复任务的唯一清单。

后续修复必须同时遵守：

- `AGENTS.md`
- `docs/AI_CODING_GUIDELINES.md`
- `docs/AI_FEATURE_STYLE_GUIDELINES.zh-CN.md`
- `docs/PRODUCT_REQUIREMENTS.zh-CN.md`
- `docs/DESIGN_SYSTEM.zh-CN.md`

## 1. 当前总体判断

核心业务和底层架构已基本稳定，暂未发现 P0 数据安全或构建阻断问题。

当前主要问题属于体验收口：

- 输入框和文本域不够精致，部分内容贴边。
- 键盘弹出后容易遮挡表单内容和操作区。
- 业务提示仍大量使用微信原生 `uni.showToast`，与整体视觉割裂。
- 自定义导航只完成首屏占位，滚动时没有稳定吸顶。
- 长列表页的重要筛选、进度和时间线标题没有轻量吸顶。
- 设置页选择器仍有拼装感，与统一选择组件体系不完全一致。
- 首页小宠物可能遮挡时间线卡片内容。
- 表单样式分散在各页面，后续维护风险较高。
- 微信开发者工具自动化截图链路仍不稳定。

当前状态：

```text
P0：未发现
P1：必须修复后再做最终体验验收
P2：需要收口的视觉与维护债
P3：测试与流程改进项
```

---

## 2. 优先级定义

| 等级 | 定义 |
|---|---|
| P0 | 构建、数据安全、CloudBase、删除/上传、页面不可用等阻塞问题 |
| P1 | 明显影响真机使用体验，必须在最终验收前修复 |
| P2 | 不阻塞功能，但明显影响一致性、视觉质量或维护成本 |
| P3 | 自动化、文档或长期优化项 |

---

## 3. 问题总表

| 编号 | 问题 | 优先级 | 主要范围 | 建议修复任务 | 状态 |
|---|---|---:|---|---|---|
| UX-01 | 输入框、文本域内边距不足，部分文字和光标贴边 | P1 | create、detail、song-edit、task-edit、memo-edit | Form Polish 1.0 | [ ] |
| UX-02 | 键盘弹出后遮挡内容、选项或保存按钮 | P1 | 所有创建/编辑页 | Form Polish 1.0 | [ ] |
| UX-03 | 业务提示大量使用原生 `uni.showToast` | P1 | 页面与 `useFileUpload` | Feedback UI 1.0 | [ ] |
| UX-04 | 自定义导航滚动后不吸顶，内容可能进入状态栏/胶囊区 | P1 | 全部页面 | Custom Nav Sticky 1.0 | [ ] |
| UX-05 | 长列表页重要区域未轻量吸顶 | P1/P2 | 首页、songs、tasks、memos | List Sticky Sections 1.0 | [ ] |
| UX-06 | 设置页外观、密度、字号选择器与统一组件体系不一致 | P2 | settings | Settings Control Polish 1.0 | [ ] |
| UX-07 | 主题色板仍使用独立自定义 cell，交互体系不完全统一 | P2 | ThemeSwatchPicker | Settings Control Polish 1.0 | [ ] |
| UX-08 | 首页小宠物会压住时间线卡片图片或文字 | P2 | index、AppPetNavigator | Pet Clearance 1.0 | [ ] |
| UX-09 | Wot 输入组件的 deep 样式分散，行为和尺寸容易漂移 | P2 | 多个编辑页 | Form Foundation 1.0 | [ ] |
| UX-10 | 提示文字需要再次统一为俏皮可爱、清楚克制的口吻 | P2 | 全局反馈文案 | Feedback UI 1.0 | [ ] |
| UX-11 | 自动化截图与 DevTools runtime handshake 不稳定 | P3 | 验收流程 | Visual Smoke 1.0 | [ ] |

---

# 4. P1 修复项

## UX-01：输入框和文本域内边距不足

### 现象

真机截图中可见：

- 点歌标题输入内容贴近容器边缘。
- 小线索标题输入光标贴边。
- 文本域虽然有外层卡片，但实际输入内容缺少舒适的内部留白。
- 不同页面的标题输入、普通输入、文本域视觉不一致。

### 影响页面

- `src/pages/create/create.vue`
- `src/pages/detail/detail.vue`
- `src/pages/song-edit/song-edit.vue`
- `src/pages/task-edit/task-edit.vue`
- `src/pages/memo-edit/memo-edit.vue`

### 当前技术原因

多个页面分别使用：

```text
wd-input / wd-textarea
custom-class
custom-input-class
custom-textarea-container-class
custom-textarea-class
```

部分根节点设置了 `padding: var(--app-space-0)`，实际 input 内部没有统一左右和上下留白。

### 修复目标

- [ ] 标题输入、普通输入、文本域分别建立统一纸条输入规格。
- [ ] 输入文字与光标不贴边。
- [ ] placeholder、输入文字、清除图标位置协调。
- [ ] 深色模式和 6 套主题下均可读。
- [ ] 标准/偏大字号均不截断。
- [ ] 不写 raw px/rpx、raw color、固定圆角或直接阴影。

### 推荐实现

优先方案：

```text
新增 app-level 纸条输入组件或统一 mixin
```

例如：

- `AppPaperInput.vue`
- `AppPaperTextarea.vue`
- 或 `mixins.scss` 中统一 field 内容区规则

不要继续在每个页面重复维护不同的 `:deep()` 选择器。

### 验收标准

- [ ] 点歌标题输入框有清晰左右内边距。
- [ ] 小线索标题和正文输入不贴边。
- [ ] 回忆、事项、点歌、小线索编辑页输入感受一致。
- [ ] 不出现 Wot 默认样式和页面自定义样式冲突。

---

## UX-02：键盘遮挡编辑内容

### 现象

小线索编辑页弹出键盘后，下方正文、标签、置顶选项和保存按钮会被遮挡；其他长表单页也存在同类风险。

### 影响页面

- `src/pages/create/create.vue`
- `src/pages/detail/detail.vue` 编辑状态
- `src/pages/song-edit/song-edit.vue`
- `src/pages/task-edit/task-edit.vue`
- `src/pages/memo-edit/memo-edit.vue`

### 修复目标

- [ ] 监听真实键盘高度，不写死设备尺寸。
- [ ] 页面底部增加动态 keyboard spacer。
- [ ] 输入聚焦后，当前字段可滚动到可视区域。
- [ ] 保存按钮和重要选项可以完整滚动到键盘上方。
- [ ] 键盘收起后恢复正常底部安全区。
- [ ] 不破坏自定义导航和页面缓存。

### 推荐实现

- 使用 UniApp/微信键盘高度事件封装 app-level composable。
- 建议新增：`useKeyboardInset.ts`。
- 页面只消费动态 inset，不各自重复监听。

### 验收标准

- [ ] 五个创建/编辑页面均可在键盘打开时滚到最底部。
- [ ] 不出现保存按钮永远被键盘挡住的情况。
- [ ] iPhone 和常见 Android 均正常。

---

## UX-03：原生 Toast 与项目视觉割裂

### 当前情况

以下位置仍存在 `uni.showToast`：

- `src/composables/useFileUpload.ts`
- `src/pages/index/index.vue`
- `src/pages/create/create.vue`
- `src/pages/detail/detail.vue`
- `src/pages/songs/songs.vue`
- `src/pages/song-edit/song-edit.vue`
- `src/pages/tasks/tasks.vue`
- `src/pages/task-edit/task-edit.vue`
- `src/pages/memos/memos.vue`
- `src/pages/memo-edit/memo-edit.vue`

删除确认目前已主要使用 Wot `wd-message-box`，这是正确方向；本项重点清理原生 Toast。

### 允许保留的平台 API

以下不属于需要清理的“丑陋反馈 UI”：

- `uni.chooseImage`
- `getWindowInfo`
- `getMenuButtonBoundingClientRect`
- 页面导航 API
- CloudBase service wrapper 内的平台能力

### 修复目标

- [ ] 在 AppShell 或 app 根层提供统一 `wd-toast` 宿主。
- [ ] 新增 `useAppToast()` 或等价 app-level composable。
- [ ] 全量替换业务代码中的 `uni.showToast`。
- [ ] 成功、警告、错误提示使用统一视觉。
- [ ] 删除确认继续使用 `wd-message-box`。
- [ ] 不恢复 `uni.showModal`。

### 文案要求

一般提示要俏皮、温柔：

```text
已经轻轻收好
小纸条暂时没更新好，请稍后再试。
云端暂时没翻到新内容，先看本机收好的这一版。
```

错误、删除和权限提示必须清楚克制：

```text
这条小线索暂时没删掉，请稍后再试。
单张图片不能超过指定大小。
```

禁止：

```text
呜呜
哭哭
它消失啦
超级无敌
```

### 验收标准

- [ ] `grep -R "uni.showToast" src` 无业务命中。
- [ ] 所有反馈由 Wot/AppToast 统一承载。
- [ ] 深色和 6 套主题下 Toast 可读。

---

## UX-04：自定义导航未粘性吸顶

### 当前情况

`AppCustomNav.vue` 当前根节点为正常文档流 `position: relative`。首次进入页面时高度占位正确，但页面向上滚动后，自定义导航会跟随内容滚走。

真机截图中可见：

- 设置页滚动后正文进入状态栏区域。
- 编辑页内容可能接近或压到顶部状态栏/胶囊。

### 修复目标

- [ ] 自定义导航在滚动时保持顶部可见。
- [ ] 继续使用 API 获取状态栏和胶囊尺寸。
- [ ] 不覆盖微信右上角胶囊。
- [ ] 不产生重复占位或首屏跳动。
- [ ] 首页无返回按钮，其他页面返回按钮正常。
- [ ] 页面背景与导航自然融合。

### 推荐实现

优先评估：

1. Wot UI 当前版本是否支持稳定的 sticky 组件。
2. 若不适用，封装 app-level sticky nav，不在页面散写。

必须检查 sticky 的祖先节点是否存在会破坏吸顶的 `overflow`。

### 验收标准

- [ ] 11 个页面滚动时导航稳定吸顶。
- [ ] 状态栏、刘海和微信胶囊均不遮挡内容。
- [ ] 深色/浅色切换时导航背景同步。

---

## UX-05：长列表重要区域未吸顶

### 原则

只吸顶“轻量操作区”，不要把大 Hero 或大卡片吸顶，否则会占用过多屏幕。

### 页面与建议区域

| 页面 | 建议吸顶内容 |
|---|---|
| 首页 | `回忆时间线 + 条数` 的紧凑标题行 |
| 小歌单 | 分类筛选和必要操作区 |
| 小约定 | 进度摘要 + 分类筛选 |
| 小档案 | 分类标签区 |
| 设置 | 只需要全局自定义导航吸顶，不做内部复杂吸顶 |
| 编辑页 | 不做内部吸顶，优先处理键盘避让 |

### 修复要求

- [ ] 与 AppCustomNav 的动态高度兼容。
- [ ] sticky top 使用导航计算值或统一 CSS variable，不写死。
- [ ] 吸顶背景足够遮住下方内容，但不做玻璃拟物。
- [ ] 吸顶后仍保持小纸条、手绘、轻盈风格。
- [ ] 筛选状态和滚动位置不丢失。

### 验收标准

- [ ] 长列表滚动时，用户仍能看到当前模块和筛选状态。
- [ ] 不遮挡第一条卡片。
- [ ] 不与微信胶囊或自定义导航重叠。

---

# 5. P2 修复项

## UX-06：设置页选择器体系不统一

### 当前问题

设置页仍使用独立 `view` 卡片：

- `mode-card`
- `density-card`
- `font-choice`

虽然没有使用原生表单控件，但与项目要求的 `AppOptionGroup / AppOptionButton` 统一选择器体系不完全一致。

### 修复目标

- [ ] 外观模式改用 `AppOptionGroup / AppOptionButton`。
- [ ] 界面密度改用统一组件。
- [ ] 字号大小改用统一组件。
- [ ] 保留当前图标、说明文案和纸片视觉。
- [ ] 不退回系统设置页风格。

### 验收标准

- [ ] settings 不再存在 `mode-card / density-card / font-choice` 主要交互结构。
- [ ] 所有选项键盘/触控状态一致。
- [ ] 选中态、禁用态和按压态统一。

---

## UX-07：ThemeSwatchPicker 组件路径不统一

### 当前问题

`ThemeSwatchPicker.vue` 使用自定义 `view` cell、倾角 class 和点击事件；视觉可用，但与 `AppOptionButton` 的交互语义和可访问性路径不同。

### 修复目标

两种可接受方案：

### 方案 A：收敛到 AppOption 体系

- `AppOptionGroup` 负责 3 列布局。
- `AppOptionButton variant="swatch"` 负责点击、选中、按压。
- 内部保留双色纸样预览和“已选”印章。

### 方案 B：明确升级为批准的 app-level Swatch 控件

若现有 `AppOptionButton` 无法支持 Figma 视觉，则：

- 明确 `ThemeSwatchPicker` 为批准的 app-level 选择器。
- 补齐 role、aria、disabled、pressed 等统一行为。
- 在设计系统文档中记录例外。

### 验收标准

- [ ] 6 套主题均正常切换。
- [ ] 选中卡片视觉稳定。
- [ ] 偏大字号不严重挤压。
- [ ] 不使用任意 hex 输入。

---

## UX-08：首页小宠物遮挡内容

### 现象

真机截图中，小宠物可能悬浮在回忆卡片图片、文字或列表计数附近。

### 修复目标

- [ ] 调整宠物默认位置，减少首次进入遮挡。
- [ ] 首页时间线底部或右侧提供合理宠物安全空间。
- [ ] 拖拽范围仍覆盖主要可用区域。
- [ ] 不让宠物进入状态栏、胶囊和底部 Home Indicator。
- [ ] 菜单气泡仍贴近宠物。
- [ ] 小宠物继续只在首页。

### 不建议

- 不要把宠物重新挂到其他页面。
- 不要自动频繁移动宠物。
- 不要为了避让内容做复杂实时碰撞系统。

### 验收标准

- [ ] 默认位置不遮挡首屏主要 CTA 和时间线标题。
- [ ] 常见 iPhone/Android 尺寸下不压住图片中心。
- [ ] 用户拖动后的保存位置仍有效。

---

## UX-09：表单 deep selector 分散

### 问题

多个页面分别维护 Wot 输入组件内部选择器：

```text
.wd-input__body
.wd-input__value
.wd-textarea__value
custom-input-class
custom-textarea-class
```

Wot 升级或页面微调时容易产生差异和回归。

### 修复目标

- [ ] 抽取统一的纸条输入基础组件或 mixin。
- [ ] 页面只传业务文案、maxlength、disabled 等 props。
- [ ] 降低重复 `:deep()` 规则。
- [ ] 不改变 Wot UI first 原则。

### 验收标准

- [ ] create/detail/song-edit/task-edit/memo-edit 的输入样式来源统一。
- [ ] 未来调整一次即可同步全部页面。

---

## UX-10：反馈文案最终统一

### 检查范围

- 表单校验
- 保存成功/失败
- 删除成功/失败
- 上传失败
- 下拉刷新失败
- 缓存回退
- 网络错误
- 权限失败

### 文案原则

一般状态：俏皮、可爱、轻盈。

危险状态：清楚、克制、不卖萌。

### 验收标准

- [ ] 所有用户可见文本为简体中文。
- [ ] 无英文 Toast、Modal、EmptyState、按钮。
- [ ] 无“后台管理 / CRUD / KPI / todo”式语气。
- [ ] 无幼儿化、哭哭、呜呜等过度卖萌。

---

# 6. P3 测试与验收项

## UX-11：DevTools 自动化截图不稳定

### 当前问题

`@dcloudio/uni-automator` 曾出现：

```text
Failed to connect to runtime, please make sure the project is running
```

### 修复目标

- [ ] 明确微信开发者工具 CLI、项目运行状态和端口启动流程。
- [ ] 提供稳定的 smoke 脚本或操作文档。
- [ ] 自动化失败时必须执行人工截图验收，不得用构建通过替代视觉验收。

### 最终截图矩阵

至少覆盖：

- [ ] 首页浅色
- [ ] 首页深色
- [ ] 回忆创建
- [ ] 回忆详情
- [ ] 小歌单
- [ ] 点歌编辑 + 键盘
- [ ] 小约定
- [ ] 事项编辑 + 键盘
- [ ] 小档案
- [ ] 小线索编辑 + 键盘
- [ ] 设置页
- [ ] 小宠物菜单
- [ ] 偏大字号业务页
- [ ] 紧凑密度列表页

---

# 7. 页面影响矩阵

| 页面 | 输入优化 | 键盘避让 | Toast 迁移 | Nav 吸顶 | 内部吸顶 | 其他 |
|---|---:|---:|---:|---:|---:|---|
| 首页 | — | — | 是 | 是 | 时间线标题 | 宠物避让 |
| 回忆创建 | 是 | 是 | 是 | 是 | — | 图片上传反馈 |
| 回忆详情 | 编辑态 | 编辑态 | 是 | 是 | — | 删除确认保留 Wot |
| 小歌单 | — | — | 是 | 是 | 筛选 | — |
| 点歌编辑 | 是 | 是 | 是 | 是 | — | 标题输入最明显 |
| 小约定 | — | — | 是 | 是 | 进度+筛选 | — |
| 事项编辑 | 是 | 是 | 是 | 是 | — | 日期输入 |
| 小档案 | — | — | 是 | 是 | 分类标签 | — |
| 小线索编辑 | 是 | 是 | 是 | 是 | — | 真机键盘遮挡明显 |
| 设置 | — | — | 少量/检查 | 是 | — | 选择器统一 |
| 设计预览 | — | — | 检查 | 是 | — | 开发者直达页 |

---

# 8. 推荐执行顺序

必须分轮执行，不要一次大改全部页面。

## Phase 1：Feedback UI 1.0

范围：

- 建立 app-level Wot Toast。
- 替换全部 `uni.showToast`。
- 统一反馈文案。

完成条件：

```text
grep -R "uni.showToast" src
```

业务代码无命中。

## Phase 2：Form Polish 1.0

范围：

- 统一输入框/文本域内边距。
- 建立纸条输入基础样式。
- 键盘动态避让。

重点页面：

- song-edit
- memo-edit
- create
- task-edit
- detail edit

## Phase 3：Custom Nav Sticky 1.0

范围：

- 自定义导航吸顶。
- 状态栏与胶囊兼容。
- 不产生重复占位。

## Phase 4：List Sticky Sections 1.0

范围：

- 首页时间线标题。
- 小歌单筛选。
- 小约定进度/筛选。
- 小档案分类。

## Phase 5：Settings Control Polish 1.0

范围：

- 外观、密度、字号统一选择器。
- ThemeSwatchPicker 收敛或正式登记例外。

## Phase 6：Pet Clearance 1.0

范围：

- 首页宠物默认位置。
- 列表安全留白。
- 拖拽边界与安全区复核。

## Phase 7：Visual Smoke 1.0

范围：

- 运行完整截图矩阵。
- 修复最终真机细节。

---

# 9. 每轮通用架构边界

所有修复不得改变：

- AppID：`wx04b0ef4f0de5c5c5`
- CloudBase envId：`love-d4g006mox4b78e5c6`
- collection：`love_entries`
- storage prefix：`love-entries/main/`
- owner-only Stage 1
- `memory / song / task / memo` 单集合类型隔离
- 回忆删除云文件清理
- 本地缓存 + 静默刷新
- `tempFileURL` 无变化重绘防护
- 小宠物首页-only
- 全页面自定义导航

禁止新增：

- 登录/账号体系
- partner access
- 公开分享/评论/feed
- 推送/支付
- 云函数
- UnoCSS
- AppSecret
- 海洋、珊瑚礁、贝壳、珍珠视觉
- 玻璃拟物和复杂 3D

---

# 10. 每轮通用验证

每轮完成后必须运行：

```bash
pnpm scan:ui-copy
pnpm scan:design-tokens
pnpm type-check
pnpm type-check:strict
pnpm build:mp-weixin
git diff --check
```

额外确认：

```bash
grep -R "wx.cloud" src/pages src/components src/stores || true
grep -R "getSystemInfoSync" src || true
grep -R "AppSecret\|appsecret" src dist || true
grep -R "unocss\|UnoCSS" src package.json vite.config.ts || true
grep -R "<app-pet-navigator" src/pages || true
grep -R "love-d4g006mox4b78e5c6" dist/build/mp-weixin
grep -R "wx04b0ef4f0de5c5c5" dist/build/mp-weixin
```

涉及反馈修复时额外确认：

```bash
grep -R "uni.showToast\|uni.showModal\|uni.showActionSheet\|uni.showLoading" src/pages src/components src/composables || true
```

涉及表单修复时额外确认：

```bash
grep -R "custom-input-class\|custom-textarea-class\|wd-input__body\|wd-textarea__value" src/pages src/components || true
```

涉及吸顶修复时必须真机/DevTools 检查，不得仅依据构建结果验收。

---

# 11. 最终完成定义

仅当以下条件全部满足，才可将本清单标记为完成：

- [ ] 所有 P1 项已关闭。
- [ ] 所有 P2 项已关闭或由用户明确接受为长期视觉债。
- [ ] 原生业务 Toast 已全部替换。
- [ ] 所有编辑页输入内边距统一。
- [ ] 所有编辑页键盘场景可滚动到保存按钮。
- [ ] 自定义导航滚动时稳定吸顶。
- [ ] 首页、歌单、事项、小档案重要区域吸顶正确。
- [ ] 设置选择器交互路径统一。
- [ ] 小宠物默认不遮挡主要内容。
- [ ] 11 个页面完成浅色/深色/偏大字号真机验收。
- [ ] 所有必跑验证命令通过。
- [ ] CloudBase、缓存、owner-only 和业务 CRUD 无回归。

完成后状态应为：

```text
P0：无
P1：无
P2：无，或已有用户书面接受
P3：自动化可用或已有稳定人工验收流程
项目状态：Stage 1 owner-only 体验收口完成
```
