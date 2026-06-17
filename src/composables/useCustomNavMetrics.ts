import { onBeforeUnmount, onMounted, ref, type Ref } from "vue"

interface MenuButtonRect {
  width: number
  height: number
  top: number
  bottom: number
  right: number
  left: number
}

interface WxRuntimeHost {
  wx?: {
    getWindowInfo?: () => {
      windowWidth?: number
      windowHeight?: number
      statusBarHeight?: number
      safeArea?: { top?: number; bottom?: number }
      safeAreaInsets?: { top?: number; bottom?: number }
      pixelRatio?: number
    } | null
    getMenuButtonBoundingClientRect?: () => MenuButtonRect | null
  }
}

interface UniRuntimeHost {
  getWindowInfo?: () => {
    windowWidth?: number
    windowHeight?: number
    statusBarHeight?: number
    safeArea?: { top?: number; bottom?: number }
    safeAreaInsets?: { top?: number; bottom?: number }
    pixelRatio?: number
  } | null
  getMenuButtonBoundingClientRect?: () => MenuButtonRect | null
}

const fallbackMetrics = {
  windowWidth: 375,
  windowHeight: 667,
  statusBarHeight: 20,
  menuButtonWidth: 87,
  menuButtonHeight: 32,
  menuButtonTop: 26,
  menuButtonRight: 366
} as const

const finiteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const readSafely = <T>(reader: (() => T | null | undefined) | undefined): T | null => {
  if (!reader) {
    return null
  }
  try {
    return reader() ?? null
  } catch {
    return null
  }
}

const readWindowInfo = () => {
  const wxHost = (globalThis as WxRuntimeHost).wx
  const wxInfo = readSafely(() => wxHost?.getWindowInfo?.())
  if (wxInfo) {
    return wxInfo
  }
  const uniHost = typeof uni !== "undefined" ? (uni as unknown as UniRuntimeHost) : undefined
  return readSafely(() => uniHost?.getWindowInfo?.()) ?? {}
}

const readMenuButton = (): MenuButtonRect | null => {
  const wxHost = (globalThis as WxRuntimeHost).wx
  const wxRect = readSafely(() => wxHost?.getMenuButtonBoundingClientRect?.())
  if (wxRect) {
    return wxRect
  }
  const uniHost = typeof uni !== "undefined" ? (uni as unknown as UniRuntimeHost) : undefined
  return readSafely(() => uniHost?.getMenuButtonBoundingClientRect?.()) ?? null
}

export interface CustomNavMetrics {
  statusBarHeight: number
  windowWidth: number
  windowHeight: number
  menuButtonWidth: number
  menuButtonHeight: number
  menuButtonTop: number
  menuButtonRight: number
  menuButtonLeft: number
  menuButtonBottom: number
  capsuleRight: number
  capsuleGap: number
  capsuleTop: number
  contentTop: number
  contentHeight: number
  contentWidth: number
}

const computeMetrics = (): CustomNavMetrics => {
  const windowInfo = readWindowInfo()
  const menuRect = readMenuButton()

  const statusBarHeight = finiteNumber(windowInfo.statusBarHeight, fallbackMetrics.statusBarHeight)
  const windowWidth = finiteNumber(windowInfo.windowWidth, fallbackMetrics.windowWidth)
  const windowHeight = finiteNumber(windowInfo.windowHeight, fallbackMetrics.windowHeight)

  const menuButtonWidth = finiteNumber(menuRect?.width, fallbackMetrics.menuButtonWidth)
  const menuButtonHeight = finiteNumber(menuRect?.height, fallbackMetrics.menuButtonHeight)
  const menuButtonTop = finiteNumber(menuRect?.top, statusBarHeight + (fallbackMetrics.menuButtonTop - fallbackMetrics.statusBarHeight))
  const menuButtonRight = finiteNumber(menuRect?.right, windowWidth - (windowWidth - fallbackMetrics.menuButtonRight))
  const menuButtonLeft = finiteNumber(menuRect?.left, menuButtonRight - menuButtonWidth)
  const menuButtonBottom = finiteNumber(menuRect?.bottom, menuButtonTop + menuButtonHeight)

  const capsuleTop = menuButtonTop
  const capsuleGap = Math.max(0, menuButtonTop - statusBarHeight)
  const capsuleRight = Math.max(0, windowWidth - menuButtonRight)
  const contentTop = menuButtonTop
  const contentHeight = menuButtonHeight
  const contentWidth = menuButtonWidth

  return {
    statusBarHeight,
    windowWidth,
    windowHeight,
    menuButtonWidth,
    menuButtonHeight,
    menuButtonTop,
    menuButtonRight,
    menuButtonLeft,
    menuButtonBottom,
    capsuleRight,
    capsuleGap,
    capsuleTop,
    contentTop,
    contentHeight,
    contentWidth
  }
}

export interface UseCustomNavMetricsResult {
  metrics: Ref<CustomNavMetrics>
  refresh: () => void
}

export const useCustomNavMetrics = (): UseCustomNavMetricsResult => {
  const metrics = ref<CustomNavMetrics>(computeMetrics())
  let resizeListenerRegistered = false

  const refresh = () => {
    metrics.value = computeMetrics()
  }

  const handleResize = () => {
    refresh()
  }

  onMounted(() => {
    if (typeof uni !== "undefined" && typeof uni.onWindowResize === "function" && !resizeListenerRegistered) {
      try {
        uni.onWindowResize(handleResize)
        resizeListenerRegistered = true
      } catch {
        resizeListenerRegistered = false
      }
    }
  })

  onBeforeUnmount(() => {
    if (resizeListenerRegistered && typeof uni !== "undefined" && typeof uni.offWindowResize === "function") {
      try {
        uni.offWindowResize(handleResize)
      } catch {
        // ignore
      }
      resizeListenerRegistered = false
    }
  })

  return {
    metrics,
    refresh
  }
}
