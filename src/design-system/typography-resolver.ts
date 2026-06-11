import type { AppCssVars, RpxValue, ScaleKey, ThemeFontScale } from "@/design-system/types"

type FontRamp = Record<ScaleKey, RpxValue>

const fontRamps = {
  normal: {
    "2xs": "18rpx",
    xs: "20rpx",
    sm: "22rpx",
    md: "24rpx",
    lg: "26rpx",
    xl: "28rpx",
    "2xl": "32rpx",
    "3xl": "38rpx"
  },
  large: {
    "2xs": "20rpx",
    xs: "22rpx",
    sm: "24rpx",
    md: "26rpx",
    lg: "28rpx",
    xl: "30rpx",
    "2xl": "34rpx",
    "3xl": "40rpx"
  }
} satisfies Record<ThemeFontScale, FontRamp>

export interface ResolvedTypographyTokens {
  cssVars: AppCssVars
  wot: {
    fsTitle: string
    fsContent: string
    fsSecondary: string
    fsAid: string
    buttonSmallFs: string
    buttonMediumFs: string
    buttonLargeFs: string
  }
}

const font = (weight: string, size: string, lineHeight: string, family: string): string =>
  `${weight} ${size} / ${lineHeight} ${family}`

export const resolveTypographyTokens = (fontScale: ThemeFontScale): ResolvedTypographyTokens => {
  const ramp = fontRamps[fontScale]
  const displayFamily = "\"Songti SC\", \"STSong\", serif"
  const bodyFamily = "\"PingFang SC\", \"Microsoft YaHei\", sans-serif"
  const medium = "500"
  const semibold = "600"

  const cssVars = {
    "--app-font-family-body": bodyFamily,
    "--app-font-family-display": displayFamily,
    "--app-font-weight-medium": medium,
    "--app-font-weight-semibold": semibold,
    "--app-line-height-none": "1",
    "--app-line-height-tight": "1.15",
    "--app-line-height-snug": "1.25",
    "--app-line-height-normal": "1.4",
    "--app-line-height-relaxed": "1.55",
    "--app-line-height-loose": "1.7",

    "--app-font-size-2xs": ramp["2xs"],
    "--app-font-size-xs": ramp.xs,
    "--app-font-size-sm": ramp.sm,
    "--app-font-size-md": ramp.md,
    "--app-font-size-base": ramp.md,
    "--app-font-size-body": ramp.lg,
    "--app-font-size-lg": ramp.xl,
    "--app-font-size-xl": ramp["2xl"],
    "--app-font-size-2xl": ramp["2xl"],
    "--app-font-size-3xl": ramp["3xl"],
    "--app-font-size-4xl": fontScale === "large" ? "42rpx" : "40rpx",
    "--app-font-size-5xl": fontScale === "large" ? "44rpx" : "42rpx",
    "--app-font-size-6xl": fontScale === "large" ? "48rpx" : "46rpx",
    "--app-font-size-7xl": fontScale === "large" ? "52rpx" : "50rpx",
    "--app-font-size-page-title": fontScale === "large" ? "54rpx" : "52rpx"
  } satisfies AppCssVars

  return {
    cssVars: {
      ...cssVars,
      "--app-font-page-title": font(semibold, cssVars["--app-font-size-page-title"], cssVars["--app-line-height-tight"], displayFamily),
      "--app-font-section-title": font(semibold, cssVars["--app-font-size-2xl"], cssVars["--app-line-height-snug"], bodyFamily),
      "--app-font-body": `${cssVars["--app-font-size-body"]} / ${cssVars["--app-line-height-relaxed"]} ${bodyFamily}`,
      "--app-font-caption": `${cssVars["--app-font-size-base"]} / ${cssVars["--app-line-height-normal"]} ${bodyFamily}`,
      "--app-font-button": font(medium, cssVars["--app-font-size-body"], cssVars["--app-line-height-none"], bodyFamily),
      "--app-font-card-title": font(semibold, cssVars["--app-font-size-3xl"], cssVars["--app-line-height-snug"], displayFamily),
      "--app-font-hero-title": font(semibold, cssVars["--app-font-size-6xl"], cssVars["--app-line-height-tight"], displayFamily),
      "--app-font-detail-title": font(semibold, cssVars["--app-font-size-7xl"], cssVars["--app-line-height-tight"], displayFamily)
    },
    wot: {
      fsTitle: cssVars["--app-font-size-2xl"],
      fsContent: cssVars["--app-font-size-lg"],
      fsSecondary: cssVars["--app-font-size-base"],
      fsAid: cssVars["--app-font-size-sm"],
      buttonSmallFs: cssVars["--app-font-size-sm"],
      buttonMediumFs: cssVars["--app-font-size-base"],
      buttonLargeFs: cssVars["--app-font-size-body"]
    }
  }
}
