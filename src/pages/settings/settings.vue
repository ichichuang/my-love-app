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
      <view class="stage-note">
        <view class="stage-note__stamp">
          <text>当前阶段</text>
          <text>本人测试</text>
        </view>
        <view class="stage-note__copy">
          <text class="stage-note__title">私密偏好</text>
          <text class="stage-note__body">当前只开放给拥有者账号，所有偏好只影响本机显示。</text>
        </view>
      </view>

      <view class="paper-book">
        <view class="paper-book__head">
          <text class="paper-book__kicker">小纸样选择册</text>
          <text class="paper-book__title">换换小程序样子</text>
          <text class="paper-book__note">一点颜色、一点间距，都可以慢慢调成顺眼的样子。</text>
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
  gap: var(--app-form-gap);
}

.stage-note,
.settings-panel {
  @include panel;
  padding: var(--app-card-padding);
}

.stage-note {
  display: flex;
  align-items: stretch;
  gap: var(--app-space-9);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.stage-note__stamp {
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
}

.stage-note__copy {
  min-width: 0;
  flex: 1;
}

.stage-note__title {
  display: block;
  color: var(--app-primary);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-5xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
}

.stage-note__body {
  display: block;
  margin-top: var(--app-space-4);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-body);
  line-height: var(--app-line-height-relaxed);
}

.paper-book {
  display: flex;
  flex-direction: column;
  gap: var(--app-form-gap);
}

.paper-book__head {
  padding: var(--app-space-2) var(--app-space-0) var(--app-space-8);
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

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: var(--app-form-gap);
}

.settings-panel--pinned {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
}

.settings-panel--sample {
  background: var(--app-surface-strong);
}

.settings-panel--quiet {
  background: var(--app-surface);
}

.settings-panel__head {
  margin-bottom: var(--app-space-9);
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

.cloud-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-9);
  padding: var(--app-space-7) var(--app-space-0);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
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
