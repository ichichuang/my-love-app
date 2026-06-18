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
      uni.pageScrollTo({
        selector,
        offsetTop: -Math.ceil(metrics.value.customNavHeight + metrics.value.capsuleGap),
        duration: 180
      })
    }, 80)
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
