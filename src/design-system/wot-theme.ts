import type { ResolvedSizeTokens } from "@/design-system/size-resolver"
import type { AppCssVars } from "@/design-system/types"
import type { WotRequiredAppVarName } from "@/design-system/token-registry"
import type { ConfigProviderThemeVars } from "wot-design-uni/components/wd-config-provider/types"

type RequiredWotThemeVarName =
  | "colorTheme"
  | "colorSuccess"
  | "colorWarning"
  | "colorDanger"
  | "colorBlue"
  | "colorWhite"
  | "colorBlack"
  | "colorGray1"
  | "colorGray2"
  | "colorGray3"
  | "colorGray4"
  | "colorGray5"
  | "colorGray6"
  | "colorGray7"
  | "colorGray8"
  | "fontGray1"
  | "fontGray2"
  | "fontGray3"
  | "fontGray4"
  | "fontWhite1"
  | "fontWhite2"
  | "fontWhite3"
  | "fontWhite4"
  | "colorTitle"
  | "colorContent"
  | "colorSecondary"
  | "colorAid"
  | "colorTip"
  | "colorBorder"
  | "colorBorderLight"
  | "colorBg"
  | "darkBackground"
  | "darkBackground2"
  | "darkBackground3"
  | "darkColor"
  | "darkColor2"
  | "darkColor3"
  | "darkBorderColor"
  | "fsTitle"
  | "fsContent"
  | "fsSecondary"
  | "fsAid"
  | "fwMedium"
  | "fwSemibold"
  | "sizeSidePadding"
  | "buttonDisabledOpacity"
  | "buttonSmallHeight"
  | "buttonSmallPadding"
  | "buttonMediumHeight"
  | "buttonMediumPadding"
  | "buttonLargeHeight"
  | "buttonLargePadding"
  | "buttonSmallRadius"
  | "buttonMediumRadius"
  | "buttonLargeRadius"
  | "buttonSmallFs"
  | "buttonMediumFs"
  | "buttonLargeFs"
  | "buttonPrimaryBgColor"
  | "buttonPrimaryColor"
  | "buttonSuccessBgColor"
  | "buttonSuccessColor"
  | "buttonWarningBgColor"
  | "buttonWarningColor"
  | "buttonErrorBgColor"
  | "buttonErrorColor"
  | "buttonInfoBgColor"
  | "buttonInfoColor"
  | "buttonInfoPlainBorderColor"
  | "buttonInfoPlainNormalColor"
  | "buttonNormalColor"
  | "buttonNormalDisabledColor"
  | "buttonPlainBgColor"

export type RequiredWotThemeVars = Required<Pick<ConfigProviderThemeVars, RequiredWotThemeVarName>>
export type WotThemeVars = RequiredWotThemeVars & Partial<ConfigProviderThemeVars>

const requiredAppVar = (vars: AppCssVars, name: WotRequiredAppVarName): string => {
  const value = vars[name]
  if (typeof value !== "string") {
    throw new Error(`Missing required app CSS variable: ${name}`)
  }
  return value
}

export const resolveWotThemeVars = (vars: AppCssVars, size: ResolvedSizeTokens): WotThemeVars => {
  const text = requiredAppVar(vars, "--app-color-text-primary")
  const textSecondary = requiredAppVar(vars, "--app-color-text-secondary")
  const textMuted = requiredAppVar(vars, "--app-color-text-muted")
  const textDisabled = requiredAppVar(vars, "--app-color-text-disabled")
  const textInverse = requiredAppVar(vars, "--app-color-text-inverse")
  const border = requiredAppVar(vars, "--app-color-border")
  const borderStrong = requiredAppVar(vars, "--app-color-border-strong")
  const bg = requiredAppVar(vars, "--app-color-bg-page")
  const card = requiredAppVar(vars, "--app-color-bg-card")
  const cardElevated = requiredAppVar(vars, "--app-color-bg-card-elevated")
  const primary = requiredAppVar(vars, "--app-color-primary")
  const danger = requiredAppVar(vars, "--app-color-danger")
  const warning = requiredAppVar(vars, "--app-color-warning")
  const success = requiredAppVar(vars, "--app-color-success")
  const onPrimary = requiredAppVar(vars, "--app-color-on-primary")
  const onAccent = requiredAppVar(vars, "--app-color-on-accent")

  return {
    colorTheme: primary,
    colorSuccess: success,
    colorWarning: warning,
    colorDanger: danger,
    colorBlue: requiredAppVar(vars, "--app-color-blue-person"),
    colorWhite: "#ffffff",
    colorBlack: "#000000",
    colorGray1: text,
    colorGray2: textSecondary,
    colorGray3: textMuted,
    colorGray4: textDisabled,
    colorGray5: borderStrong,
    colorGray6: border,
    colorGray7: cardElevated,
    colorGray8: bg,
    fontGray1: text,
    fontGray2: textSecondary,
    fontGray3: textMuted,
    fontGray4: textDisabled,
    fontWhite1: onPrimary,
    fontWhite2: onAccent,
    fontWhite3: requiredAppVar(vars, "--app-color-on-overlay"),
    fontWhite4: textInverse,
    colorTitle: text,
    colorContent: text,
    colorSecondary: textSecondary,
    colorAid: textMuted,
    colorTip: textMuted,
    colorBorder: border,
    colorBorderLight: border,
    colorBg: bg,
    darkBackground: bg,
    darkBackground2: card,
    darkBackground3: cardElevated,
    darkColor: text,
    darkColor2: textSecondary,
    darkColor3: textMuted,
    darkBorderColor: border,
    fsTitle: size.wot.fsTitle,
    fsContent: size.wot.fsContent,
    fsSecondary: size.wot.fsSecondary,
    fsAid: size.wot.fsAid,
    fwMedium: requiredAppVar(vars, "--app-font-weight-medium"),
    fwSemibold: requiredAppVar(vars, "--app-font-weight-semibold"),
    sizeSidePadding: size.wot.sizeSidePadding,
    buttonDisabledOpacity: requiredAppVar(vars, "--app-disabled-opacity"),
    buttonSmallHeight: size.wot.buttonSmallHeight,
    buttonSmallPadding: size.wot.buttonSmallPadding,
    buttonMediumHeight: size.wot.buttonMediumHeight,
    buttonMediumPadding: size.wot.buttonMediumPadding,
    buttonLargeHeight: size.wot.buttonLargeHeight,
    buttonLargePadding: size.wot.buttonLargePadding,
    buttonSmallRadius: size.wot.buttonSmallRadius,
    buttonMediumRadius: size.wot.buttonMediumRadius,
    buttonLargeRadius: size.wot.buttonLargeRadius,
    buttonSmallFs: size.wot.buttonSmallFs,
    buttonMediumFs: size.wot.buttonMediumFs,
    buttonLargeFs: size.wot.buttonLargeFs,
    buttonPrimaryBgColor: primary,
    buttonPrimaryColor: onPrimary,
    buttonSuccessBgColor: success,
    buttonSuccessColor: requiredAppVar(vars, "--app-color-success-foreground"),
    buttonWarningBgColor: warning,
    buttonWarningColor: requiredAppVar(vars, "--app-color-warning-foreground"),
    buttonErrorBgColor: danger,
    buttonErrorColor: requiredAppVar(vars, "--app-color-danger-foreground"),
    buttonInfoBgColor: requiredAppVar(vars, "--app-color-accent"),
    buttonInfoColor: onAccent,
    buttonInfoPlainBorderColor: requiredAppVar(vars, "--app-color-accent-border"),
    buttonInfoPlainNormalColor: requiredAppVar(vars, "--app-color-accent"),
    buttonNormalColor: text,
    buttonNormalDisabledColor: textDisabled,
    buttonPlainBgColor: "transparent"
  } satisfies RequiredWotThemeVars
}
