<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="小纸样本" nav-eyebrow="悄悄设置" nav-show-back :nav-variant="'page'">
    <view class="settings">
      <view class="settings-heading app-reveal-1">
        <text class="settings-heading__eyebrow">只在这台手机悄悄生效</text>
        <text class="settings-heading__title">今天的小纸样</text>
      </view>

      <view class="settings-section app-reveal-2">
        <view class="settings-section__head">
          <text class="settings-section__title">白天夜里的样子</text>
          <text class="settings-section__hint">跟随系统 / 浅色 / 深色</text>
        </view>
        <app-option-group :columns="3" responsive="auto">
          <app-option-button
            v-for="option in modeOptions"
            :key="option.value"
            :active="theme.mode === option.value"
            @click="theme.setThemeMode(option.value)"
          >
            <view class="settings-option settings-option--center">
              <text class="settings-option__icon">{{ option.icon }}</text>
              <text class="settings-option__label">{{ option.label }}</text>
            </view>
          </app-option-button>
        </app-option-group>
      </view>

      <view class="settings-section app-reveal-3">
        <view class="settings-section__head">
          <text class="settings-section__title">小纸样颜色</text>
          <text class="settings-section__hint">六套，像小纸样卡</text>
        </view>
        <theme-swatch-picker
          class="settings-theme-picker"
          :palette-id="theme.paletteId"
          @select-palette="theme.setPalette"
        />
      </view>

      <view class="settings-section app-reveal-4">
        <view class="settings-section__head">
          <text class="settings-section__title">小纸条间距</text>
          <text class="settings-section__hint">舒适 / 紧凑</text>
        </view>
        <app-option-group :columns="2" responsive="auto">
          <app-option-button
            v-for="option in densityOptions"
            :key="option.value"
            :active="theme.density === option.value"
            @click="theme.setDensity(option.value)"
          >
            <view class="settings-option">
              <view class="settings-option__top">
                <text class="settings-option__icon">{{ option.icon }}</text>
                <text class="settings-option__label">{{ option.label }}</text>
              </view>
              <text class="settings-option__note">{{ option.note }}</text>
            </view>
          </app-option-button>
        </app-option-group>
      </view>

      <view class="settings-section app-reveal-5">
        <view class="settings-section__head">
          <text class="settings-section__title">字要多大</text>
          <text class="settings-section__hint">标准 / 偏大</text>
        </view>
        <view class="font-card">
          <app-option-group :columns="2" responsive="auto">
            <app-option-button
              v-for="option in fontScaleOptions"
              :key="option.value"
              :active="theme.fontScale === option.value"
              @click="theme.setFontScale(option.value)"
            >
              <view class="settings-option settings-option--center">
                <text class="settings-option__label">{{ option.label }}</text>
                <text class="settings-option__note">{{ option.note }}</text>
              </view>
            </app-option-button>
          </app-option-group>
          <view class="font-card__rail" aria-hidden="true">
            <view
              class="font-card__rail-fill"
              :class="{ 'font-card__rail-fill--large': theme.fontScale === 'large' }"
            ></view>
            <view
              class="font-card__rail-dot"
              :class="{ 'font-card__rail-dot--large': theme.fontScale === 'large' }"
            ></view>
          </view>
          <text class="font-card__preview">这是字号大小预览效果</text>
        </view>
      </view>

      <view class="app-handdrawn-divider app-reveal-5" aria-hidden="true" />

      <view class="settings-section settings-section--muted app-reveal-6">
        <view class="settings-section__head">
          <text class="settings-section__title">小角落</text>
        </view>
        <view class="appendix">
          <view class="appendix-row appendix-row--quiet">
            <view class="appendix-row__main">
              <text class="appendix-row__icon">☁️</text>
              <text class="appendix-row__label">云端小仓库</text>
            </view>
            <text class="appendix-row__value">{{ cloudEnvLabel }}</text>
          </view>
        </view>
      </view>

      <text class="settings-signoff">小纸页轻轻收好，每一笔都是慢慢留下的痕迹</text>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { appConfig } from "@/config/app"
import type { ThemeDensity, ThemeFontScale, ThemeMode } from "@/stores/theme"

const theme = useNativeChromeSync()

const modeOptions: Array<{ icon: string; label: string; value: ThemeMode }> = [
  { icon: "🎐", label: "跟随系统", value: "system" },
  { icon: "☀️", label: "浅色", value: "light" },
  { icon: "🌙", label: "深色", value: "dark" }
]

const densityOptions: Array<{
  icon: string
  label: string
  note: string
  value: ThemeDensity
}> = [
  { icon: "☁️", label: "舒适", note: "行间松弛", value: "comfortable" },
  { icon: "🎀", label: "紧凑", note: "更密更近", value: "compact" }
]

const fontScaleOptions: Array<{
  label: string
  note: string
  value: ThemeFontScale
}> = [
  { label: "标准", note: "日常阅读", value: "normal" },
  { label: "偏大", note: "更易看清", value: "large" }
]

const cloudEnvLabel = computed(() => (appConfig.cloudbaseEnvId ? "已配置" : "待配置"))
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.settings {
  display: flex;
  flex-direction: column;
  gap: var(--app-section-gap);
}

.settings-heading {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
}

.settings-heading__eyebrow {
  display: block;
  color: var(--app-text-muted);
  font: var(--app-font-caption);
}

.settings-heading__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-7);
}

.settings-section--muted {
  margin-top: var(--app-space-4);
}

.settings-section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--app-space-5);
}

.settings-section__title {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  font-weight: var(--app-font-weight-semibold);
}

.settings-section__hint {
  color: var(--app-text-muted);
  font-size: var(--app-font-size-2xs);
  line-height: var(--app-line-height-none);
}

.settings-theme-picker {
  display: block;
}

.settings-option {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: var(--app-space-4);
}

.settings-option--center {
  align-items: center;
  text-align: center;
}

.settings-option__top {
  display: flex;
  align-items: center;
  gap: var(--app-space-5);
}

.settings-option__icon {
  color: var(--app-primary);
  font-size: var(--app-font-size-lg);
  line-height: var(--app-line-height-none);
}

.settings-option__label {
  color: var(--app-text);
  font: var(--app-font-button);
}

.settings-option__note {
  display: block;
  color: var(--app-text-muted);
  font-size: var(--app-font-size-2xs);
  line-height: var(--app-line-height-snug);
}

.font-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-8);
  padding: var(--app-card-padding);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
}

.font-card__rail {
  position: relative;
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  background: var(--app-divider);
}

.font-card__rail-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--app-space-20);
  border-radius: var(--app-radius-pill);
  background: var(--app-primary);
  transition: width var(--app-transition-normal);
}

.font-card__rail-fill--large {
  width: calc(100% - var(--app-space-20));
}

.font-card__rail-dot {
  position: absolute;
  top: calc(var(--app-space-3) * -1);
  left: var(--app-space-16);
  width: var(--app-space-8);
  height: var(--app-space-8);
  border-radius: var(--app-radius-round);
  background: var(--app-surface);
  border: var(--app-border-width-focus) solid var(--app-primary);
  transition: left var(--app-transition-normal);
}

.font-card__rail-dot--large {
  left: calc(100% - var(--app-space-24));
}

.font-card__preview {
  text-align: center;
  color: var(--app-text-soft);
  font-size: var(--app-font-size-md);
  line-height: var(--app-line-height-normal);
}

.appendix {
  display: flex;
  flex-direction: column;
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
  overflow: hidden;
}

.appendix-row {
  display: flex;
  min-height: var(--app-space-18);
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-7);
  padding: var(--app-space-7) var(--app-space-9);
  border-bottom: var(--app-panel-border-width) solid var(--app-divider);
}

.appendix-row:last-child {
  border-bottom: 0;
}

.appendix-row--pressed {
  opacity: var(--app-press-opacity);
}

.appendix-row__main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--app-space-5);
}

.appendix-row__icon {
  color: var(--app-primary);
  font: var(--app-font-caption);
}

.appendix-row--quiet .appendix-row__icon {
  color: var(--app-accent);
}

.appendix-row__label {
  color: var(--app-text);
  font: var(--app-font-caption);
}

.appendix-row__value {
  flex-shrink: 0;
  max-width: var(--app-cloud-value-width);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-normal);
  text-align: right;
}

.settings-signoff {
  margin-top: var(--app-space-12);
  color: var(--app-text-muted);
  font: var(--app-font-caption);
  text-align: center;
}
</style>
