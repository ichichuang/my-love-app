import { nextTick, shallowRef, type ShallowRef } from "vue"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import {
  dataCacheKeys,
  readDataCache,
  removeDataCache,
  writeDataCache
} from "@/services/data-cache"
import {
  loadMemoryTimelinePage,
  type EntryRecord,
  type MemoryTimelineCursor,
  type MemoryTimelinePage
} from "@/services/repositories/entries"

interface MemoryTimelineCachePayload {
  items: EntryRecord[]
  rawOffset: number
  hasMore: boolean
}

interface LoadMoreResult {
  appendedItems: EntryRecord[]
  appendedCount: number
}

const isTimelineCachePayload = (value: unknown): value is MemoryTimelineCachePayload => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const payload = value as Partial<MemoryTimelineCachePayload>
  return (
    Array.isArray(payload.items) &&
    typeof payload.rawOffset === "number" &&
    Number.isFinite(payload.rawOffset) &&
    payload.rawOffset >= 0 &&
    typeof payload.hasMore === "boolean"
  )
}

const readTimelineCache = (): MemoryTimelineCachePayload | null => {
  const payload = readDataCache<MemoryTimelineCachePayload>(dataCacheKeys.memoryTimelinePage())
  if (!payload || !isTimelineCachePayload(payload)) {
    return null
  }

  return payload
}

const writeTimelineCache = (items: EntryRecord[], cursor: MemoryTimelineCursor | undefined, hasMore: boolean): void => {
  writeDataCache<MemoryTimelineCachePayload>(dataCacheKeys.memoryTimelinePage(), {
    items,
    rawOffset: cursor?.rawOffset ?? items.length,
    hasMore
  })
}

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
  const items = shallowRef<EntryRecord[]>([])
  const initialLoading = shallowRef(false)
  const refreshing = shallowRef(false)
  const loadingMore = shallowRef(false)
  const hasMore = shallowRef(true)
  const loadMoreError = shallowRef(false)
  const nextCursor = shallowRef<MemoryTimelineCursor | undefined>(undefined)
  const errorMessage = shallowRef("")

  const applyPage = (page: MemoryTimelinePage, append: boolean): EntryRecord[] => {
    if (append) {
      const existingIds = new Set(items.value.map((item) => item.id))
      const appendedItems = page.items.filter((item) => !existingIds.has(item.id))

      if (appendedItems.length > 0) {
        items.value = [...items.value, ...appendedItems]
      }

      return appendedItems
    }

    const seenIds = new Set<string>()
    items.value = page.items.filter((item) => {
      if (seenIds.has(item.id)) {
        return false
      }

      seenIds.add(item.id)
      return true
    })

    return items.value
  }

  const updateStateFromPage = (page: MemoryTimelinePage, appendedItems: EntryRecord[]): void => {
    nextCursor.value = page.nextCursor
    hasMore.value = page.hasMore
    loadMoreError.value = false
    errorMessage.value = ""
    writeTimelineCache(items.value, page.nextCursor, page.hasMore)
    invalidateLegacyTimelineCaches()
  }

  const handlePageError = (error: unknown, fallbackMessage: string, isLoadMore: boolean): void => {
    if (isLoadMore) {
      loadMoreError.value = true
    } else {
      errorMessage.value = getFriendlyErrorMessage(error) || fallbackMessage
    }
  }

  const loadInitial = async (): Promise<void> => {
    if (initialLoading.value || refreshing.value) {
      return
    }

    const cached = readTimelineCache()
    if (cached) {
      items.value = cached.items
      nextCursor.value = cached.hasMore ? { rawOffset: cached.rawOffset } : undefined
      hasMore.value = cached.hasMore
      loadMoreError.value = false
      errorMessage.value = ""
      return
    }

    initialLoading.value = true
    errorMessage.value = ""
    loadMoreError.value = false

    try {
      await nextTick()
      const page = await loadMemoryTimelinePage()
      applyPage(page, false)
      updateStateFromPage(page, items.value)
    } catch (error) {
      handlePageError(error, "读取回忆列表失败，请稍后再试。", false)
    } finally {
      initialLoading.value = false
    }
  }

  const refresh = async (): Promise<void> => {
    if (refreshing.value) {
      return
    }

    refreshing.value = true
    errorMessage.value = ""
    loadMoreError.value = false

    try {
      await nextTick()
      const page = await loadMemoryTimelinePage()
      applyPage(page, false)
      updateStateFromPage(page, items.value)
    } catch (error) {
      handlePageError(error, "刷新回忆列表失败，请稍后再试。", false)
    } finally {
      refreshing.value = false
    }
  }

  const yieldToRenderer = (): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, 0)
    })

  const loadMore = async (): Promise<LoadMoreResult> => {
    if (initialLoading.value || refreshing.value || loadingMore.value || !hasMore.value) {
      return {
        appendedItems: [],
        appendedCount: 0
      }
    }

    loadingMore.value = true
    loadMoreError.value = false

    if (import.meta.env.DEV) {
      console.info(`[timeline-load-more] loadingMore=true`)
    }

    try {
      await nextTick()
      await yieldToRenderer()
      const page = await loadMemoryTimelinePage(nextCursor.value)
      const appendedItems = applyPage(page, true)
      updateStateFromPage(page, appendedItems)

      if (import.meta.env.DEV) {
        console.info(
          `[timeline-load-more] appended=${appendedItems.length} total=${items.value.length} hasMore=${hasMore.value} nextRawOffset=${nextCursor.value?.rawOffset ?? -1}`
        )
      }

      return {
        appendedItems,
        appendedCount: appendedItems.length
      }
    } catch (error) {
      handlePageError(error, "加载更多回忆失败，请稍后再试。", true)

      return {
        appendedItems: [],
        appendedCount: 0
      }
    } finally {
      loadingMore.value = false
    }
  }

  // Cold launch: load the first page immediately.
  void loadInitial()

  return {
    items,
    initialLoading,
    refreshing,
    loadingMore,
    hasMore,
    loadMoreError,
    nextCursor,
    errorMessage,
    loadInitial,
    refresh,
    loadMore
  }
}
