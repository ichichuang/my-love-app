const TIMELINE_REFRESH_SIGNAL_KEY = "app-timeline-needs-refresh-v1"
const TIMELINE_REFRESH_SIGNAL_TTL_MS = 5 * 60 * 1000

interface TimelineRefreshSignal {
  targetRoute: string
  createdAt: number
}

const normalizeRoute = (route: string): string => route.trim().replace(/^\/+/, "").replace(/[?#].*$/, "")

const removeStoredSignal = (): void => {
  try {
    uni.removeStorageSync(TIMELINE_REFRESH_SIGNAL_KEY)
  } catch {
    // Signal persistence is best-effort and must not block navigation.
  }
}

const isSignal = (value: unknown): value is TimelineRefreshSignal => {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const signal = value as Partial<TimelineRefreshSignal>
  return (
    typeof signal.targetRoute === "string" &&
    signal.targetRoute.length > 0 &&
    typeof signal.createdAt === "number" &&
    Number.isFinite(signal.createdAt)
  )
}

export const setTimelineNeedsRefresh = (targetRoute: string): void => {
  const normalizedRoute = normalizeRoute(targetRoute)
  if (!normalizedRoute) {
    return
  }

  const signal: TimelineRefreshSignal = {
    targetRoute: normalizedRoute,
    createdAt: Date.now()
  }

  try {
    uni.setStorageSync(TIMELINE_REFRESH_SIGNAL_KEY, signal)
  } catch {
    removeStoredSignal()
  }
}

export const consumeTimelineNeedsRefresh = (targetRoute: string): boolean => {
  const normalizedRoute = normalizeRoute(targetRoute)
  if (!normalizedRoute) {
    return false
  }

  try {
    const raw = uni.getStorageSync(TIMELINE_REFRESH_SIGNAL_KEY) as unknown
    if (typeof raw === "undefined" || raw === null || raw === "") {
      return false
    }

    removeStoredSignal()

    if (!isSignal(raw)) {
      return false
    }

    if (Date.now() - raw.createdAt > TIMELINE_REFRESH_SIGNAL_TTL_MS) {
      return false
    }

    return raw.targetRoute === normalizedRoute
  } catch {
    removeStoredSignal()
    return false
  }
}
