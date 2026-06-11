<template>
  <wd-config-provider :theme="theme.wotTheme" :theme-vars="theme.wotThemeVars">
    <view class="app-shell theme-transition" :class="theme.themeClasses" :style="theme.appStyle">
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
  gap: var(--app-shell-header-gap);
  margin-bottom: var(--app-shell-header-bottom);
  padding-top: var(--app-shell-header-top);
}

.app-shell__eyebrow {
  display: block;
  margin-bottom: var(--app-shell-eyebrow-bottom);
  color: var(--app-accent);
  font-size: var(--app-font-size-md);
  letter-spacing: 0;
  line-height: var(--app-line-height-tight);
}

.app-shell__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-page-title);
}

.app-shell__actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-6);
  flex-shrink: 0;
}
</style>
