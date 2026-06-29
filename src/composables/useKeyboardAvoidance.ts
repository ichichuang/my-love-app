import { computed, onBeforeUnmount, onMounted, shallowRef } from "vue"
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
  const { metrics } = useCustomNavMetrics()

  const syncKeyboardHeight = (result: KeyboardHeightResult) => {
    keyboardHeight.value = normalizeHeight(result.height)
  }

  const keyboardSpacerStyle = computed(() => ({
    height: keyboardHeight.value > 0 ? `${keyboardHeight.value}px` : "0"
  }))

  const focusField = (selector: string) => {
    setTimeout(() => {
      const query = uni.createSelectorQuery()
      query.select(selector).boundingClientRect()
      query.selectViewport().scrollOffset(() => {})
      query.exec((res) => {
        if (!res || !res[0]) return

        const rect = res[0] as UniNamespace.NodeInfo
        const scroll = (res[1] || { scrollTop: 0 }) as { scrollTop: number }

        const sysInfo = uni.getSystemInfoSync()
        const windowHeight = sysInfo.windowHeight

        const navHeight = Math.ceil(metrics.value.customNavHeight + metrics.value.capsuleGap)
        const visibleBottom = windowHeight - keyboardHeight.value

        const topEdge = rect.top ?? 0
        const bottomEdge = rect.bottom ?? 0
        const scrollTop = scroll.scrollTop ?? 0

        const margin = 20

        if (bottomEdge > visibleBottom - margin) {
          const scrollDistance = bottomEdge - visibleBottom + margin
          uni.pageScrollTo({
            scrollTop: scrollTop + scrollDistance,
            duration: 180
          })
        } else if (topEdge < navHeight + margin) {
          const scrollDistance = topEdge - navHeight - margin
          uni.pageScrollTo({
            scrollTop: scrollTop + scrollDistance,
            duration: 180
          })
        }
      })
    }, 150)
  }

  onMounted(() => {
    uni.onKeyboardHeightChange(syncKeyboardHeight)
  })

  onBeforeUnmount(() => {
    uni.offKeyboardHeightChange(syncKeyboardHeight)
  })

  return {
    keyboardSpacerStyle,
    syncKeyboardHeight,
    focusField
  }
}
