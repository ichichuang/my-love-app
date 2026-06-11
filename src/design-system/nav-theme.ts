import type { NavigationTheme } from "@/design-system/types"

const NAV_THEME_DEBOUNCE_MS = 120
const NAV_THEME_DELAY_MS = 80
const NAV_THEME_ANIMATION_MS = 220

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let delayTimer: ReturnType<typeof setTimeout> | null = null
let pendingTheme: NavigationTheme | null = null

const clearTimer = (timer: ReturnType<typeof setTimeout> | null): void => {
  if (timer) {
    clearTimeout(timer)
  }
}

const reportNavigationThemeFailure = (error: unknown): void => {
  if (import.meta.env.DEV) {
    console.warn("[珊瑚行动] 导航栏主题同步失败", error)
  }
}

const applyPendingNavigationTheme = (): void => {
  const nextTheme = pendingTheme
  if (!nextTheme) {
    return
  }

  try {
    uni.setNavigationBarColor({
      frontColor: nextTheme.frontColor,
      backgroundColor: nextTheme.backgroundColor,
      animation: {
        duration: NAV_THEME_ANIMATION_MS,
        timingFunc: "easeInOut"
      },
      fail: reportNavigationThemeFailure
    })
  } catch (error) {
    reportNavigationThemeFailure(error)
  }
}

export const scheduleNavigationTheme = (theme: NavigationTheme): void => {
  pendingTheme = theme
  clearTimer(debounceTimer)
  clearTimer(delayTimer)

  debounceTimer = setTimeout(() => {
    debounceTimer = null
    delayTimer = setTimeout(() => {
      delayTimer = null
      applyPendingNavigationTheme()
    }, NAV_THEME_DELAY_MS)
  }, NAV_THEME_DEBOUNCE_MS)
}
