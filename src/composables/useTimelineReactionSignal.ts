const TIMELINE_REACTION_CHANGED_KEY = "app-timeline-reaction-changed-v1"
const TIMELINE_REACTION_CHANGED_TTL_MS = 5 * 60 * 1000

interface TimelineReactionChangedSignal {
  entryId: string
  changedAt: number
}

const removeStoredSignal = (): void => {
  try {
    uni.removeStorageSync(TIMELINE_REACTION_CHANGED_KEY)
  } catch {
    // Signal persistence is best-effort and must not block navigation.
  }
}

const isSignal = (value: unknown): value is TimelineReactionChangedSignal => {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const signal = value as Partial<TimelineReactionChangedSignal>
  return (
    typeof signal.entryId === "string" &&
    signal.entryId.length > 0 &&
    typeof signal.changedAt === "number" &&
    Number.isFinite(signal.changedAt)
  )
}

export const setTimelineReactionChanged = (entryId: string): void => {
  if (!entryId) {
    return
  }

  const signal: TimelineReactionChangedSignal = {
    entryId,
    changedAt: Date.now()
  }

  try {
    uni.setStorageSync(TIMELINE_REACTION_CHANGED_KEY, signal)
  } catch {
    removeStoredSignal()
  }
}

export const consumeTimelineReactionChanged = (): string | null => {
  try {
    const raw = uni.getStorageSync(TIMELINE_REACTION_CHANGED_KEY) as unknown
    if (typeof raw === "undefined" || raw === null || raw === "") {
      return null
    }

    removeStoredSignal()

    if (!isSignal(raw)) {
      return null
    }

    if (Date.now() - raw.changedAt > TIMELINE_REACTION_CHANGED_TTL_MS) {
      return null
    }

    return raw.entryId
  } catch {
    removeStoredSignal()
    return null
  }
}
