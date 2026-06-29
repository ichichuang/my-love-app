<template>
  <wd-datetime-picker
    type="date"
    :model-value="pickerValue"
    :default-value="pickerValue"
    :disabled="disabled"
    :title="title"
    confirm-button-text="就这天"
    cancel-button-text="再想想"
    custom-class="app-date-field__picker"
    :root-portal="false"
    :z-index="1050"
    @confirm="handleConfirm"
  >
    <view
      class="app-date-field"
      :class="{ 'app-date-field--disabled': disabled, 'app-date-field--empty': !hasValue }"
      role="button"
      :aria-label="hasValue ? `日子：${displayText}` : placeholder"
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
  </wd-datetime-picker>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { calendarDateToTimestamp, formatChineseDate, timestampToCalendarDate, todayCalendarDate } from "@/utils/date"

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

const hasValue = computed(() => formatChineseDate(props.modelValue).length > 0)
const displayText = computed(() => (hasValue.value ? formatChineseDate(props.modelValue) : props.placeholder))
const pickerValue = computed(() => {
  const timestamp = calendarDateToTimestamp(props.modelValue)
  return Number.isFinite(timestamp) ? timestamp : calendarDateToTimestamp(todayCalendarDate())
})

const handleConfirm = (event: { value: number | string | Array<number | string> }) => {
  const raw = Array.isArray(event.value) ? event.value[0] : event.value
  const timestamp = typeof raw === "number" ? raw : Number(raw)
  const nextDate = timestampToCalendarDate(timestamp)
  if (nextDate) {
    emit("update:modelValue", nextDate)
  }
}

const handleClear = () => {
  emit("update:modelValue", "")
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

:deep(.app-date-field__picker) {
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
</style>
