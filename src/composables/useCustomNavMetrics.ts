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
  menuButtonWidth: 87,
  menuButtonHeight: 32,
  capsuleGap: 6,
  capsuleRightGap: 7
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
  navBarHeight: number
  customNavHeight: number
  capsuleRightGap: number
  navRightReserve: number
  navSideGap: number
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

  const statusBarHeight = finiteNumber(windowInfo.statusBarHeight, 0)
  const windowWidth = finiteNumber(windowInfo.windowWidth, fallbackMetrics.windowWidth)
  const windowHeight = finiteNumber(windowInfo.windowHeight, fallbackMetrics.windowHeight)

  const hasMenuButtonMetrics =
    typeof menuRect?.width === "number" &&
    typeof menuRect.height === "number" &&
    typeof menuRect.top === "number" &&
    typeof menuRect.right === "number" &&
    menuRect.width > 0 &&
    menuRect.height > 0 &&
    menuRect.right > 0

  const menuButtonWidth = hasMenuButtonMetrics ? menuRect.width : fallbackMetrics.menuButtonWidth
  const menuButtonHeight = hasMenuButtonMetrics ? menuRect.height : fallbackMetrics.menuButtonHeight
  const menuButtonTop = hasMenuButtonMetrics ? menuRect.top : statusBarHeight + fallbackMetrics.capsuleGap
  const menuButtonRight = hasMenuButtonMetrics ? menuRect.right : windowWidth - fallbackMetrics.capsuleRightGap
  const menuButtonLeft = hasMenuButtonMetrics
    ? finiteNumber(menuRect.left, menuButtonRight - menuButtonWidth)
    : menuButtonRight - menuButtonWidth
  const menuButtonBottom = hasMenuButtonMetrics
    ? finiteNumber(menuRect.bottom, menuButtonTop + menuButtonHeight)
    : menuButtonTop + menuButtonHeight

  const capsuleTop = menuButtonTop
  const capsuleGap = Math.max(0, menuButtonTop - statusBarHeight)
  const capsuleRightGap = Math.max(0, windowWidth - menuButtonRight)
  const navBarHeight = Math.max(0, capsuleGap * 2 + menuButtonHeight)
  const customNavHeight = statusBarHeight + navBarHeight
  const navSideGap = Math.max(capsuleRightGap, capsuleGap)
  const navRightReserve = menuButtonWidth + capsuleRightGap + navSideGap
  const capsuleRight = capsuleRightGap
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
    navBarHeight,
    customNavHeight,
    capsuleRightGap,
    navRightReserve,
    navSideGap,
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
