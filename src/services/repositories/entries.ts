import { appConfig } from "@/config/app"
import {
  addDocument,
  CloudBaseUserError,
  deleteCloudFiles,
  getDocument,
  listDocuments,
  removeDocument,
  updateDocument,
  type CloudFile
} from "@/services/cloudbase"
import {
  dataCacheKeys,
  removeCachedListItem,
  removeDataCache,
  upsertCachedListItem,
  writeDataCache
} from "@/services/data-cache"
import { queueCloudFilesForCleanup } from "@/services/cloud-file-cleanup"

export type LoveEntryKind = "memory" | "song" | "task" | "memo"

export interface EntryDraft {
  title: string
  content: string
  occurredAt: string
  mood: string
  files: CloudFile[]
}

export interface EntryRecord extends EntryDraft {
  id: string
  kind: "memory"
  createdAt: number
  updatedAt: number
}

type StoredCloudFile = Omit<CloudFile, "resolvedTempURL">

interface StoredEntryDocument {
  _id?: string
  coupleId: string
  kind?: LoveEntryKind
  title: string
  content: string
  occurredAt: string
  mood: string
  files: StoredCloudFile[]
  createdAt: number
  updatedAt: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asString = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback)

const asNumber = (value: unknown, fallback = 0): number => (typeof value === "number" ? value : fallback)

const normalizeKind = (value: unknown): LoveEntryKind =>
  value === "memory" || value === "song" || value === "task" || value === "memo" ? value : "memory"

const ENTRY_UNAVAILABLE_MESSAGE = "这张小纸条暂时打不开，可能是云开发慢了一点，请稍后再试。"

const entryUnavailableError = (): CloudBaseUserError =>
  new CloudBaseUserError(ENTRY_UNAVAILABLE_MESSAGE)

export const isEntryUnavailableError = (error: unknown): boolean =>
  error instanceof CloudBaseUserError && error.message === ENTRY_UNAVAILABLE_MESSAGE

const stripRuntimeUrl = (file: CloudFile): StoredCloudFile => ({
  fileID: file.fileID,
  cloudPath: file.cloudPath,
  name: file.name,
  type: file.type,
  size: file.size,
  uploadedAt: file.uploadedAt
})

const normalizeStoredFile = (value: unknown): StoredCloudFile | null => {
  if (!isRecord(value)) {
    return null
  }

  const fileID = asString(value.fileID)
  const cloudPath = asString(value.cloudPath)
  const name = asString(value.name, "memory.jpg")
  const type = value.type === "file" ? "file" : "image"
  const uploadedAt = asNumber(value.uploadedAt, Date.now())

  if (!fileID || !cloudPath) {
    return null
  }

  return {
    fileID,
    cloudPath,
    name,
    type,
    size: typeof value.size === "number" ? value.size : undefined,
    uploadedAt
  }
}

const normalizeEntry = (document: StoredEntryDocument): EntryRecord | null => {
  const id = asString(document._id)
  if (!id || document.coupleId !== appConfig.coupleId) {
    return null
  }

  if (normalizeKind(document.kind) !== "memory") {
    return null
  }

  const files = Array.isArray(document.files)
    ? document.files.map(normalizeStoredFile).filter((file): file is StoredCloudFile => file !== null)
    : []

  return {
    id,
    kind: "memory",
    title: asString(document.title, "未命名纪念"),
    content: asString(document.content),
    occurredAt: asString(document.occurredAt),
    mood: asString(document.mood, "温柔"),
    files,
    createdAt: asNumber(document.createdAt),
    updatedAt: asNumber(document.updatedAt)
  }
}

const toStoredDraft = (draft: EntryDraft, timestamp: number): Omit<StoredEntryDocument, "_id"> => ({
  coupleId: appConfig.coupleId,
  kind: "memory",
  title: draft.title.trim(),
  content: draft.content.trim(),
  occurredAt: draft.occurredAt,
  mood: draft.mood.trim(),
  files: draft.files.map(stripRuntimeUrl),
  createdAt: timestamp,
  updatedAt: timestamp
})

const writeEntryCache = (entry: EntryRecord, insertIfMissing = true): void => {
  writeDataCache(dataCacheKeys.memoryDetail(entry.id), entry)
  upsertCachedListItem(dataCacheKeys.memoryList(), entry, {
    insertIfMissing
  })
}

const removeEntryCache = (id: string): void => {
  removeDataCache(dataCacheKeys.memoryDetail(id))
  removeCachedListItem(dataCacheKeys.memoryList(), id)
}

export interface MemoryTimelineCursor {
  rawOffset: number
}

export interface MemoryTimelinePage {
  items: EntryRecord[]
  nextCursor: MemoryTimelineCursor | undefined
  hasMore: boolean
  rawDocumentsConsumed: number
}

// CloudBase returns at most 20 documents per request in the current environment.
// Keep the raw request page size at that cap so we never silently truncate.
const CLOUDBASE_MEMORY_PAGE_SIZE = 20
// Visible timeline page size: how many memory cards the user sees per load.
const VISIBLE_MEMORY_PAGE_SIZE = 6
const MAX_MEMORY_PAGES = 100

const fetchMemoryTimelinePage = async (
  cursor: MemoryTimelineCursor = { rawOffset: 0 }
): Promise<MemoryTimelinePage> => {
  const collection = appConfig.entriesCollection
  const coupleId = appConfig.coupleId
  const memoryEntries: EntryRecord[] = []
  const seenIds = new Set<string>()
  const startRawOffset = cursor.rawOffset
  let rawOffset = startRawOffset
  let rawDocumentsConsumed = 0
  let lastRawPageSize = 0
  let lastBreakIndex = -1

  if (import.meta.env.DEV) {
    console.info(`[timeline-page] start rawOffset=${startRawOffset}`)
  }

  for (let page = 0; page < MAX_MEMORY_PAGES; page += 1) {
    if (import.meta.env.DEV) {
      console.info(`[timeline-page] raw query skip=${rawOffset} limit=${CLOUDBASE_MEMORY_PAGE_SIZE}`)
    }

    const documents = await listDocuments<StoredEntryDocument>(collection, {
      where: { coupleId },
      orderBy: {
        field: "createdAt",
        direction: "desc"
      },
      skip: rawOffset,
      limit: CLOUDBASE_MEMORY_PAGE_SIZE
    })

    lastRawPageSize = documents.length
    if (import.meta.env.DEV) {
      console.info(`[timeline-page] raw query returned ${lastRawPageSize} docs`)
    }

    if (lastRawPageSize === 0) {
      break
    }

    let visiblePageFilledInThisBatch = false

    for (let index = 0; index < documents.length; index += 1) {
      const document = documents[index]
      rawOffset += 1
      rawDocumentsConsumed += 1

      const entry = normalizeEntry(document)
      if (!entry || seenIds.has(entry.id)) {
        continue
      }

      seenIds.add(entry.id)
      memoryEntries.push(entry)

      if (memoryEntries.length >= VISIBLE_MEMORY_PAGE_SIZE) {
        lastBreakIndex = index
        visiblePageFilledInThisBatch = true
        break
      }
    }

    if (visiblePageFilledInThisBatch) {
      break
    }

    // The whole fetched batch was consumed and the visible page is still not full.
    if (lastRawPageSize < CLOUDBASE_MEMORY_PAGE_SIZE) {
      break
    }
  }

  const isVisiblePageFull = memoryEntries.length >= VISIBLE_MEMORY_PAGE_SIZE
  let hasMore = false

  if (isVisiblePageFull) {
    // If we stopped before the end of the fetched batch, unconsumed raw docs remain.
    // If we stopped on the final document of a short batch, the collection is exhausted.
    // If we stopped on the final document of a full batch, another raw page may exist.
    if (lastBreakIndex >= 0 && lastBreakIndex < lastRawPageSize - 1) {
      hasMore = true
    } else if (lastRawPageSize === CLOUDBASE_MEMORY_PAGE_SIZE) {
      hasMore = true
    }
  } else if (lastRawPageSize === CLOUDBASE_MEMORY_PAGE_SIZE) {
    // The visible page is not full, but the last consumed raw batch was full,
    // so more raw documents may yield additional memory entries.
    hasMore = true
  }

  if (import.meta.env.DEV) {
    console.info(
      `[timeline-page] end start=${startRawOffset} consumed=${rawDocumentsConsumed} memories=${memoryEntries.length} endRawOffset=${rawOffset} hasMore=${hasMore}`
    )
  }

  return {
    items: memoryEntries,
    nextCursor: hasMore ? { rawOffset } : undefined,
    hasMore,
    rawDocumentsConsumed
  }
}

export const loadMemoryTimelinePage = async (
  cursor?: MemoryTimelineCursor
): Promise<MemoryTimelinePage> => fetchMemoryTimelinePage(cursor)

const getNormalizedEntry = async (id: string): Promise<EntryRecord> => {
  const document = await getDocument<StoredEntryDocument>(appConfig.entriesCollection, id)
  const normalized = normalizeEntry({
    ...(isRecord(document) ? document : {}),
    _id: id
  } as StoredEntryDocument)

  if (!normalized) {
    throw entryUnavailableError()
  }

  return normalized
}

export const getEntry = async (id: string): Promise<EntryRecord> => {
  try {
    const entry = await getNormalizedEntry(id)
    writeEntryCache(entry, false)
    return entry
  } catch (error) {
    if (isEntryUnavailableError(error)) {
      removeDataCache(dataCacheKeys.memoryDetail(id))
    }
    throw error
  }
}

export const createEntry = async (draft: EntryDraft): Promise<EntryRecord> => {
  const now = Date.now()
  const id = await addDocument(appConfig.entriesCollection, toStoredDraft(draft, now))
  const entry = await getEntry(id)
  writeEntryCache(entry)
  return entry
}

export const updateEntry = async (id: string, draft: EntryDraft): Promise<EntryRecord> => {
  await getNormalizedEntry(id)

  const now = Date.now()
  await updateDocument<Omit<StoredEntryDocument, "_id">>(appConfig.entriesCollection, id, {
    coupleId: appConfig.coupleId,
    kind: "memory",
    title: draft.title.trim(),
    content: draft.content.trim(),
    occurredAt: draft.occurredAt,
    mood: draft.mood.trim(),
    files: draft.files.map(stripRuntimeUrl),
    updatedAt: now
  })

  const entry = await getEntry(id)
  writeEntryCache(entry)
  return entry
}

export const deleteEntry = async (id: string): Promise<void> => {
  const entry = await getEntry(id)
  const fileIDs = entry.files.map((file) => file.fileID)
  await removeDocument(appConfig.entriesCollection, id)
  removeEntryCache(id)
  queueCloudFilesForCleanup(fileIDs)
}

export const deleteEntryFiles = async (files: CloudFile[]): Promise<void> => {
  await deleteCloudFiles(files.map((file) => file.fileID))
}

export const queueEntryFilesForCleanup = (files: CloudFile[]): void => {
  const fileIDs = Array.from(
    new Set(
      files
        .map((file) => file.fileID.trim())
        .filter((fileID) => fileID.length > 0)
    )
  )

  if (fileIDs.length === 0) {
    return
  }

  queueCloudFilesForCleanup(fileIDs)
}
