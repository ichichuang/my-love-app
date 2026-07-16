import { shallowRef, type ShallowRef } from "vue"
import {
  applyResolvedTempURLsToFiles,
  getTempFileURLByFileIds,
  removeResolvedTempURLFromFiles
} from "@/services/cloud-file-resolver"
import { type EntryRecord } from "@/services/repositories/entries"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { selectFirstImageFile } from "@/utils/entry-files"

interface PreviewTarget {
  entryId: string
  fileID: string
}

interface TimelinePreviewHydrationOptions {
  items: ShallowRef<EntryRecord[]>
}

export interface TimelinePreviewHydrationController {
  exhaustedKeys: ShallowRef<Set<string>>
  hydrate: (entries: EntryRecord[]) => Promise<void>
  hydrateAll: () => Promise<void>
  recover: (entryId: string, fileID: string, rejectedUrl?: string) => Promise<void>
  retryUnavailable: (entries?: EntryRecord[]) => Promise<void>
}

const keyFor = (entryId: string, fileID: string): string => `${entryId}:${fileID}`

/**
 * 统一控制首页时间线封面预览的水合生命周期。
 *
 * 关键设计：
 * - 所有入口（缓存恢复、首屏、刷新、追加、onShow、图片报错恢复）都走同一个 hydrate/recover。
 * - 按 entryId:fileID 标识 exhausted 状态，按 fileID 去重网络请求并维护可共享的 per-file Promise。
 * - 同一 fileID 的并发请求复用同一个 Promise，避免重复请求，也避免把正在请求中的文件直接标为 unavailable。
 * - 批量请求保留 batch 网络效率：一次性发起一批 fileID 的请求，每个 fileID 仍暴露独立 Promise 供共享。
 * - 不保留全局“最新调用胜出”计数，避免后一页请求取消前一页结果。
 * - 批量请求结束后，已返回 URL 的进入 ready，缺失的 force 重试一次，仍然缺失或抛错的进入 unavailable。
 * - 显式用户刷新可调用 retryUnavailable，只重试当前可见且 exhausted 的预览，清除对应状态后走一次普通+force 重试。
 */
export const useTimelinePreviewHydration = (
  options: TimelinePreviewHydrationOptions
): TimelinePreviewHydrationController => {
  const { items } = options
  const exhaustedKeys = shallowRef(new Set<string>())
  const inFlightPromises = new Map<string, Promise<string | null>>()
  const recoveredKeys = new Set<string>()
  const rejectedUrls = new Map<string, string>()

  const syncExhausted = (key: string, exhausted: boolean): boolean => {
    if (exhaustedKeys.value.has(key) === exhausted) {
      return false
    }

    const next = new Set(exhaustedKeys.value)
    if (exhausted) {
      next.add(key)
    } else {
      next.delete(key)
    }
    exhaustedKeys.value = next
    return true
  }

  const batchUpdateItems = (updates: Map<string, EntryRecord>): boolean => {
    if (updates.size === 0) {
      return false
    }

    let changed = false
    const nextItems = items.value.map((item) => {
      const updated = updates.get(item.id)
      if (!updated) {
        return item
      }

      if (updated !== item) {
        changed = true
      }
      return updated
    })

    if (changed) {
      items.value = nextItems
    }
    return changed
  }

  const applyUrlToFileID = (fileID: string, url: string): void => {
    const updates = new Map<string, EntryRecord>()
    for (const entry of items.value) {
      const nextFiles = applyResolvedTempURLsToFiles(entry.files, new Map([[fileID, url]]))
      if (nextFiles !== entry.files) {
        updates.set(entry.id, { ...entry, files: nextFiles })
      }
    }
    batchUpdateItems(updates)
  }

  const removeResolvedUrl = (entryId: string, fileID: string): void => {
    let changed = false
    const nextItems = items.value.map((item) => {
      if (item.id !== entryId) {
        return item
      }

      const nextFiles = removeResolvedTempURLFromFiles(item.files, fileID)
      if (nextFiles === item.files) {
        return item
      }

      changed = true
      return { ...item, files: nextFiles }
    })

    if (changed) {
      items.value = nextItems
    }
  }

  const collectTargets = (entries: EntryRecord[]): PreviewTarget[] => {
    const targets: PreviewTarget[] = []
    for (const entry of entries) {
      const file = selectFirstImageFile(entry.files)
      if (!file || !file.fileID || file.resolvedTempURL) {
        continue
      }

      const key = keyFor(entry.id, file.fileID)
      if (exhaustedKeys.value.has(key)) {
        continue
      }

      targets.push({ entryId: entry.id, fileID: file.fileID })
    }
    return targets
  }

  const safeResolveBatch = async (
    fileIDs: string[],
    force: boolean
  ): Promise<Map<string, string | null>> => {
    try {
      const urls = await getTempFileURLByFileIds(fileIDs, { force })
      const result = new Map<string, string | null>()
      for (const fileID of fileIDs) {
        result.set(fileID, urls.get(fileID) ?? null)
      }
      return result
    } catch (error) {
      if (import.meta.env.DEV) {
        console.info(
          `[小珊的树洞] 时间线预览链接请求失败：${getFriendlyErrorMessage(error)}`
        )
      }
      const result = new Map<string, string | null>()
      for (const fileID of fileIDs) {
        result.set(fileID, null)
      }
      return result
    }
  }

  const makeInFlightPromise = (
    fileID: string,
    promise: Promise<string | null>
  ): Promise<string | null> => {
    inFlightPromises.set(fileID, promise)
    promise.finally(() => {
      // 身份安全清理：只有当前 Promise 仍是该 fileID 的最新代表时才移除，
      // 防止旧请求的 finally 误删新请求的共享 Promise。
      if (inFlightPromises.get(fileID) === promise) {
        inFlightPromises.delete(fileID)
      }
    })
    return promise
  }

  /**
   * 请求单个 fileID 的临时链接。若已有同 fileID 的 in-flight Promise，直接复用。
   */
  const requestFileURL = (fileID: string, force: boolean): Promise<string | null> => {
    const existing = inFlightPromises.get(fileID)
    if (existing) {
      return existing
    }

    const promise = safeResolveBatch([fileID], force).then((urls) => urls.get(fileID) ?? null)
    return makeInFlightPromise(fileID, promise)
  }

  /**
   * 强制发起一次新的单个 fileID 请求，不共享已有 Promise。
   * 用于 recover 中在共享结果无效时额外再试一次。
   */
  const requestFreshFileURL = (fileID: string, force: boolean): Promise<string | null> => {
    const promise = safeResolveBatch([fileID], force).then((urls) => urls.get(fileID) ?? null)
    return makeInFlightPromise(fileID, promise)
  }

  /**
   * 批量请求多个 fileID，保留 batch 网络效率，同时每个 fileID 暴露独立 Promise 供并发共享。
   */
  const requestFileURLs = (
    fileIDs: string[],
    force: boolean
  ): Map<string, Promise<string | null>> => {
    const result = new Map<string, Promise<string | null>>()
    const missing: string[] = []

    for (const fileID of fileIDs) {
      const existing = inFlightPromises.get(fileID)
      if (existing) {
        result.set(fileID, existing)
      } else {
        missing.push(fileID)
      }
    }

    if (missing.length > 0) {
      const batchPromise = safeResolveBatch(missing, force)
      for (const fileID of missing) {
        const singlePromise = batchPromise.then((urls) => urls.get(fileID) ?? null)
        makeInFlightPromise(fileID, singlePromise)
        result.set(fileID, singlePromise)
      }
    }

    return result
  }

  const applyUrlsToTargets = (
    targets: PreviewTarget[],
    urls: Map<string, string | null>
  ): { resolved: Set<string> } => {
    const resolved = new Set<string>()
    const resolvedUrls = new Map<string, string>()

    for (const target of targets) {
      const url = urls.get(target.fileID)
      if (!url) {
        continue
      }

      resolvedUrls.set(target.fileID, url)
      resolved.add(target.fileID)
    }

    if (resolvedUrls.size === 0) {
      return { resolved }
    }

    const updates = new Map<string, EntryRecord>()
    for (const entry of items.value) {
      const nextFiles = applyResolvedTempURLsToFiles(entry.files, resolvedUrls)
      if (nextFiles !== entry.files) {
        updates.set(entry.id, { ...entry, files: nextFiles })
      }
    }
    batchUpdateItems(updates)

    return { resolved }
  }

  const markUnavailable = (targets: PreviewTarget[]): void => {
    for (const target of targets) {
      syncExhausted(keyFor(target.entryId, target.fileID), true)
    }
  }

  const clearExhaustedForResolved = (targets: PreviewTarget[], resolved: Set<string>): void => {
    for (const target of targets) {
      if (resolved.has(target.fileID)) {
        syncExhausted(keyFor(target.entryId, target.fileID), false)
      }
    }
  }

  const hydrate = async (entries: EntryRecord[]): Promise<void> => {
    const targets = collectTargets(entries)
    if (targets.length === 0) {
      return
    }

    const requestIDs = Array.from(new Set(targets.map((target) => target.fileID)))
    const promises = requestFileURLs(requestIDs, false)

    const urls = new Map<string, string | null>()
    await Promise.all(
      requestIDs.map(async (fileID) => {
        const url = await promises.get(fileID)
        urls.set(fileID, url ?? null)
      })
    )

    const { resolved } = applyUrlsToTargets(targets, urls)
    const unresolvedTargets = targets.filter((target) => !resolved.has(target.fileID))

    if (unresolvedTargets.length > 0) {
      const retryIDs = Array.from(new Set(unresolvedTargets.map((target) => target.fileID)))
      const retryPromises = requestFileURLs(retryIDs, true)
      const retryUrls = new Map<string, string | null>()
      await Promise.all(
        retryIDs.map(async (fileID) => {
          const url = await retryPromises.get(fileID)
          retryUrls.set(fileID, url ?? null)
        })
      )
      const { resolved: retryResolved } = applyUrlsToTargets(unresolvedTargets, retryUrls)
      for (const fileID of retryResolved) {
        resolved.add(fileID)
      }

      const stillUnresolved = unresolvedTargets.filter((target) => !resolved.has(target.fileID))
      markUnavailable(stillUnresolved)
    }

    clearExhaustedForResolved(targets, resolved)
  }

  const hydrateAll = async (): Promise<void> => hydrate(items.value)

  const retryUnavailable = async (entries?: EntryRecord[]): Promise<void> => {
    const targetEntries = entries ?? items.value
    const keysToRetry: string[] = []

    for (const entry of targetEntries) {
      const file = selectFirstImageFile(entry.files)
      if (!file?.fileID) {
        continue
      }

      const key = keyFor(entry.id, file.fileID)
      if (exhaustedKeys.value.has(key)) {
        keysToRetry.push(key)
      }
    }

    if (keysToRetry.length === 0) {
      return
    }

    const nextExhausted = new Set(exhaustedKeys.value)
    for (const key of keysToRetry) {
      nextExhausted.delete(key)
      recoveredKeys.delete(key)
      rejectedUrls.delete(key)
    }
    exhaustedKeys.value = nextExhausted

    const entriesToHydrate = targetEntries.filter((entry) => {
      const file = selectFirstImageFile(entry.files)
      if (!file?.fileID) {
        return false
      }
      return keysToRetry.includes(keyFor(entry.id, file.fileID))
    })

    await hydrate(entriesToHydrate)
  }

  const recover = async (entryId: string, fileID: string, rejectedUrl?: string): Promise<void> => {
    const key = keyFor(entryId, fileID)

    // 同一条目同一文件在本页面会话中只允许一次定向恢复。
    if (recoveredKeys.has(key)) {
      syncExhausted(key, true)
      return
    }

    recoveredKeys.add(key)

    if (rejectedUrl) {
      rejectedUrls.set(key, rejectedUrl)
    }

    removeResolvedUrl(entryId, fileID)

    const firstUrl = await requestFileURL(fileID, true)

    const isRejectedUrl = (url: string | null): boolean =>
      !url || (rejectedUrl !== undefined && url === rejectedUrl)

    let usableUrl = firstUrl
    if (isRejectedUrl(firstUrl)) {
      // 共享结果无效时，再发起一次新的 force 请求；整个恢复周期最多一次额外重试。
      usableUrl = await requestFreshFileURL(fileID, true)
    }

    if (!usableUrl || (rejectedUrl !== undefined && usableUrl === rejectedUrl)) {
      if (usableUrl) {
        rejectedUrls.set(key, usableUrl)
      }
      syncExhausted(key, true)
      return
    }

    applyUrlToFileID(fileID, usableUrl)
    syncExhausted(key, false)
  }

  return {
    exhaustedKeys,
    hydrate,
    hydrateAll,
    recover,
    retryUnavailable
  }
}
