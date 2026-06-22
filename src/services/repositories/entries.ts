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

export const listEntries = async (): Promise<EntryRecord[]> => {
  const documents = await listDocuments<StoredEntryDocument>(appConfig.entriesCollection, {
    where: {
      coupleId: appConfig.coupleId
    },
    orderBy: {
      field: "createdAt",
      direction: "desc"
    },
    limit: 50
  })

  const entries = documents.map(normalizeEntry).filter((entry): entry is EntryRecord => entry !== null)
  writeDataCache(dataCacheKeys.memoryList(), entries)
  return entries
}

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
