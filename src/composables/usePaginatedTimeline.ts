import { type ShallowRef } from "vue"
import { dataCacheKeys, readDataCache, removeDataCache } from "@/services/data-cache"
import { writePaginatedCache } from "@/services/paginated-cache"
import {
  usePaginatedList,
  type PaginatedLoadMoreResult
} from "@/composables/usePaginatedList"
import {
  loadMemoryTimelinePage,
  type EntryRecord,
  type MemoryTimelineCursor
} from "@/services/repositories/entries"

// Payload version matches the "timeline-v3" cache scope in dataCacheKeys.
const TIMELINE_CACHE_VERSION = 3

interface LegacyTimelineCachePayload {
  items: EntryRecord[]
  rawOffset: number
  hasMore: boolean
}

interface LoadMoreResult {
  appendedItems: EntryRecord[]
  appendedCount: number
}

const isLegacyTimelineCachePayload = (value: unknown): value is LegacyTimelineCachePayload => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const payload = value as Partial<LegacyTimelineCachePayload>
  return (
    Array.isArray(payload.items) &&
    typeof payload.rawOffset === "number" &&
    Number.isFinite(payload.rawOffset) &&
    payload.rawOffset >= 0 &&
    typeof payload.hasMore === "boolean"
  )
}

// Pre-v4 caches stored {items, rawOffset, hasMore} without a version field.
// Rewrite them into the shared paginated payload shape so existing installs
// keep their loaded timeline instead of refetching on first launch.
const migrateLegacyTimelineCache = (() => {
  let migrated = false
  return (): void => {
    if (migrated) {
      return
    }

    migrated = true
    const legacy = readDataCache<unknown>(dataCacheKeys.memoryTimelinePage())
    if (!isLegacyTimelineCachePayload(legacy)) {
      return
    }

    writePaginatedCache<EntryRecord, MemoryTimelineCursor>(dataCacheKeys.memoryTimelinePage(), {
      version: TIMELINE_CACHE_VERSION,
      items: legacy.items,
      nextCursor: legacy.hasMore ? { rawOffset: legacy.rawOffset } : undefined,
      hasMore: legacy.hasMore,
      mutationRevision: 0
    })
  }
})()

const invalidateLegacyTimelineCaches = (() => {
  let invalidated = false
  const legacyKeys = [
    "love-cache:v1:unconfigured:main:memory:list",
    "love-cache:v1:unconfigured:main:memory:timeline",
    "love-cache:v1:unconfigured:main:memory:timeline-v2"
  ]
  return (): void => {
    if (invalidated) {
      return
    }

    invalidated = true
    removeDataCache(dataCacheKeys.memoryList())
    for (const key of legacyKeys) {
      removeDataCache(key)
    }
  }
})()

export interface UsePaginatedTimelineResult {
  items: ShallowRef<EntryRecord[]>
  initialLoading: ShallowRef<boolean>
  refreshing: ShallowRef<boolean>
  loadingMore: ShallowRef<boolean>
  hasMore: ShallowRef<boolean>
  loadMoreError: ShallowRef<boolean>
  nextCursor: ShallowRef<MemoryTimelineCursor | undefined>
  errorMessage: ShallowRef<string>
  loadInitial: () => Promise<void>
  refresh: () => Promise<void>
  loadMore: () => Promise<LoadMoreResult>
}

export const usePaginatedTimeline = (): UsePaginatedTimelineResult => {
  migrateLegacyTimelineCache()

  const engine = usePaginatedList<EntryRecord, MemoryTimelineCursor>({
    loadPage: loadMemoryTimelinePage,
    getItemId: (item) => item.id,
    cacheKey: dataCacheKeys.memoryTimelinePage,
    cacheVersion: TIMELINE_CACHE_VERSION,
    fallbackMessages: {
      initial: "读取回忆列表失败，请稍后再试。",
      refresh: "刷新回忆列表失败，请稍后再试。",
      loadMore: "加载更多回忆失败，请稍后再试。"
    },
    debugTag: "timeline"
  })

  invalidateLegacyTimelineCaches()

  const loadMore = async (): Promise<LoadMoreResult> => {
    const result: PaginatedLoadMoreResult<EntryRecord> = await engine.loadMore()
    return {
      appendedItems: result.appendedItems,
      appendedCount: result.appendedCount
    }
  }

  return {
    items: engine.items,
    initialLoading: engine.initialLoading,
    refreshing: engine.refreshing,
    loadingMore: engine.loadingMore,
    hasMore: engine.hasMore,
    loadMoreError: engine.loadMoreError,
    nextCursor: engine.nextCursor,
    errorMessage: engine.errorMessage,
    loadInitial: engine.loadInitial,
    refresh: engine.refresh,
    loadMore
  }
}
