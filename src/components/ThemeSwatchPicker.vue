<template>
  <view class="theme-picker">
    <view
      v-for="palette in romanticPalettes"
      :key="palette.id"
      class="theme-picker__cell"
      :class="{ 'theme-picker__cell--active': palette.id === paletteId }"
      :style="swatchStyle(palette)"
      hover-class="theme-picker__cell--pressed"
      hover-stay-time="80"
      @click="emit('selectPalette', palette.id)"
    >
      <view class="theme-picker__paper">
        <view class="theme-picker__swatch">
          <view class="theme-picker__swatch-block theme-picker__swatch-block--primary"></view>
          <view class="theme-picker__swatch-block theme-picker__swatch-block--accent"></view>
        </view>
        <view v-if="palette.id === paletteId" class="theme-picker__stamp">已选</view>
      </view>
      <view class="theme-picker__copy">
        <text class="theme-picker__name">{{ palette.name }}</text>
        <text class="theme-picker__description">{{ palette.description }}</text>
      </view>
    </view>
  </view>
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
.theme-picker {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--app-option-group-gap);
}

.theme-picker__cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-5);
  padding: var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
  text-align: left;
}

.theme-picker__cell--active {
  border-color: var(--app-primary);
  box-shadow: var(--app-shadow-focus);
}

.theme-picker__cell--pressed {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale));
}

.theme-picker__paper {
  position: relative;
  padding: var(--app-space-3);
  border: var(--app-panel-border-width) solid var(--app-divider);
  border-radius: var(--app-radius-md);
  background: var(--app-field);
  transform: rotate(-1.5deg);
  transform-origin: center;
}

.theme-picker__swatch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  border-radius: var(--app-radius-sm);
}

.theme-picker__swatch-block {
  display: block;
  height: var(--app-space-14);
}

.theme-picker__swatch-block--primary {
  background: var(--app-option-swatch-primary);
}

.theme-picker__swatch-block--accent {
  background: var(--app-option-swatch-accent);
}

.theme-picker__stamp {
  position: absolute;
  top: calc(var(--app-space-3) * -1);
  right: calc(var(--app-space-3) * -1);
  padding: var(--app-space-1) var(--app-space-3);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-badge);
  background: var(--app-surface);
  color: var(--app-primary);
  font-size: var(--app-font-size-2xs);
  line-height: var(--app-line-height-none);
  transform: rotate(8deg);
}

.theme-picker__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-2);
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
  color: var(--app-text-soft);
  font-size: var(--app-font-size-2xs);
  line-height: var(--app-line-height-snug);
  overflow-wrap: anywhere;
}
</style>