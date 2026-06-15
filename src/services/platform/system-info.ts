import type { AppTheme } from "@/design-system/types"

interface AppBaseInfoSnapshot {
  theme?: string
}

interface WindowInfoSnapshot {
  windowWidth?: number
  windowHeight?: number
  screenHeight?: number
  safeAreaInsets?: {
    bottom?: number
  }
  safeArea?: {
    bottom?: number
  }
}

interface PlatformSystemApi {
  getAppBaseInfo?: () => AppBaseInfoSnapshot
  getWindowInfo?: () => WindowInfoSnapshot
}

export interface PlatformViewportMetrics {
  windowWidth: number
  windowHeight: number
  screenHeight: number
  safeBottom: number
}

type WxRuntimeHost = typeof globalThis & {
  wx?: PlatformSystemApi
}

const defaultWindowWidth = 375
const defaultWindowHeight = 667

const finiteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const readSafely = <T>(reader: (() => T | null | undefined) | undefined): T | null => {
  if (!reader) {
    return null
  }

  try {
    return reader() ?? null
  } catch {
    return null
  }
}

const readWxSystemApi = (): PlatformSystemApi | undefined => (globalThis as WxRuntimeHost).wx

const readUniSystemApi = (): PlatformSystemApi => uni as unknown as PlatformSystemApi

const normalizeTheme = (theme: unknown): AppTheme | null => {
  if (theme === "dark") {
    return "dark"
  }

  if (theme === "light") {
    return "light"
  }

  return null
}

export const readPlatformSystemTheme = (): AppTheme => {
  const wxApi = readWxSystemApi()
  const wxTheme = normalizeTheme(readSafely(() => wxApi?.getAppBaseInfo?.())?.theme)
  if (wxTheme) {
    return wxTheme
  }

  const uniApi = readUniSystemApi()
  const uniTheme = normalizeTheme(readSafely(() => uniApi.getAppBaseInfo?.())?.theme)
  return uniTheme ?? "light"
}

export const readPlatformViewportMetrics = (): PlatformViewportMetrics => {
  const wxApi = readWxSystemApi()
  const uniApi = readUniSystemApi()
  const info: WindowInfoSnapshot = readSafely(() => wxApi?.getWindowInfo?.()) ?? readSafely(() => uniApi.getWindowInfo?.()) ?? {}

  const windowWidth = finiteNumber(info.windowWidth, defaultWindowWidth)
  const windowHeight = finiteNumber(info.windowHeight, defaultWindowHeight)
  const screenHeight = finiteNumber(info.screenHeight, windowHeight)
  const safeAreaInsetBottom = finiteNumber(info.safeAreaInsets?.bottom, Number.NaN)
  const safeAreaBottom = finiteNumber(info.safeArea?.bottom, screenHeight)
  const safeBottom = Number.isFinite(safeAreaInsetBottom)
    ? safeAreaInsetBottom
    : Math.max(0, screenHeight - safeAreaBottom)

  return {
    windowWidth,
    windowHeight,
    screenHeight,
    safeBottom
  }
}
