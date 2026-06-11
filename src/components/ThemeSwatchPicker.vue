<template>
  <view class="theme-picker">
    <button
      v-for="palette in romanticPalettes"
      :key="palette.id"
      class="theme-picker__swatch"
      :class="{ 'theme-picker__swatch--active': palette.id === paletteId }"
      :style="swatchStyle(palette)"
      hover-class="theme-picker__swatch--pressed"
      @click="emit('selectPalette', palette.id)"
    >
      <text class="theme-picker__name">{{ palette.name }}</text>
      <text class="theme-picker__description">{{ palette.description }}</text>
      <text v-if="palette.id === paletteId" class="theme-picker__active">已选</text>
    </button>
  </view>
</template>

<script setup lang="ts">
import { romanticPalettes, type RomanticPalette } from "@/stores/theme"

defineProps<{
  paletteId: string
}>()

const emit = defineEmits<{
  selectPalette: [id: string]
}>()

const swatchStyle = (palette: RomanticPalette) =>
  `--swatch-primary: ${palette.primary}; --swatch-accent: ${palette.bluePerson}; --swatch-glow: ${palette.glow}`
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.theme-picker {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--app-image-grid-gap);
}

.theme-picker__swatch {
  @include pressable;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  height: var(--app-swatch-height);
  padding: var(--app-space-7);
  border: var(--app-border-width-focus) solid transparent;
  border-radius: var(--app-radius-card);
  background:
    radial-gradient(circle at 18% 20%, var(--swatch-glow), transparent var(--app-swatch-gradient-size)),
    linear-gradient(135deg, var(--swatch-primary), var(--swatch-accent));
  color: var(--app-color-on-swatch);
  line-height: var(--app-line-height-none);
  text-align: left;
}

.theme-picker__swatch--active {
  border-color: var(--app-color-swatch-active-border);
  box-shadow: var(--app-shadow-focus);
}

.theme-picker__swatch--pressed {
  opacity: var(--app-press-opacity);
}

.theme-picker__name {
  font-size: var(--app-font-size-base);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
}

.theme-picker__description {
  margin-top: var(--app-space-2);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-snug);
}

.theme-picker__active {
  align-self: flex-start;
  padding: var(--app-space-1) var(--app-space-4);
  border-radius: var(--app-radius-pill);
  background: var(--app-color-swatch-active-bg);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-none);
}
</style>
