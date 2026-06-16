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
      <view class="settings-cover">
        <view class="settings-cover__stamp">
          <text>当前阶段</text>
          <text>本人测试</text>
        </view>
        <view class="settings-cover__copy">
          <text class="settings-cover__title">私密偏好</text>
          <text class="settings-cover__body">当前只开放给拥有者账号，所有偏好只影响本机显示。</text>
          <view class="settings-cover__tags">
            <text class="settings-cover__tag">只影响本机</text>
            <text class="settings-cover__tag">安静保存</text>
          </view>
        </view>
      </view>

      <view class="paper-book">
        <view class="paper-book__rings">
          <view class="paper-book__ring"></view>
          <view class="paper-book__ring"></view>
          <view class="paper-book__ring"></view>
        </view>
        <view class="paper-book__head">
          <text class="paper-book__kicker">小纸样选择册</text>
          <text class="paper-book__title">换换小程序样子</text>
          <text class="paper-book__note">一点颜色、一点间距，都可以慢慢调成顺眼的样子。</text>
          <view class="paper-book__tabs">
            <text class="paper-book__tab">模式</text>
            <text class="paper-book__tab paper-book__tab--palette">色卡</text>
            <text class="paper-book__tab paper-book__tab--feel">手感</text>
          </view>
        </view>

        <view class="settings-panel settings-panel--pinned">
          <view class="settings-panel__head">
            <text class="settings-panel__title">外观模式</text>
            <text class="settings-panel__note">白天、夜里，或者交给系统自己看着办。</text>
          </view>
          <app-option-group :columns="3">
            <app-option-button
              v-for="option in modeOptions"
              :key="option.value"
              :active="theme.mode === option.value"
              @click="theme.setThemeMode(option.value)"
            >
              <text>{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <view class="settings-panel settings-panel--sample">
          <view class="settings-panel__head">
            <text class="settings-panel__title">主题颜色</text>
            <text class="settings-panel__note">挑一张今天的小纸样。</text>
          </view>
          <theme-swatch-picker
            class="settings-theme-picker"
            :palette-id="theme.paletteId"
            @select-palette="theme.setPalette"
          />
        </view>

        <view class="settings-grid">
          <view class="settings-panel settings-panel--small">
            <view class="settings-panel__head">
              <text class="settings-panel__title">界面密度</text>
              <text class="settings-panel__note">小纸条之间要松一点，还是贴近一点。</text>
            </view>
            <app-option-group :columns="2">
              <app-option-button
                v-for="option in densityOptions"
                :key="option.value"
                :active="theme.density === option.value"
                @click="theme.setDensity(option.value)"
              >
                <text>{{ option.label }}</text>
              </app-option-button>
            </app-option-group>
          </view>

          <view class="settings-panel settings-panel--small">
            <view class="settings-panel__head">
              <text class="settings-panel__title">字号大小</text>
              <text class="settings-panel__note">看小字顺眼，或者让字再大一点。</text>
            </view>
            <app-option-group :columns="2">
              <app-option-button
                v-for="option in fontScaleOptions"
                :key="option.value"
                :active="theme.fontScale === option.value"
                @click="theme.setFontScale(option.value)"
              >
                <text>{{ option.label }}</text>
              </app-option-button>
            </app-option-group>
          </view>
        </view>
      </view>

      <view class="settings-footer">
        <view class="settings-panel settings-panel--quiet">
          <view class="settings-panel__head">
            <text class="settings-panel__title">开发预览</text>
            <text class="settings-panel__note">查看设计系统预览。</text>
          </view>
          <wd-button block plain @click="openDesignPreview">查看设计系统预览</wd-button>
        </view>

        <view class="settings-panel settings-panel--quiet">
          <view class="settings-panel__head">
            <text class="settings-panel__title">云开发信息</text>
            <text class="settings-panel__note">只展示当前运行需要的公开配置。</text>
          </view>
          <view class="cloud-row">
            <text class="cloud-row__label">当前阶段</text>
            <text class="cloud-row__value">本人测试</text>
          </view>
          <view class="cloud-row">
            <text class="cloud-row__label">环境</text>
            <text class="cloud-row__value">{{ cloudEnvLabel }}</text>
          </view>
          <view class="cloud-row">
            <text class="cloud-row__label">数据集合</text>
            <text class="cloud-row__value">{{ appConfig.entriesCollection }}</text>
          </view>
          <view class="cloud-row">
            <text class="cloud-row__label">云存储</text>
            <text class="cloud-row__value">{{ appConfig.storageEntriesPath }}</text>
          </view>
        </view>
      </view>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { appConfig } from "@/config/app"
import type { ThemeDensity, ThemeFontScale, ThemeMode } from "@/stores/theme"

const theme = useNativeChromeSync()

const modeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: "跟随系统", value: "system" },
  { label: "浅色", value: "light" },
  { label: "深色", value: "dark" }
]

const densityOptions: Array<{ label: string; value: ThemeDensity }> = [
  { label: "舒适", value: "comfortable" },
  { label: "紧凑", value: "compact" }
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

const cloudEnvLabel = computed(() => appConfig.cloudbaseEnvId || "云开发环境暂未配置，请检查本地环境变量。")
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.settings {
  display: flex;
  flex-direction: column;
  gap: var(--app-section-gap);
}

.settings-cover,
.paper-book,
.settings-panel {
  @include panel;
}

.settings-cover {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: var(--app-space-9);
  padding: var(--app-card-padding);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
  overflow: hidden;
}

.settings-cover::before {
  position: absolute;
  top: calc(var(--app-space-0) - var(--app-space-16));
  right: calc(var(--app-space-0) - var(--app-space-20));
  width: var(--app-space-64);
  height: var(--app-space-64);
  border-radius: var(--app-radius-round);
  background: var(--app-primary-muted);
  content: "";
  opacity: var(--app-decor-opacity);
}

.settings-cover::after {
  position: absolute;
  right: var(--app-card-padding);
  bottom: var(--app-space-5);
  width: var(--app-space-36);
  height: var(--app-space-10);
  border-top: var(--app-panel-border-width) dashed var(--app-divider);
  border-bottom: var(--app-panel-border-width) dashed var(--app-divider);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-6deg);
}

.settings-cover__stamp {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: var(--app-entry-date-width);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-2);
  padding: var(--app-space-6);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-badge);
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font: var(--app-font-caption);
  text-align: center;
  transform: rotate(-3deg);
}

.settings-cover__copy {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
}

.settings-cover__title {
  display: block;
  color: var(--app-primary);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-5xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
}

.settings-cover__body {
  display: block;
  margin-top: var(--app-space-4);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-body);
  line-height: var(--app-line-height-relaxed);
}

.settings-cover__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  margin-top: var(--app-space-7);
}

.settings-cover__tag {
  padding: var(--app-space-2) var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-pill);
  background: var(--app-field);
  color: var(--app-text-muted);
  font: var(--app-font-caption);
}

.paper-book {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--app-form-gap);
  padding: var(--app-card-padding);
  background:
    linear-gradient(180deg, var(--app-surface), var(--app-field));
  overflow: hidden;
}

.paper-book::before {
  position: absolute;
  top: var(--app-card-padding);
  bottom: var(--app-card-padding);
  left: var(--app-space-7);
  width: var(--app-space-1);
  border-radius: var(--app-radius-pill);
  background: var(--app-primary-soft);
  content: "";
  opacity: var(--app-decor-opacity);
}

.paper-book__rings {
  position: absolute;
  top: var(--app-space-16);
  left: var(--app-space-4);
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-16);
}

.paper-book__ring {
  width: var(--app-space-7);
  height: var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-round);
  background: var(--app-surface);
}

.paper-book__head {
  position: relative;
  z-index: 1;
  padding: var(--app-space-2) var(--app-space-0) var(--app-space-8) var(--app-space-12);
  border-bottom: var(--app-panel-border-width) dashed var(--app-border);
}

.paper-book__kicker {
  display: block;
  color: var(--app-accent);
  font: var(--app-font-caption);
}

.paper-book__title {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.paper-book__note {
  display: block;
  margin-top: var(--app-space-3);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-md);
  line-height: var(--app-line-height-relaxed);
}

.paper-book__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  margin-top: var(--app-space-7);
}

.paper-book__tab {
  padding: var(--app-space-2) var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-pill);
  background: var(--app-field);
  color: var(--app-text-muted);
  font: var(--app-font-caption);
  transform: rotate(-2deg);
}

.paper-book__tab--palette {
  background: var(--app-primary-muted);
  color: var(--app-primary);
  transform: rotate(2deg);
}

.paper-book__tab--feel {
  background: var(--app-accent-soft);
  color: var(--app-accent);
  transform: rotate(-1deg);
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: var(--app-form-gap);
}

.settings-footer {
  display: flex;
  flex-direction: column;
  gap: var(--app-form-gap);
}

.settings-panel {
  position: relative;
  z-index: 1;
  padding: var(--app-space-10);
  border-color: var(--app-border-muted);
  background: var(--app-field);
  box-shadow: var(--app-shadow-none);
  overflow: hidden;
}

.settings-panel::before {
  position: absolute;
  top: var(--app-space-0);
  left: var(--app-space-10);
  width: var(--app-space-24);
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  background: var(--app-primary-soft);
  content: "";
  opacity: var(--app-decor-opacity);
}

.settings-panel--pinned {
  border-color: var(--app-primary-muted);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-primary-muted));
}

.settings-panel--sample {
  border-color: var(--app-accent-soft);
  background:
    linear-gradient(180deg, var(--app-surface), var(--app-surface-strong));
}

.settings-panel--small {
  background: var(--app-surface);
}

.settings-panel--quiet {
  border-style: dashed;
  background: var(--app-surface);
}

.settings-panel__head {
  margin-bottom: var(--app-space-8);
}

.settings-panel__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.settings-panel__note {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-md);
  line-height: var(--app-line-height-normal);
}

.settings-theme-picker {
  gap: var(--app-space-3);
}

:deep(.settings-theme-picker .app-option-button--swatch) {
  position: relative;
  min-height: calc(var(--app-swatch-height) + var(--app-space-10));
  height: auto;
  align-items: flex-start;
  justify-content: flex-end;
  gap: var(--app-space-3);
  padding: var(--app-space-8);
  border-radius: var(--app-radius-xl) var(--app-radius-lg) var(--app-radius-2xl) var(--app-radius-md);
  box-shadow: var(--app-shadow-sm);
  overflow: hidden;
}

:deep(.settings-theme-picker .app-option-button--swatch.app-option-button--active) {
  box-shadow: var(--app-shadow-focus);
  transform: translateY(calc(var(--app-space-0) - var(--app-space-1)));
}

:deep(.settings-theme-picker .theme-picker__name) {
  font: var(--app-font-card-title);
}

:deep(.settings-theme-picker .theme-picker__description) {
  color: var(--app-option-swatch-foreground);
  opacity: var(--app-muted-opacity);
}

:deep(.settings-theme-picker .theme-picker__active) {
  align-self: flex-end;
  border: var(--app-panel-border-width) solid var(--app-color-swatch-active-border);
}

.cloud-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-9);
  padding: var(--app-space-7) var(--app-space-0) var(--app-space-6);
  border-bottom: var(--app-panel-border-width) dashed var(--app-divider);
}

.cloud-row:last-child {
  border-bottom: 0;
}

.cloud-row__label {
  color: var(--app-text-soft);
  font-size: var(--app-font-size-base);
}

.cloud-row__value {
  max-width: var(--app-cloud-value-width);
  color: var(--app-text);
  font-size: var(--app-font-size-base);
  line-height: var(--app-line-height-normal);
  text-align: right;
  word-break: break-all;
}
</style>
