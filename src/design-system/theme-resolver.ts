import { resolvePaletteColorVars } from "@/design-system/color-scale"
import { resolveAppCssAliases } from "@/design-system/css-vars"
import type { ResolvedSizeTokens } from "@/design-system/size-resolver"
import type { AppCssVars, AppTheme, RomanticPalette, ThemeDensity, ThemeFontScale, ThemeMode } from "@/design-system/types"

export interface AppCssVarInput {
  theme: AppTheme
  palette: RomanticPalette
  size: ResolvedSizeTokens
}

export const resolveThemeMode = (mode: ThemeMode, systemTheme: AppTheme): AppTheme =>
  mode === "system" ? systemTheme : mode

export const resolveThemeClasses = (theme: AppTheme, density: ThemeDensity, fontScale: ThemeFontScale): string[] => [
  `app-theme--${theme}`,
  `app-density--${density}`,
  `app-font-scale--${fontScale}`
]

export const resolveThemeProviderKey = (
  theme: AppTheme,
  paletteId: string,
  density: ThemeDensity,
  fontScale: ThemeFontScale
): string => [theme, paletteId, density, fontScale].join(":")

export const resolveThemeColorVars = (theme: AppTheme, palette: RomanticPalette): AppCssVars =>
  resolvePaletteColorVars(palette, theme)

export const resolveAppCssVars = ({ theme, palette, size }: AppCssVarInput): AppCssVars => {
  const canonicalVars = {
    ...resolveThemeColorVars(theme, palette),
    ...size.cssVars
  }

  return {
    ...canonicalVars,
    ...resolveAppCssAliases(canonicalVars)
  }
}
