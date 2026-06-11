import type { ResolvedSizeTokens } from "@/design-system/size-resolver"
import type { AppCssVars } from "@/design-system/types"
import type { ConfigProviderThemeVars } from "wot-design-uni/components/wd-config-provider/types"

export type WotThemeVars = Partial<ConfigProviderThemeVars>

export const resolveWotThemeVars = (vars: AppCssVars, size: ResolvedSizeTokens): WotThemeVars => {
  const text = vars["--app-color-text-primary"]
  const textSecondary = vars["--app-color-text-secondary"]
  const textMuted = vars["--app-color-text-muted"]
  const border = vars["--app-color-border"]
  const bg = vars["--app-color-bg-page"]
  const card = vars["--app-color-bg-card"]
  const primary = vars["--app-color-primary"]
  const danger = vars["--app-color-danger"]
  const warning = vars["--app-color-warning"]
  const success = vars["--app-color-success"]
  const onPrimary = vars["--app-color-on-primary"]
  const onAccent = vars["--app-color-on-accent"]

  return {
    colorTheme: primary,
    colorSuccess: success,
    colorWarning: warning,
    colorDanger: danger,
    colorBlue: vars["--app-color-blue-person"],
    colorWhite: "#ffffff",
    colorBlack: "#000000",
    colorGray1: vars["--app-color-text-primary"],
    colorGray2: vars["--app-color-text-secondary"],
    colorGray3: vars["--app-color-text-muted"],
    colorGray4: vars["--app-color-text-disabled"],
    colorGray5: vars["--app-color-border-strong"],
    colorGray6: vars["--app-color-border"],
    colorGray7: vars["--app-color-bg-card-elevated"],
    colorGray8: vars["--app-color-bg-page"],
    fontGray1: vars["--app-color-text-primary"],
    fontGray2: vars["--app-color-text-secondary"],
    fontGray3: vars["--app-color-text-muted"],
    fontGray4: vars["--app-color-text-disabled"],
    fontWhite1: vars["--app-color-on-primary"],
    fontWhite2: vars["--app-color-on-accent"],
    fontWhite3: vars["--app-color-on-overlay"],
    fontWhite4: vars["--app-color-text-inverse"],
    colorTitle: text,
    colorContent: text,
    colorSecondary: textSecondary,
    colorAid: textMuted,
    colorTip: textMuted,
    colorBorder: border,
    colorBorderLight: border,
    colorBg: bg,
    darkBackground: vars["--app-color-bg-page"],
    darkBackground2: card,
    darkBackground3: vars["--app-color-bg-card-elevated"],
    darkColor: text,
    darkColor2: textSecondary,
    darkColor3: textMuted,
    darkBorderColor: border,
    fsTitle: size.wot.fsTitle,
    fsContent: size.wot.fsContent,
    fsSecondary: size.wot.fsSecondary,
    fsAid: size.wot.fsAid,
    fwMedium: vars["--app-font-weight-medium"],
    fwSemibold: vars["--app-font-weight-semibold"],
    sizeSidePadding: size.wot.sizeSidePadding,
    buttonDisabledOpacity: vars["--app-disabled-opacity"],
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
    buttonSuccessColor: vars["--app-color-success-foreground"],
    buttonWarningBgColor: warning,
    buttonWarningColor: vars["--app-color-warning-foreground"],
    buttonErrorBgColor: danger,
    buttonErrorColor: vars["--app-color-danger-foreground"],
    buttonInfoBgColor: vars["--app-color-accent"],
    buttonInfoColor: onAccent,
    buttonInfoPlainBorderColor: vars["--app-color-accent-border"],
    buttonInfoPlainNormalColor: vars["--app-color-accent"],
    buttonNormalColor: vars["--app-color-text-primary"],
    buttonNormalDisabledColor: vars["--app-color-text-disabled"],
    buttonPlainBgColor: "transparent"
  }
}
