import { computed, ref, watch } from "vue"
import { defineStore } from "pinia"

export type AppTheme = "light" | "dark"
export type ThemeMode = "system" | AppTheme
export type ThemeDensity = "comfortable" | "compact"
export type ThemeFontScale = "normal" | "large"

export interface RomanticPalette {
  id: string
  name: string
  description: string
  primary: string
  primarySoft: string
  primaryPressed: string
  redPerson: string
  bluePerson: string
  heartSoft: string
  bgWarm: string
  cardWarm: string
  borderSoft: string
  glow: string
  darkPrimary: string
  darkBluePerson: string
  darkBg: string
  darkBgSoft: string
  darkCard: string
}

interface SavedThemeState {
  mode: ThemeMode
  paletteId: string
  density: ThemeDensity
  fontScale: ThemeFontScale
}

type WotThemeVars = Record<string, string>

const STORAGE_KEY = "coral-action-theme-v2"

export const romanticPalettes: RomanticPalette[] = [
  {
    id: "warm-red-blue",
    name: "暖白红蓝",
    description: "默认手绘小人配色",
    primary: "#bd5a62",
    primarySoft: "#f9d7d6",
    primaryPressed: "#8f3846",
    redPerson: "#bd5a62",
    bluePerson: "#4f87aa",
    heartSoft: "#f7dce4",
    bgWarm: "#fffaf3",
    cardWarm: "#fffdfb",
    borderSoft: "rgba(68, 42, 48, 0.14)",
    glow: "rgba(189, 90, 98, 0.16)",
    darkPrimary: "#df7b84",
    darkBluePerson: "#86b8d6",
    darkBg: "#101827",
    darkBgSoft: "#1b2536",
    darkCard: "#202a3a"
  },
  {
    id: "soft-pink-blue",
    name: "软粉蓝",
    description: "更轻的粉蓝记忆感",
    primary: "#c96f86",
    primarySoft: "#f7dce4",
    primaryPressed: "#9b435d",
    redPerson: "#c96f86",
    bluePerson: "#6da1c2",
    heartSoft: "#fff3f6",
    bgWarm: "#fff8f6",
    cardWarm: "#fffefe",
    borderSoft: "rgba(77, 48, 59, 0.13)",
    glow: "rgba(201, 111, 134, 0.15)",
    darkPrimary: "#e9a0b3",
    darkBluePerson: "#9ac6dd",
    darkBg: "#131722",
    darkBgSoft: "#222634",
    darkCard: "#2a2f3d"
  },
  {
    id: "night-red-blue",
    name: "夜航红蓝",
    description: "深色友好的红蓝系统",
    primary: "#a9505f",
    primarySoft: "#f1ced3",
    primaryPressed: "#7f3242",
    redPerson: "#a9505f",
    bluePerson: "#3f7897",
    heartSoft: "#ead5dd",
    bgWarm: "#fbf5ee",
    cardWarm: "#fffdfa",
    borderSoft: "rgba(36, 50, 71, 0.16)",
    glow: "rgba(63, 120, 151, 0.14)",
    darkPrimary: "#e28a95",
    darkBluePerson: "#7fb2cf",
    darkBg: "#0f1726",
    darkBgSoft: "#18243a",
    darkCard: "#212d43"
  }
]

const defaultPalette = romanticPalettes[0]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "system" || value === "light" || value === "dark"

const isThemeDensity = (value: unknown): value is ThemeDensity =>
  value === "comfortable" || value === "compact"

const isThemeFontScale = (value: unknown): value is ThemeFontScale =>
  value === "normal" || value === "large"

const readSystemTheme = (): AppTheme => {
  const info = uni.getSystemInfoSync()
  const theme = isRecord(info) ? info.theme : undefined
  return theme === "dark" ? "dark" : "light"
}

const readSavedThemeState = (): SavedThemeState | null => {
  const raw = uni.getStorageSync(STORAGE_KEY) as unknown
  if (!isRecord(raw)) {
    return null
  }

  const mode = raw.mode
  const paletteId = raw.paletteId
  const density = raw.density
  const fontScale = raw.fontScale

  if (
    !isThemeMode(mode) ||
    typeof paletteId !== "string" ||
    !isThemeDensity(density) ||
    !isThemeFontScale(fontScale)
  ) {
    return null
  }

  return {
    mode,
    paletteId,
    density,
    fontScale
  }
}

const makeCssVars = (vars: Record<string, string>): string =>
  Object.entries(vars)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ")

const compactCssVars: Record<string, string> = {
  "--app-page-padding-x": "24rpx",
  "--app-page-padding-y": "24rpx",
  "--app-section-gap": "24rpx",
  "--app-card-padding": "24rpx",
  "--app-card-gap": "20rpx",
  "--app-list-gap": "18rpx",
  "--app-form-gap": "20rpx",
  "--app-control-height-sm": "72rpx",
  "--app-control-height-md": "80rpx",
  "--app-control-height-lg": "88rpx",
  "--app-input-height": "80rpx",
  "--app-image-grid-gap": "12rpx",
  "--app-entry-card-min-height": "156rpx"
}

const largeFontCssVars: Record<string, string> = {
  "--app-font-size-xs": "20rpx",
  "--app-font-size-sm": "22rpx",
  "--app-font-size-md": "24rpx",
  "--app-font-size-base": "26rpx",
  "--app-font-size-body": "28rpx",
  "--app-font-size-lg": "30rpx",
  "--app-font-size-xl": "32rpx",
  "--app-font-size-2xl": "34rpx",
  "--app-font-size-3xl": "36rpx",
  "--app-font-size-4xl": "38rpx",
  "--app-font-size-5xl": "40rpx",
  "--app-font-size-6xl": "44rpx",
  "--app-font-size-7xl": "48rpx",
  "--app-font-size-page-title": "50rpx"
}

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>("system")
  const paletteId = ref(defaultPalette.id)
  const density = ref<ThemeDensity>("comfortable")
  const fontScale = ref<ThemeFontScale>("normal")
  const systemTheme = ref<AppTheme>("light")
  const listenerRegistered = ref(false)

  let themeChangeListener: UniNamespace.OnThemeChangeCallback | null = null

  const selectedPalette = computed<RomanticPalette>(() => {
    return romanticPalettes.find((palette) => palette.id === paletteId.value) ?? defaultPalette
  })

  const resolvedMode = computed<AppTheme>(() => {
    return mode.value === "system" ? systemTheme.value : mode.value
  })

  const effectiveTheme = resolvedMode
  const isDark = computed(() => resolvedMode.value === "dark")

  const appCssVars = computed<Record<string, string>>(() => {
    const palette = selectedPalette.value
    const baseVars = isDark.value
      ? {
          "--app-color-bg-page": palette.darkBg,
          "--app-color-bg-page-soft": palette.darkBgSoft,
          "--app-color-bg-card": palette.darkCard,
          "--app-color-bg-card-elevated": "#263246",
          "--app-color-bg-input": "#182234",
          "--app-color-text-primary": "#f7f0ea",
          "--app-color-text-secondary": "#d9c8c1",
          "--app-color-text-muted": "#ad9ba1",
          "--app-color-text-inverse": "#111827",
          "--app-color-border": "rgba(247, 240, 234, 0.14)",
          "--app-color-border-strong": "rgba(247, 240, 234, 0.24)",
          "--app-color-primary": palette.darkPrimary,
          "--app-color-primary-soft": "rgba(223, 123, 132, 0.2)",
          "--app-color-primary-pressed": "#f0a4aa",
          "--app-color-red-person": palette.darkPrimary,
          "--app-color-blue-person": palette.darkBluePerson,
          "--app-color-danger": "#ee8b93",
          "--app-color-warning": "#deb66b",
          "--app-color-success": "#88bea3",
          "--app-color-heart-soft": "rgba(229, 168, 184, 0.18)",
          "--app-color-accent": palette.darkBluePerson,
          "--app-color-overlay-soft": "rgba(16, 24, 39, 0.42)",
          "--app-color-overlay-strong": "rgba(16, 24, 39, 0.74)",
          "--app-color-danger-border": "rgba(238, 139, 147, 0.28)",
          "--app-color-page-glow": "rgba(223, 123, 132, 0.16)",
          "--app-shadow-card": "0 24rpx 72rpx rgba(0, 0, 0, 0.24)",
          "--app-shadow-floating": "0 28rpx 96rpx rgba(0, 0, 0, 0.34)",
          "--app-shadow-image": "0 12rpx 30rpx rgba(0, 0, 0, 0.2)",
          "--app-shadow-logo": "0 16rpx 42rpx rgba(0, 0, 0, 0.22)"
        }
      : {
          "--app-color-bg-page": palette.bgWarm,
          "--app-color-bg-page-soft": "#f7efe3",
          "--app-color-bg-card": "#ffffff",
          "--app-color-bg-card-elevated": palette.cardWarm,
          "--app-color-bg-input": "#fffefa",
          "--app-color-text-primary": "#2b2024",
          "--app-color-text-secondary": "#58484b",
          "--app-color-text-muted": "#8a7672",
          "--app-color-text-inverse": "#ffffff",
          "--app-color-border": palette.borderSoft,
          "--app-color-border-strong": "rgba(68, 42, 48, 0.22)",
          "--app-color-primary": palette.primary,
          "--app-color-primary-soft": palette.primarySoft,
          "--app-color-primary-pressed": palette.primaryPressed,
          "--app-color-red-person": palette.redPerson,
          "--app-color-blue-person": palette.bluePerson,
          "--app-color-danger": "#9f2f3e",
          "--app-color-warning": "#b7791f",
          "--app-color-success": "#43866a",
          "--app-color-heart-soft": palette.heartSoft,
          "--app-color-accent": palette.bluePerson,
          "--app-color-overlay-soft": "rgba(43, 32, 36, 0.28)",
          "--app-color-overlay-strong": "rgba(43, 32, 36, 0.72)",
          "--app-color-danger-border": "rgba(159, 47, 62, 0.2)",
          "--app-color-page-glow": palette.glow,
          "--app-shadow-card": "0 24rpx 80rpx rgba(85, 44, 50, 0.14)",
          "--app-shadow-floating": "0 28rpx 96rpx rgba(85, 44, 50, 0.18)",
          "--app-shadow-image": "0 12rpx 30rpx rgba(85, 44, 50, 0.1)",
          "--app-shadow-logo": "0 16rpx 42rpx rgba(85, 44, 50, 0.12)"
        }

    return {
      ...baseVars,
      ...(density.value === "compact" ? compactCssVars : {}),
      ...(fontScale.value === "large" ? largeFontCssVars : {})
    }
  })

  const appStyle = computed(() => makeCssVars(appCssVars.value))

  const themeClasses = computed(() => [
    `app-theme--${resolvedMode.value}`,
    `app-density--${density.value}`,
    `app-font-scale--${fontScale.value}`
  ])

  const wotTheme = computed<AppTheme>(() => resolvedMode.value)

  const wotThemeVars = computed<WotThemeVars>(() => {
    const vars = appCssVars.value
    const text = vars["--app-color-text-primary"]
    const textSecondary = vars["--app-color-text-secondary"]
    const border = vars["--app-color-border"]
    const bg = vars["--app-color-bg-page"]
    const card = vars["--app-color-bg-card"]
    const primary = vars["--app-color-primary"]
    const danger = vars["--app-color-danger"]
    const warning = vars["--app-color-warning"]
    const success = vars["--app-color-success"]

    return {
      colorTheme: primary,
      colorSuccess: success,
      colorWarning: warning,
      colorDanger: danger,
      colorBlue: vars["--app-color-blue-person"],
      colorWhite: "#ffffff",
      colorBlack: "#000000",
      colorTitle: text,
      colorContent: text,
      colorSecondary: textSecondary,
      colorAid: vars["--app-color-text-muted"],
      colorTip: vars["--app-color-text-muted"],
      colorBorder: border,
      colorBorderLight: border,
      colorBg: bg,
      darkBackground: vars["--app-color-bg-page"],
      darkBackground2: card,
      darkBackground3: vars["--app-color-bg-card-elevated"],
      darkColor: text,
      darkColor2: textSecondary,
      darkColor3: vars["--app-color-text-muted"],
      darkBorderColor: border,
      fsTitle: "32rpx",
      fsContent: "28rpx",
      fsSecondary: "24rpx",
      fsAid: "22rpx",
      buttonLargeHeight: "96rpx",
      buttonLargeRadius: "24rpx",
      buttonMediumRadius: "24rpx",
      buttonSmallRadius: "999rpx",
      buttonPrimaryBgColor: primary,
      buttonPrimaryColor: "#ffffff",
      buttonErrorBgColor: danger,
      buttonPlainBgColor: "transparent"
    }
  })

  const persist = () => {
    const payload: SavedThemeState = {
      mode: mode.value,
      paletteId: paletteId.value,
      density: density.value,
      fontScale: fontScale.value
    }
    uni.setStorageSync(STORAGE_KEY, payload)
  }

  const applyNavigationTheme = () => {
    const vars = appCssVars.value
    uni.setNavigationBarColor({
      frontColor: isDark.value ? "#ffffff" : "#000000",
      backgroundColor: vars["--app-color-bg-page"],
      animation: {
        duration: 220,
        timingFunc: "easeInOut"
      }
    })
  }

  const bindSystemThemeListener = () => {
    if (listenerRegistered.value) {
      return
    }

    themeChangeListener = (result) => {
      systemTheme.value = result.theme === "dark" ? "dark" : "light"
      applyNavigationTheme()
    }
    uni.onThemeChange(themeChangeListener)
    listenerRegistered.value = true
  }

  const disposeSystemThemeListener = () => {
    if (!themeChangeListener) {
      return
    }

    uni.offThemeChange(themeChangeListener)
    themeChangeListener = null
    listenerRegistered.value = false
  }

  const initTheme = () => {
    systemTheme.value = readSystemTheme()
    const saved = readSavedThemeState()
    if (saved) {
      mode.value = saved.mode
      paletteId.value = romanticPalettes.some((palette) => palette.id === saved.paletteId)
        ? saved.paletteId
        : defaultPalette.id
      density.value = saved.density
      fontScale.value = saved.fontScale
    }
    bindSystemThemeListener()
    applyNavigationTheme()
  }

  const setThemeMode = (nextMode: ThemeMode) => {
    mode.value = nextMode
    applyNavigationTheme()
  }

  const setPalette = (nextPaletteId: string) => {
    const exists = romanticPalettes.some((palette) => palette.id === nextPaletteId)
    if (!exists) {
      return
    }
    paletteId.value = nextPaletteId
    applyNavigationTheme()
  }

  const setDensity = (nextDensity: ThemeDensity) => {
    density.value = nextDensity
  }

  const setFontScale = (nextFontScale: ThemeFontScale) => {
    fontScale.value = nextFontScale
  }

  watch([mode, paletteId, density, fontScale], persist)

  return {
    mode,
    paletteId,
    density,
    fontScale,
    systemTheme,
    selectedPalette,
    resolvedMode,
    effectiveTheme,
    isDark,
    appCssVars,
    appStyle,
    themeClasses,
    wotTheme,
    wotThemeVars,
    initTheme,
    bindSystemThemeListener,
    disposeSystemThemeListener,
    applyNavigationTheme,
    setThemeMode,
    setPalette,
    setDensity,
    setFontScale
  }
})
