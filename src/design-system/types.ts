export type AppTheme = "light" | "dark"
export type ThemeMode = "system" | AppTheme
export type ThemeDensity = "comfortable" | "compact"
export type ThemeFontScale = "normal" | "large"
export type ScaleKey = "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"

export type AppCssVars = Record<string, string>

export interface ColorRole {
  base: string
  soft: string
  muted: string
  pressed: string
  active: string
  foreground: string
  border: string
  disabled: string
  divider: string
  focusRing: string
}

export interface TextColorRole {
  primary: string
  secondary: string
  muted: string
  disabled: string
  inverse: string
  onPrimary: string
  onAccent: string
  onOverlay: string
}

export interface BorderColorRole {
  base: string
  muted: string
  strong: string
  divider: string
  disabled: string
  focusRing: string
}

export interface StatusColorRoles {
  danger: ColorRole
  warning: ColorRole
  success: ColorRole
  info: ColorRole
}

export interface ShadowColorRole {
  card: string
  floating: string
  button: string
  image: string
  logo: string
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
  redPerson: ColorRole
  bluePerson: ColorRole
  status: StatusColorRoles
  overlay: ColorRole
  swatch: ColorRole
  photoBadge: ColorRole
  heartSoft: string
  pageGlow: string
  shadows: ShadowColorRole
}

export interface RomanticPalette {
  id: string
  name: string
  description: string
  preview: {
    primary: string
    accent: string
    glow: string
    foreground: string
  }
  schemes: Record<AppTheme, SemanticColorScheme>
}

export interface NavigationTheme {
  frontColor: "#ffffff" | "#000000"
  backgroundColor: string
}
