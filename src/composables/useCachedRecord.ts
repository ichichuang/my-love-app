import { shallowRef } from "vue"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { mergeStableRecord, readDataCache, removeDataCache, writeDataCache } from "@/services/data-cache"
import type { CachedLoadResult } from "@/composables/useCachedList"

interface UseCachedRecordOptions<T> {
  cacheKey: () => string
  isUnavailableError?: (error: unknown) => boolean
  loader: () => Promise<T>
}

interface CachedRecordLoadOptions<T> {
  applyCached?: (record: T) => void
  applyFresh?: (record: T) => void
  canApplyFresh?: () => boolean
}

export const useCachedRecord = <T>(options: UseCachedRecordOptions<T>) => {
  const record = shallowRef<T | null>(null)
  const loading = shallowRef(false)
  const refreshing = shallowRef(false)
  const errorMessage = shallowRef("")

  const applyVisibleRecord = (nextRecord: T): T => {
    const mergedRecord = mergeStableRecord(record.value, nextRecord)
    if (mergedRecord !== record.value) {
      record.value = mergedRecord
    }

    return mergedRecord
  }

  const reload = async (loadOptions: CachedRecordLoadOptions<T> = {}): Promise<CachedLoadResult> => {
    const key = options.cacheKey()
    const cachedRecord = readDataCache<T>(key)
    const hasCache = cachedRecord !== null

    if (hasCache) {
      const visibleRecord = applyVisibleRecord(cachedRecord)
      loadOptions.applyCached?.(visibleRecord)
      loading.value = false
      refreshing.value = true
      errorMessage.value = ""
    } else {
      record.value = null
      loading.value = true
      refreshing.value = false
      errorMessage.value = ""
    }

    try {
      const freshRecord = await options.loader()
      writeDataCache(key, freshRecord)
      if (loadOptions.canApplyFresh?.() !== false) {
        const visibleRecord = applyVisibleRecord(freshRecord)
        loadOptions.applyFresh?.(visibleRecord)
      }
      errorMessage.value = ""
      return {
        fromCache: hasCache,
        refreshed: true
      }
    } catch (error) {
      if (options.isUnavailableError?.(error)) {
        removeDataCache(key)
        record.value = null
        errorMessage.value = getFriendlyErrorMessage(error)
        throw error
      }

      if (hasCache) {
        return {
          fromCache: true,
          refreshed: false
        }
      }

      record.value = null
      errorMessage.value = getFriendlyErrorMessage(error)
      throw error
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  return {
    record,
    loading,
    refreshing,
    errorMessage,
    reload
  }
}
