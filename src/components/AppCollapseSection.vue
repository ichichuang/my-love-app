<template>
  <view
    class="app-collapse-section"
    :class="{
      'app-collapse-section--expanded': isActive,
      'app-collapse-section--collapsed': !isActive
    }"
    :style="style"
  >
    <view v-show="isRendered" class="app-collapse-section__inner">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { motionDurations } from "@/design-system/size-resolver"

const props = withDefaults(
  defineProps<{
    expanded?: boolean
  }>(),
  {
    expanded: false
  }
)

const isRendered = ref(props.expanded)
const isActive = ref(props.expanded)

const style = computed(() => {
  return {
    "--app-collapse-duration": `${motionDurations.slower}ms`
  }
})

let enterTimerId: ReturnType<typeof setTimeout> | null = null
let leaveTimerId: ReturnType<typeof setTimeout> | null = null

const clearTimers = () => {
  if (enterTimerId) {
    clearTimeout(enterTimerId)
    enterTimerId = null
  }

  if (leaveTimerId) {
    clearTimeout(leaveTimerId)
    leaveTimerId = null
  }
}

watch(
  () => props.expanded,
  (nextExpanded) => {
    clearTimers()

    if (nextExpanded) {
      isRendered.value = true
      nextTick(() => {
        enterTimerId = setTimeout(() => {
          isActive.value = true
          enterTimerId = null
        }, motionDurations.tickDelay)
      })
    } else {
      isActive.value = false
      leaveTimerId = setTimeout(() => {
        isRendered.value = false
        leaveTimerId = null
      }, motionDurations.slower)
    }
  },
  { immediate: false }
)

onBeforeUnmount(clearTimers)
</script>

<style lang="scss" scoped>
.app-collapse-section {
  display: grid;
  width: 100%;
  grid-template-rows: 0fr;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(calc(-1 * var(--app-space-8)));
  visibility: hidden;
  transition:
    grid-template-rows var(--app-collapse-duration) var(--app-ease-out),
    opacity var(--app-collapse-duration) var(--app-ease-out),
    transform var(--app-collapse-duration) var(--app-ease-out),
    visibility var(--app-duration-instant) linear var(--app-collapse-duration);
  will-change: grid-template-rows, opacity, transform;
}

.app-collapse-section__inner {
  min-height: 0;
  overflow: hidden;
}

.app-collapse-section--collapsed {
  opacity: 0;
  transform: translateY(calc(-1 * var(--app-space-8)));
  visibility: hidden;
  pointer-events: none;
}

.app-collapse-section--expanded {
  grid-template-rows: 1fr;
  opacity: 1;
  transform: translateY(var(--app-space-0));
  visibility: visible;
  pointer-events: auto;
  transition:
    grid-template-rows var(--app-collapse-duration) var(--app-ease-out),
    opacity var(--app-collapse-duration) var(--app-ease-out),
    transform var(--app-collapse-duration) var(--app-ease-out),
    visibility var(--app-duration-instant);
}
</style>
