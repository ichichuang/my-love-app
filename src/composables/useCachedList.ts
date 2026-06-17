import { shallowRef } from "vue"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { mergeStableList, readDataCache, writeDataCache } from "@/services/data-cache"

interface UseCachedListOptions<T> {
  cacheKey: () => string
  loader: () => Promise<T[]>
}

export interface CachedLoadResult {
  fromCache: boolean
  refreshed: boolean
}

export const useCachedList = <T>(options: UseCachedListOptions<T>) => {
  const items = shallowRef<T[]>([])
  const loading = shallowRef(false)
  const refreshing = shallowRef(false)
  const errorMessage = shallowRef("")

  const applyVisibleItems = (nextItems: T[]): void => {
    const mergedItems = mergeStableList(items.value, nextItems)
    if (mergedItems !== items.value) {
      items.value = mergedItems
    }
  }

  const reload = async (): Promise<CachedLoadResult> => {
    const key = options.cacheKey()
    const cachedItems = readDataCache<T[]>(key)
    const hasCache = cachedItems !== null

    if (hasCache) {
      applyVisibleItems(cachedItems)
      loading.value = false
      refreshing.value = true
      errorMessage.value = ""
    } else {
      loading.value = true
      refreshing.value = false
      errorMessage.value = ""
    }

    try {
      const freshItems = await options.loader()
      writeDataCache(key, freshItems)
      applyVisibleItems(freshItems)
      errorMessage.value = ""
      return {
        fromCache: hasCache,
        refreshed: true
      }
    } catch (error) {
      if (hasCache) {
        return {
          fromCache: true,
          refreshed: false
        }
      }

      items.value = []
      errorMessage.value = getFriendlyErrorMessage(error)
      throw error
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  return {
    items,
    loading,
    refreshing,
    errorMessage,
    reload
  }
}
