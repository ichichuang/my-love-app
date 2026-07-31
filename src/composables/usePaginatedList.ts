import { nextTick, shallowRef, type ShallowRef } from "vue"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { readPaginatedCache, writePaginatedCache } from "@/services/paginated-cache"

export interface PaginatedPage<TItem, TCursor> {
  items: TItem[]
  nextCursor: TCursor | undefined
  hasMore: boolean
}

export interface PaginatedLoadMoreResult<TItem> {
  appendedItems: TItem[]
  appendedCount: number
}

interface UsePaginatedListFallbackMessages {
  initial: string
  refresh: string
  loadMore: string
}

interface UsePaginatedListOptions<TItem, TCursor> {
  loadPage: (cursor: TCursor | undefined) => Promise<PaginatedPage<TItem, TCursor>>
  getItemId: (item: TItem) => string
  cacheKey: () => string
  cacheVersion: number
  fallbackMessages: UsePaginatedListFallbackMessages
  compareItems?: (left: TItem, right: TItem) => number
  // Fetch-order comparison between two cursors: negative when `left` is fetched
  // before `right`. Required for background revalidation.
  compareCursors?: (left: TCursor, right: TCursor) => number
  revalidateOnCacheRestore?: boolean
  debugTag?: string
}

export interface UsePaginatedListResult<TItem, TCursor> {
  items: ShallowRef<TItem[]>
  initialLoading: ShallowRef<boolean>
  refreshing: ShallowRef<boolean>
  loadingMore: ShallowRef<boolean>
  revalidating: ShallowRef<boolean>
  hasMore: ShallowRef<boolean>
  loadMoreError: ShallowRef<boolean>
  nextCursor: ShallowRef<TCursor | undefined>
  errorMessage: ShallowRef<string>
  loadInitial: () => Promise<void>
  refresh: () => Promise<void>
  loadMore: () => Promise<PaginatedLoadMoreResult<TItem>>
  retryLoadMore: () => Promise<PaginatedLoadMoreResult<TItem>>
  syncFromCache: () => Promise<boolean>
  prependItem: (item: TItem) => void
  replaceItem: (item: TItem) => void
  removeItem: (id: string) => void
}

// Safety bound for the sequential background revalidation walk.
const REVALIDATE_MAX_PAGES = 50

export const usePaginatedList = <TItem, TCursor>(
  options: UsePaginatedListOptions<TItem, TCursor>
): UsePaginatedListResult<TItem, TCursor> => {
  const items = shallowRef<TItem[]>([])
  const initialLoading = shallowRef(false)
  const refreshing = shallowRef(false)
  const loadingMore = shallowRef(false)
  const revalidating = shallowRef(false)
  const hasMore = shallowRef(true)
  const loadMoreError = shallowRef(false)
  const nextCursor = shallowRef<TCursor | undefined>(undefined)
  const errorMessage = shallowRef("")

  // Monotonic generation: loadInitial/refresh/syncFromCache bump it, every async
  // operation captures it and discards its response when it has moved on.
  let generation = 0

  const sortItems = (list: TItem[]): TItem[] =>
    options.compareItems ? [...list].sort(options.compareItems) : list

  const dedupeItems = (list: TItem[]): TItem[] => {
    const seenIds = new Set<string>()
    return list.filter((item) => {
      const id = options.getItemId(item)
      if (seenIds.has(id)) {
        return false
      }

      seenIds.add(id)
      return true
    })
  }

  const persistCache = (): void => {
    writePaginatedCache<TItem, TCursor>(options.cacheKey(), {
      version: options.cacheVersion,
      items: items.value,
      nextCursor: nextCursor.value,
      hasMore: hasMore.value
    })
  }

  const restoreFromPayload = (payload: {
    items: TItem[]
    nextCursor: TCursor | undefined
    hasMore: boolean
  }): void => {
    items.value = sortItems(dedupeItems(payload.items))
    nextCursor.value = payload.hasMore ? payload.nextCursor : undefined
    hasMore.value = payload.hasMore
    loadMoreError.value = false
    errorMessage.value = ""
  }

  const applyPage = (page: PaginatedPage<TItem, TCursor>, append: boolean): TItem[] => {
    if (append) {
      const existingIds = new Set(items.value.map((item) => options.getItemId(item)))
      const appendedItems = page.items.filter((item) => !existingIds.has(options.getItemId(item)))

      if (appendedItems.length > 0) {
        items.value = sortItems([...items.value, ...appendedItems])
      }

      return appendedItems
    }

    items.value = sortItems(dedupeItems(page.items))

    return items.value
  }

  const updateStateFromPage = (page: PaginatedPage<TItem, TCursor>): void => {
    nextCursor.value = page.nextCursor
    hasMore.value = page.hasMore
    loadMoreError.value = false
    errorMessage.value = ""
    persistCache()
  }

  const handlePageError = (error: unknown, fallbackMessage: string, isLoadMore: boolean): void => {
    if (isLoadMore) {
      loadMoreError.value = true
    } else {
      errorMessage.value = getFriendlyErrorMessage(error) || fallbackMessage
    }
  }

  // Silent background revalidation after a cache restore. Walks from the top of
  // the collection until it reaches the previously restored cursor boundary (or
  // the data is exhausted), so records added on another device are picked up
  // without losing the previously loaded depth.
  const revalidateRestoredDepth = async (boundary: TCursor | undefined): Promise<void> => {
    if (revalidating.value) {
      return
    }

    const capturedGeneration = generation
    revalidating.value = true

    try {
      const collected: TItem[] = []
      let cursor: TCursor | undefined
      let exhausted = false

      for (let pageIndex = 0; pageIndex < REVALIDATE_MAX_PAGES; pageIndex += 1) {
        if (capturedGeneration !== generation) {
          return
        }

        const page = await options.loadPage(cursor)
        collected.push(...page.items)
        cursor = page.nextCursor

        if (!page.hasMore || typeof page.nextCursor === "undefined") {
          exhausted = true
          break
        }

        if (
          typeof boundary !== "undefined" &&
          options.compareCursors &&
          options.compareCursors(page.nextCursor, boundary) >= 0
        ) {
          // Reached the previously restored depth; items beyond the old boundary
          // remain loadable through this continuation cursor.
          break
        }
      }

      if (capturedGeneration !== generation) {
        return
      }

      items.value = sortItems(dedupeItems(collected))
      nextCursor.value = exhausted ? undefined : cursor
      hasMore.value = !exhausted
      loadMoreError.value = false
      errorMessage.value = ""
      persistCache()
    } catch {
      // Revalidation is best-effort; the restored cache content stays on screen.
    } finally {
      revalidating.value = false
    }
  }

  const loadInitial = async (): Promise<void> => {
    if (initialLoading.value || refreshing.value) {
      return
    }

    generation += 1
    const capturedGeneration = generation

    const cached = readPaginatedCache<TItem, TCursor>(options.cacheKey(), options.cacheVersion)
    if (cached) {
      restoreFromPayload(cached)
      if (options.revalidateOnCacheRestore && options.compareCursors) {
        void revalidateRestoredDepth(cached.hasMore ? cached.nextCursor : undefined)
      }
      return
    }

    initialLoading.value = true
    errorMessage.value = ""
    loadMoreError.value = false

    try {
      await nextTick()
      const page = await options.loadPage(undefined)

      if (capturedGeneration !== generation) {
        return
      }

      applyPage(page, false)
      updateStateFromPage(page)
    } catch (error) {
      if (capturedGeneration !== generation) {
        return
      }

      handlePageError(error, options.fallbackMessages.initial, false)
    } finally {
      initialLoading.value = false
    }
  }

  const refresh = async (): Promise<void> => {
    if (refreshing.value || initialLoading.value) {
      return
    }

    generation += 1
    const capturedGeneration = generation
    refreshing.value = true
    errorMessage.value = ""
    loadMoreError.value = false

    try {
      await nextTick()
      const page = await options.loadPage(undefined)

      if (capturedGeneration !== generation) {
        return
      }

      applyPage(page, false)
      updateStateFromPage(page)
    } catch (error) {
      if (capturedGeneration !== generation) {
        return
      }

      handlePageError(error, options.fallbackMessages.refresh, false)
    } finally {
      refreshing.value = false
    }
  }

  const yieldToRenderer = (): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, 0)
    })

  const loadMore = async (): Promise<PaginatedLoadMoreResult<TItem>> => {
    if (initialLoading.value || refreshing.value || revalidating.value || loadingMore.value || !hasMore.value) {
      return {
        appendedItems: [],
        appendedCount: 0
      }
    }

    const capturedGeneration = generation
    loadingMore.value = true
    loadMoreError.value = false

    if (import.meta.env.DEV && options.debugTag) {
      console.info(`[${options.debugTag}-load-more] loadingMore=true`)
    }

    try {
      await nextTick()
      await yieldToRenderer()
      const page = await options.loadPage(nextCursor.value)

      if (capturedGeneration !== generation) {
        return {
          appendedItems: [],
          appendedCount: 0
        }
      }

      const appendedItems = applyPage(page, true)
      updateStateFromPage(page)

      if (import.meta.env.DEV && options.debugTag) {
        console.info(
          `[${options.debugTag}-load-more] appended=${appendedItems.length} total=${items.value.length} hasMore=${hasMore.value} nextCursor=${JSON.stringify(nextCursor.value ?? null)}`
        )
      }

      return {
        appendedItems,
        appendedCount: appendedItems.length
      }
    } catch (error) {
      if (capturedGeneration !== generation) {
        return {
          appendedItems: [],
          appendedCount: 0
        }
      }

      handlePageError(error, options.fallbackMessages.loadMore, true)

      return {
        appendedItems: [],
        appendedCount: 0
      }
    } finally {
      loadingMore.value = false
    }
  }

  const retryLoadMore = (): Promise<PaginatedLoadMoreResult<TItem>> => loadMore()

  // Applies repository write-through cache content (create/update/delete from
  // edit pages) without a network request, preserving the loaded depth.
  const syncFromCache = async (): Promise<boolean> => {
    generation += 1

    const cached = readPaginatedCache<TItem, TCursor>(options.cacheKey(), options.cacheVersion)
    if (!cached) {
      await refresh()
      return false
    }

    restoreFromPayload(cached)
    persistCache()
    return true
  }

  const prependItem = (item: TItem): void => {
    const itemId = options.getItemId(item)
    items.value = sortItems([
      item,
      ...items.value.filter((existingItem) => options.getItemId(existingItem) !== itemId)
    ])
    persistCache()
  }

  const replaceItem = (item: TItem): void => {
    const itemId = options.getItemId(item)
    const existingIndex = items.value.findIndex((existingItem) => options.getItemId(existingItem) === itemId)
    if (existingIndex < 0) {
      return
    }

    items.value = sortItems(
      items.value.map((existingItem) => (options.getItemId(existingItem) === itemId ? item : existingItem))
    )
    persistCache()
  }

  const removeItem = (id: string): void => {
    const removed = items.value.find((existingItem) => options.getItemId(existingItem) === id)
    if (!removed) {
      return
    }

    items.value = items.value.filter((existingItem) => options.getItemId(existingItem) !== id)
    persistCache()
  }

  // Cold launch: load the first page immediately.
  void loadInitial()

  return {
    items,
    initialLoading,
    refreshing,
    loadingMore,
    revalidating,
    hasMore,
    loadMoreError,
    nextCursor,
    errorMessage,
    loadInitial,
    refresh,
    loadMore,
    retryLoadMore,
    syncFromCache,
    prependItem,
    replaceItem,
    removeItem
  }
}
