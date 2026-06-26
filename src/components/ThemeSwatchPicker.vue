<template>
  <app-option-group class="theme-picker" :columns="2" responsive="swatch">
    <app-option-button
      v-for="(palette, index) in romanticPalettes"
      :key="palette.id"
      variant="swatch"
      :active="palette.id === paletteId"
      class="theme-picker__cell"
      :class="[
        tiltClass(index),
        { 'theme-picker__cell--active': palette.id === paletteId }
      ]"
      :style="cellStyle(palette)"
      :aria-label="`${palette.name}，${palette.description}`"
      :aria-pressed="palette.id === paletteId"
      @click="emit('selectPalette', palette.id)"
    >
      <view class="theme-picker__content">
        <view v-if="palette.id === paletteId" class="theme-picker__stamp">已选</view>
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

// 每张卡片一个轻微的「俏皮」倾角，全部围绕中心旋转，角度不重复
const tilts = [
  "tilt--neg-1",
  "tilt--pos-2",
  "tilt--neg-2",
  "tilt--pos-1",
  "tilt--neg-2-half",
  "tilt--pos-1-half"
] as const

const tiltClass = (index: number) => tilts[index % tilts.length]

// 选中卡片不再倾斜，回正以保证「已选」印章视觉稳定
const cellStyle = (palette: RomanticPalette) =>
  makeCssVars(resolvePalettePreviewVars(palette))
</script>

<style lang="scss" scoped>
.theme-picker {
  padding: var(--app-space-5) var(--app-space-2);
}

.theme-picker__cell {
  overflow: visible;
  transform-origin: center;
  will-change: transform;
  // 松手时小纸样带一点回弹，像贴纸轻轻弹回原角度
  transition: transform var(--app-duration-normal) var(--app-ease-bounce), opacity var(--app-transition-fast), border-color var(--app-transition-normal), box-shadow var(--app-transition-normal);
}

.theme-picker__cell--active {
  transform: rotate(0deg);
}

/* 俏皮倾角：6 张卡片角度各异，回正时给保留聚焦环 */
.tilt--neg-1 {
  transform: rotate(-1.4deg);
}
.tilt--pos-1 {
  transform: rotate(1.2deg);
}
.tilt--pos-1-half {
  transform: rotate(1.8deg);
}
.tilt--neg-2 {
  transform: rotate(-2.4deg);
}
.tilt--pos-2 {
  transform: rotate(2.2deg);
}
.tilt--neg-2-half {
  transform: rotate(-1.8deg);
}

.theme-picker__content {
  position: relative;
  display: flex;
  min-height: 100%;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.theme-picker__stamp {
  position: absolute;
  top: var(--app-space-2);
  right: var(--app-space-2);
  padding: var(--app-space-1) var(--app-space-3);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-badge);
  background: var(--app-surface);
  color: var(--app-primary);
  font-size: var(--app-font-size-2xs);
  line-height: var(--app-line-height-none);
  // 选中即盖章：从天而降转着落定到 8deg（both 保留静止倾角）
  animation: app-stamp-in var(--app-duration-slow) var(--app-ease-bounce) both;
}

.theme-picker__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-3);
}

.theme-picker__name {
  display: block;
  color: var(--app-option-swatch-foreground);
  font-size: var(--app-font-size-md);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
  overflow-wrap: anywhere;
}

.theme-picker__description {
  display: block;
  color: var(--app-option-swatch-foreground);
  font-size: var(--app-font-size-2xs);
  line-height: var(--app-line-height-snug);
  overflow-wrap: anywhere;
}
</style>
