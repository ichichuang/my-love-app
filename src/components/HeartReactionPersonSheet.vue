<template>
  <wd-popup
    :model-value="popupOpen"
    position="bottom"
    :root-portal="true"
    :z-index="sheetZIndex"
    :custom-style="popupStyle"
    custom-class="heart-reaction-person-sheet__popup"
    @close="handleCancel"
    @update:model-value="handleUpdateOpen"
  >
    <view class="heart-reaction-person-sheet theme-transition" :class="theme.themeClasses" :style="popupTokenStyle">
      <view class="heart-reaction-person-sheet__handle" aria-hidden="true" />

      <view class="heart-reaction-person-sheet__header">
        <text class="heart-reaction-person-sheet__title">这次是谁在看？</text>
        <text class="heart-reaction-person-sheet__subtitle">选一下，以后比心就知道是谁的小心意啦。</text>
      </view>

      <view class="heart-reaction-person-sheet__body">
        <app-option-group columns="2" responsive="auto">
          <app-option-button
            v-for="person in localPerson.options"
            :key="person.key"
            :active="localPerson.selectedKey.value === person.key"
            @click="handleSelect(person)"
          >
            <text>{{ person.label }}</text>
          </app-option-button>
        </app-option-group>
      </view>

      <view class="heart-reaction-person-sheet__footer">
        <wd-button block plain custom-class="heart-reaction-person-sheet__cancel" @click="handleCancel">
          先不选
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { makeCssVars } from "@/design-system/css-vars"
import { useThemeStore } from "@/stores/theme"
import { useLocalPerson } from "@/composables/useLocalPerson"
import type { LocalPerson } from "@/types/local-person"

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
  }>(),
  {
    modelValue: false
  }
)

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  select: [person: LocalPerson]
  cancel: []
}>()

const theme = useThemeStore()
const localPerson = useLocalPerson()

const popupOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

const sheetZIndex = computed(() => Number(theme.appCssVars["--app-z-index-picker"]))
const popupTokenStyle = computed(() => makeCssVars(theme.appCssVars))
const popupStyle = computed(
  () =>
    `${popupTokenStyle.value}; background: transparent; border-radius: 0; overflow: visible;`
)

const handleUpdateOpen = (value: boolean) => {
  popupOpen.value = value
}

const handleSelect = (person: LocalPerson) => {
  localPerson.selectPerson(person.key)
  emit("select", person)
  popupOpen.value = false
}

const handleCancel = () => {
  emit("cancel")
  popupOpen.value = false
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.heart-reaction-person-sheet {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--app-card-gap);
  padding: var(--app-space-6) var(--app-page-padding-x) calc(var(--app-page-padding-y) + env(safe-area-inset-bottom));
  border-top: var(--app-panel-border-width) solid var(--app-border-strong);
  border-radius: var(--app-radius-card) var(--app-radius-card) var(--app-space-0) var(--app-space-0);
  background:
    radial-gradient(circle at 14% 8%, var(--app-surface-strong), transparent 48%),
    linear-gradient(180deg, var(--app-surface), var(--app-field));
  color: var(--app-text);
  box-shadow: var(--app-shadow-md);
}

.heart-reaction-person-sheet__handle {
  align-self: center;
  width: var(--app-space-16);
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  background: var(--app-border-muted);
  opacity: var(--app-muted-opacity);
}

.heart-reaction-person-sheet__header {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
  text-align: center;
}

.heart-reaction-person-sheet__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.heart-reaction-person-sheet__subtitle {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.heart-reaction-person-sheet__body {
  padding: var(--app-space-2) var(--app-space-0);
}

.heart-reaction-person-sheet__footer {
  padding-top: var(--app-space-2);
}

:deep(.heart-reaction-person-sheet__cancel) {
  box-shadow: var(--app-shadow-none);
}
</style>
