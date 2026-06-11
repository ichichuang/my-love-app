<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell title="能力预览" eyebrow="开发校验">
    <view class="preview">
      <view class="preview-panel preview-panel--diagnostics">
        <view class="preview-panel__head">
          <text class="preview-panel__title">运行诊断</text>
          <text class="preview-panel__note">只显示主题运行状态，不展示密钥或账号凭据。</text>
        </view>
        <view class="preview-diagnostics">
          <view v-for="item in diagnostics" :key="item.key" class="preview-diagnostic">
            <text class="preview-diagnostic__label">{{ item.caption }}</text>
            <text class="preview-diagnostic__value">{{ item.value }}</text>
          </view>
        </view>
      </view>

      <view class="preview-panel">
        <view class="preview-panel__head">
          <text class="preview-panel__title">实时主题控制</text>
          <text class="preview-panel__note">此处复用设置页控件，变更会立即影响本页和组件主题。</text>
        </view>
        <view class="preview-control-group">
          <text class="preview-control-group__label">外观模式</text>
          <app-option-group :columns="3">
            <app-option-button
              v-for="option in modeOptions"
              :key="option.value"
              :active="theme.mode === option.value"
              @click="theme.setThemeMode(option.value)"
            >
              <text>{{ option.caption }}</text>
            </app-option-button>
          </app-option-group>
        </view>
        <view class="preview-control-group">
          <text class="preview-control-group__label">主题颜色</text>
          <theme-swatch-picker :palette-id="theme.paletteId" @select-palette="theme.setPalette" />
        </view>
        <view class="preview-control-group">
          <text class="preview-control-group__label">界面密度</text>
          <app-option-group :columns="2">
            <app-option-button
              v-for="option in densityOptions"
              :key="option.value"
              :active="theme.density === option.value"
              @click="theme.setDensity(option.value)"
            >
              <text>{{ option.caption }}</text>
            </app-option-button>
          </app-option-group>
        </view>
        <view class="preview-control-group">
          <text class="preview-control-group__label">字号大小</text>
          <app-option-group :columns="2">
            <app-option-button
              v-for="option in fontScaleOptions"
              :key="option.value"
              :active="theme.fontScale === option.value"
              @click="theme.setFontScale(option.value)"
            >
              <text>{{ option.caption }}</text>
            </app-option-button>
          </app-option-group>
        </view>
      </view>

      <preview-section title="策展配色" note="每组色板展示浅色与深色语义输出。">
        <view class="preview-palette-list">
          <view v-for="palette in themePalettes" :key="palette.id" class="preview-palette">
            <view class="preview-palette__meta">
              <text class="preview-palette__name">{{ palette.name }}</text>
              <text class="preview-palette__description">{{ palette.description }}</text>
              <text class="preview-tech">{{ palette.id }}</text>
            </view>
            <view class="preview-palette__schemes">
              <view class="preview-scheme" :style="schemeStyle(palette, 'light')">
                <text class="preview-scheme__label">浅色</text>
                <view class="preview-scheme__sample">
                  <text>卡片</text>
                  <text>主色</text>
                </view>
              </view>
              <view class="preview-scheme" :style="schemeStyle(palette, 'dark')">
                <text class="preview-scheme__label">深色</text>
                <view class="preview-scheme__sample">
                  <text>卡片</text>
                  <text>主色</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </preview-section>

      <preview-section title="语义颜色" note="颜色块来自当前解析后的运行时变量。">
        <view class="preview-token-grid">
          <view v-for="item in colorSamples" :key="item.token" class="preview-token" :style="tokenStyle(item.token, item.foreground)">
            <view class="preview-token__swatch" />
            <text class="preview-token__caption">{{ item.caption }}</text>
            <text class="preview-tech preview-tech--on-token">{{ item.token }}</text>
          </view>
        </view>
      </preview-section>

      <preview-section title="状态颜色" note="危险、警告、成功和信息状态均由语义方案输出。">
        <view class="preview-status-list">
          <view v-for="item in statusSamples" :key="item.token" class="preview-status" :style="tokenStyle(item.token, item.foreground)">
            <text class="preview-status__caption">{{ item.caption }}</text>
            <text class="preview-tech preview-tech--on-token">{{ item.token }}</text>
          </view>
        </view>
      </preview-section>

      <preview-section title="间距刻度" note="横向条展示 2xs 到 3xl 的密度响应。">
        <view class="preview-scale-list">
          <view v-for="item in scaleSamples" :key="item.key" class="preview-scale-row">
            <text class="preview-scale-row__label">{{ item.caption }}</text>
            <view class="preview-space-bar" :style="spaceStyle(item.spaceToken)" />
            <text class="preview-tech">{{ item.spaceToken }}</text>
          </view>
        </view>
      </preview-section>

      <preview-section title="圆角刻度" note="边框样片展示当前密度下的圆角输出。">
        <view class="preview-radius-grid">
          <view v-for="item in scaleSamples" :key="item.key" class="preview-radius-sample" :style="radiusStyle(item.radiusToken)">
            <text>{{ item.caption }}</text>
          </view>
        </view>
      </preview-section>

      <preview-section title="控件尺寸" note="控件高度随密度切换，不跟页面写死。">
        <view class="preview-control-size-list">
          <view v-for="item in scaleSamples" :key="item.key" class="preview-control-size" :style="controlStyle(item.controlToken)">
            <text>{{ item.caption }}</text>
            <text class="preview-tech">{{ item.controlToken }}</text>
          </view>
        </view>
      </preview-section>

      <preview-section title="排版语义" note="语义字体随字号偏好切换。">
        <view class="preview-type-list">
          <view v-for="item in typographySamples" :key="item.token" class="preview-type" :style="fontStyle(item.token)">
            <text>{{ item.caption }}</text>
            <text class="preview-tech">{{ item.token }}</text>
          </view>
        </view>
      </preview-section>

      <preview-section title="组件令牌" note="卡片、输入、徽章、媒体和覆层使用组件级变量。">
        <view class="preview-component-stack">
          <view class="preview-card">
            <text class="preview-card__title">卡片标题</text>
            <text class="preview-card__body">卡片背景、边框、阴影和内边距全部来自令牌。</text>
          </view>
          <view class="preview-field">
            <text class="preview-field__label">输入区域</text>
            <text class="preview-field__value">输入内容预览</text>
          </view>
          <view class="preview-badge-row">
            <text class="preview-badge">主色徽章</text>
            <text class="preview-badge preview-badge--accent">强调徽章</text>
            <text class="preview-badge preview-badge--soft">柔和徽章</text>
          </view>
          <view class="preview-image">
            <view class="preview-image__mark" />
            <text class="preview-image__label">媒体占位</text>
            <text class="preview-image__badge">媒体</text>
          </view>
          <view class="preview-overlay">
            <text class="preview-overlay__text">覆层与媒体角标令牌</text>
          </view>
        </view>
      </preview-section>

      <preview-section title="阴影与动效" note="阴影、按压透明度和过渡令牌集中展示。">
        <view class="preview-motion-grid">
          <view v-for="item in shadowSamples" :key="item.token" class="preview-shadow" :style="shadowStyle(item.token)">
            <text>{{ item.caption }}</text>
            <text class="preview-tech">{{ item.token }}</text>
          </view>
          <view class="preview-motion">
            <text class="preview-motion__title">按压反馈</text>
            <text class="preview-motion__body">使用透明度、缩放和过渡令牌。</text>
          </view>
        </view>
      </preview-section>

      <preview-section title="组件主题" note="按钮通过当前组件主题变量刷新。">
        <view class="preview-wot-buttons">
          <wd-button size="small">小号按钮</wd-button>
          <wd-button>默认按钮</wd-button>
          <wd-button size="large">大号按钮</wd-button>
          <wd-button type="success">成功</wd-button>
          <wd-button type="warning">警告</wd-button>
          <wd-button type="error">危险</wd-button>
          <wd-button type="info" plain>信息</wd-button>
        </view>
      </preview-section>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from "vue"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { makeCssVars } from "@/design-system/css-vars"
import { resolveThemeColorVars } from "@/design-system/theme-resolver"
import type { AppTheme, ThemePalette } from "@/design-system/types"
import { themePalettes, type ThemeDensity, type ThemeFontScale, type ThemeMode } from "@/stores/theme"

const PreviewSection = defineComponent({
  props: {
    title: {
      type: String,
      required: true
    },
    note: {
      type: String,
      required: true
    }
  },
  setup(props, { slots }) {
    return () =>
      h("view", { class: "preview-panel" }, [
        h("view", { class: "preview-panel__head" }, [
          h("text", { class: "preview-panel__title" }, props.title),
          h("text", { class: "preview-panel__note" }, props.note)
        ]),
        h("view", { class: "preview-panel__body" }, slots.default?.())
      ])
  }
})

const theme = useNativeChromeSync()

const modeOptions: Array<{ caption: string; value: ThemeMode }> = [
  { caption: "跟随系统", value: "system" },
  { caption: "浅色", value: "light" },
  { caption: "深色", value: "dark" }
]

const densityOptions: Array<{ caption: string; value: ThemeDensity }> = [
  { caption: "舒适", value: "comfortable" },
  { caption: "紧凑", value: "compact" }
]

const fontScaleOptions: Array<{ caption: string; value: ThemeFontScale }> = [
  { caption: "标准", value: "normal" },
  { caption: "偏大", value: "large" }
]

const scaleSamples = [
  { caption: "2xs", key: "2xs", spaceToken: "--app-space-scale-2xs", radiusToken: "--app-radius-scale-2xs", controlToken: "--app-control-scale-2xs" },
  { caption: "xs", key: "xs", spaceToken: "--app-space-scale-xs", radiusToken: "--app-radius-scale-xs", controlToken: "--app-control-scale-xs" },
  { caption: "sm", key: "sm", spaceToken: "--app-space-scale-sm", radiusToken: "--app-radius-scale-sm", controlToken: "--app-control-scale-sm" },
  { caption: "md", key: "md", spaceToken: "--app-space-scale-md", radiusToken: "--app-radius-scale-md", controlToken: "--app-control-scale-md" },
  { caption: "lg", key: "lg", spaceToken: "--app-space-scale-lg", radiusToken: "--app-radius-scale-lg", controlToken: "--app-control-scale-lg" },
  { caption: "xl", key: "xl", spaceToken: "--app-space-scale-xl", radiusToken: "--app-radius-scale-xl", controlToken: "--app-control-scale-xl" },
  { caption: "2xl", key: "2xl", spaceToken: "--app-space-scale-2xl", radiusToken: "--app-radius-scale-2xl", controlToken: "--app-control-scale-2xl" },
  { caption: "3xl", key: "3xl", spaceToken: "--app-space-scale-3xl", radiusToken: "--app-radius-scale-3xl", controlToken: "--app-control-scale-3xl" }
] as const

const colorSamples = [
  { caption: "页面背景", token: "--app-bg", foreground: "--app-text" },
  { caption: "深层背景", token: "--app-bg-deep", foreground: "--app-text" },
  { caption: "卡片表面", token: "--app-surface", foreground: "--app-text" },
  { caption: "强调表面", token: "--app-surface-strong", foreground: "--app-text" },
  { caption: "输入背景", token: "--app-field", foreground: "--app-text" },
  { caption: "控件背景", token: "--app-control", foreground: "--app-text" },
  { caption: "主色", token: "--app-primary", foreground: "--app-color-on-primary" },
  { caption: "主色柔和", token: "--app-primary-soft", foreground: "--app-text" },
  { caption: "强调色", token: "--app-accent", foreground: "--app-color-on-accent" },
  { caption: "文字", token: "--app-text", foreground: "--app-color-text-inverse" },
  { caption: "次级文字", token: "--app-text-soft", foreground: "--app-color-text-inverse" },
  { caption: "边框", token: "--app-border", foreground: "--app-text" }
] as const

const statusSamples = [
  { caption: "危险", token: "--app-danger", foreground: "--app-color-danger-foreground" },
  { caption: "危险柔和", token: "--app-danger-soft", foreground: "--app-text" },
  { caption: "警告", token: "--app-warning", foreground: "--app-color-warning-foreground" },
  { caption: "警告柔和", token: "--app-warning-soft", foreground: "--app-text" },
  { caption: "成功", token: "--app-success", foreground: "--app-color-success-foreground" },
  { caption: "成功柔和", token: "--app-success-soft", foreground: "--app-text" },
  { caption: "信息", token: "--app-color-info", foreground: "--app-color-info-foreground" },
  { caption: "信息柔和", token: "--app-color-info-soft", foreground: "--app-text" }
] as const

const typographySamples = [
  { caption: "辅助说明文字", token: "--app-font-caption" },
  { caption: "正文段落文字", token: "--app-font-body" },
  { caption: "按钮文字", token: "--app-font-button" },
  { caption: "分区标题", token: "--app-font-section-title" },
  { caption: "卡片标题", token: "--app-font-card-title" },
  { caption: "页面标题", token: "--app-font-page-title" },
  { caption: "首屏标题", token: "--app-font-hero-title" },
  { caption: "详情标题", token: "--app-font-detail-title" }
] as const

const shadowSamples = [
  { caption: "无阴影", token: "--app-shadow-none" },
  { caption: "卡片阴影", token: "--app-shadow-card" },
  { caption: "浮层阴影", token: "--app-shadow-floating" },
  { caption: "按钮阴影", token: "--app-shadow-button" },
  { caption: "图片阴影", token: "--app-shadow-image" },
  { caption: "焦点阴影", token: "--app-shadow-focus" }
] as const

const diagnostics = computed(() => [
  { key: "mode", caption: "当前选择", value: theme.mode },
  { key: "resolvedMode", caption: "解析模式", value: theme.resolvedMode },
  { key: "systemTheme", caption: "系统模式", value: theme.systemTheme },
  { key: "paletteId", caption: "配色编号", value: theme.paletteId },
  { key: "density", caption: "界面密度", value: theme.density },
  { key: "fontScale", caption: "字号档位", value: theme.fontScale },
  { key: "providerKey", caption: "组件刷新键", value: theme.providerKey ? "已启用" : "未启用" },
  { key: "runtimeCss", caption: "变量注入", value: theme.appCssVars["--app-bg"] ? "已启用" : "未启用" },
  { key: "wotThemeVars", caption: "组件变量", value: Object.keys(theme.wotThemeVars).length > 0 ? "已启用" : "未启用" }
])

const cssVars = makeCssVars

const schemeStyle = (palette: ThemePalette, mode: AppTheme) => {
  const vars = resolveThemeColorVars(mode, palette)
  return cssVars({
    "--preview-scheme-bg": vars["--app-color-bg-page"],
    "--preview-scheme-card": vars["--app-color-bg-card"],
    "--preview-scheme-text": vars["--app-color-text-primary"],
    "--preview-scheme-muted": vars["--app-color-text-secondary"],
    "--preview-scheme-primary": vars["--app-color-primary"],
    "--preview-scheme-on-primary": vars["--app-color-on-primary"],
    "--preview-scheme-border": vars["--app-color-border"],
    "--preview-scheme-shadow": vars["--app-shadow-card"]
  })
}

const tokenStyle = (token: string, foreground = "--app-text") =>
  cssVars({
    "--preview-token-bg": `var(${token})`,
    "--preview-token-text": `var(${foreground})`
  })

const spaceStyle = (token: string) =>
  cssVars({
    "--preview-space-width": `var(${token})`
  })

const radiusStyle = (token: string) =>
  cssVars({
    "--preview-radius": `var(${token})`
  })

const controlStyle = (token: string) =>
  cssVars({
    "--preview-control-height": `var(${token})`
  })

const fontStyle = (token: string) =>
  cssVars({
    "--preview-font": `var(${token})`
  })

const shadowStyle = (token: string) =>
  cssVars({
    "--preview-shadow": `var(${token})`
  })
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.preview {
  display: flex;
  flex-direction: column;
  gap: var(--app-section-gap);
}

.preview-panel {
  @include panel;
  padding: var(--app-card-padding);
}

.preview-panel--diagnostics {
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.preview-panel__head {
  margin-bottom: var(--app-space-9);
}

.preview-panel__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.preview-panel__note {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.preview-panel__body,
.preview-component-stack,
.preview-control-group {
  display: flex;
  flex-direction: column;
  gap: var(--app-card-gap);
}

.preview-control-group__label {
  color: var(--app-text);
  font: var(--app-font-button);
}

.preview-diagnostics,
.preview-token-grid,
.preview-radius-grid,
.preview-motion-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-list-gap);
}

.preview-diagnostic,
.preview-token,
.preview-radius-sample,
.preview-shadow,
.preview-motion,
.preview-field {
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-field);
}

.preview-diagnostic {
  padding: var(--app-space-7);
}

.preview-diagnostic__label {
  display: block;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.preview-diagnostic__value {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text);
  font: var(--app-font-button);
  word-break: break-all;
}

.preview-tech {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text-muted);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-snug);
  word-break: break-all;
}

.preview-palette-list,
.preview-status-list,
.preview-scale-list,
.preview-control-size-list,
.preview-type-list,
.preview-wot-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--app-list-gap);
}

.preview-palette {
  padding: var(--app-card-padding);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-field);
}

.preview-palette__meta {
  margin-bottom: var(--app-space-8);
}

.preview-palette__name {
  display: block;
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.preview-palette__description {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.preview-palette__schemes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-list-gap);
}

.preview-scheme {
  min-height: var(--app-control-scale-3xl);
  padding: var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--preview-scheme-border);
  border-radius: var(--app-radius-card);
  background: var(--preview-scheme-bg);
  box-shadow: var(--preview-scheme-shadow);
  color: var(--preview-scheme-text);
}

.preview-scheme__label {
  display: block;
  color: var(--preview-scheme-muted);
  font: var(--app-font-caption);
}

.preview-scheme__sample {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-6);
  margin-top: var(--app-space-7);
  padding: var(--app-space-6);
  border-radius: var(--app-radius-button);
  background: var(--preview-scheme-card);
  color: var(--preview-scheme-text);
  font: var(--app-font-button);
}

.preview-scheme__sample text:last-child {
  padding: var(--app-space-2) var(--app-space-5);
  border-radius: var(--app-radius-badge);
  background: var(--preview-scheme-primary);
  color: var(--preview-scheme-on-primary);
}

.preview-token {
  min-height: var(--app-control-scale-xl);
  padding: var(--app-space-6);
  background: var(--preview-token-bg);
  color: var(--preview-token-text);
}

.preview-token__swatch {
  height: var(--app-control-scale-xs);
  margin-bottom: var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--preview-token-text);
  border-radius: var(--app-radius-button);
  background: var(--preview-token-text);
}

.preview-token__caption {
  color: var(--preview-token-text);
  font: var(--app-font-button);
}

.preview-tech--on-token {
  color: var(--preview-token-text);
}

.preview-status {
  padding: var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--preview-token-bg);
  border-radius: var(--app-radius-card);
  background: var(--preview-token-bg);
  color: var(--preview-token-text);
}

.preview-status__caption {
  font: var(--app-font-button);
}

.preview-scale-row {
  display: grid;
  grid-template-columns: var(--app-space-44) 1fr;
  align-items: center;
  gap: var(--app-space-6);
}

.preview-scale-row__label {
  color: var(--app-text);
  font: var(--app-font-button);
}

.preview-space-bar {
  width: var(--preview-space-width);
  height: var(--app-control-scale-2xs);
  border-radius: var(--app-radius-badge);
  background: var(--app-primary);
}

.preview-radius-sample {
  min-height: var(--app-control-scale-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--preview-radius);
  color: var(--app-text);
  font: var(--app-font-button);
}

.preview-control-size {
  min-height: var(--preview-control-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-6);
  padding: var(--app-space-4) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-button);
  background: var(--app-control);
  color: var(--app-text);
  font: var(--app-font-button);
}

.preview-type {
  padding-bottom: var(--app-space-7);
  border-bottom: var(--app-panel-border-width) solid var(--app-divider);
  color: var(--app-text);
  font: var(--preview-font);
}

.preview-type:last-child {
  padding-bottom: var(--app-space-0);
  border-bottom: 0;
}

.preview-card {
  @include panel;
  padding: var(--app-card-padding);
}

.preview-card__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.preview-card__body {
  display: block;
  margin-top: var(--app-space-4);
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.preview-field {
  min-height: var(--app-input-height);
  padding: var(--app-space-6) var(--app-field-padding-x);
}

.preview-field__label {
  display: block;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.preview-field__value {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text);
  font: var(--app-font-body);
}

.preview-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-5);
}

.preview-badge {
  padding: var(--app-space-2) var(--app-space-6);
  border-radius: var(--app-radius-badge);
  background: var(--app-primary);
  color: var(--app-color-on-primary);
  font: var(--app-font-caption);
}

.preview-badge--accent {
  background: var(--app-accent);
  color: var(--app-color-on-accent);
}

.preview-badge--soft {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.preview-image {
  position: relative;
  min-height: var(--app-control-scale-3xl);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--app-radius-image);
  background:
    radial-gradient(circle at 22% 18%, var(--app-decor-soft), transparent var(--app-space-40)),
    linear-gradient(135deg, var(--app-primary-soft), var(--app-accent-soft));
  box-shadow: var(--app-shadow-image);
}

.preview-image__mark {
  width: var(--app-space-32);
  height: var(--app-space-32);
  border-radius: var(--app-radius-round);
  background: var(--app-surface);
  opacity: var(--app-muted-opacity);
}

.preview-image__label {
  position: absolute;
  color: var(--app-text-soft);
  font: var(--app-font-button);
}

.preview-image__badge {
  position: absolute;
  top: var(--app-space-6);
  right: var(--app-space-6);
  padding: var(--app-space-2) var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--app-color-media-badge-border);
  border-radius: var(--app-radius-badge);
  background: var(--app-media-badge);
  color: var(--app-color-on-overlay);
  font: var(--app-font-caption);
}

.preview-overlay {
  padding: var(--app-space-8);
  border-radius: var(--app-radius-card);
  background: var(--app-overlay-strong);
  color: var(--app-color-on-overlay);
}

.preview-overlay__text {
  font: var(--app-font-button);
}

.preview-shadow {
  min-height: var(--app-control-scale-xl);
  padding: var(--app-space-7);
  box-shadow: var(--preview-shadow);
  color: var(--app-text);
  font: var(--app-font-button);
}

.preview-motion {
  min-height: var(--app-control-scale-xl);
  padding: var(--app-space-7);
  transition: var(--app-transition-normal);
}

.preview-motion:active {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale));
}

.preview-motion__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-button);
}

.preview-motion__body {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}
</style>
