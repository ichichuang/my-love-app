<template>
  <app-option-group class="theme-picker" :columns="2">
    <app-option-button
      v-for="palette in themePalettes"
      :key="palette.id"
      variant="swatch"
      :active="palette.id === paletteId"
      :style="swatchStyle(palette)"
      @click="emit('selectPalette', palette.id)"
    >
      <text class="theme-picker__name">{{ palette.name }}</text>
      <text class="theme-picker__description">{{ palette.description }}</text>
      <text v-if="palette.id === paletteId" class="theme-picker__active">已选</text>
    </app-option-button>
  </app-option-group>
</template>

<script setup lang="ts">
import { resolvePalettePreviewVars } from "@/design-system/color-scale"
import { makeCssVars } from "@/design-system/css-vars"
import { themePalettes, type PaletteId, type ThemePalette } from "@/stores/theme"

defineProps<{
  paletteId: PaletteId
}>()

const emit = defineEmits<{
  selectPalette: [id: PaletteId]
}>()

const swatchStyle = (palette: ThemePalette) =>
  makeCssVars(resolvePalettePreviewVars(palette))
</script>

<style lang="scss" scoped>
.theme-picker__name {
  font-size: var(--app-font-size-base);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
  overflow-wrap: anywhere;
}

.theme-picker__description {
  margin-top: var(--app-space-2);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-snug);
  overflow-wrap: anywhere;
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
