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
        <text class="settings-heading__eyebrow">设置</text>
        <text class="settings-heading__title">偏好配置</text>
      </view>

      <view class="stage-card">
        <view class="stage-card__bar"></view>
        <view class="stage-card__copy">
          <text class="stage-card__label">当前阶段</text>
          <text class="stage-card__value">本人测试</text>
        </view>
        <view class="stage-card__mark">
          <text>试</text>
        </view>
        <text class="stage-card__note">当前只开放给拥有者账号，所有偏好只影响本机显示。</text>
      </view>

      <view class="settings-section">
        <text class="settings-section__title">外观模式</text>
        <app-option-group class="mode-group" :columns="3">
          <app-option-button
            v-for="option in modeOptions"
            :key="option.value"
            class="mode-card"
            :active="theme.mode === option.value"
            @click="theme.setThemeMode(option.value)"
          >
            <text class="mode-card__icon">{{ option.icon }}</text>
            <text class="mode-card__label">{{ option.label }}</text>
          </app-option-button>
        </app-option-group>
      </view>

      <view class="settings-section">
        <text class="settings-section__title">主题颜色</text>
        <theme-swatch-picker
          class="settings-theme-picker"
          :palette-id="theme.paletteId"
          @select-palette="theme.setPalette"
        />
      </view>

      <view class="settings-section">
        <text class="settings-section__title">界面密度</text>
        <view class="choice-list">
          <app-option-group class="choice-list__group" :columns="2">
            <app-option-button
              v-for="option in densityOptions"
              :key="option.value"
              class="choice-row"
              :active="theme.density === option.value"
              @click="theme.setDensity(option.value)"
            >
              <view class="choice-row__main">
                <text class="choice-row__icon">{{ option.icon }}</text>
                <text class="choice-row__label">{{ option.label }}</text>
              </view>
              <text class="choice-row__radio"></text>
            </app-option-button>
          </app-option-group>
        </view>
      </view>

      <view class="settings-section">
        <text class="settings-section__title">字号大小</text>
        <view class="font-card">
          <app-option-group class="font-card__choices" :columns="2">
            <app-option-button
              v-for="option in fontScaleOptions"
              :key="option.value"
              class="font-choice"
              :active="theme.fontScale === option.value"
              @click="theme.setFontScale(option.value)"
            >
              <text>{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
          <view class="font-card__rail">
            <view
              class="font-card__dot"
              :class="{ 'font-card__dot--large': theme.fontScale === 'large' }"
            ></view>
          </view>
          <text class="font-card__preview">“这是字号大小预览效果”</text>
        </view>
      </view>

      <view class="settings-section">
        <text class="settings-section__title">当前版本</text>
        <view class="info-card">
          <view class="info-row" @click="openDesignPreview">
            <view class="info-row__main">
              <text class="info-row__icon">开发</text>
              <text class="info-row__label">开发预览</text>
            </view>
            <text class="info-row__value">2.4.0</text>
          </view>
          <view class="info-row info-row--muted">
            <view class="info-row__main">
              <text class="info-row__icon">云</text>
              <text class="info-row__label">云开发信息</text>
            </view>
            <text class="info-row__value">{{ cloudEnvLabel }}</text>
          </view>
        </view>
      </view>

      <text class="settings-signoff">每一笔，都是心跳的痕迹</text>
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

const densityOptions: Array<{ icon: string; label: string; value: ThemeDensity }> = [
  { icon: "▦", label: "舒适", value: "comfortable" },
  { icon: "☰", label: "紧凑", value: "compact" }
]

const fontScaleOptions: Array<{ label: string; value: ThemeFontScale }> = [
  { label: "标准", value: "normal" },
  { label: "偏大", value: "large" }
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

.stage-card,
.font-card,
.info-card {
  @include panel;
}

.settings-heading {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
  margin-bottom: calc(var(--app-section-gap) - var(--app-space-8));
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

.stage-card {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: var(--app-space-8);
  row-gap: var(--app-space-3);
  padding: var(--app-card-padding);
  border-color: var(--app-border-muted);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  overflow: hidden;
}

.stage-card__bar {
  align-self: stretch;
  width: var(--app-space-1);
  border-radius: var(--app-radius-pill);
  background: var(--app-primary);
  grid-row: 1 / 3;
}

.stage-card__copy {
  min-width: 0;
}

.stage-card__label {
  display: block;
  color: var(--app-text-muted);
  font: var(--app-font-caption);
}

.stage-card__value {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-primary);
  font: var(--app-font-card-title);
}

.stage-card__mark {
  display: flex;
  width: var(--app-space-16);
  height: var(--app-space-16);
  align-items: center;
  justify-content: center;
  border-radius: var(--app-radius-round);
  color: var(--app-primary);
  font: var(--app-font-section-title);
  transform: rotate(8deg);
}

.stage-card__note {
  grid-column: 2 / 4;
  color: var(--app-text-soft);
  font-size: var(--app-font-size-md);
  line-height: var(--app-line-height-normal);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-7);
}

.settings-section__title {
  color: var(--app-text-muted);
  font: var(--app-font-caption);
}

.mode-card {
  min-height: var(--app-space-40);
  flex-direction: column;
  gap: var(--app-space-5);
  border-color: var(--app-border-muted);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.mode-card.app-option-button--active {
  background: var(--app-surface);
  box-shadow: var(--app-shadow-focus);
}

.mode-card__icon {
  color: var(--app-primary);
  font: var(--app-font-section-title);
}

.mode-card__label {
  color: var(--app-text);
  font: var(--app-font-caption);
}

.choice-list {
  @include panel;
  padding: var(--app-space-0);
  border-color: var(--app-border-muted);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  overflow: hidden;
}

.choice-list__group {
  gap: var(--app-space-0);
  grid-template-columns: 1fr;
}

.choice-row {
  min-height: var(--app-space-36);
  justify-content: space-between;
  padding: var(--app-space-7) var(--app-space-8);
  border: 0;
  border-bottom: var(--app-panel-border-width) solid var(--app-divider);
  border-radius: var(--app-space-0);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-none);
}

.choice-row:last-child {
  border-bottom: 0;
}

.choice-row.app-option-button--active {
  background: var(--app-surface);
  box-shadow: var(--app-shadow-none);
}

.choice-row__main,
.info-row__main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--app-space-5);
}

.choice-row__icon,
.info-row__icon {
  color: var(--app-primary);
  font: var(--app-font-caption);
}

.choice-row__label,
.info-row__label {
  color: var(--app-text);
  font: var(--app-font-button);
}

.choice-row__radio {
  width: var(--app-space-7);
  height: var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-border-strong);
  border-radius: var(--app-radius-round);
}

.choice-row.app-option-button--active .choice-row__radio {
  border-color: var(--app-primary);
  background: radial-gradient(circle, var(--app-primary) var(--app-space-2), transparent var(--app-space-3));
}

.font-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--app-space-7);
  padding: var(--app-card-padding);
  border-color: var(--app-border-muted);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.font-card__choices {
  display: contents;
}

.font-choice {
  min-height: var(--app-control-height-sm);
  padding: var(--app-space-2) var(--app-space-4);
  border: 0;
  background: transparent;
  box-shadow: var(--app-shadow-none);
}

.font-choice.app-option-button--active {
  color: var(--app-primary);
  background: transparent;
  box-shadow: var(--app-shadow-none);
}

.font-card__rail {
  position: relative;
  min-width: var(--app-space-32);
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  background: var(--app-divider);
}

.font-card__rail::before {
  position: absolute;
  inset: var(--app-space-0) auto var(--app-space-0) var(--app-space-0);
  width: var(--app-space-20);
  border-radius: var(--app-radius-pill);
  background: var(--app-primary);
  content: "";
}

.font-card__dot {
  position: absolute;
  top: calc(var(--app-space-0) - var(--app-space-3));
  left: var(--app-space-16);
  width: var(--app-space-8);
  height: var(--app-space-8);
  border-radius: var(--app-radius-round);
  background: var(--app-primary);
}

.font-card__dot--large {
  left: var(--app-space-24);
}

.font-card__preview {
  grid-column: 1 / 4;
  justify-self: center;
  color: var(--app-text-soft);
  font-size: var(--app-font-size-md);
  line-height: var(--app-line-height-normal);
}

.info-card {
  border-color: var(--app-border-muted);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  overflow: hidden;
}

.info-row {
  display: flex;
  min-height: var(--app-space-36);
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-7);
  padding: var(--app-space-7) var(--app-space-8);
  border-bottom: var(--app-panel-border-width) solid var(--app-divider);
}

.info-row:last-child {
  border-bottom: 0;
}

.info-row--muted .info-row__icon {
  color: var(--app-accent);
}

.info-row__value {
  flex-shrink: 0;
  max-width: var(--app-cloud-value-width);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-normal);
  text-align: right;
}

.settings-signoff {
  margin-top: var(--app-space-16);
  color: var(--app-text-muted);
  font: var(--app-font-caption);
  text-align: center;
}
</style>
