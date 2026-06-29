import { computed, onBeforeUnmount, onMounted, shallowRef } from "vue"
import { motionDurations } from "@/design-system/size-resolver"
import { useCustomNavMetrics } from "@/composables/useCustomNavMetrics"

type KeyboardHeightResult = Pick<UniNamespace.OnKeyboardHeightChangeResult, "height">

const normalizeHeight = (height: unknown): number => {
  if (typeof height !== "number" || !Number.isFinite(height)) {
    return 0
  }

  return Math.max(0, height)
}

export const useKeyboardAvoidance = () => {
  const keyboardHeight = shallowRef(0)
  const pendingFocusSelector = shallowRef("")
  const { metrics } = useCustomNavMetrics()
  let focusTimerId: ReturnType<typeof setTimeout> | null = null

  const clearFocusTimer = () => {
    if (focusTimerId) {
      clearTimeout(focusTimerId)
      focusTimerId = null
    }
  }

  const keyboardSpacerStyle = computed(() => ({
    height: keyboardHeight.value > 0 ? `${keyboardHeight.value}px` : "0"
  }))

  const scrollFocusedFieldIntoView = (selector: string) => {
    if (keyboardHeight.value <= 0) {
      return
    }

    const query = uni.createSelectorQuery()
    query.select(selector).boundingClientRect()
    query.selectViewport().scrollOffset(() => {})
    query.exec((res) => {
      if (!res || !res[0]) return

      const rect = res[0] as UniNamespace.NodeInfo
      const scroll = (res[1] || { scrollTop: 0 }) as { scrollTop: number }

      const sysInfo = uni.getSystemInfoSync()
      const windowHeight = sysInfo.windowHeight

      const visibleBottom = windowHeight - keyboardHeight.value
      const bottomEdge = rect.bottom ?? 0
      const scrollTop = scroll.scrollTop ?? 0
      const margin = Math.ceil(metrics.value.capsuleGap)

      if (bottomEdge <= visibleBottom - margin) {
        return
      }

      const scrollDistance = bottomEdge - visibleBottom + margin
      if (scrollDistance <= 0) {
        return
      }

      uni.pageScrollTo({
        scrollTop: scrollTop + scrollDistance,
        duration: motionDurations.fast
      })
    })
  }

  const scheduleFocusScroll = (selector: string, delay: number) => {
    clearFocusTimer()
    focusTimerId = setTimeout(() => {
      focusTimerId = null
      scrollFocusedFieldIntoView(selector)
    }, delay)
  }

  const syncKeyboardHeight = (result: KeyboardHeightResult) => {
    keyboardHeight.value = normalizeHeight(result.height)

    if (keyboardHeight.value <= 0) {
      pendingFocusSelector.value = ""
      clearFocusTimer()
      return
    }

    if (pendingFocusSelector.value) {
      scheduleFocusScroll(pendingFocusSelector.value, motionDurations.paintDelay)
    }
  }

  const focusField = (selector: string) => {
    pendingFocusSelector.value = selector
    scheduleFocusScroll(selector, motionDurations.slow)
  }

  onMounted(() => {
    uni.onKeyboardHeightChange(syncKeyboardHeight)
  })

  onBeforeUnmount(() => {
    clearFocusTimer()
    uni.offKeyboardHeightChange(syncKeyboardHeight)
  })

  return {
    keyboardSpacerStyle,
    syncKeyboardHeight,
    focusField
  }
}
