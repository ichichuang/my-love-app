<template>
  <wd-config-provider :theme="theme.wotTheme" :theme-vars="theme.wotThemeVars">
    <view class="app-shell theme-transition" :style="theme.appStyle">
      <view v-if="title || $slots.actions" class="app-shell__header">
        <view>
          <text v-if="eyebrow" class="app-shell__eyebrow">{{ eyebrow }}</text>
          <text v-if="title" class="app-shell__title">{{ title }}</text>
        </view>
        <view v-if="$slots.actions" class="app-shell__actions">
          <slot name="actions" />
        </view>
      </view>

      <slot />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { useThemeStore } from "@/stores/theme"

defineProps<{
  title?: string
  eyebrow?: string
}>()

const theme = useThemeStore()
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.app-shell {
  @include page-shell;
}

.app-shell__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 28rpx;
}

.app-shell__eyebrow {
  display: block;
  margin-bottom: 8rpx;
  color: var(--app-accent);
  font-size: 22rpx;
  letter-spacing: 0;
  line-height: 1.2;
}

.app-shell__title {
  display: block;
  color: var(--app-text);
  font-family: "Songti SC", "STSong", serif;
  font-size: 46rpx;
  font-weight: 600;
  line-height: 1.16;
}

.app-shell__actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}
</style>
