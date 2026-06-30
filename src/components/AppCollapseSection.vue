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
// 关键：不使用 display:grid + grid-template-rows:0fr↔1fr。
// mp-weixin 不支持 grid-template-rows 过渡，且原生 input/textarea 在 grid 1fr 轨道
// 配合 overflow:hidden 时会落入零高/被裁切的盒模型，导致点击无法聚焦、键盘不弹。
// 改用 max-height + opacity + visibility 的稳定方案：展开态内容在常规流中、
// 不被裁剪，原生输入框可正常聚焦；收起态 display:none（v-show）彻底移出交互。
.app-collapse-section {
  width: 100%;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition:
    max-height var(--app-collapse-duration) var(--app-ease-out),
    opacity var(--app-collapse-duration) var(--app-ease-out),
    visibility var(--app-duration-instant) linear var(--app-collapse-duration);
  will-change: max-height, opacity;
}

.app-collapse-section__inner {
  width: 100%;
}

.app-collapse-section--collapsed {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.app-collapse-section--expanded {
  max-height: var(--app-collapse-max-height);
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition:
    max-height var(--app-collapse-duration) var(--app-ease-out),
    opacity var(--app-collapse-duration) var(--app-ease-out),
    visibility var(--app-duration-instant);
}
</style>
