import type { NativeChromeTheme, NavigationTheme } from "@/design-system/types"

const NATIVE_CHROME_DEBOUNCE_MS = 120
const NATIVE_CHROME_DELAY_MS = 80
const NATIVE_CHROME_ANIMATION_MS = 220

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let delayTimer: ReturnType<typeof setTimeout> | null = null
let pendingTheme: NativeChromeTheme | null = null

const clearTimer = (timer: ReturnType<typeof setTimeout> | null): void => {
  if (timer) {
    clearTimeout(timer)
  }
}

const reportNativeChromeThemeFailure = (error: unknown): void => {
  if (import.meta.env.DEV) {
    console.warn("[小程序架构] 原生界面主题同步失败", error)
  }
}

const applyPendingNativeChromeTheme = (): void => {
  const nextTheme = pendingTheme
  if (!nextTheme) {
    return
  }

  try {
    uni.setNavigationBarColor({
      frontColor: nextTheme.frontColor,
      backgroundColor: nextTheme.navigationBarBackgroundColor,
      animation: {
        duration: NATIVE_CHROME_ANIMATION_MS,
        timingFunc: "easeInOut"
      },
      fail: reportNativeChromeThemeFailure
    })
  } catch (error) {
    reportNativeChromeThemeFailure(error)
  }

  try {
    uni.setBackgroundColor({
      backgroundColor: nextTheme.backgroundColor,
      backgroundColorTop: nextTheme.backgroundColorTop,
      backgroundColorBottom: nextTheme.backgroundColorBottom,
      fail: reportNativeChromeThemeFailure
    })
  } catch (error) {
    reportNativeChromeThemeFailure(error)
  }

  try {
    uni.setBackgroundTextStyle({
      textStyle: nextTheme.backgroundTextStyle,
      fail: reportNativeChromeThemeFailure
    })
  } catch (error) {
    reportNativeChromeThemeFailure(error)
  }
}

export const scheduleNativeChromeTheme = (theme: NativeChromeTheme): void => {
  pendingTheme = theme
  clearTimer(debounceTimer)
  clearTimer(delayTimer)

  debounceTimer = setTimeout(() => {
    debounceTimer = null
    delayTimer = setTimeout(() => {
      delayTimer = null
      applyPendingNativeChromeTheme()
    }, NATIVE_CHROME_DELAY_MS)
  }, NATIVE_CHROME_DEBOUNCE_MS)
}

export const scheduleNavigationTheme = (theme: NavigationTheme): void => {
  scheduleNativeChromeTheme({
    frontColor: theme.frontColor,
    navigationBarBackgroundColor: theme.backgroundColor,
    backgroundColor: theme.backgroundColor,
    backgroundColorTop: theme.backgroundColor,
    backgroundColorBottom: theme.backgroundColor,
    backgroundTextStyle: theme.frontColor === "#ffffff" ? "light" : "dark",
    pageStyle: `background-color: ${theme.backgroundColor};`
  })
}
