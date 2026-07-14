import { resolveDensityScales, scaleToCssVars } from "@/design-system/size-scale"
import { resolveTypographyTokens } from "@/design-system/typography-resolver"
import type { AppCssVars, ThemeDensity, ThemeFontScale } from "@/design-system/types"

export const motionDurations = {
  fast: 180,
  normal: 260,
  slow: 320,
  slower: 420,
  paintDelay: 50,
  tickDelay: 30
} as const

export interface ResolvedSizeTokens {
  cssVars: AppCssVars
  wot: {
    fsTitle: string
    fsContent: string
    fsSecondary: string
    fsAid: string
    sizeSidePadding: string
    buttonSmallHeight: string
    buttonMediumHeight: string
    buttonLargeHeight: string
    buttonSmallPadding: string
    buttonMediumPadding: string
    buttonLargePadding: string
    buttonSmallRadius: string
    buttonMediumRadius: string
    buttonLargeRadius: string
    buttonSmallFs: string
    buttonMediumFs: string
    buttonLargeFs: string
  }
}

const structuralVars = (density: ThemeDensity, fontScale: ThemeFontScale) => {
  const { spacing, radius, control } = resolveDensityScales(density)
  const isCompact = density === "compact"
  const isLargeFont = fontScale === "large"

  return {
    ...scaleToCssVars("space-scale", spacing),
    ...scaleToCssVars("radius-scale", radius),
    ...scaleToCssVars("control-scale", control),

    "--app-space-0": "0",
    "--app-space-1": spacing["2xs"],
    "--app-space-2": spacing.xs,
    "--app-space-3": isCompact ? "8rpx" : "10rpx",
    "--app-space-4": spacing.sm,
    "--app-space-5": isCompact ? "12rpx" : "14rpx",
    "--app-space-6": spacing.md,
    "--app-space-7": isCompact ? "16rpx" : "18rpx",
    "--app-space-8": spacing.lg,
    "--app-space-9": isCompact ? "20rpx" : "22rpx",
    "--app-space-10": spacing.xl,
    "--app-space-11": isCompact ? "24rpx" : "26rpx",
    "--app-space-12": isCompact ? "26rpx" : "28rpx",
    "--app-space-13": isCompact ? "28rpx" : "30rpx",
    "--app-space-14": spacing["2xl"],
    "--app-space-15": isCompact ? "30rpx" : "34rpx",
    "--app-space-16": isCompact ? "32rpx" : "36rpx",
    "--app-space-18": isCompact ? "38rpx" : "42rpx",
    "--app-space-20": isCompact ? "44rpx" : "48rpx",
    "--app-space-24": isCompact ? "58rpx" : "64rpx",
    "--app-space-28": isCompact ? "66rpx" : "72rpx",
    "--app-space-32": isCompact ? "80rpx" : "88rpx",
    "--app-space-36": isCompact ? "96rpx" : "106rpx",
    "--app-space-40": isCompact ? "116rpx" : "128rpx",
    "--app-space-44": isCompact ? "136rpx" : "148rpx",
    "--app-space-48": isCompact ? "152rpx" : "168rpx",
    "--app-space-56": isCompact ? "198rpx" : "220rpx",
    "--app-space-64": isCompact ? "232rpx" : "260rpx",

    "--app-border-width-hairline": "1rpx",
    "--app-border-width-focus": "2rpx",

    "--app-radius-xs": radius["2xs"],
    "--app-radius-sm": radius.xs,
    "--app-radius-md": radius.md,
    "--app-radius-lg": radius.lg,
    "--app-radius-xl": radius.xl,
    "--app-radius-2xl": radius["2xl"],
    "--app-radius-3xl": radius["3xl"],
    "--app-radius-pill": "999rpx",
    "--app-radius-round": "50%",
    "--app-radius-card": radius.xl,
    "--app-radius-button": radius.md,
    "--app-radius-input": radius.md,
    "--app-radius-image": radius.lg,
    "--app-radius-sheet": radius.xl,
    "--app-radius-badge": "999rpx",

    "--app-page-padding-x": spacing["2xl"],
    "--app-page-padding-y": spacing["2xl"],
    "--app-section-gap": isCompact ? spacing.xl : "34rpx",
    "--app-card-padding": isCompact ? spacing.xl : "28rpx",
    "--app-card-gap": spacing.xl,
    "--app-list-gap": isCompact ? "18rpx" : "22rpx",
    "--app-form-gap": spacing.xl,
    "--app-control-height-sm": control.sm,
    "--app-control-height-md": control.md,
    "--app-control-height-lg": control.lg,
    "--app-button-height": control.lg,
    "--app-input-height": isCompact ? control.md : "88rpx",
    "--app-nav-height": control.lg,
    "--app-image-grid-gap": spacing.md,
    "--app-safe-action-bottom-gap": isCompact ? "144rpx" : "156rpx",
    "--app-textarea-min-height": isCompact ? "232rpx" : "260rpx",
    // 折叠区展开态保守高度上限：容纳歌曲/任务详情（含 textarea + 选项组），
    // 且为大字号、窄屏降列留余量；超出时由外层 overflow:hidden 兜底，不裁剪已展开的原生输入框
    "--app-collapse-max-height": isCompact ? "1400rpx" : "1600rpx",

    "--app-shell-header-gap": spacing.xl,
    "--app-shell-header-bottom": isCompact ? "26rpx" : "30rpx",
    "--app-shell-header-top": spacing["2xs"],
    "--app-shell-eyebrow-bottom": spacing.xs,
    "--app-panel-border-width": "1rpx",
    "--app-field-padding-x": isCompact ? "20rpx" : "22rpx",

    "--app-empty-padding-y": isCompact ? "48rpx" : "58rpx",
    "--app-empty-padding-x": isCompact ? "30rpx" : "38rpx",
    "--app-empty-decor-size": isCompact ? "66rpx" : "72rpx",
    "--app-empty-image-size": isCompact ? "136rpx" : "148rpx",
    "--app-empty-mark-size": isCompact ? "116rpx" : "128rpx",

    "--app-home-logo-size": isCompact ? "96rpx" : "106rpx",
    "--app-home-decor-width": isCompact ? "104rpx" : "116rpx",
    "--app-home-decor-height": isCompact ? "58rpx" : "64rpx",
    "--app-home-decor-bottom": isCompact ? "88rpx" : "98rpx",

    "--app-entry-date-width": isCompact ? "86rpx" : "94rpx",
    "--app-entry-day-width": isCompact ? "62rpx" : "68rpx",

    "--app-image-badge-size": isCompact ? "30rpx" : "34rpx",
    "--app-image-remove-touch-size": "80rpx",
    "--app-image-remove-height": isCompact ? "38rpx" : "42rpx",
    "--app-image-remove-padding-x": isCompact ? "12rpx" : "14rpx",

    "--app-option-group-gap": isCompact ? "12rpx" : "14rpx",
    "--app-option-group-safe-inset": isCompact ? "6rpx" : "8rpx",
    "--app-option-group-auto-min-width": isLargeFont
      ? (isCompact ? "212rpx" : "224rpx")
      : (isCompact ? "172rpx" : "184rpx"),
    "--app-option-group-swatch-min-width": isLargeFont
      ? (isCompact ? "316rpx" : "336rpx")
      : (isCompact ? "274rpx" : "292rpx"),
    "--app-paper-tag-field-min-width": isLargeFont
      ? (isCompact ? "316rpx" : "336rpx")
      : (isCompact ? "274rpx" : "292rpx"),
    "--app-option-padding-x": isCompact ? "18rpx" : "22rpx",
    "--app-option-padding-y": isCompact ? "14rpx" : "18rpx",
    "--app-option-min-height": control.md,
    "--app-option-swatch-primary": "var(--app-primary)",
    "--app-option-swatch-accent": "var(--app-accent)",
    "--app-option-swatch-glow": "var(--app-glow)",
    "--app-option-swatch-foreground": "var(--app-color-on-primary)",
    "--app-swatch-height": isCompact ? "116rpx" : "126rpx",
    "--app-swatch-gradient-size": isCompact ? "66rpx" : "72rpx",
    "--app-swatch-custom-button-width": isCompact ? "136rpx" : "148rpx",

    "--app-cloud-value-width": "420rpx",
    "--app-z-index-nav": "10",
    "--app-z-index-pet": "50",
    "--app-z-index-picker": "1050",

    "--app-timeline-rail-width": isCompact ? "70rpx" : "76rpx",
    "--app-timeline-axis-gap": isCompact ? "14rpx" : "18rpx",
    "--app-timeline-node-size": isCompact ? "18rpx" : "20rpx",
    "--app-timeline-line-width": "2rpx",

    "--app-timeline-header-padding-x": spacing.xl,
    "--app-timeline-header-padding-y": spacing.md,
    "--app-timeline-marker-padding": `${spacing.xs} ${spacing.sm}`,
    "--app-timeline-marker-radius": "var(--app-radius-pill)",

    "--app-shadow-none": "none",
    "--app-shadow-focus": "0 0 0 4rpx var(--app-color-border-focus-ring)",
    "--app-shadow-focus-inset": "inset 0 0 0 var(--app-border-width-focus) var(--app-color-border-focus-ring)",
    "--app-duration-fast": `${motionDurations.fast}ms`,
    "--app-duration-normal": `${motionDurations.normal}ms`,
    "--app-duration-slow": `${motionDurations.slow}ms`,
    "--app-duration-slower": `${motionDurations.slower}ms`,
    "--app-duration-instant": "0s",
    "--app-duration-breath": "1600ms",
    "--app-duration-breath-idle": "3200ms",
    "--app-duration-paint-delay": `${motionDurations.paintDelay}ms`,
    "--app-duration-tick-delay": `${motionDurations.tickDelay}ms`,
    "--app-stagger-reveal": "70ms",
    "--app-stagger-menu": "45ms",
    "--app-ease-standard": "ease",
    "--app-ease-emphasized": "ease-in-out",
    "--app-ease-out": "cubic-bezier(0.22, 0.61, 0.36, 1)",
    "--app-ease-bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)",
    "--app-transition-fast": `${motionDurations.fast}ms ease`,
    "--app-transition-normal": `${motionDurations.normal}ms ease`,
    "--app-transition-slow": `${motionDurations.slow}ms ease-in-out`,
    "--app-transition-theme": `background-color ${motionDurations.normal}ms ease, border-color ${motionDurations.normal}ms ease, color ${motionDurations.normal}ms ease, opacity 220ms ease, box-shadow ${motionDurations.normal}ms ease`,
    "--app-press-scale": "0.99",
    "--app-press-scale-strong": "0.96",
    "--app-pop-scale": "1.04",
    "--app-press-opacity": "0.82",
    "--app-muted-opacity": "0.78",
    "--app-decor-opacity": "0.7",
    "--app-disabled-opacity": "0.3",
    "--app-fade-offset-y": spacing.md,
    "--app-lift-translate-y": isCompact ? "-4rpx" : "-6rpx",
    "--app-rotate-stamp": "-4deg"
  } satisfies AppCssVars
}

export const resolveSizeTokens = (density: ThemeDensity, fontScale: ThemeFontScale): ResolvedSizeTokens => {
  const sizeVars = structuralVars(density, fontScale)
  const typography = resolveTypographyTokens(fontScale)

  return {
    cssVars: {
      ...sizeVars,
      ...typography.cssVars
    },
    wot: {
      ...typography.wot,
      sizeSidePadding: sizeVars["--app-page-padding-x"],
      buttonSmallHeight: sizeVars["--app-control-height-sm"],
      buttonMediumHeight: sizeVars["--app-control-height-md"],
      buttonLargeHeight: sizeVars["--app-control-height-lg"],
      buttonSmallPadding: `0 ${sizeVars["--app-space-5"]}`,
      buttonMediumPadding: `0 ${sizeVars["--app-space-8"]}`,
      buttonLargePadding: `0 ${sizeVars["--app-space-10"]}`,
      buttonSmallRadius: sizeVars["--app-radius-badge"],
      buttonMediumRadius: sizeVars["--app-radius-button"],
      buttonLargeRadius: sizeVars["--app-radius-button"]
    }
  }
}
