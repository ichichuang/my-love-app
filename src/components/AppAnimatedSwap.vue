<template>
  <view class="app-animated-swap" :class="[phaseClass]">
    <slot :display-value="displayValue" :phase="phase" />
  </view>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue"
import { motionDurations } from "@/design-system/size-resolver"

const props = defineProps<{
  value: any
}>()

const displayValue = ref(props.value)
const phase = ref<"idle" | "leaving" | "entering">("idle")

const phaseClass = computed(() => `app-animated-swap--${phase.value}`)

let timeoutId: any = null

watch(
  () => props.value,
  (newVal) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    phase.value = "leaving"

    // Delay duration matches var(--app-duration-fast)
    timeoutId = setTimeout(() => {
      displayValue.value = newVal
      phase.value = "entering"

      nextTick(() => {
        timeoutId = setTimeout(() => {
          phase.value = "idle"
          timeoutId = null
        }, motionDurations.fast)
      })
    }, motionDurations.fast)
  }
)
</script>

<style lang="scss" scoped>
.app-animated-swap {
  transition: opacity var(--app-transition-fast), transform var(--app-transition-fast);
  will-change: opacity, transform;
}

.app-animated-swap--leaving {
  opacity: 0;
  transform: translateY(var(--app-fade-offset-y));
}

.app-animated-swap--entering {
  opacity: 0;
  transform: translateY(calc(-1 * var(--app-fade-offset-y)));
}

.app-animated-swap--idle {
  opacity: 1;
  transform: translateY(0);
}
</style>
