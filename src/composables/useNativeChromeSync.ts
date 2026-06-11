import { watch } from "vue"
import { onReady, onShow } from "@dcloudio/uni-app"
import { scheduleNativeChromeTheme } from "@/design-system/nav-theme"
import { useThemeStore } from "@/stores/theme"

export const useNativeChromeSync = () => {
  const theme = useThemeStore()

  const scheduleCurrentNativeChromeTheme = () => {
    scheduleNativeChromeTheme(theme.nativeChromeTheme)
  }

  watch(
    () =>
      [
        theme.nativeChromeTheme.frontColor,
        theme.nativeChromeTheme.navigationBarBackgroundColor,
        theme.nativeChromeTheme.backgroundColor,
        theme.nativeChromeTheme.backgroundColorTop,
        theme.nativeChromeTheme.backgroundColorBottom,
        theme.nativeChromeTheme.backgroundTextStyle,
        theme.nativeChromeTheme.pageStyle
      ] as const,
    scheduleCurrentNativeChromeTheme,
    { flush: "post" }
  )

  onReady(scheduleCurrentNativeChromeTheme)
  onShow(scheduleCurrentNativeChromeTheme)

  return theme
}
