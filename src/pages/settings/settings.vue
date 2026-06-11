<template>
  <app-shell title="私密偏好" eyebrow="设置">
    <view class="settings">
      <view class="settings-intro">
        <text class="settings-intro__title">本人测试</text>
        <text class="settings-intro__body">当前只开放给拥有者账号，主题偏好只影响本机显示。</text>
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
          <text class="settings-panel__note">保留温柔、私密的红蓝小人方向</text>
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
          <text class="settings-panel__title">开发预览</text>
          <text class="settings-panel__note">查看主题、尺寸、组件和令牌的当前渲染结果</text>
        </view>
        <wd-button block plain @click="openDesignPreview">打开设计系统预览</wd-button>
      </view>

      <view class="settings-panel">
        <view class="settings-panel__head">
          <text class="settings-panel__title">云开发信息</text>
          <text class="settings-panel__note">只显示运行所需的公开配置</text>
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
import { appConfig } from "@/config/app"
import { useThemeStore, type ThemeDensity, type ThemeFontScale, type ThemeMode } from "@/stores/theme"

const theme = useThemeStore()

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

const cloudEnvLabel = computed(() => appConfig.cloudbaseEnvId || "云开发环境未配置，请检查 .env 中的 VITE_CLOUDBASE_ENV_ID。")
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
