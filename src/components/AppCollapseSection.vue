<template>
  <view
    class="app-collapse-section"
    :class="{
      'app-collapse-section--expanded': isActive,
      'app-collapse-section--collapsed': !isActive
    }"
    :style="style"
  >
    <slot v-if="isRendered" />
  </view>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue"
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

let timeoutId: any = null

watch(
  () => props.expanded,
  (nextExpanded) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (nextExpanded) {
      isRendered.value = true
      nextTick(() => {
        setTimeout(() => {
          isActive.value = true
        }, 30)
      })
    } else {
      isActive.value = false
      timeoutId = setTimeout(() => {
        isRendered.value = false
        timeoutId = null
      }, motionDurations.slower)
    }
  },
  { immediate: false }
)
</script>

<style lang="scss" scoped>
.app-collapse-section {
  display: block;
  width: 100%;
  overflow: hidden;
  transition:
    max-height var(--app-collapse-duration) var(--app-ease-out),
    opacity var(--app-collapse-duration) var(--app-ease-out),
    transform var(--app-collapse-duration) var(--app-ease-out),
    visibility var(--app-collapse-duration) var(--app-ease-out);
  will-change: max-height, opacity, transform;
}

.app-collapse-section--collapsed {
  max-height: var(--app-space-0);
  opacity: 0;
  transform: translateY(calc(-1 * var(--app-space-8)));
  visibility: hidden;
  pointer-events: none;
}

.app-collapse-section--expanded {
  max-height: calc(var(--app-space-64) * 6); /* Safe upper bound ~1560rpx */
  opacity: 1;
  transform: translateY(var(--app-space-0));
  visibility: visible;
  pointer-events: auto;
}
</style>
