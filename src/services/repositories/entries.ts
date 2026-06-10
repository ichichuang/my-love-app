import { appConfig } from "@/config/app"
import {
  addDocument,
  deleteCloudFiles,
  getDocument,
  getTemporaryFileURLs,
  listDocuments,
  removeDocument,
  updateDocument,
  type CloudFile
} from "@/services/cloudbase"

export interface EntryDraft {
  title: string
  content: string
  occurredAt: string
  mood: string
  files: CloudFile[]
}

export interface EntryRecord extends EntryDraft {
  id: string
  createdAt: number
  updatedAt: number
}

type StoredCloudFile = Omit<CloudFile, "tempFileURL">

interface StoredEntryDocument {
  _id?: string
  coupleId: string
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

const stripTemporaryUrl = (file: CloudFile): StoredCloudFile => ({
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
  if (!id) {
    return null
  }

  const files = Array.isArray(document.files)
    ? document.files.map(normalizeStoredFile).filter((file): file is StoredCloudFile => file !== null)
    : []

  return {
    id,
    title: asString(document.title, "未命名纪念"),
    content: asString(document.content),
    occurredAt: asString(document.occurredAt),
    mood: asString(document.mood, "温柔"),
    files,
    createdAt: asNumber(document.createdAt),
    updatedAt: asNumber(document.updatedAt)
  }
}

const attachTemporaryUrls = async (entries: EntryRecord[]): Promise<EntryRecord[]> => {
  const fileIDs = entries.flatMap((entry) => entry.files.map((file) => file.fileID))
  const tempUrls = await getTemporaryFileURLs(fileIDs)

  return entries.map((entry) => ({
    ...entry,
    files: entry.files.map((file) => ({
      ...file,
      tempFileURL: tempUrls.get(file.fileID)
    }))
  }))
}

const toStoredDraft = (draft: EntryDraft, timestamp: number): Omit<StoredEntryDocument, "_id"> => ({
  coupleId: appConfig.coupleId,
  title: draft.title.trim(),
  content: draft.content.trim(),
  occurredAt: draft.occurredAt,
  mood: draft.mood.trim(),
  files: draft.files.map(stripTemporaryUrl),
  createdAt: timestamp,
  updatedAt: timestamp
})

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
  return attachTemporaryUrls(entries)
}

export const getEntry = async (id: string): Promise<EntryRecord> => {
  const document = await getDocument<StoredEntryDocument>(appConfig.entriesCollection, id)
  const normalized = normalizeEntry({
    ...document,
    _id: id
  })

  if (!normalized) {
    throw new Error("回忆不存在")
  }

  const [entry] = await attachTemporaryUrls([normalized])
  return entry
}

export const createEntry = async (draft: EntryDraft): Promise<EntryRecord> => {
  const now = Date.now()
  const id = await addDocument(appConfig.entriesCollection, toStoredDraft(draft, now))
  return getEntry(id)
}

export const updateEntry = async (id: string, draft: EntryDraft): Promise<EntryRecord> => {
  const now = Date.now()
  await updateDocument<Omit<StoredEntryDocument, "_id">>(appConfig.entriesCollection, id, {
    coupleId: appConfig.coupleId,
    title: draft.title.trim(),
    content: draft.content.trim(),
    occurredAt: draft.occurredAt,
    mood: draft.mood.trim(),
    files: draft.files.map(stripTemporaryUrl),
    updatedAt: now
  })

  return getEntry(id)
}

export const deleteEntry = async (id: string): Promise<void> => {
  const entry = await getEntry(id)
  await deleteCloudFiles(entry.files.map((file) => file.fileID))
  await removeDocument(appConfig.entriesCollection, id)
}

export const deleteEntryFiles = async (files: CloudFile[]): Promise<void> => {
  await deleteCloudFiles(files.map((file) => file.fileID))
}
