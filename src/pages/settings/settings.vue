<template>
  <app-shell title="私密偏好" eyebrow="Theme settings">
    <view class="settings">
      <view class="settings-panel">
        <text class="settings-panel__title">Appearance mode</text>
        <view class="mode-grid">
          <button
            v-for="option in modeOptions"
            :key="option.value"
            class="mode-grid__button"
            :class="{ 'mode-grid__button--active': theme.mode === option.value }"
            hover-class="mode-grid__button--pressed"
            @click="theme.setThemeMode(option.value)"
          >
            <text>{{ option.label }}</text>
          </button>
        </view>
      </view>

      <view class="settings-panel">
        <text class="settings-panel__title">Romantic palette</text>
        <theme-swatch-picker
          :palette-id="theme.paletteId"
          :custom-primary="theme.customPrimary"
          @select-palette="theme.setPalette"
          @update-custom="theme.setCustomPrimary"
          @clear-custom="theme.clearCustomPrimary"
        />
      </view>

      <view class="settings-panel">
        <text class="settings-panel__title">CloudBase</text>
        <view class="cloud-row">
          <text class="cloud-row__label">Environment</text>
          <text class="cloud-row__value">{{ cloudEnvLabel }}</text>
        </view>
        <view class="cloud-row">
          <text class="cloud-row__label">Collection</text>
          <text class="cloud-row__value">{{ appConfig.entriesCollection }}</text>
        </view>
        <view class="cloud-row">
          <text class="cloud-row__label">Storage</text>
          <text class="cloud-row__value">{{ appConfig.storageBasePath }}</text>
        </view>
      </view>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { appConfig } from "@/config/app"
import { useThemeStore, type ThemeMode } from "@/stores/theme"

const theme = useThemeStore()

const modeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: "Follow system", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" }
]

const cloudEnvLabel = computed(() => appConfig.cloudbaseEnvId || "Not configured")
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.settings {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.settings-panel {
  @include panel;
  padding: 28rpx;
}

.settings-panel__title {
  display: block;
  margin-bottom: 22rpx;
  color: var(--app-text);
  font-size: 32rpx;
  font-weight: 600;
}

.mode-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14rpx;
}

.mode-grid__button {
  @include pressable;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 82rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
  background: var(--app-field);
  color: var(--app-text);
  font-size: 26rpx;
  line-height: 82rpx;
}

.mode-grid__button--active {
  border-color: var(--app-primary);
  background: var(--app-surface-strong);
  color: var(--app-primary);
}

.mode-grid__button--pressed {
  opacity: 0.78;
}

.cloud-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 22rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid var(--app-border);
}

.cloud-row:last-child {
  border-bottom: 0;
}

.cloud-row__label {
  color: var(--app-text-soft);
  font-size: 24rpx;
}

.cloud-row__value {
  max-width: 420rpx;
  color: var(--app-text);
  font-size: 24rpx;
  line-height: 1.4;
  text-align: right;
  word-break: break-all;
}
</style>
