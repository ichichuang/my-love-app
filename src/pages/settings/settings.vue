<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell title="私密偏好" eyebrow="设置">
    <view class="settings">
      <view class="settings-heading">
        <text class="settings-heading__eyebrow">只影响本机显示</text>
        <text class="settings-heading__title">偏好配置</text>
      </view>

      <view class="settings-section">
        <view class="settings-section__head">
          <text class="settings-section__title">外观模式</text>
          <text class="settings-section__hint">跟随系统 / 浅色 / 深色</text>
        </view>
        <view class="mode-strip">
          <view
            v-for="option in modeOptions"
            :key="option.value"
            class="mode-card"
            :class="{ 'mode-card--active': theme.mode === option.value }"
            hover-class="mode-card--pressed"
            hover-stay-time="80"
            @click="theme.setThemeMode(option.value)"
          >
            <text class="mode-card__icon">{{ option.icon }}</text>
            <text class="mode-card__label">{{ option.label }}</text>
          </view>
        </view>
      </view>

      <view class="settings-section">
        <view class="settings-section__head">
          <text class="settings-section__title">主题颜色</text>
          <text class="settings-section__hint">六套，像小纸样卡</text>
        </view>
        <theme-swatch-picker
          class="settings-theme-picker"
          :palette-id="theme.paletteId"
          @select-palette="theme.setPalette"
        />
      </view>

      <view class="settings-section">
        <view class="settings-section__head">
          <text class="settings-section__title">界面密度</text>
          <text class="settings-section__hint">舒适 / 紧凑</text>
        </view>
        <view class="density-strip">
          <view
            v-for="option in densityOptions"
            :key="option.value"
            class="density-card"
            :class="{ 'density-card--active': theme.density === option.value }"
            hover-class="density-card--pressed"
            hover-stay-time="80"
            @click="theme.setDensity(option.value)"
          >
            <view class="density-card__top">
              <text class="density-card__icon">{{ option.icon }}</text>
              <text class="density-card__label">{{ option.label }}</text>
            </view>
            <text class="density-card__note">{{ option.note }}</text>
          </view>
        </view>
      </view>

      <view class="settings-section">
        <view class="settings-section__head">
          <text class="settings-section__title">字号大小</text>
          <text class="settings-section__hint">标准 / 偏大</text>
        </view>
        <view class="font-card">
          <view class="font-card__row">
            <view
              v-for="option in fontScaleOptions"
              :key="option.value"
              class="font-choice"
              :class="{ 'font-choice--active': theme.fontScale === option.value }"
              hover-class="font-choice--pressed"
              hover-stay-time="80"
              @click="theme.setFontScale(option.value)"
            >
              <text class="font-choice__label">{{ option.label }}</text>
              <text class="font-choice__hint">{{ option.note }}</text>
            </view>
          </view>
          <view class="font-card__rail" aria-hidden="true">
            <view class="font-card__rail-fill"></view>
            <view
              class="font-card__rail-dot"
              :class="{ 'font-card__rail-dot--large': theme.fontScale === 'large' }"
            ></view>
          </view>
          <text class="font-card__preview">这是字号大小预览效果</text>
        </view>
      </view>

      <view class="settings-section settings-section--muted">
        <view class="settings-section__head">
          <text class="settings-section__title">小角落信息</text>
        </view>
        <view class="appendix">
          <view class="appendix-row" hover-class="appendix-row--pressed" @click="openDesignPreview">
            <view class="appendix-row__main">
              <text class="appendix-row__icon">开发</text>
              <text class="appendix-row__label">开发预览</text>
            </view>
            <text class="appendix-row__value">设计系统小样本</text>
          </view>
          <view class="appendix-row appendix-row--quiet">
            <view class="appendix-row__main">
              <text class="appendix-row__icon">云</text>
              <text class="appendix-row__label">云开发信息</text>
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
  { icon: "▣", label: "跟随系统", value: "system" },
  { icon: "☼", label: "浅色", value: "light" },
  { icon: "☾", label: "深色", value: "dark" }
]

const densityOptions: Array<{
  icon: string
  label: string
  note: string
  value: ThemeDensity
}> = [
  { icon: "▦", label: "舒适", note: "行间松弛", value: "comfortable" },
  { icon: "☰", label: "紧凑", note: "更密更近", value: "compact" }
]

const fontScaleOptions: Array<{
  label: string
  note: string
  value: ThemeFontScale
}> = [
  { label: "标准", note: "日常阅读", value: "normal" },
  { label: "偏大", note: "更易看清", value: "large" }
]

const openDesignPreview = () => {
  uni.navigateTo({
    url: "/pages/design-preview/design-preview"
  })
}

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

.mode-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--app-option-group-gap);
}

.mode-card {
  display: flex;
  min-height: var(--app-space-24);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-3);
  padding: var(--app-space-7) var(--app-space-4);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
}

.mode-card--active {
  border-color: var(--app-primary);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-focus);
}

.mode-card--pressed {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale));
}

.mode-card__icon {
  color: var(--app-primary);
  font-size: var(--app-font-size-lg);
  line-height: var(--app-line-height-none);
}

.mode-card__label {
  color: var(--app-text);
  font: var(--app-font-caption);
}

.mode-card--active .mode-card__label {
  color: var(--app-primary);
}

.settings-theme-picker {
  display: block;
}

.density-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-option-group-gap);
}

.density-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  padding: var(--app-space-7) var(--app-space-8);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
}

.density-card--active {
  border-color: var(--app-primary);
  box-shadow: var(--app-shadow-focus);
}

.density-card--pressed {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale));
}

.density-card__top {
  display: flex;
  align-items: center;
  gap: var(--app-space-5);
}

.density-card__icon {
  color: var(--app-primary);
  font-size: var(--app-font-size-lg);
  line-height: var(--app-line-height-none);
}

.density-card__label {
  color: var(--app-text);
  font: var(--app-font-button);
}

.density-card--active .density-card__label {
  color: var(--app-primary);
}

.density-card__note {
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

.font-card__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-option-group-gap);
}

.font-choice {
  display: flex;
  min-height: var(--app-space-20);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-2);
  padding: var(--app-space-5) var(--app-space-4);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-md);
  background: var(--app-surface);
}

.font-choice--active {
  border-color: var(--app-primary);
  box-shadow: var(--app-shadow-focus);
}

.font-choice--pressed {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale));
}

.font-choice__label {
  color: var(--app-text);
  font: var(--app-font-button);
}

.font-choice--active .font-choice__label {
  color: var(--app-primary);
}

.font-choice__hint {
  color: var(--app-text-muted);
  font-size: var(--app-font-size-2xs);
  line-height: var(--app-line-height-none);
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