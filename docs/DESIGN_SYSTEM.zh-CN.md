# 设计系统

## 1. 架构

全局样式入口是 `src/styles/index.scss`，按层导入：

- `tokens/primitive.scss`：原始颜色、间距、字号、圆角、阴影、动效值。
- `tokens/light.scss` 和 `tokens/dark.scss`：浅色、深色语义变量默认映射。
- `tokens/size.scss`：页面、卡片、表单、按钮、输入框、图片网格尺寸。
- `tokens/typography.scss`：页面标题、分区标题、正文、说明文字、按钮、卡片标题。
- `tokens/radius.scss`：卡片、按钮、输入框、图片、底部面板圆角。
- `tokens/shadow.scss`：卡片、悬浮层、按钮、图片、标志阴影。
- `tokens/motion.scss`：过渡时长、缓动、按压透明度和位移。
- `tokens/component.scss`：AppShell、空状态、首页、记录卡片、图片网格、色板、云开发信息等组件尺寸。
- `tokens/semantic.scss`：兼容旧变量名，并把页面组件常用变量统一到语义层。

页面和组件只能消费 `var(--app-xxx)`、`src/styles/mixins.scss` 或已有组件 API。不要在页面和组件里直接写新颜色、字号、间距、阴影、圆角或动效数值。

## 2. 原始令牌

原始令牌保存不可再拆分的值，例如：

- 颜色：`--app-red-50`、`--app-red-500`、`--app-blue-500`、`--app-ivory-50`、`--app-neutral-900`
- 间距：`--app-space-1` 到 `--app-space-64`
- 圆角：`--app-radius-sm`、`--app-radius-md`、`--app-radius-xl`、`--app-radius-pill`
- 字号：`--app-font-size-xs` 到 `--app-font-size-page-title`
- 阴影：`--app-shadow-sm`、`--app-shadow-md`、`--app-shadow-lg`
- 动效：`--app-duration-fast`、`--app-duration-normal`、`--app-ease-standard`

原始令牌只应在 `src/styles/tokens/**` 和主题 store 的语义映射里使用。

## 3. 语义令牌

页面和组件优先使用语义令牌：

- 背景：`--app-color-bg-page`、`--app-color-bg-card`、`--app-color-bg-input`
- 文本：`--app-color-text-primary`、`--app-color-text-secondary`、`--app-color-text-muted`
- 品牌：`--app-color-primary`、`--app-color-primary-soft`、`--app-color-red-person`、`--app-color-blue-person`
- 状态：`--app-color-danger`、`--app-color-warning`、`--app-color-success`
- 布局：`--app-page-padding-x`、`--app-section-gap`、`--app-card-padding`、`--app-form-gap`
- 组件：`--app-entry-card-min-height`、`--app-image-grid-gap`、`--app-swatch-height`

`--app-primary`、`--app-bg`、`--app-surface`、`--app-text` 等旧变量名仍保留为兼容别名。

## 4. 深浅色与配色

`src/stores/theme.ts` 是主题唯一状态源：

- `mode`：`system`、`light`、`dark`
- `resolvedMode`：实际生效的 `light` 或 `dark`
- `paletteId`：当前策展配色
- `density`：`comfortable` 或 `compact`
- `fontScale`：`normal` 或 `large`
- `appCssVars`：注入到 AppShell 根节点的应用 CSS 变量
- `wotThemeVars`：传给 Wot UI 的主题变量

浅色模式使用暖白页面背景、柔和卡片、深墨文字、红蓝小人强调色。深色模式使用深海军蓝或暖炭黑背景、深色卡片和柔和红蓝强调色，避免纯黑和霓虹感。

当前配色：

- 暖白红蓝：默认配色，匹配红蓝手绘小人。
- 软粉蓝：更轻的粉蓝浪漫感。
- 夜航红蓝：更适合深色模式的红蓝系统。

新增配色时，只改 `romanticPalettes`，并提供语义输出：`primary`、`primarySoft`、`primaryPressed`、`redPerson`、`bluePerson`、`heartSoft`、`bgWarm`、`cardWarm`、`borderSoft`、深色主色和深色背景。

## 5. 尺寸与排版

全局尺寸在 `tokens/size.scss` 和 `tokens/component.scss` 管理：

- 页面留白：`--app-page-padding-x`、`--app-page-padding-y`
- 卡片：`--app-card-padding`、`--app-card-gap`
- 列表和表单：`--app-list-gap`、`--app-form-gap`
- 控件：`--app-control-height-sm/md/lg`、`--app-button-height`、`--app-input-height`
- 图片：`--app-image-grid-gap`、`--app-radius-image`

排版在 `tokens/typography.scss` 管理。组件使用 `--app-font-page-title`、`--app-font-section-title`、`--app-font-body`、`--app-font-caption`、`--app-font-card-title` 等语义字体。

## 6. Wot UI 映射

Wot UI 通过 `AppShell.vue` 的 `wd-config-provider` 接收：

- `:theme="theme.wotTheme"`
- `:theme-vars="theme.wotThemeVars"`

当前只使用已在 `wot-design-uni/components/wd-config-provider/types.ts` 中确认存在的变量，例如 `colorTheme`、`colorTitle`、`colorContent`、`colorSecondary`、`colorBorder`、`colorBg`、`darkBackground`、`buttonLargeRadius`。

不确定的 Wot 变量不要猜；优先使用应用级 CSS 变量。

## 7. 全局注入方式

UniApp mp-weixin 下最稳定的方式是：

1. `src/App.vue` 全局导入 `src/styles/index.scss`，提供默认令牌。
2. `src/components/AppShell.vue` 在根 `view` 上绑定 `theme.themeClasses` 和 `theme.appStyle`。
3. `theme.appStyle` 以内联 CSS 变量覆盖当前配色、深浅色、密度和字号。

所有页面都包在 `AppShell` 里，因此变量可以稳定传递到页面、组件和 Wot UI 子树。

## 8. 禁止做法

- 不要在 `src/components/**` 或 `src/pages/**` 里新增十六进制颜色、`rgba()`、固定 `rpx/px` 尺寸、直接 `box-shadow` 或直接过渡时长。
- 不要新增任意颜色输入器。
- 不要把主题状态分散到页面。
- 不要绕过 `wd-config-provider` 设置 Wot UI 主题。
- 不要把 “Coral” 视觉化为海洋、珊瑚礁或商业化品牌风。

提交前运行：

```bash
pnpm scan:design-tokens
pnpm scan:ui-copy
pnpm type-check
pnpm build:mp-weixin
```
