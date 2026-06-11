import type { AppCssVars, ScaleKey, ThemeDensity } from "@/design-system/types"

export type RpxScale = Record<ScaleKey, string>

export const scaleKeys: ScaleKey[] = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"]

export const spacingScales: Record<ThemeDensity, RpxScale> = {
  comfortable: {
    "2xs": "4rpx",
    xs: "8rpx",
    sm: "12rpx",
    md: "16rpx",
    lg: "20rpx",
    xl: "24rpx",
    "2xl": "32rpx",
    "3xl": "40rpx"
  },
  compact: {
    "2xs": "4rpx",
    xs: "6rpx",
    sm: "10rpx",
    md: "14rpx",
    lg: "18rpx",
    xl: "22rpx",
    "2xl": "28rpx",
    "3xl": "34rpx"
  }
}

export const radiusScales: Record<ThemeDensity, RpxScale> = {
  comfortable: {
    "2xs": "8rpx",
    xs: "12rpx",
    sm: "16rpx",
    md: "24rpx",
    lg: "28rpx",
    xl: "36rpx",
    "2xl": "42rpx",
    "3xl": "52rpx"
  },
  compact: {
    "2xs": "6rpx",
    xs: "10rpx",
    sm: "14rpx",
    md: "22rpx",
    lg: "24rpx",
    xl: "30rpx",
    "2xl": "36rpx",
    "3xl": "44rpx"
  }
}

export const controlHeightScales: Record<ThemeDensity, RpxScale> = {
  comfortable: {
    "2xs": "56rpx",
    xs: "64rpx",
    sm: "78rpx",
    md: "86rpx",
    lg: "96rpx",
    xl: "108rpx",
    "2xl": "128rpx",
    "3xl": "156rpx"
  },
  compact: {
    "2xs": "50rpx",
    xs: "58rpx",
    sm: "72rpx",
    md: "80rpx",
    lg: "88rpx",
    xl: "100rpx",
    "2xl": "118rpx",
    "3xl": "144rpx"
  }
}

export const scaleToCssVars = (prefix: string, scale: RpxScale): AppCssVars =>
  scaleKeys.reduce<AppCssVars>((vars, key) => {
    vars[`--app-${prefix}-${key}`] = scale[key]
    return vars
  }, {})

export const resolveDensityScales = (density: ThemeDensity) => ({
  spacing: spacingScales[density],
  radius: radiusScales[density],
  control: controlHeightScales[density]
})
