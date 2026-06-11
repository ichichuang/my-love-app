<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell title="基础设置" eyebrow="模板配置">
    <view class="settings">
      <view class="settings-intro">
        <text class="settings-intro__title">小程序架构模板</text>
        <text class="settings-intro__body">保留主题、尺寸、组件和原生界面同步能力，业务页面可按项目需要补充。</text>
      </view>

      <view class="settings-panel">
        <view class="settings-panel__head">
          <text class="settings-panel__title">外观模式</text>
          <text class="settings-panel__note">深浅模式会跟随系统或手动固定</text>
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

      <view class="settings-panel">
        <view class="settings-panel__head">
          <text class="settings-panel__title">主题颜色</text>
          <text class="settings-panel__note">切换预设配色并同步组件主题</text>
        </view>
        <theme-swatch-picker
          :palette-id="theme.paletteId"
          @select-palette="theme.setPalette"
        />
      </view>

      <view class="settings-panel">
        <view class="settings-panel__head">
          <text class="settings-panel__title">界面密度</text>
          <text class="settings-panel__note">控制页面留白、卡片间距和输入区域高度</text>
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

      <view class="settings-panel">
        <view class="settings-panel__head">
          <text class="settings-panel__title">字号大小</text>
          <text class="settings-panel__note">标准适合日常记录，偏大适合长时间阅读</text>
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

      <view class="settings-panel">
        <view class="settings-panel__head">
          <text class="settings-panel__title">能力预览</text>
          <text class="settings-panel__note">查看主题、尺寸、组件和令牌的当前渲染结果</text>
        </view>
        <wd-button block plain @click="openDesignPreview">打开能力预览</wd-button>
      </view>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
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
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.settings {
  display: flex;
  flex-direction: column;
  gap: var(--app-form-gap);
}

.settings-intro,
.settings-panel {
  @include panel;
  padding: var(--app-card-padding);
}

.settings-intro {
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.settings-intro__title {
  display: block;
  color: var(--app-primary);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-5xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
}

.settings-intro__body {
  display: block;
  margin-top: var(--app-space-4);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-body);
  line-height: var(--app-line-height-relaxed);
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

</style>
