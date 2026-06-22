import { appConfig } from "@/config/app"
import {
  CloudBaseUserError,
  deleteCloudFilesWithResult,
  type CloudFileDeleteFailure
} from "@/services/cloudbase"

interface CloudFileCleanupEnvelope {
  version: 1
  fileIDs: string[]
  updatedAt: number
}

export interface CloudFileCleanupResult {
  attempted: number
  deleted: number
  pending: number
}

const CLEANUP_QUEUE_VERSION = 1
const CLEANUP_QUEUE_PREFIX = "cloud-file-cleanup"
const FALLBACK_ENV_ID = "unconfigured"

let pendingFileIDs = new Set<string>()
let activeFlushPromise: Promise<CloudFileCleanupResult> | null = null

const normalizeFileIDs = (fileIDs: readonly unknown[]): string[] =>
  Array.from(
    new Set(
      fileIDs
        .map((fileID) => (typeof fileID === "string" ? fileID.trim() : ""))
        .filter(Boolean)
    )
  )

const cleanupStorageKey = (): string => {
  const envId = appConfig.cloudbaseEnvId || FALLBACK_ENV_ID
  return `${CLEANUP_QUEUE_PREFIX}:v${CLEANUP_QUEUE_VERSION}:${envId}:${appConfig.coupleId}`
}

const isCleanupEnvelope = (value: unknown): value is CloudFileCleanupEnvelope => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const envelope = value as Partial<CloudFileCleanupEnvelope>
  return envelope.version === CLEANUP_QUEUE_VERSION && Array.isArray(envelope.fileIDs)
}

const logCleanupIssue = (message: string, error?: unknown): void => {
  if (!import.meta.env.DEV) {
    return
  }

  if (!error) {
    console.info(`[小珊的树洞] ${message}`)
    return
  }

  const causeDetail = error instanceof CloudBaseUserError ? error.causeDetail : ""
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.warn(`[小珊的树洞] ${message}`, {
    message: errorMessage,
    causeDetail
  })
}

const formatDeleteFailures = (failures: CloudFileDeleteFailure[]): string =>
  failures
    .map((failure) => {
      const status = typeof failure.status === "number" ? failure.status : "missing"
      return `${failure.fileID} status=${status} errMsg=${failure.errMsg}`
    })
    .join("; ")

const readPersistedFileIDs = (): string[] => {
  try {
    const raw = uni.getStorageSync(cleanupStorageKey()) as unknown
    if (!isCleanupEnvelope(raw)) {
      return []
    }

    return normalizeFileIDs(raw.fileIDs)
  } catch (error) {
    logCleanupIssue("云文件清理队列读取失败，先使用内存队列。", error)
    return []
  }
}

const writePersistedFileIDs = (fileIDs: string[]): boolean => {
  try {
    const envelope: CloudFileCleanupEnvelope = {
      version: CLEANUP_QUEUE_VERSION,
      fileIDs: normalizeFileIDs(fileIDs),
      updatedAt: Date.now()
    }
    uni.setStorageSync(cleanupStorageKey(), envelope)
    return true
  } catch (error) {
    logCleanupIssue("云文件清理队列写入失败，已保留内存队列。", error)
    return false
  }
}

const pendingSnapshot = (): string[] => normalizeFileIDs([...readPersistedFileIDs(), ...pendingFileIDs])

const removeProcessedFileIDs = (processedFileIDs: string[]): void => {
  const processed = new Set(processedFileIDs)
  pendingFileIDs = new Set([...pendingFileIDs].filter((fileID) => !processed.has(fileID)))

  const persistedRemainder = readPersistedFileIDs().filter((fileID) => !processed.has(fileID))
  writePersistedFileIDs([...persistedRemainder, ...pendingFileIDs])
}

const runFlush = async (): Promise<CloudFileCleanupResult> => {
  let attempted = 0
  let deleted = 0

  while (true) {
    const snapshot = pendingSnapshot()
    if (snapshot.length === 0) {
      return {
        attempted,
        deleted,
        pending: 0
      }
    }

    attempted += snapshot.length

    try {
      const result = await deleteCloudFilesWithResult(snapshot)
      deleted += result.deletedFileIDs.length

      if (result.deletedFileIDs.length > 0) {
        removeProcessedFileIDs(result.deletedFileIDs)
      }

      if (result.failures.length > 0) {
        logCleanupIssue(
          `云文件清理部分未完成，失败 ${result.failures.length} 个，已保留待重试队列。`,
          new CloudBaseUserError("云文件清理部分失败。", formatDeleteFailures(result.failures))
        )
        return {
          attempted,
          deleted,
          pending: pendingSnapshot().length
        }
      }
    } catch (error) {
      logCleanupIssue("云文件清理暂未完成，已保留待重试队列。", error)
      return {
        attempted,
        deleted,
        pending: pendingSnapshot().length
      }
    }
  }
}

const safeRunFlush = async (): Promise<CloudFileCleanupResult> => {
  try {
    return await runFlush()
  } catch (error) {
    logCleanupIssue("云文件清理流程异常中断，已保留待重试队列。", error)
    return {
      attempted: 0,
      deleted: 0,
      pending: pendingSnapshot().length
    }
  }
}

export const flushPendingCloudFileCleanup = (): Promise<CloudFileCleanupResult> => {
  if (activeFlushPromise) {
    return activeFlushPromise
  }

  activeFlushPromise = safeRunFlush().finally(() => {
    activeFlushPromise = null
  })

  return activeFlushPromise
}

export const queueCloudFilesForCleanup = (fileIDs: string[]): void => {
  try {
    const normalizedFileIDs = normalizeFileIDs(fileIDs)
    if (normalizedFileIDs.length === 0) {
      return
    }

    normalizedFileIDs.forEach((fileID) => pendingFileIDs.add(fileID))
    writePersistedFileIDs([...readPersistedFileIDs(), ...pendingFileIDs])

    void flushPendingCloudFileCleanup()
  } catch (error) {
    logCleanupIssue("云文件清理入队失败，已尽量保留内存队列。", error)
    void flushPendingCloudFileCleanup()
  }
}
