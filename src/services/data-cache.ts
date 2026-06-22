import { appConfig } from "@/config/app"

export interface DataCacheEnvelope<T> {
  version: 1
  savedAt: number
  data: T
}

type DataCacheKind = "memory" | "song" | "task" | "memo"
type SemanticData = boolean | number | string | null | SemanticData[] | { [key: string]: SemanticData }
type StableListKey = number | string

interface UpsertCachedListItemOptions<T> {
  insertIfMissing?: boolean
  sort?: (left: T, right: T) => number
}

interface StableListMergeOptions<T> {
  areItemsSemanticallyEqual?: (current: T, next: T) => boolean
  getKey?: (item: T, index: number) => StableListKey
}

interface StableRecordMergeOptions<T> {
  areRecordsSemanticallyEqual?: (current: T, next: T) => boolean
}

const DATA_CACHE_VERSION = 1
const DATA_CACHE_PREFIX = "love-cache"
const FALLBACK_ENV_ID = "unconfigured"
const RESOLVED_FILE_URL_KEY = "resolvedTempURL"
const LEGACY_FILE_URL_KEY = ["temp", "FileURL"].join("")
const FILE_URL_KEYS_STRIPPED_FROM_CACHE = new Set<string>([RESOLVED_FILE_URL_KEY, LEGACY_FILE_URL_KEY])

const cacheEnvId = (): string => appConfig.cloudbaseEnvId || FALLBACK_ENV_ID

const makeDataCacheKey = (kind: DataCacheKind, scope: "list" | "detail", id = ""): string => {
  const baseKey = `${DATA_CACHE_PREFIX}:v${DATA_CACHE_VERSION}:${cacheEnvId()}:${appConfig.coupleId}:${kind}:${scope}`
  return id ? `${baseKey}:${id}` : baseKey
}

export const dataCacheKeys = {
  memoryList: (): string => makeDataCacheKey("memory", "list"),
  memoryDetail: (id: string): string => makeDataCacheKey("memory", "detail", id),
  songList: (): string => makeDataCacheKey("song", "list"),
  songDetail: (id: string): string => makeDataCacheKey("song", "detail", id),
  taskList: (): string => makeDataCacheKey("task", "list"),
  taskDetail: (id: string): string => makeDataCacheKey("task", "detail", id),
  memoList: (): string => makeDataCacheKey("memo", "list"),
  memoDetail: (id: string): string => makeDataCacheKey("memo", "detail", id)
}

const isCacheEnvelope = <T>(value: unknown): value is DataCacheEnvelope<T> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const envelope = value as Partial<DataCacheEnvelope<T>>
  return envelope.version === DATA_CACHE_VERSION && typeof envelope.savedAt === "number" && "data" in envelope
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isRuntimeFileUrlKey = (key: string): boolean => FILE_URL_KEYS_STRIPPED_FROM_CACHE.has(key)

const normalizeSemanticData = (value: unknown): SemanticData | undefined => {
  if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol") {
    return undefined
  }

  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === "bigint") {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeSemanticData(item) ?? null)
  }

  if (isRecord(value)) {
    const normalized: { [key: string]: SemanticData } = {}
    Object.keys(value)
      .filter((key) => !isRuntimeFileUrlKey(key))
      .sort()
      .forEach((key) => {
        const nextValue = normalizeSemanticData(value[key])
        if (typeof nextValue !== "undefined") {
          normalized[key] = nextValue
        }
      })
    return normalized
  }

  return String(value)
}

const semanticSignature = (value: unknown): string => JSON.stringify(normalizeSemanticData(value) ?? null)

export const isSemanticallyEqual = <T>(current: T, next: T): boolean =>
  semanticSignature(current) === semanticSignature(next)

export const sanitizeFileObjects = <T>(files: T[]): T[] => {
  let changed = false
  const sanitizedFiles = files.map((file) => {
    if (!isRecord(file)) {
      return file
    }

    let fileChanged = false
    const nextFile: Record<string, unknown> = {}

    Object.keys(file).forEach((key) => {
      if (isRuntimeFileUrlKey(key)) {
        fileChanged = true
        return
      }

      nextFile[key] = file[key]
    })

    if (!fileChanged) {
      return file
    }

    changed = true
    return nextFile as T
  })

  return changed ? sanitizedFiles : files
}

const withoutRuntimeFileUrls = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const sanitizedItems = sanitizeFileObjects(value)
    let changed = sanitizedItems !== value
    const nextItems = sanitizedItems.map((item) => {
      const nextItem = withoutRuntimeFileUrls(item)
      if (nextItem !== item) {
        changed = true
      }
      return nextItem
    })

    return changed ? nextItems : value
  }

  if (!isRecord(value)) {
    return value
  }

  let changed = false
  const nextRecord: Record<string, unknown> = {}

  Object.keys(value).forEach((key) => {
    const currentValue = value[key]
    if (isRuntimeFileUrlKey(key)) {
      changed = true
      return
    }

    const nextValue = withoutRuntimeFileUrls(currentValue)
    if (nextValue !== currentValue) {
      changed = true
    }

    nextRecord[key] = nextValue
  })

  return changed ? nextRecord : value
}

export const removeRuntimeFileUrls = <T>(value: T): T => withoutRuntimeFileUrls(value) as T

const mergeRuntimeFileUrls = (current: unknown, next: unknown): unknown => {
  if (Array.isArray(current) && Array.isArray(next)) {
    let changed = false
    const mergedItems = current.map((currentItem, index) => {
      const mergedItem = mergeRuntimeFileUrls(currentItem, next[index])
      if (mergedItem !== currentItem) {
        changed = true
      }
      return mergedItem
    })

    return changed ? mergedItems : current
  }

  if (!isRecord(current) || !isRecord(next)) {
    return current
  }

  let changed = false
  const mergedRecord: Record<string, unknown> = {}

  Object.keys(current).forEach((key) => {
    if (isRuntimeFileUrlKey(key)) {
      return
    }

    const currentValue = current[key]
    const mergedValue = key in next ? mergeRuntimeFileUrls(currentValue, next[key]) : currentValue
    if (mergedValue !== currentValue) {
      changed = true
    }
    mergedRecord[key] = mergedValue
  })

  if (RESOLVED_FILE_URL_KEY in next) {
    const nextResolvedUrl = next[RESOLVED_FILE_URL_KEY]
    if (typeof nextResolvedUrl === "string") {
      mergedRecord[RESOLVED_FILE_URL_KEY] = nextResolvedUrl
      changed = current[RESOLVED_FILE_URL_KEY] !== nextResolvedUrl || changed
    } else if (RESOLVED_FILE_URL_KEY in current) {
      changed = true
    }
  } else if (RESOLVED_FILE_URL_KEY in current) {
    mergedRecord[RESOLVED_FILE_URL_KEY] = current[RESOLVED_FILE_URL_KEY]
  }

  return changed ? mergedRecord : current
}

const defaultListKey = <T>(item: T, index: number): StableListKey => {
  if (isRecord(item)) {
    const id = item.id
    if (typeof id === "string" || typeof id === "number") {
      return id
    }
  }

  return `index:${index}`
}

export const mergeStableRecord = <T>(
  current: T | null | undefined,
  next: T,
  options: StableRecordMergeOptions<T> = {}
): T => {
  const areRecordsSemanticallyEqual = options.areRecordsSemanticallyEqual ?? isSemanticallyEqual

  if (typeof current !== "undefined" && current !== null && areRecordsSemanticallyEqual(current, next)) {
    return mergeRuntimeFileUrls(current, next) as T
  }

  return next
}

export const mergeStableList = <T>(
  current: T[],
  next: T[],
  options: StableListMergeOptions<T> = {}
): T[] => {
  const getKey = options.getKey ?? defaultListKey
  const areItemsSemanticallyEqual = options.areItemsSemanticallyEqual ?? isSemanticallyEqual
  const currentByKey = new Map<StableListKey, T>()

  current.forEach((item, index) => {
    currentByKey.set(getKey(item, index), item)
  })

  let changed = current.length !== next.length
  const merged = next.map((nextItem, index) => {
    const key = getKey(nextItem, index)
    const currentItem = currentByKey.get(key)

    if (typeof currentItem !== "undefined" && areItemsSemanticallyEqual(currentItem, nextItem)) {
      const mergedItem = mergeRuntimeFileUrls(currentItem, nextItem) as T

      if (mergedItem !== currentItem || current[index] !== currentItem) {
        changed = true
      }
      return mergedItem
    }

    if (current[index] !== nextItem) {
      changed = true
    }
    return nextItem
  })

  return changed ? merged : current
}

export const removeDataCache = (key: string): void => {
  try {
    uni.removeStorageSync(key)
  } catch {
    // Cache failures must never break the CloudBase data path.
  }
}

export const readDataCache = <T>(key: string): T | null => {
  try {
    const raw = uni.getStorageSync(key) as unknown
    if (typeof raw === "undefined" || raw === null || raw === "") {
      return null
    }

    if (!isCacheEnvelope<T>(raw)) {
      removeDataCache(key)
      return null
    }

    const cacheData = removeRuntimeFileUrls(raw.data)
    if (cacheData !== raw.data) {
      writeDataCache(key, cacheData)
    }

    return cacheData
  } catch {
    removeDataCache(key)
    return null
  }
}

export const writeDataCache = <T>(key: string, data: T): void => {
  try {
    const cacheData = removeRuntimeFileUrls(data)
    const envelope: DataCacheEnvelope<T> = {
      version: DATA_CACHE_VERSION,
      savedAt: Date.now(),
      data: cacheData
    }
    uni.setStorageSync(key, envelope)
  } catch {
    // Storage may be unavailable or full; fresh API data should still render.
  }
}

export const upsertCachedListItem = <T extends { id: string }>(
  key: string,
  item: T,
  options: UpsertCachedListItemOptions<T> = {}
): void => {
  const cachedList = readDataCache<T[]>(key)
  if (!cachedList) {
    if (options.insertIfMissing === false) {
      return
    }

    writeDataCache(key, [item])
    return
  }

  const existingIndex = cachedList.findIndex((cachedItem) => cachedItem.id === item.id)
  if (existingIndex < 0 && options.insertIfMissing === false) {
    return
  }

  const nextList =
    existingIndex >= 0
      ? cachedList.map((cachedItem) => (cachedItem.id === item.id ? item : cachedItem))
      : [item, ...cachedList]

  writeDataCache(key, options.sort ? [...nextList].sort(options.sort) : nextList)
}

export const removeCachedListItem = (key: string, id: string): void => {
  const cachedList = readDataCache<Array<{ id: string }>>(key)
  if (!cachedList) {
    return
  }

  writeDataCache(
    key,
    cachedList.filter((item) => item.id !== id)
  )
}
