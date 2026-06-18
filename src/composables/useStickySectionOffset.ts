import { computed } from "vue"
import { useCustomNavMetrics } from "@/composables/useCustomNavMetrics"

export const useStickySectionOffset = () => {
  const { metrics } = useCustomNavMetrics()

  const stickySectionStyle = computed(() => ({
    top: `${metrics.value.customNavHeight}px`
  }))

  return {
    stickySectionStyle
  }
}
