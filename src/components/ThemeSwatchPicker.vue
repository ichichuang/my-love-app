<template>
  <app-option-group class="theme-picker" :columns="3">
    <app-option-button
      v-for="palette in romanticPalettes"
      :key="palette.id"
      :active="palette.id === paletteId"
      :style="swatchStyle(palette)"
      @click="emit('selectPalette', palette.id)"
    >
      <view class="theme-picker__content">
        <view class="theme-picker__paper">
          <view class="theme-picker__swatch">
            <text class="theme-picker__swatch-block theme-picker__swatch-block--primary"></text>
            <text class="theme-picker__swatch-block theme-picker__swatch-block--accent"></text>
          </view>
          <text v-if="palette.id === paletteId" class="theme-picker__active">已选</text>
        </view>
        <view class="theme-picker__copy">
          <text class="theme-picker__name">{{ palette.name }}</text>
          <text class="theme-picker__description">{{ palette.description }}</text>
        </view>
      </view>
    </app-option-button>
  </app-option-group>
</template>

<script setup lang="ts">
import { resolvePalettePreviewVars } from "@/design-system/color-scale"
import { makeCssVars } from "@/design-system/css-vars"
import { romanticPalettes, type PaletteId, type RomanticPalette } from "@/stores/theme"

defineProps<{
  paletteId: PaletteId
}>()

const emit = defineEmits<{
  selectPalette: [id: PaletteId]
}>()

const swatchStyle = (palette: RomanticPalette) =>
  makeCssVars(resolvePalettePreviewVars(palette))
</script>

<style lang="scss" scoped>
.theme-picker__content {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  align-items: stretch;
  gap: var(--app-space-4);
  text-align: left;
}

.theme-picker__paper {
  position: relative;
  padding: var(--app-space-3);
  border-radius: var(--app-radius-md);
  background: var(--app-field);
  transform: rotate(-2deg);
}

.theme-picker__swatch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: var(--app-space-28);
  overflow: hidden;
  border-radius: var(--app-radius-sm);
}

.theme-picker__swatch-block {
  display: block;
  min-height: var(--app-space-28);
}

.theme-picker__swatch-block--primary {
  background: var(--app-option-swatch-primary);
}

.theme-picker__swatch-block--accent {
  background: var(--app-option-swatch-accent);
}

.theme-picker__name {
  display: block;
  color: var(--app-text);
  font-size: var(--app-font-size-sm);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
  overflow-wrap: anywhere;
}

.theme-picker__description {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-2xs);
  line-height: var(--app-line-height-snug);
  overflow-wrap: anywhere;
}

.theme-picker__active {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  padding: var(--app-space-1) var(--app-space-3);
  border-radius: var(--app-radius-badge);
  background: var(--app-primary);
  color: var(--app-text-inverse);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-none);
  transform: rotate(8deg);
}
</style>
