<template>
  <view class="app-date-field-wrap">
    <view
      class="app-date-field"
      :class="{ 'app-date-field--disabled': disabled, 'app-date-field--empty': !hasValue }"
      role="button"
      :aria-label="hasValue ? `日子：${displayText}` : placeholder"
      @click="openPicker"
    >
      <text class="app-date-field__text">{{ displayText }}</text>

      <view
        v-if="clearable && hasValue && !disabled"
        class="app-date-field__clear"
        role="button"
        aria-label="先空着"
        @click.stop="handleClear"
      >
        <view class="app-date-field__clear-line app-date-field__clear-line--a" />
        <view class="app-date-field__clear-line app-date-field__clear-line--b" />
      </view>
      <view v-else class="app-date-field__glyph" aria-hidden="true">
        <view class="app-date-field__glyph-ring app-date-field__glyph-ring--left" />
        <view class="app-date-field__glyph-ring app-date-field__glyph-ring--right" />
        <view class="app-date-field__glyph-dot" />
      </view>
    </view>

    <wd-popup
      v-model="popupOpen"
      position="bottom"
      :root-portal="true"
      :z-index="pickerZIndex"
      :custom-style="popupStyle"
      custom-class="app-date-field__popup"
      @close="handleCancel"
    >
      <view class="app-date-field__sheet theme-transition" :class="theme.themeClasses" :style="popupTokenStyle">
        <view class="app-date-field__toolbar">
          <wd-button
            size="small"
            plain
            custom-class="app-date-field__toolbar-action"
            @click="handleCancel"
          >
            再想想
          </wd-button>
          <text class="app-date-field__title">{{ title }}</text>
          <wd-button size="small" custom-class="app-date-field__toolbar-action" @click="handleConfirm">
            就这天
          </wd-button>
        </view>

        <view class="app-date-field__picker-shell">
          <wd-datetime-picker-view
            v-model="draftTimestamp"
            type="date"
            custom-class="app-date-field__picker-view"
            :formatter="formatPickerColumn"
          />
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue"
import { makeCssVars } from "@/design-system/css-vars"
import { useThemeStore } from "@/stores/theme"
import {
  calendarDateToTimestamp,
  formatChineseDate,
  normalizeCalendarDate,
  timestampToCalendarDate,
  todayCalendarDate
} from "@/utils/date"

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    title?: string
    disabled?: boolean
    clearable?: boolean
  }>(),
  {
    modelValue: "",
    placeholder: "挑一个日子吧",
    title: "挑个好日子",
    disabled: false,
    clearable: false
  }
)

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const theme = useThemeStore()
const popupOpen = shallowRef(false)
const draftTimestamp = shallowRef(calendarDateToTimestamp(todayCalendarDate()))

const normalizedValue = computed(() => normalizeCalendarDate(props.modelValue))
const formattedValue = computed(() => formatChineseDate(normalizedValue.value))
const hasValue = computed(() => formattedValue.value.length > 0)
const displayText = computed(() => (hasValue.value ? formattedValue.value : props.placeholder))
const fallbackTimestamp = computed(() => calendarDateToTimestamp(todayCalendarDate()))
const currentTimestamp = computed(() => {
  const timestamp = calendarDateToTimestamp(normalizedValue.value)
  return Number.isFinite(timestamp) ? timestamp : fallbackTimestamp.value
})
const pickerZIndex = computed(() => Number(theme.appCssVars["--app-z-index-picker"]))
const popupTokenStyle = computed(() => makeCssVars(theme.appCssVars))
const popupStyle = computed(() => `${popupTokenStyle.value}; background: var(--app-bg); border-radius: var(--app-radius-card) var(--app-radius-card) var(--app-space-0) var(--app-space-0); overflow: hidden;`)

const resetDraft = () => {
  draftTimestamp.value = currentTimestamp.value
}

const openPicker = () => {
  if (props.disabled) {
    return
  }

  resetDraft()
  popupOpen.value = true
}

const handleCancel = () => {
  popupOpen.value = false
}

const handleConfirm = () => {
  const nextDate = timestampToCalendarDate(draftTimestamp.value)
  if (nextDate) {
    emit("update:modelValue", nextDate)
  }
  popupOpen.value = false
}

const handleClear = () => {
  emit("update:modelValue", "")
}

const formatPickerColumn = (type: string, value: string): string => {
  const label = String(Number(value))
  if (type === "year") {
    return `${label}年`
  }
  if (type === "month") {
    return `${label}月`
  }
  if (type === "date") {
    return `${label}日`
  }
  return label
}

watch(
  () => props.modelValue,
  () => {
    if (!popupOpen.value) {
      resetDraft()
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.app-date-field-wrap {
  display: block;
  width: 100%;
}

.app-date-field {
  @include wot-paper-input-root;
  @include pressable;
  justify-content: space-between;
  gap: var(--app-space-5);
  transition:
    background-color var(--app-transition-normal),
    border-color var(--app-transition-normal),
    box-shadow var(--app-transition-normal),
    transform var(--app-transition-fast);
}

.app-date-field:not(.app-date-field--empty) {
  border-color: var(--app-primary-soft);
  background: var(--app-surface);
}

.app-date-field:active {
  background: var(--app-surface-strong);
}

// 挑到日子的瞬间：文字轻轻弹一下，像盖了个小日戳
.app-date-field:not(.app-date-field--empty) .app-date-field__text {
  animation: app-tap-pop var(--app-duration-normal) var(--app-ease-bounce);
}

.app-date-field:not(.app-date-field--empty) .app-date-field__glyph {
  border-color: var(--app-primary);
}

.app-date-field--empty .app-date-field__text {
  color: var(--app-text-muted);
}

.app-date-field--disabled {
  opacity: var(--app-disabled-opacity);
}

.app-date-field__text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--app-font-size-xl);
  line-height: var(--app-input-height);
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: color var(--app-transition-normal);
}

.app-date-field__glyph {
  position: relative;
  flex-shrink: 0;
  width: var(--app-space-14);
  height: var(--app-space-13);
  border: var(--app-panel-border-width) solid var(--app-border-strong);
  border-radius: var(--app-radius-sm);
  background: var(--app-surface);
  transform: rotate(-3deg);
  transition:
    transform var(--app-transition-fast),
    border-color var(--app-transition-normal),
    background-color var(--app-transition-normal);
}

.app-date-field:active .app-date-field__glyph {
  transform: scale(0.94) rotate(3deg);
}

.app-date-field__glyph-ring {
  position: absolute;
  top: calc(var(--app-space-2) * -1);
  width: var(--app-space-2);
  height: var(--app-space-4);
  border-radius: var(--app-radius-pill);
  background: var(--app-primary);
}

.app-date-field__glyph-ring--left {
  left: var(--app-space-4);
}

.app-date-field__glyph-ring--right {
  right: var(--app-space-4);
}

.app-date-field__glyph-dot {
  position: absolute;
  right: var(--app-space-3);
  bottom: var(--app-space-3);
  width: var(--app-space-4);
  height: var(--app-space-4);
  border-radius: var(--app-radius-round);
  background: var(--app-accent);
}

.app-date-field__clear {
  position: relative;
  flex-shrink: 0;
  width: var(--app-space-14);
  height: var(--app-space-14);
  transition: transform var(--app-transition-fast), opacity var(--app-transition-fast);
  animation: app-pop-in var(--app-duration-fast) var(--app-ease-bounce) both;
}

.app-date-field__clear:active {
  opacity: var(--app-press-opacity);
  transform: scale(0.82) rotate(-6deg);
}

.app-date-field__clear-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--app-space-8);
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  background: var(--app-text-muted);
}

.app-date-field__clear-line--a {
  transform: translate(-50%, -50%) rotate(45deg);
}

.app-date-field__clear-line--b {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.app-date-field__sheet {
  display: flex;
  width: 100%;
  flex-direction: column;
  overflow: hidden;
  border-top: var(--app-panel-border-width) solid var(--app-border-strong);
  border-radius: var(--app-radius-card) var(--app-radius-card) var(--app-space-0) var(--app-space-0);
  background: var(--app-bg);
  color: var(--app-text);
}

.app-date-field__toolbar {
  display: flex;
  min-height: var(--app-control-height-lg);
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-5);
  padding: var(--app-space-3) var(--app-space-6);
  border-bottom: var(--app-border-width-focus) dashed var(--app-border);
  background: var(--app-bg-deep);
}

.app-date-field__title {
  min-width: 0;
  flex: 1;
  color: var(--app-text);
  font: var(--app-font-section-title);
  text-align: center;
}

:deep(.app-date-field__toolbar-action) {
  flex-shrink: 0;
  box-shadow: var(--app-shadow-none);
}

.app-date-field__picker-shell {
  background: var(--app-bg);
}

:deep(.app-date-field__picker-view) {
  padding: var(--app-space-4) var(--app-space-0);
  background: var(--app-bg);
}

:deep(.app-date-field__picker-view .wd-picker-view__roller) {
  border-top: var(--app-border-width-focus) dashed var(--app-primary-soft);
  border-bottom: var(--app-border-width-focus) dashed var(--app-primary-soft);
  background: var(--app-bg-deep);
}

:deep(.app-date-field__picker-view .wd-picker-view-column) {
  color: var(--app-text);
  font-size: var(--app-font-size-lg);
}

:deep(.app-date-field__picker-view .wd-picker-view-column__item--active) {
  color: var(--app-primary);
  font-weight: var(--app-font-weight-semibold);
}
</style>
