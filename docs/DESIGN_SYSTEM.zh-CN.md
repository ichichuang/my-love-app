# 设计系统

## 1. 架构边界

运行时主题系统分成两条同步链路、三层来源：

- `src/styles/tokens/**`：编译期默认令牌，只给 UniApp 和首次渲染提供兜底值。
- `src/design-system/**`：纯解析层，负责配色、尺寸、排版、Wot UI 变量、CSS 变量字符串和 `nativeChromeTheme`。除 `nav-theme.ts` 外不能调用 `uni`、`wx`、定时器或存储。
- `src/stores/theme.ts`：唯一主题状态源，只负责模式、配色、密度、字号、持久化、系统主题监听和调用解析器。

`AppShell.vue` 是唯一运行时 CSS 变量注入根。所有页面必须包在 `app-shell` 内，根 `view` 绑定 `theme.themeClasses` 与 `theme.appStyle`。`theme.appStyle` 必须包含展开后的终端变量，例如 `--app-bg: #fffaf3`，不能只输出 `--app-bg: var(--app-color-bg-page)`。

微信原生层单独由 `theme.nativeChromeTheme` 控制，包括导航栏、状态栏前景、窗口背景、iOS 顶部/底部背景、下拉背景文字和页面根样式。`src/design-system/native-chrome-resolver.ts` 只输出最终十六进制颜色，不输出 CSS 变量或 `rgba()`；深色导航栏使用深色卡片色，避免 Android 上过黑的状态栏观感。每个页面必须把 `page-meta` 放在模板第一个节点，并绑定 `theme.nativeChromeTheme` 的背景字段和 `pageStyle`。

`theme.json` 和 `src/theme.json` 只是系统主题下的首帧 fallback，用于微信在 Pinia 恢复前渲染原生窗口。手动“浅色/深色”以 Pinia runtime 为准；页面通过 `useNativeChromeSync()` 在 `onReady`、`onShow` 和主题字段变化时调用 `scheduleNativeChromeTheme`。真正的 `uni.setNavigationBarColor`、`uni.setBackgroundColor`、`uni.setBackgroundTextStyle` 只允许出现在 `src/design-system/nav-theme.ts`，并由 debounce、delay 和 `fail` callback 兜底。

## 1.1 类型治理

`src/design-system/token-registry.ts` 是 `--app-*` 令牌名的登记入口。新增令牌必须先加入该注册表中的对应分组，再由 `src/design-system/**` 解析器或 `src/styles/tokens/**` 样式根输出。页面和组件只能消费已登记令牌，不能在 `src/pages/**` 或 `src/components/**` 内定义新的 `--app-*` 令牌；少量组件运行时变量必须加入 `intentionalDynamicComponentVarNames` 显式 allowlist。

`AppCssVarName` 由注册表数组和 template literal 类型推导，`AppCssVars` 只允许登记过的应用令牌。局部工具变量，例如设计预览页的 `--preview-*`，应使用 `makeCssVars` 的通用 CSS 变量序列化能力，不要并入应用令牌体系。

`scaleKeys` 是尺寸刻度唯一来源，`ScaleKey` 必须从 `scaleKeys` 推导。`scaleToCssVars` 只接受 `"space-scale"`、`"radius-scale"`、`"control-scale"` 三类前缀。

策展配色的 `PaletteId` 必须从 `paletteSeeds` 推导。持久化读取仍接受历史未知字符串，但进入运行时状态前必须通过 `hasPalette` 校验并回退到默认配色。

Wot UI 映射继续基于 `ConfigProviderThemeVars`，并通过项目级 `RequiredWotThemeVars` 锁定核心映射。新增或调整 Wot 映射时，优先复用 `resolveWotThemeVars`、`resolveSizeTokens`、`resolveTypographyTokens` 和注册表中的 `wotRequiredAppVarNames`。

提交前除常规 `pnpm type-check` 外，应运行 `pnpm type-check:strict`。当前 strict 配置聚焦 `src/design-system/**` 与环境类型，用于约束设计系统基础类型，不承担全项目迁移。

## 2. 颜色令牌

配色只允许使用 `src/design-system/palettes.ts` 中的策展预设，不提供任意十六进制输入。

当前预设固定为 6 套策展主题：

- `warm-paper-red-blue`：暖纸红蓝，暖纸底色、安静红蓝，适合作为默认日记感。
- `peach-mist-blue`：桃雾蓝灰，桃雾柔光、蓝灰书写，整体更轻。
- `wisteria-tea`：紫藤杏茶，紫藤纸面、杏茶暖意，偏安静文艺。
- `apricot-sage`：杏茶鼠尾草，杏茶纸感、鼠尾草绿，偏自然手绘。
- `plum-garden`：梅子庭院，梅子色、庭院绿影，偏克制亲密。
- `indigo-letter`：靛蓝信笺，靛蓝信纸、安静朱砂，偏书信感。

每个预设都必须定义完整 `light` 和 `dark` 语义方案，并覆盖这些家族：

- `page`
- `card`
- `input`
- `control`
- `text`
- `border`
- `primary`
- `accent`
- `red-person`
- `blue-person`
- `status`
- `overlay`
- `swatch`
- `photo-badge`

可交互颜色家族必须包含 `base`、`soft`、`muted`、`pressed`、`active`、`foreground`、`border`、`disabled`、`divider`、`focus-ring`。`color-scale.ts` 将这些家族转换成 `--app-color-*` 变量，同时保留旧页面需要的兼容变量：

- 背景：`--app-color-bg-page`、`--app-color-bg-page-soft`、`--app-color-bg-card`、`--app-color-bg-input`
- 文本：`--app-color-text-primary`、`--app-color-text-secondary`、`--app-color-text-muted`、`--app-color-text-disabled`
- 品牌：`--app-color-primary`、`--app-color-primary-soft`、`--app-color-primary-pressed`
- 人物：`--app-color-red-person`、`--app-color-blue-person`
- 状态：`--app-color-danger`、`--app-color-warning`、`--app-color-success`、`--app-color-info`
- 覆层：`--app-color-overlay-soft`、`--app-color-overlay-strong`、`--app-color-on-overlay`
- 色板：`--app-color-swatch-*`
- 照片角标：`--app-color-photo-badge-*`

`css-vars.ts` 输出常用终端 alias：`--app-bg`、`--app-surface`、`--app-field`、`--app-control`、`--app-primary`、`--app-accent`、`--app-text`、`--app-border`、`--app-divider`、`--app-focus-ring`、`--app-shadow`。

对比度规则：

- 主色、强调色、人物色、状态色、色板预览等实色块的文字对比度必须不低于 4.5:1。
- `soft`、`muted`、`active` 等柔和色块与主文字的对比度必须不低于 3.0:1。
- 只有当白字对当前实色块达到 4.5:1 时才使用白字；否则使用深色墨水前景，例如 `#111827`。
- 深色模式的明亮主色、强调色和状态色通常使用深色前景，不强行使用白字。

新增或调整配色时：

1. 只修改 `src/design-system/palettes.ts` 中的策展种子或纯解析函数，不在页面、组件或 store 内写 raw 颜色。
2. 每套配色必须提供完整浅色和深色语义方案输入，并保持 `page`、`card`、`text`、`primary`、`accent` 的策展来源清晰。
3. 不新增任意十六进制输入器，不把配色变成用户自定义颜色系统。
4. 更新本文件中的配色清单和意图说明。
5. 运行 `pnpm scan:design-tokens`，该脚本会检查 6 套固定配色、关键源色、实色对比度和柔和色块对比度。

## 3. 尺寸与排版

`size-scale.ts` 定义 rpx 矩阵键：`2xs`、`xs`、`sm`、`md`、`lg`、`xl`、`2xl`、`3xl`。

`density` 只影响：

- 间距和 gap
- 页面、卡片、表单留白
- 控件高度
- 圆角
- 组件结构尺寸，例如记录卡片、图片网格、色板、底部操作区

`fontScale` 只影响：

- 字号 ramp
- 语义字体 shorthand
- Wot UI 字号

语义输出由 `size-resolver.ts` 汇总：

- spacing：`--app-page-padding-x`、`--app-section-gap`、`--app-card-padding`、`--app-form-gap`
- radius：`--app-radius-card`、`--app-radius-button`、`--app-radius-input`、`--app-radius-image`
- controls：`--app-control-height-sm`、`--app-control-height-md`、`--app-control-height-lg`
- components：`--app-entry-card-min-height`、`--app-swatch-height`、`--app-image-badge-size`
- shadows：`--app-shadow-card`、`--app-shadow-focus` 等由颜色方案和尺寸系统共同输出
- motion：`--app-transition-fast`、`--app-transition-normal`、`--app-press-opacity`

页面和组件只能消费 `var(--app-xxx)` 或 `src/styles/mixins.scss`。不要在页面或组件内新增固定 rpx/px、固定字号、直接阴影、直接过渡时长、十六进制颜色或 `rgba()`。

## 4. Wot UI 映射

Wot UI 通过 `AppShell.vue` 的 `wd-config-provider` 接收：

- `:key="theme.providerKey"`
- `:theme="theme.wotTheme"`
- `:theme-vars="theme.wotThemeVars"`

`providerKey` 由 `resolvedMode`、`paletteId`、`density`、`fontScale` 组成，用于强制 Wot UI 在主题输入变化时刷新。

`wot-theme.ts` 只能使用 `wot-design-uni/components/wd-config-provider/types.ts` 中已确认支持的变量。当前映射覆盖：

- 颜色：`colorTheme`、`colorSuccess`、`colorWarning`、`colorDanger`、`colorBlue`、`colorTitle`、`colorContent`、`colorSecondary`、`colorAid`、`colorBorder`、`colorBg`
- 深色：`darkBackground`、`darkBackground2`、`darkBackground3`、`darkColor`、`darkColor2`、`darkColor3`、`darkBorderColor`
- 字号：`fsTitle`、`fsContent`、`fsSecondary`、`fsAid`
- 按钮：`buttonSmallHeight`、`buttonMediumHeight`、`buttonLargeHeight`、`buttonSmallRadius`、`buttonMediumRadius`、`buttonLargeRadius`、`buttonSmallFs`、`buttonMediumFs`、`buttonLargeFs`

不确定的 Wot 变量不要猜，优先使用应用级 CSS 变量或局部组件。

## 5. 选项按钮

微信原生 `button` 有默认伪元素边框。`App.vue` 必须保留全局 reset：

- `button`
- `button::after`
- `button:after`

设置页模式、密度、字号选择和 `ThemeSwatchPicker` 必须使用统一选项组件路径：

- `AppOptionGroup.vue`
- `AppOptionButton.vue`

`ThemeSwatchPicker` 必须通过 `AppOptionButton variant="swatch"` 承载色板点击、选中、按压和可访问性语义；不得退回自定义可点击 `view` cell。

CTA、保存、删除、上传等明确动作继续使用 Wot `wd-button`。

## 6. 设计系统预览页

开发预览页位于 `pages/design-preview/design-preview`，页面标题为“小样本预览”。基于第一阶段仅拥有者使用的产品决策，该页面允许继续保留注册并可见，因为当前小程序只供拥有者和情侣使用；它是设计系统与主题 QA 页面，不是公开用户功能或普通产品卖点。除非后续明确提出产品需求，不应在首页、小宠物导航或设置页把它推广为常规产品入口。

预览页不得展示 AppSecret、OpenID、私有凭据、调试 token 或敏感账号数据。预览页必须继续包裹在 `AppShell.vue` 内，并使用同一个 `useThemeStore`、Wot UI 主题变量和设计令牌规则。QA 时可在页面内切换外观模式、策展配色、界面密度和字号，确认运行时 CSS 变量、Wot UI 主题变量、语义颜色、尺寸刻度、排版、组件令牌、阴影、动效、照片角标和状态色能立即刷新。

该页面属于开发者预览界面，允许展示 `--app-*` 技术令牌名；说明性文字、按钮、标题和状态文案仍必须使用简体中文。样式同样受 `pnpm scan:design-tokens` 管控，不允许在页面内新增 raw hex、`rgba()`、固定 rpx/px、直接阴影或直接过渡时长。

## 7. 禁止做法

- 不要新增 UnoCSS 或其他 utility CSS 框架。
- 不要新增任意颜色输入器。
- 不要在页面、组件或 store 内调用 `uni.setNavigationBarColor`、`uni.setBackgroundColor` 或 `uni.setBackgroundTextStyle`。
- 不要绕过页面首节点 `page-meta` 或 `useNativeChromeSync()` 同步微信原生层。
- 不要绕过 `AppShell` 注入 `theme.appStyle`。
- 不要绕过 `wd-config-provider` 设置 Wot UI 主题。
- 不要在页面或组件里直接写 hex、`rgba()`、固定 rpx/px、直接 `box-shadow`、直接 transition duration。
- 不要新增英文用户界面文案。
- 不要把 Stage 1 从本人测试扩展为公开社交、分享、评论、公开资料、支付、推送或网页登录。

## 8. 校验

提交前运行：

```bash
pnpm scan:ui-copy
pnpm scan:design-tokens
pnpm type-check
pnpm type-check:strict
pnpm build:mp-weixin
git diff --check
```

`scan:design-tokens` 会检查：

- 页面是否绕过 `AppShell`
- 页面是否缺少首节点 `page-meta`、`useNativeChromeSync()` 或 `theme.nativeChromeTheme` 绑定
- `AppShell` 是否仍注入 `theme.appStyle`、`themeVars` 和 `providerKey`
- 原生 chrome API 是否只出现在 `src/design-system/nav-theme.ts`
- `native-chrome-resolver.ts` 是否仍存在十六进制颜色解析与原生层主题解析
- 是否仍保留 6 套固定策展配色、关键源色和对比度规则
- `src/design-system/**` 是否存在禁用的运行时副作用
- 设置页和色板是否绕过 `AppOptionButton`
- 页面和组件是否出现 raw style 值
- 使用的 `--app-*` 是否已登记在令牌系统中
- 令牌名是否来自 `src/design-system/token-registry.ts` 或 `src/styles/**` 中的真实定义，组件内动态变量是否在 allowlist 中
