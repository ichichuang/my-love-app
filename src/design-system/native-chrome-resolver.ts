import type { AppCssVars, AppTheme, CssHexColor, NativeChromeTheme, NavigationTheme } from "@/design-system/types"

const fallbackNativeChrome = {
  lightPage: "#FFF8F1",
  darkPage: "#101826",
  darkNavigation: "#202B3B",
  lightText: "#2F2427",
  darkText: "#F7F0EA"
} as const satisfies Record<string, CssHexColor>

const nativeHexPattern = /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/

const normalizeNativeHexColor = (value: string): CssHexColor | null => {
  const trimmed = value.trim()
  if (!nativeHexPattern.test(trimmed)) {
    return null
  }

  const hex = trimmed.slice(1)
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((character) => `${character}${character}`)
      .join("")
      .toUpperCase()}` as CssHexColor
  }

  return `#${hex.toUpperCase()}` as CssHexColor
}

const resolveNativeHexVar = (vars: AppCssVars, name: keyof AppCssVars, fallback: CssHexColor): CssHexColor => {
  const value = vars[name]
  if (typeof value !== "string") {
    return fallback
  }

  return normalizeNativeHexColor(value) ?? fallback
}

export const resolveNativeChromeTheme = (theme: AppTheme, vars: AppCssVars): NativeChromeTheme => {
  const isDark = theme === "dark"
  const backgroundColor = resolveNativeHexVar(
    vars,
    "--app-color-bg-page",
    isDark ? fallbackNativeChrome.darkPage : fallbackNativeChrome.lightPage
  )
  const navigationBarBackgroundColor = isDark
    ? resolveNativeHexVar(vars, "--app-color-bg-card", fallbackNativeChrome.darkNavigation)
    : backgroundColor
  const textColor = resolveNativeHexVar(
    vars,
    "--app-color-text-primary",
    isDark ? fallbackNativeChrome.darkText : fallbackNativeChrome.lightText
  )

  return {
    frontColor: isDark ? "#ffffff" : "#000000",
    navigationBarBackgroundColor,
    backgroundColor,
    backgroundColorTop: isDark ? navigationBarBackgroundColor : backgroundColor,
    backgroundColorBottom: backgroundColor,
    backgroundTextStyle: isDark ? "light" : "dark",
    pageStyle: `background-color: ${backgroundColor}; color: ${textColor};`
  }
}

export const resolveNavigationThemeFromNativeChrome = (theme: NativeChromeTheme): NavigationTheme => ({
  frontColor: theme.frontColor,
  backgroundColor: theme.navigationBarBackgroundColor
})
