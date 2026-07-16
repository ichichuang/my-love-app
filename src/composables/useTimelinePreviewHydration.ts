import { shallowRef, type ShallowRef } from "vue"
import {
  applyResolvedTempURLsToFiles,
  getTempFileURLByFileIds,
  mergeResolvedTempURLsForEntry,
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
  scheduleRemeasure: () => void
}

export interface TimelinePreviewHydrationController {
  exhaustedKeys: ShallowRef<Set<string>>
  hydrate: (entries: EntryRecord[]) => Promise<void>
  hydrateAll: () => Promise<void>
  recover: (entryId: string, fileID: string, rejectedUrl?: string) => Promise<void>
}

const keyFor = (entryId: string, fileID: string): string => `${entryId}:${fileID}`

/**
 * 统一控制首页时间线封面预览的水合生命周期。
 *
 * 关键设计：
 * - 所有入口（缓存恢复、首屏、刷新、追加、onShow、图片报错恢复）都走同一个 hydrate/recover。
 * - 按 entryId:fileID 标识 exhausted 状态，按 fileID 去重网络请求并维护 in-flight 集合。
 * - 不保留全局“最新调用胜出”计数，避免后一页请求取消前一页结果。
 * - 批量请求结束后，已返回 URL 的进入 ready，缺失的 force 重试一次，仍然缺失或抛错的进入 unavailable。
 */
export const useTimelinePreviewHydration = (
  options: TimelinePreviewHydrationOptions
): TimelinePreviewHydrationController => {
  const { items, scheduleRemeasure } = options
  const exhaustedKeys = shallowRef(new Set<string>())
  const inFlightFileIDs = new Set<string>()
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

      const merged = mergeResolvedTempURLsForEntry(item, updated)
      if (merged !== item) {
        changed = true
      }
      return merged
    })

    if (changed) {
      items.value = nextItems
    }
    return changed
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
      if (!file || !file.fileID || file.resolvedTempURL || inFlightFileIDs.has(file.fileID)) {
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

  const applyUrlsToTargets = (
    targets: PreviewTarget[],
    urls: Map<string, string>
  ): { resolved: Set<string> } => {
    const resolved = new Set<string>()
    const updates = new Map<string, EntryRecord>()

    for (const target of targets) {
      const url = urls.get(target.fileID)
      if (!url) {
        continue
      }

      const entry = items.value.find((item) => item.id === target.entryId)
      if (!entry) {
        continue
      }

      const currentEntry = updates.get(entry.id) ?? entry
      const nextFiles = applyResolvedTempURLsToFiles(currentEntry.files, new Map([[target.fileID, url]]))
      if (nextFiles !== currentEntry.files) {
        updates.set(entry.id, { ...currentEntry, files: nextFiles })
      }
      resolved.add(target.fileID)
    }

    batchUpdateItems(updates)
    return { resolved }
  }

  const markUnavailable = (targets: PreviewTarget[]): void => {
    let changed = false
    for (const target of targets) {
      changed = syncExhausted(keyFor(target.entryId, target.fileID), true) || changed
    }
    if (changed) {
      scheduleRemeasure()
    }
  }

  const clearExhaustedForResolved = (targets: PreviewTarget[], resolved: Set<string>): void => {
    let changed = false
    for (const target of targets) {
      if (resolved.has(target.fileID)) {
        changed = syncExhausted(keyFor(target.entryId, target.fileID), false) || changed
      }
    }
    if (changed) {
      scheduleRemeasure()
    }
  }

  const safeResolve = async (fileIDs: string[], force: boolean): Promise<Map<string, string>> => {
    try {
      return await getTempFileURLByFileIds(fileIDs, { force })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.info(
          `[小珊的树洞] 时间线预览链接请求失败：${getFriendlyErrorMessage(error)}`
        )
      }
      return new Map()
    }
  }

  const hydrate = async (entries: EntryRecord[]): Promise<void> => {
    const targets = collectTargets(entries)
    if (targets.length === 0) {
      return
    }

    const requestIDs = Array.from(new Set(targets.map((target) => target.fileID)))
    for (const fileID of requestIDs) {
      inFlightFileIDs.add(fileID)
    }

    try {
      const urls = await safeResolve(requestIDs, false)
      const { resolved } = applyUrlsToTargets(targets, urls)
      const unresolvedTargets = targets.filter((target) => !resolved.has(target.fileID))

      if (unresolvedTargets.length > 0) {
        const retryIDs = Array.from(new Set(unresolvedTargets.map((target) => target.fileID)))
        const retryUrls = await safeResolve(retryIDs, true)
        const { resolved: retryResolved } = applyUrlsToTargets(unresolvedTargets, retryUrls)
        for (const fileID of retryResolved) {
          resolved.add(fileID)
        }

        const stillUnresolved = unresolvedTargets.filter((target) => !resolved.has(target.fileID))
        markUnavailable(stillUnresolved)
      }

      clearExhaustedForResolved(targets, resolved)
    } finally {
      for (const fileID of requestIDs) {
        inFlightFileIDs.delete(fileID)
      }
    }
  }

  const hydrateAll = async (): Promise<void> => hydrate(items.value)

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

    if (inFlightFileIDs.has(fileID)) {
      syncExhausted(key, true)
      return
    }

    inFlightFileIDs.add(fileID)
    try {
      const urls = await safeResolve([fileID], true)
      const url = urls.get(fileID)
      if (!url || url === rejectedUrls.get(key)) {
        if (url) {
          rejectedUrls.set(key, url)
        }
        syncExhausted(key, true)
        return
      }

      const entry = items.value.find((item) => item.id === entryId)
      if (entry) {
        const nextFiles = applyResolvedTempURLsToFiles(entry.files, new Map([[fileID, url]]))
        if (nextFiles !== entry.files) {
          items.value = items.value.map((item) =>
            item.id === entryId ? { ...item, files: nextFiles } : item
          )
        }
      }
      syncExhausted(key, false)
    } finally {
      inFlightFileIDs.delete(fileID)
    }
  }

  return {
    exhaustedKeys,
    hydrate,
    hydrateAll,
    recover
  }
}
