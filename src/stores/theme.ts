import { computed, ref, watch } from "vue"
import { defineStore } from "pinia"
import { makeCssVars } from "@/design-system/css-vars"
import { defaultPalette, getPaletteById, hasPalette, romanticPalettes } from "@/design-system/palettes"
import type { PaletteId } from "@/design-system/palettes"
import { resolveSizeTokens } from "@/design-system/size-resolver"
import {
  resolveAppCssVars,
  resolveNavigationTheme,
  resolveThemeClasses,
  resolveThemeMode,
  resolveThemeProviderKey
} from "@/design-system/theme-resolver"
import type { AppCssVars, AppTheme, RomanticPalette, ThemeDensity, ThemeFontScale, ThemeMode } from "@/design-system/types"
import { resolveWotThemeVars } from "@/design-system/wot-theme"

export type { PaletteId }
export type { AppTheme, RomanticPalette, ThemeDensity, ThemeFontScale, ThemeMode } from "@/design-system/types"
export { romanticPalettes } from "@/design-system/palettes"

interface SavedThemeState {
  mode: ThemeMode
  paletteId: string
  density: ThemeDensity
  fontScale: ThemeFontScale
}

const STORAGE_KEY = "coral-action-theme-v2"

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

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>("system")
  const paletteId = ref<PaletteId>(defaultPalette.id)
  const density = ref<ThemeDensity>("comfortable")
  const fontScale = ref<ThemeFontScale>("normal")
  const systemTheme = ref<AppTheme>("light")
  const listenerRegistered = ref(false)

  let themeChangeListener: UniNamespace.OnThemeChangeCallback | null = null

  const selectedPalette = computed<RomanticPalette>(() => getPaletteById(paletteId.value))
  const resolvedMode = computed<AppTheme>(() => resolveThemeMode(mode.value, systemTheme.value))
  const effectiveTheme = resolvedMode
  const isDark = computed(() => resolvedMode.value === "dark")
  const sizeTokens = computed(() => resolveSizeTokens(density.value, fontScale.value))

  const appCssVars = computed<AppCssVars>(() =>
    resolveAppCssVars({
      theme: resolvedMode.value,
      palette: selectedPalette.value,
      size: sizeTokens.value
    })
  )

  const appStyle = computed(() => makeCssVars(appCssVars.value))
  const themeClasses = computed(() => resolveThemeClasses(resolvedMode.value, density.value, fontScale.value))
  const providerKey = computed(() => resolveThemeProviderKey(resolvedMode.value, paletteId.value, density.value, fontScale.value))
  const wotTheme = computed<AppTheme>(() => resolvedMode.value)
  const wotThemeVars = computed(() => resolveWotThemeVars(appCssVars.value, sizeTokens.value))
  const navigationTheme = computed(() => resolveNavigationTheme(resolvedMode.value, appCssVars.value))

  const persist = () => {
    const payload: SavedThemeState = {
      mode: mode.value,
      paletteId: paletteId.value,
      density: density.value,
      fontScale: fontScale.value
    }
    uni.setStorageSync(STORAGE_KEY, payload)
  }

  const bindSystemThemeListener = () => {
    if (listenerRegistered.value) {
      return
    }

    themeChangeListener = (result) => {
      systemTheme.value = result.theme === "dark" ? "dark" : "light"
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
      paletteId.value = hasPalette(saved.paletteId) ? saved.paletteId : defaultPalette.id
      density.value = saved.density
      fontScale.value = saved.fontScale
    }
    bindSystemThemeListener()
  }

  const setThemeMode = (nextMode: ThemeMode) => {
    mode.value = nextMode
  }

  const setPalette = (nextPaletteId: string) => {
    if (!hasPalette(nextPaletteId)) {
      return
    }
    paletteId.value = nextPaletteId
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
    providerKey,
    wotTheme,
    wotThemeVars,
    navigationTheme,
    initTheme,
    bindSystemThemeListener,
    disposeSystemThemeListener,
    setThemeMode,
    setPalette,
    setDensity,
    setFontScale
  }
})
