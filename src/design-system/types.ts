import type { AppCssVarName, CssVarName } from "@/design-system/token-registry"
import { scaleKeys } from "@/design-system/token-registry"

export type AppTheme = "light" | "dark"
export type ThemeMode = "system" | AppTheme
export type ThemeDensity = "comfortable" | "compact"
export type ThemeFontScale = "normal" | "large"
export type ScaleKey = (typeof scaleKeys)[number]

export { scaleKeys }

export type RpxValue = `${number}rpx` | "0"
export type MsValue = `${number}ms`
export type CssHexColor = `#${string}`
export type CssRgbaColor = `rgb(${string})` | `rgba(${string})`
export type CssVarReference = `var(${CssVarName})`
export type CssColorValue = CssHexColor | CssRgbaColor | CssVarReference | "transparent" | "currentColor" | "inherit"
export type CssShadowValue = "none" | `${string} ${CssColorValue}` | CssVarReference
export type CssTransitionValue = `${MsValue} ${string}` | `${string} ${MsValue} ${string}` | CssVarReference
export type CssVarRecord<TName extends CssVarName = CssVarName> = Partial<Record<TName, string>>
export type AppCssVars = Partial<Record<AppCssVarName, string>>
export type NativeFrontColor = "#ffffff" | "#000000"
export type BackgroundTextStyle = "dark" | "light"

export interface ColorRole {
  base: CssColorValue
  soft: CssColorValue
  muted: CssColorValue
  pressed: CssColorValue
  active: CssColorValue
  foreground: CssColorValue
  border: CssColorValue
  disabled: CssColorValue
  divider: CssColorValue
  focusRing: CssColorValue
}

export interface TextColorRole {
  primary: CssColorValue
  secondary: CssColorValue
  muted: CssColorValue
  disabled: CssColorValue
  inverse: CssColorValue
  onPrimary: CssColorValue
  onAccent: CssColorValue
  onOverlay: CssColorValue
}

export interface BorderColorRole {
  base: CssColorValue
  muted: CssColorValue
  strong: CssColorValue
  divider: CssColorValue
  disabled: CssColorValue
  focusRing: CssColorValue
}

export interface StatusColorRoles {
  danger: ColorRole
  warning: ColorRole
  success: ColorRole
  info: ColorRole
}

export interface ShadowColorRole {
  card: CssShadowValue
  floating: CssShadowValue
  button: CssShadowValue
  image: CssShadowValue
  logo: CssShadowValue
}

export interface SemanticColorScheme {
  page: ColorRole
  card: ColorRole
  input: ColorRole
  control: ColorRole
  text: TextColorRole
  border: BorderColorRole
  primary: ColorRole
  accent: ColorRole
  warmAccent: ColorRole
  coolAccent: ColorRole
  status: StatusColorRoles
  overlay: ColorRole
  swatch: ColorRole
  mediaBadge: ColorRole
  decorSoft: CssColorValue
  pageGlow: CssColorValue
  shadows: ShadowColorRole
}

export interface PaletteSchemeSeed {
  page: CssHexColor
  card: CssHexColor
  text: CssHexColor
  primary: CssHexColor
  accent: CssHexColor
}

export interface CuratedPaletteSeed {
  id: string
  name: string
  description: string
  light: PaletteSchemeSeed
  dark: PaletteSchemeSeed
}

export interface ThemePalette<TId extends string = string> {
  id: TId
  name: string
  description: string
  preview: {
    primary: CssColorValue
    accent: CssColorValue
    glow: CssColorValue
    foreground: CssColorValue
  }
  schemes: Record<AppTheme, SemanticColorScheme>
}

export interface NativeChromeTheme {
  frontColor: NativeFrontColor
  navigationBarBackgroundColor: CssHexColor
  backgroundColor: CssHexColor
  backgroundColorTop: CssHexColor
  backgroundColorBottom: CssHexColor
  backgroundTextStyle: BackgroundTextStyle
  pageStyle: string
}

export interface NavigationTheme {
  frontColor: NativeFrontColor
  backgroundColor: CssHexColor
}
