import { readDataCache, writeDataCache } from "@/services/data-cache"

export interface PaginatedCachePayload<TItem, TCursor> {
  version: number
  items: TItem[]
  nextCursor: TCursor | undefined
  hasMore: boolean
  // Monotonic revision bumped by every item-level cache mutation (repository
  // write-through and engine list mutations). Network paths capture it at
  // request start and discard their response when it has moved on.
  mutationRevision: number
}

interface PaginatedCacheMutationOptions<TItem, TCursor> {
  version: number
  getItemId: (item: TItem) => string
  compareItems?: (left: TItem, right: TItem) => number
  insertIfMissing?: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isPaginatedCachePayload = <TItem, TCursor>(
  value: unknown,
  version: number
): value is PaginatedCachePayload<TItem, TCursor> => {
  if (!isRecord(value)) {
    return false
  }

  const payload = value as Partial<PaginatedCachePayload<TItem, TCursor>>
  return (
    payload.version === version &&
    Array.isArray(payload.items) &&
    typeof payload.hasMore === "boolean" &&
    (payload.hasMore ? typeof payload.nextCursor !== "undefined" : true)
  )
}

// Revision normalization contract for stored v2 payloads: a missing revision
// (legacy payload) reads as 0; a present one must be a non-negative safe
// integer, otherwise the whole payload is treated as corrupt. Callers always
// receive a payload whose mutationRevision is a concrete number.
const normalizeMutationRevision = (value: unknown): number | null => {
  if (typeof value === "undefined") {
    return 0
  }

  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null
}

export const readPaginatedCache = <TItem, TCursor>(
  key: string,
  version: number
): PaginatedCachePayload<TItem, TCursor> | null => {
  const payload = readDataCache<PaginatedCachePayload<TItem, TCursor>>(key)
  if (!payload || !isPaginatedCachePayload<TItem, TCursor>(payload, version)) {
    return null
  }

  const mutationRevision = normalizeMutationRevision(payload.mutationRevision)
  if (mutationRevision === null) {
    return null
  }

  return {
    ...payload,
    mutationRevision
  }
}

export const readPaginatedCacheMutationRevision = (key: string, version: number): number =>
  readPaginatedCache(key, version)?.mutationRevision ?? 0

export const writePaginatedCache = <TItem, TCursor>(
  key: string,
  payload: PaginatedCachePayload<TItem, TCursor>
): void => {
  writeDataCache<PaginatedCachePayload<TItem, TCursor>>(key, payload)
}

// Write-through from repository mutation paths. A missing payload is left absent on
// purpose: the list page performs a network initial load when no cache exists, and a
// payload reconstructed from a single item would carry a meaningless cursor.
export const upsertPaginatedCacheItem = <TItem, TCursor>(
  key: string,
  item: TItem,
  options: PaginatedCacheMutationOptions<TItem, TCursor>
): void => {
  const payload = readPaginatedCache<TItem, TCursor>(key, options.version)
  if (!payload) {
    return
  }

  const itemId = options.getItemId(item)
  const existingIndex = payload.items.findIndex((cachedItem) => options.getItemId(cachedItem) === itemId)
  if (existingIndex < 0 && options.insertIfMissing === false) {
    return
  }

  const nextItems =
    existingIndex >= 0
      ? payload.items.map((cachedItem) => (options.getItemId(cachedItem) === itemId ? item : cachedItem))
      : [item, ...payload.items]

  writePaginatedCache<TItem, TCursor>(key, {
    ...payload,
    items: options.compareItems ? [...nextItems].sort(options.compareItems) : nextItems,
    mutationRevision: payload.mutationRevision + 1
  })
}

export const removePaginatedCacheItem = <TItem, TCursor>(
  key: string,
  id: string,
  options: PaginatedCacheMutationOptions<TItem, TCursor>
): void => {
  const payload = readPaginatedCache<TItem, TCursor>(key, options.version)
  if (!payload) {
    return
  }

  const nextItems = payload.items.filter((cachedItem) => options.getItemId(cachedItem) !== id)
  if (nextItems.length === payload.items.length) {
    return
  }

  writePaginatedCache<TItem, TCursor>(key, {
    ...payload,
    items: nextItems,
    mutationRevision: payload.mutationRevision + 1
  })
}
