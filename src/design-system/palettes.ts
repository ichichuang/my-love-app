import { makeColorRole } from "@/design-system/color-scale"
import type {
  AppTheme,
  BorderColorRole,
  ColorRole,
  CssColorValue,
  CssHexColor,
  CssRgbaColor,
  CssShadowValue,
  CuratedPaletteSeed,
  PaletteSchemeSeed,
  ThemePalette,
  SemanticColorScheme,
  ShadowColorRole,
  StatusColorRoles,
  TextColorRole
} from "@/design-system/types"

interface RgbColor {
  r: number
  g: number
  b: number
}

const WHITE: CssHexColor = "#FFFFFF"
const DARK_INK: CssHexColor = "#111827"
const BLACK: CssHexColor = "#000000"

const lightStatusBases = {
  danger: "#96505E",
  warning: "#87612E",
  success: "#4F715F",
  info: "#4B7087"
} as const satisfies Record<keyof StatusColorRoles, CssHexColor>

const darkStatusBases = {
  danger: "#E79AA3",
  warning: "#D9B878",
  success: "#9AC2A8",
  info: "#9FC6DA"
} as const satisfies Record<keyof StatusColorRoles, CssHexColor>

const paletteSeeds = [
  {
    id: "warm-paper",
    name: "暖纸基础",
    description: "暖纸底色与柔和主色",
    light: {
      page: "#FFF8F1",
      card: "#FFFFFF",
      text: "#2F2427",
      primary: "#A84E5A",
      accent: "#3F7897"
    },
    dark: {
      page: "#101826",
      card: "#202B3B",
      text: "#F7F0EA",
      primary: "#E28A93",
      accent: "#8DBBD4"
    }
  },
  {
    id: "peach-mist",
    name: "桃雾蓝灰",
    description: "桃雾柔光与蓝灰辅助",
    light: {
      page: "#FFF6F2",
      card: "#FFFEFC",
      text: "#302327",
      primary: "#A94F5B",
      accent: "#446F8D"
    },
    dark: {
      page: "#151A24",
      card: "#262B37",
      text: "#F6F0EC",
      primary: "#E99AA4",
      accent: "#9FC6DA"
    }
  },
  {
    id: "soft-lavender",
    name: "柔紫杏茶",
    description: "柔紫纸面与暖色强调",
    light: {
      page: "#F7F2FF",
      card: "#FFFFFF",
      text: "#2B2635",
      primary: "#7256A5",
      accent: "#A35461"
    },
    dark: {
      page: "#171624",
      card: "#282538",
      text: "#F3EEFF",
      primary: "#B89AE6",
      accent: "#E59AA4"
    }
  },
  {
    id: "apricot-sage",
    name: "杏茶鼠尾草",
    description: "暖杏底色与鼠尾草辅助",
    light: {
      page: "#FBF4E7",
      card: "#FFFDF8",
      text: "#2D261E",
      primary: "#9A5A33",
      accent: "#3F6952"
    },
    dark: {
      page: "#181713",
      card: "#29251D",
      text: "#F4ECDD",
      primary: "#E3A46D",
      accent: "#9AC2A8"
    }
  },
  {
    id: "muted-plum",
    name: "梅子灰阶",
    description: "梅子主色与柔和绿色辅助",
    light: {
      page: "#FCF6F4",
      card: "#FFFFFF",
      text: "#2B2328",
      primary: "#7F4865",
      accent: "#5D7D6D"
    },
    dark: {
      page: "#17171B",
      card: "#29272D",
      text: "#F6EEF4",
      primary: "#D993B4",
      accent: "#A9C7B8"
    }
  },
  {
    id: "indigo-slate",
    name: "靛蓝灰阶",
    description: "靛蓝主色与暖色辅助",
    light: {
      page: "#F8F4EC",
      card: "#FFFFFF",
      text: "#272626",
      primary: "#625C8E",
      accent: "#A15345"
    },
    dark: {
      page: "#121724",
      card: "#232A3A",
      text: "#F3F0EA",
      primary: "#AAA6DA",
      accent: "#E09A88"
    }
  }
] as const satisfies readonly CuratedPaletteSeed[]

export type PaletteId = (typeof paletteSeeds)[number]["id"]

const clampChannel = (value: number): number => Math.max(0, Math.min(255, Math.round(value)))

const normalizeHex = (hex: CssHexColor): CssHexColor => {
  const value = hex.replace("#", "")
  if (value.length === 3) {
    return `#${value
      .split("")
      .map((character) => `${character}${character}`)
      .join("")
      .toUpperCase()}` as CssHexColor
  }
  return `#${value.toUpperCase()}` as CssHexColor
}

const hexToRgb = (hex: CssHexColor): RgbColor => {
  const normalized = normalizeHex(hex).slice(1)
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  }
}

const rgbToHex = ({ r, g, b }: RgbColor): CssHexColor =>
  `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}` as CssHexColor

const mix = (from: CssHexColor, to: CssHexColor, weight: number): CssHexColor => {
  const left = hexToRgb(from)
  const right = hexToRgb(to)
  return rgbToHex({
    r: left.r * (1 - weight) + right.r * weight,
    g: left.g * (1 - weight) + right.g * weight,
    b: left.b * (1 - weight) + right.b * weight
  })
}

const alpha = (hex: CssHexColor, opacity: number): CssRgbaColor => {
  const color = hexToRgb(hex)
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`
}

const luminanceChannel = (channel: number): number => {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: CssHexColor): number => {
  const color = hexToRgb(hex)
  return 0.2126 * luminanceChannel(color.r) + 0.7152 * luminanceChannel(color.g) + 0.0722 * luminanceChannel(color.b)
}

const contrastRatio = (left: CssHexColor, right: CssHexColor): number => {
  const leftLuminance = luminance(left)
  const rightLuminance = luminance(right)
  const lighter = Math.max(leftLuminance, rightLuminance)
  const darker = Math.min(leftLuminance, rightLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

const readableForeground = (background: CssHexColor, darkInk = DARK_INK): CssHexColor =>
  contrastRatio(WHITE, background) >= 4.5 ? WHITE : darkInk

const role = (
  base: CssColorValue,
  soft: CssColorValue,
  muted: CssColorValue,
  pressed: CssColorValue,
  active: CssColorValue,
  foreground: CssColorValue,
  border: CssColorValue,
  disabled: CssColorValue,
  divider: CssColorValue,
  focusRing: CssColorValue
): ColorRole =>
  makeColorRole({
    base,
    soft,
    muted,
    pressed,
    active,
    foreground,
    border,
    disabled,
    divider,
    focusRing
  })

const makeTextRole = (seed: PaletteSchemeSeed, mode: AppTheme): TextColorRole => ({
  primary: seed.text,
  secondary: mode === "light" ? mix(seed.text, seed.card, 0.24) : mix(seed.text, seed.card, 0.22),
  muted: mode === "light" ? mix(seed.text, seed.card, 0.48) : mix(seed.text, seed.card, 0.38),
  disabled: mode === "light" ? mix(seed.text, seed.card, 0.68) : mix(seed.text, seed.card, 0.56),
  inverse: readableForeground(seed.text),
  onPrimary: readableForeground(seed.primary),
  onAccent: readableForeground(seed.accent),
  onOverlay: WHITE
} satisfies TextColorRole)

const makeToneRole = (base: CssHexColor, mode: AppTheme): ColorRole =>
  role(
    base,
    mode === "light" ? mix(base, WHITE, 0.78) : alpha(base, 0.22),
    mode === "light" ? mix(base, WHITE, 0.9) : alpha(base, 0.13),
    mode === "light" ? mix(base, DARK_INK, 0.22) : mix(base, WHITE, 0.12),
    mode === "light" ? mix(base, WHITE, 0.68) : alpha(base, 0.3),
    readableForeground(base),
    alpha(base, mode === "light" ? 0.3 : 0.34),
    mode === "light" ? mix(base, WHITE, 0.58) : alpha(base, 0.12),
    alpha(base, mode === "light" ? 0.15 : 0.2),
    alpha(base, mode === "light" ? 0.38 : 0.44)
  )

const makeStatusRoles = (mode: AppTheme): StatusColorRoles => {
  const bases = mode === "light" ? lightStatusBases : darkStatusBases
  return {
    danger: makeToneRole(bases.danger, mode),
    warning: makeToneRole(bases.warning, mode),
    success: makeToneRole(bases.success, mode),
    info: makeToneRole(bases.info, mode)
  }
}

const makeBorderRole = (text: CssHexColor, primary: CssHexColor, mode: AppTheme): BorderColorRole => ({
  base: alpha(text, mode === "light" ? 0.14 : 0.15),
  muted: alpha(text, mode === "light" ? 0.1 : 0.1),
  strong: alpha(text, mode === "light" ? 0.23 : 0.25),
  divider: alpha(text, mode === "light" ? 0.12 : 0.13),
  disabled: alpha(text, mode === "light" ? 0.08 : 0.08),
  focusRing: alpha(primary, mode === "light" ? 0.38 : 0.44)
} satisfies BorderColorRole)

const makeOverlayRole = (text: CssHexColor, mode: AppTheme): ColorRole => {
  const overlayBase = mode === "light" ? text : BLACK
  return role(
    alpha(overlayBase, mode === "light" ? 0.3 : 0.46),
    alpha(overlayBase, mode === "light" ? 0.18 : 0.32),
    alpha(overlayBase, mode === "light" ? 0.1 : 0.18),
    alpha(overlayBase, mode === "light" ? 0.72 : 0.76),
    alpha(overlayBase, mode === "light" ? 0.62 : 0.66),
    WHITE,
    alpha(WHITE, mode === "light" ? 0.48 : 0.42),
    alpha(overlayBase, 0.1),
    alpha(WHITE, mode === "light" ? 0.24 : 0.2),
    alpha(WHITE, 0.86)
  )
}

const makePhotoBadgeRole = (text: CssHexColor, mode: AppTheme): ColorRole => {
  const badgeBase = mode === "light" ? text : BLACK
  return role(
    alpha(badgeBase, mode === "light" ? 0.34 : 0.5),
    alpha(badgeBase, mode === "light" ? 0.22 : 0.34),
    alpha(badgeBase, mode === "light" ? 0.12 : 0.2),
    alpha(badgeBase, mode === "light" ? 0.76 : 0.8),
    alpha(badgeBase, mode === "light" ? 0.66 : 0.7),
    WHITE,
    alpha(WHITE, mode === "light" ? 0.5 : 0.42),
    alpha(badgeBase, 0.1),
    alpha(WHITE, mode === "light" ? 0.24 : 0.2),
    alpha(WHITE, 0.86)
  )
}

const makeSwatchRole = (
  primary: ColorRole,
  accent: ColorRole,
  primaryBase: CssHexColor,
  accentBase: CssHexColor,
  mode: AppTheme
): ColorRole =>
  role(
    primary.base,
    primary.soft,
    primary.muted,
    primary.pressed,
    mode === "light" ? alpha(WHITE, 0.28) : alpha(DARK_INK, 0.32),
    readableForeground(mix(primaryBase, accentBase, 0.5)),
    mode === "light" ? alpha(WHITE, 0.86) : alpha(WHITE, 0.76),
    mode === "light" ? alpha(WHITE, 0.34) : alpha(WHITE, 0.22),
    mode === "light" ? alpha(WHITE, 0.28) : alpha(WHITE, 0.2),
    alpha(WHITE, 0.9)
  )

const shadow = (value: CssShadowValue): CssShadowValue => value

const makeShadows = (seed: PaletteSchemeSeed, mode: AppTheme): ShadowColorRole => {
  const shadowBase = mode === "light" ? seed.text : BLACK
  return {
    card: shadow(`0 24rpx 80rpx ${alpha(shadowBase, mode === "light" ? 0.13 : 0.24)}`),
    floating: shadow(`0 28rpx 96rpx ${alpha(shadowBase, mode === "light" ? 0.17 : 0.34)}`),
    button: shadow(`0 12rpx 28rpx ${alpha(shadowBase, mode === "light" ? 0.12 : 0.2)}`),
    image: shadow(`0 12rpx 30rpx ${alpha(shadowBase, mode === "light" ? 0.1 : 0.2)}`),
    logo: shadow(`0 16rpx 42rpx ${alpha(shadowBase, mode === "light" ? 0.12 : 0.22)}`)
  } satisfies ShadowColorRole
}

const makeScheme = (seed: PaletteSchemeSeed, mode: AppTheme): SemanticColorScheme => {
  const text = makeTextRole(seed, mode)
  const border = makeBorderRole(seed.text, seed.primary, mode)
  const pageSoft = mode === "light" ? mix(seed.page, seed.primary, 0.045) : mix(seed.page, seed.card, 0.62)
  const pageMuted = mode === "light" ? mix(seed.page, seed.text, 0.075) : mix(seed.page, seed.card, 0.82)
  const cardSoft = mode === "light" ? mix(seed.card, seed.primary, 0.035) : mix(seed.card, seed.primary, 0.07)
  const cardMuted = mode === "light" ? mix(seed.page, seed.primary, 0.07) : mix(seed.page, seed.card, 0.46)
  const inputBase = mode === "light" ? mix(seed.card, seed.page, 0.58) : mix(seed.page, seed.card, 0.36)
  const controlBase = mode === "light" ? mix(seed.page, seed.primary, 0.04) : mix(seed.card, seed.primary, 0.06)
  const primary = makeToneRole(seed.primary, mode)
  const accent = makeToneRole(seed.accent, mode)

  return {
    page: role(seed.page, pageSoft, pageMuted, pageMuted, pageSoft, text.primary, border.base, border.disabled, border.divider, border.focusRing),
    card: role(seed.card, cardSoft, cardMuted, controlBase, cardSoft, text.primary, border.base, cardMuted, border.divider, border.focusRing),
    input: role(inputBase, cardSoft, cardMuted, controlBase, cardSoft, text.primary, border.base, cardMuted, border.divider, border.focusRing),
    control: role(controlBase, cardSoft, cardMuted, mix(controlBase, seed.primary, mode === "light" ? 0.12 : 0.1), cardSoft, text.primary, border.base, cardMuted, border.divider, border.focusRing),
    text,
    border,
    primary,
    accent,
    warmAccent: primary,
    coolAccent: accent,
    status: makeStatusRoles(mode),
    overlay: makeOverlayRole(seed.text, mode),
    swatch: makeSwatchRole(primary, accent, seed.primary, seed.accent, mode),
    mediaBadge: makePhotoBadgeRole(seed.text, mode),
    decorSoft: mode === "light" ? mix(seed.primary, seed.card, 0.84) : alpha(seed.primary, 0.18),
    pageGlow: alpha(mode === "light" ? seed.primary : seed.accent, mode === "light" ? 0.15 : 0.14),
    shadows: makeShadows(seed, mode)
  } satisfies SemanticColorScheme
}

const makePalette = <TSeed extends CuratedPaletteSeed>(seed: TSeed): ThemePalette<TSeed["id"]> => ({
  id: seed.id,
  name: seed.name,
  description: seed.description,
  preview: {
    primary: seed.light.primary,
    accent: seed.light.accent,
    glow: alpha(seed.light.primary, 0.16),
    foreground: readableForeground(mix(seed.light.primary, seed.light.accent, 0.5))
  },
  schemes: {
    light: makeScheme(seed.light, "light"),
    dark: makeScheme(seed.dark, "dark")
  }
} satisfies ThemePalette<TSeed["id"]>)

export const themePalettes = paletteSeeds.map((seed) => makePalette(seed)) as readonly ThemePalette<PaletteId>[]

export const defaultPalette = themePalettes[0]

export const getPaletteById = (paletteId: string): ThemePalette<PaletteId> =>
  themePalettes.find((palette) => palette.id === paletteId) ?? defaultPalette

export const hasPalette = (paletteId: string): paletteId is PaletteId =>
  themePalettes.some((palette) => palette.id === paletteId)
