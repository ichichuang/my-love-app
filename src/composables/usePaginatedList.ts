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
  adjustCursorAfterRemove?: (cursor: TCursor, removed: TItem) => TCursor
  debugTag?: string
}

export interface UsePaginatedListResult<TItem, TCursor> {
  items: ShallowRef<TItem[]>
  initialLoading: ShallowRef<boolean>
  refreshing: ShallowRef<boolean>
  loadingMore: ShallowRef<boolean>
  hasMore: ShallowRef<boolean>
  loadMoreError: ShallowRef<boolean>
  nextCursor: ShallowRef<TCursor | undefined>
  errorMessage: ShallowRef<string>
  loadInitial: () => Promise<void>
  refresh: () => Promise<void>
  loadMore: () => Promise<PaginatedLoadMoreResult<TItem>>
  retryLoadMore: () => Promise<PaginatedLoadMoreResult<TItem>>
  prependItem: (item: TItem) => void
  replaceItem: (item: TItem) => void
  removeItem: (id: string) => void
}

export const usePaginatedList = <TItem, TCursor>(
  options: UsePaginatedListOptions<TItem, TCursor>
): UsePaginatedListResult<TItem, TCursor> => {
  const items = shallowRef<TItem[]>([])
  const initialLoading = shallowRef(false)
  const refreshing = shallowRef(false)
  const loadingMore = shallowRef(false)
  const hasMore = shallowRef(true)
  const loadMoreError = shallowRef(false)
  const nextCursor = shallowRef<TCursor | undefined>(undefined)
  const errorMessage = shallowRef("")

  // Monotonic generation: loadInitial/refresh invalidate any in-flight loadMore response.
  let generation = 0

  const sortItems = (list: TItem[]): TItem[] =>
    options.compareItems ? [...list].sort(options.compareItems) : list

  const persistCache = (): void => {
    writePaginatedCache<TItem, TCursor>(options.cacheKey(), {
      version: options.cacheVersion,
      items: items.value,
      nextCursor: nextCursor.value,
      hasMore: hasMore.value
    })
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

    const seenIds = new Set<string>()
    items.value = sortItems(
      page.items.filter((item) => {
        const id = options.getItemId(item)
        if (seenIds.has(id)) {
          return false
        }

        seenIds.add(id)
        return true
      })
    )

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

  const loadInitial = async (): Promise<void> => {
    if (initialLoading.value || refreshing.value) {
      return
    }

    generation += 1

    const cached = readPaginatedCache<TItem, TCursor>(options.cacheKey(), options.cacheVersion)
    if (cached) {
      items.value = cached.items
      nextCursor.value = cached.hasMore ? cached.nextCursor : undefined
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
      const page = await options.loadPage(undefined)
      applyPage(page, false)
      updateStateFromPage(page)
    } catch (error) {
      handlePageError(error, options.fallbackMessages.initial, false)
    } finally {
      initialLoading.value = false
    }
  }

  const refresh = async (): Promise<void> => {
    if (refreshing.value) {
      return
    }

    generation += 1
    refreshing.value = true
    errorMessage.value = ""
    loadMoreError.value = false

    try {
      await nextTick()
      const page = await options.loadPage(undefined)
      applyPage(page, false)
      updateStateFromPage(page)
    } catch (error) {
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
    if (initialLoading.value || refreshing.value || loadingMore.value || !hasMore.value) {
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
        // A refresh/initial load started while this page was in flight; discard the stale page.
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
    if (options.adjustCursorAfterRemove && typeof nextCursor.value !== "undefined") {
      nextCursor.value = options.adjustCursorAfterRemove(nextCursor.value, removed)
    }
    persistCache()
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
    loadMore,
    retryLoadMore,
    prependItem,
    replaceItem,
    removeItem
  }
}
