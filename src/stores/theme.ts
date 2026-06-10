import { computed, ref, watch } from "vue"
import { defineStore } from "pinia"

export type AppTheme = "light" | "dark"
export type ThemeMode = "system" | AppTheme

export interface RomanticPalette {
  id: string
  name: string
  primary: string
  accent: string
  glow: string
}

interface SavedThemeState {
  mode: ThemeMode
  paletteId: string
  customPrimary: string
}

type WotThemeVars = Record<string, string>

const STORAGE_KEY = "coral-action-theme-v1"

export const romanticPalettes: RomanticPalette[] = [
  {
    id: "rose-gold",
    name: "玫瑰金",
    primary: "#b84f62",
    accent: "#c49a5a",
    glow: "rgba(184, 79, 98, 0.18)"
  },
  {
    id: "camellia",
    name: "山茶",
    primary: "#c0574f",
    accent: "#5f8d78",
    glow: "rgba(192, 87, 79, 0.18)"
  },
  {
    id: "velvet",
    name: "绒红",
    primary: "#a53f54",
    accent: "#d0b06a",
    glow: "rgba(165, 63, 84, 0.22)"
  },
  {
    id: "pearl",
    name: "暖紫",
    primary: "#8f4d5f",
    accent: "#3f7f83",
    glow: "rgba(143, 77, 95, 0.16)"
  }
]

const defaultPalette = romanticPalettes[0]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "system" || value === "light" || value === "dark"

export const isHexColor = (value: string): boolean => /^#[0-9a-fA-F]{6}$/.test(value)

export const normalizeHexColor = (value: string): string => {
  const trimmed = value.trim()
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed}`
  }

  return trimmed
}

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
  const customPrimary = raw.customPrimary

  if (!isThemeMode(mode) || typeof paletteId !== "string" || typeof customPrimary !== "string") {
    return null
  }

  return {
    mode,
    paletteId,
    customPrimary
  }
}

const makeCssVars = (vars: Record<string, string>): string =>
  Object.entries(vars)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ")

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>("system")
  const paletteId = ref(defaultPalette.id)
  const customPrimary = ref("")
  const systemTheme = ref<AppTheme>("light")
  const listenerRegistered = ref(false)

  let themeChangeListener: UniNamespace.OnThemeChangeCallback | null = null

  const selectedPalette = computed<RomanticPalette>(() => {
    return romanticPalettes.find((palette) => palette.id === paletteId.value) ?? defaultPalette
  })

  const activePalette = computed<RomanticPalette>(() => {
    const normalized = normalizeHexColor(customPrimary.value)
    if (!isHexColor(normalized)) {
      return selectedPalette.value
    }

    return {
      ...selectedPalette.value,
      id: "custom",
      name: "自定义",
      primary: normalized,
      glow: `${normalized}2e`
    }
  })

  const effectiveTheme = computed<AppTheme>(() => {
    return mode.value === "system" ? systemTheme.value : mode.value
  })

  const isDark = computed(() => effectiveTheme.value === "dark")

  const themeTokens = computed(() => {
    const palette = activePalette.value

    if (isDark.value) {
      return {
        primary: palette.primary,
        accent: palette.accent,
        bg: "#151012",
        bgDeep: "#0d0a0b",
        surface: "#21191c",
        surfaceStrong: "#2a2024",
        field: "#181214",
        text: "#f7efec",
        textSoft: "#c9b7b4",
        border: "rgba(255, 236, 229, 0.16)",
        glow: "rgba(184, 79, 98, 0.22)",
        shadow: "0 28rpx 96rpx rgba(0, 0, 0, 0.34)"
      }
    }

    return {
      primary: palette.primary,
      accent: palette.accent,
      bg: "#fff7f4",
      bgDeep: "#f4e3dc",
      surface: "#ffffff",
      surfaceStrong: "#f6ebe5",
      field: "#fffdfb",
      text: "#2b2024",
      textSoft: "#766268",
      border: "rgba(68, 42, 48, 0.14)",
      glow: palette.glow,
      shadow: "0 24rpx 80rpx rgba(85, 44, 50, 0.14)"
    }
  })

  const appStyle = computed(() => {
    const tokens = themeTokens.value
    return makeCssVars({
      "--app-primary": tokens.primary,
      "--app-accent": tokens.accent,
      "--app-bg": tokens.bg,
      "--app-bg-deep": tokens.bgDeep,
      "--app-surface": tokens.surface,
      "--app-surface-strong": tokens.surfaceStrong,
      "--app-field": tokens.field,
      "--app-text": tokens.text,
      "--app-text-soft": tokens.textSoft,
      "--app-border": tokens.border,
      "--app-glow": tokens.glow,
      "--app-shadow": tokens.shadow
    })
  })

  const wotTheme = computed<AppTheme>(() => effectiveTheme.value)

  const wotThemeVars = computed<WotThemeVars>(() => {
    const tokens = themeTokens.value
    return {
      colorTheme: tokens.primary,
      colorTitle: tokens.text,
      colorContent: tokens.text,
      colorSecondary: tokens.textSoft,
      colorAid: tokens.textSoft,
      colorTip: tokens.textSoft,
      colorBorder: tokens.border,
      colorBg: tokens.bg,
      colorWhite: "#ffffff",
      colorBlack: "#000000",
      darkBackground: "#151012",
      darkBackground2: "#21191c",
      darkColor: "#f7efec",
      darkColor2: "#c9b7b4",
      darkBorderColor: "rgba(255, 236, 229, 0.16)"
    }
  })

  const persist = () => {
    const payload: SavedThemeState = {
      mode: mode.value,
      paletteId: paletteId.value,
      customPrimary: customPrimary.value
    }
    uni.setStorageSync(STORAGE_KEY, payload)
  }

  const applyNavigationTheme = () => {
    const tokens = themeTokens.value
    uni.setNavigationBarColor({
      frontColor: isDark.value ? "#ffffff" : "#000000",
      backgroundColor: tokens.bg,
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
      systemTheme.value = result.theme
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
      paletteId.value = saved.paletteId
      customPrimary.value = saved.customPrimary
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

  const setCustomPrimary = (hex: string) => {
    const normalized = normalizeHexColor(hex)
    customPrimary.value = isHexColor(normalized) ? normalized : hex
    applyNavigationTheme()
  }

  const clearCustomPrimary = () => {
    customPrimary.value = ""
    applyNavigationTheme()
  }

  watch([mode, paletteId, customPrimary], persist)

  return {
    mode,
    paletteId,
    customPrimary,
    systemTheme,
    selectedPalette,
    activePalette,
    effectiveTheme,
    isDark,
    appStyle,
    wotTheme,
    wotThemeVars,
    initTheme,
    bindSystemThemeListener,
    disposeSystemThemeListener,
    applyNavigationTheme,
    setThemeMode,
    setPalette,
    setCustomPrimary,
    clearCustomPrimary
  }
})
