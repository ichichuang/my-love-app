<template>
  <view class="app-option-group" :class="responsiveClass" :style="groupStyle">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue"

type AppOptionGroupResponsive = "none" | "auto" | "swatch"

const props = withDefaults(
  defineProps<{
    columns?: 2 | 3
    responsive?: AppOptionGroupResponsive
  }>(),
  {
    columns: 2,
    responsive: "none"
  }
)

const groupStyle = computed(() => `--app-option-group-columns: ${props.columns}`)
const responsiveClass = computed(() => `app-option-group--${props.responsive}`)
</script>

<style lang="scss" scoped>
.app-option-group {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(var(--app-option-group-columns), minmax(0, 1fr));
  gap: var(--app-option-group-gap);
}

.app-option-group--auto {
  grid-template-columns:
    repeat(auto-fit, minmax(min(100%, var(--app-option-group-auto-min-width)), 1fr));
}

.app-option-group--swatch {
  grid-template-columns:
    repeat(auto-fit, minmax(min(100%, var(--app-option-group-swatch-min-width)), 1fr));
}

.app-option-group--auto :deep(.app-option-button),
.app-option-group--swatch :deep(.app-option-button) {
  height: auto;
}

.app-option-group--swatch :deep(.app-option-button--swatch) {
  min-height: var(--app-swatch-height);
}

.app-option-group--auto :deep(.app-option-button > *),
.app-option-group--swatch :deep(.app-option-button > *) {
  min-width: 0;
}

.app-option-group--auto :deep(text),
.app-option-group--swatch :deep(text) {
  overflow-wrap: anywhere;
  white-space: normal;
}
</style>
