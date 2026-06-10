<template>
  <view class="theme-picker">
    <button
      v-for="palette in romanticPalettes"
      :key="palette.id"
      class="theme-picker__swatch"
      :class="{ 'theme-picker__swatch--active': palette.id === paletteId && !customPrimary }"
      :style="swatchStyle(palette)"
      hover-class="theme-picker__swatch--pressed"
      @click="emit('selectPalette', palette.id)"
    >
      <text class="theme-picker__name">{{ palette.name }}</text>
    </button>

    <view class="theme-picker__custom">
      <text class="theme-picker__label">自定义主色</text>
      <input
        class="theme-picker__input"
        :value="customPrimary"
        maxlength="7"
        placeholder="#b84f62"
        placeholder-class="theme-picker__placeholder"
        @input="onCustomInput"
      />
      <button class="theme-picker__clear" hover-class="theme-picker__clear--pressed" @click="emit('clearCustom')">
        清除
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { romanticPalettes, type RomanticPalette } from "@/stores/theme"

defineProps<{
  paletteId: string
  customPrimary: string
}>()

const emit = defineEmits<{
  selectPalette: [id: string]
  updateCustom: [hex: string]
  clearCustom: []
}>()

const swatchStyle = (palette: RomanticPalette) =>
  `--swatch-primary: ${palette.primary}; --swatch-accent: ${palette.accent}; --swatch-glow: ${palette.glow}`

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const eventValue = (event: Event): string => {
  const raw = event as unknown
  if (!isRecord(raw)) {
    return ""
  }

  const detail = raw.detail
  if (isRecord(detail) && typeof detail.value === "string") {
    return detail.value
  }

  const target = raw.target
  if (isRecord(target) && typeof target.value === "string") {
    return target.value
  }

  return ""
}

const onCustomInput = (event: Event) => {
  emit("updateCustom", eventValue(event))
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.theme-picker {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.theme-picker__swatch {
  @include pressable;
  min-width: 0;
  height: 118rpx;
  padding: 18rpx;
  border: 2rpx solid transparent;
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 18% 20%, var(--swatch-glow), transparent 70rpx),
    linear-gradient(135deg, var(--swatch-primary), var(--swatch-accent));
  color: #ffffff;
  line-height: 1;
  text-align: left;
}

.theme-picker__swatch--active {
  border-color: var(--app-text);
}

.theme-picker__swatch--pressed {
  opacity: 0.82;
}

.theme-picker__name {
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.2;
}

.theme-picker__custom {
  @include panel;
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 148rpx;
  gap: 14rpx;
  padding: 18rpx;
}

.theme-picker__label {
  grid-column: 1 / -1;
  color: var(--app-text-soft);
  font-size: 24rpx;
}

.theme-picker__input {
  @include field;
  height: 78rpx;
  min-height: 78rpx;
  padding: 0 22rpx;
}

.theme-picker__placeholder {
  color: var(--app-text-soft);
}

.theme-picker__clear {
  height: 78rpx;
  min-width: 0;
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
  background: var(--app-surface-strong);
  color: var(--app-text);
  font-size: 24rpx;
  line-height: 78rpx;
}

.theme-picker__clear--pressed {
  opacity: 0.76;
}
</style>
