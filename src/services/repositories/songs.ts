import { appConfig } from "@/config/app"
import {
  addDocument,
  CloudBaseUserError,
  getDocument,
  listDocuments,
  removeDocument,
  updateDocument
} from "@/services/cloudbase"
import type { LoveEntryKind } from "@/services/repositories/entries"

export type SongStatus = "wanted" | "sung" | "paused"
export type SongPriority = "high" | "normal" | "anytime"

export interface SongDraft {
  title: string
  content: string
  artist: string
  songStatus: SongStatus
  songPriority: SongPriority
}

export interface SongRecord extends SongDraft {
  id: string
  kind: "song"
  occurredAt: string
  mood: string
  createdAt: number
  updatedAt: number
  sungAt?: number
}

export const songStatusLabels: Record<SongStatus, string> = {
  wanted: "想听",
  sung: "已唱",
  paused: "暂缓"
}

export const songPriorityLabels: Record<SongPriority, string> = {
  high: "很想听",
  normal: "想听",
  anytime: "随时"
}

interface StoredSongDocument {
  _id?: string
  coupleId?: string
  kind?: LoveEntryKind
  title?: string
  content?: string
  occurredAt?: string
  mood?: string
  files?: unknown[]
  artist?: string
  songStatus?: SongStatus
  songPriority?: SongPriority
  sungAt?: number
  createdAt?: number
  updatedAt?: number
}

const songStatusRank: Record<SongStatus, number> = {
  wanted: 0,
  paused: 1,
  sung: 2
}

const songPriorityRank: Record<SongPriority, number> = {
  high: 0,
  normal: 1,
  anytime: 2
}

const asString = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback)

const asNumber = (value: unknown, fallback = 0): number => (typeof value === "number" ? value : fallback)

const asPositiveNumber = (value: unknown): number | undefined =>
  typeof value === "number" && value > 0 ? value : undefined

const normalizeKind = (value: unknown): LoveEntryKind =>
  value === "memory" || value === "song" || value === "task" ? value : "memory"

const normalizeSongStatus = (value: unknown): SongStatus =>
  value === "sung" || value === "paused" || value === "wanted" ? value : "wanted"

const normalizeSongPriority = (value: unknown): SongPriority =>
  value === "high" || value === "anytime" || value === "normal" ? value : "normal"

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const songUnavailableError = (): CloudBaseUserError =>
  new CloudBaseUserError("点歌记录暂时打不开，请检查这首歌是否仍然存在。")

const normalizeSong = (document: StoredSongDocument): SongRecord | null => {
  const id = asString(document._id)
  if (!id || document.coupleId !== appConfig.coupleId || normalizeKind(document.kind) !== "song") {
    return null
  }

  const songStatus = normalizeSongStatus(document.songStatus)
  const songPriority = normalizeSongPriority(document.songPriority)
  const createdAt = asNumber(document.createdAt)
  const updatedAt = asNumber(document.updatedAt, createdAt)
  const createdDateSource = createdAt > 0 ? createdAt : Date.now()
  const sungAt = songStatus === "sung" ? asPositiveNumber(document.sungAt) : undefined
  const record: SongRecord = {
    id,
    kind: "song",
    title: asString(document.title, "未命名歌曲"),
    content: asString(document.content),
    artist: asString(document.artist),
    songStatus,
    songPriority,
    occurredAt: asString(document.occurredAt, formatDate(sungAt ?? createdDateSource)),
    mood: asString(document.mood, songPriorityLabels[songPriority]),
    createdAt,
    updatedAt
  }

  if (typeof sungAt === "number") {
    record.sungAt = sungAt
  }

  return record
}

const compareSongs = (left: SongRecord, right: SongRecord): number =>
  songStatusRank[left.songStatus] - songStatusRank[right.songStatus] ||
  songPriorityRank[left.songPriority] - songPriorityRank[right.songPriority] ||
  right.updatedAt - left.updatedAt ||
  right.createdAt - left.createdAt ||
  left.id.localeCompare(right.id)

const resolveSungAtForDraft = (status: SongStatus, existing: SongRecord | null, timestamp: number): number => {
  if (status !== "sung") {
    return 0
  }

  return existing?.songStatus === "sung" && typeof existing.sungAt === "number" ? existing.sungAt : timestamp
}

const resolveOccurredAt = (status: SongStatus, sungAt: number, createdAt: number, timestamp: number): string => {
  if (status === "sung" && sungAt > 0) {
    return formatDate(sungAt)
  }

  return formatDate(createdAt > 0 ? createdAt : timestamp)
}

const toStoredSong = (
  draft: SongDraft,
  timestamp: number,
  existing: SongRecord | null = null
): StoredSongDocument => {
  const songStatus = normalizeSongStatus(draft.songStatus)
  const songPriority = normalizeSongPriority(draft.songPriority)
  const createdAt = existing?.createdAt ?? timestamp
  const sungAt = resolveSungAtForDraft(songStatus, existing, timestamp)

  return {
    coupleId: appConfig.coupleId,
    kind: "song",
    title: draft.title.trim(),
    content: draft.content.trim(),
    occurredAt: resolveOccurredAt(songStatus, sungAt, createdAt, timestamp),
    mood: songPriorityLabels[songPriority],
    files: [],
    artist: draft.artist.trim(),
    songStatus,
    songPriority,
    sungAt,
    createdAt,
    updatedAt: timestamp
  }
}

export const listSongs = async (): Promise<SongRecord[]> => {
  const documents = await listDocuments<StoredSongDocument>(appConfig.entriesCollection, {
    where: {
      coupleId: appConfig.coupleId
    },
    orderBy: {
      field: "updatedAt",
      direction: "desc"
    },
    limit: 100
  })

  return documents.map(normalizeSong).filter((song): song is SongRecord => song !== null).sort(compareSongs)
}

export const getSong = async (id: string): Promise<SongRecord> => {
  const document = await getDocument<StoredSongDocument>(appConfig.entriesCollection, id)
  const song = normalizeSong({
    ...document,
    _id: id
  })

  if (!song) {
    throw songUnavailableError()
  }

  return song
}

export const createSong = async (draft: SongDraft): Promise<SongRecord> => {
  const now = Date.now()
  const id = await addDocument(appConfig.entriesCollection, toStoredSong(draft, now))
  return getSong(id)
}

export const updateSong = async (id: string, draft: SongDraft): Promise<SongRecord> => {
  const existing = await getSong(id)
  const now = Date.now()
  await updateDocument<StoredSongDocument>(appConfig.entriesCollection, id, toStoredSong(draft, now, existing))
  return getSong(id)
}

export const updateSongStatus = async (id: string, status: SongStatus): Promise<SongRecord> => {
  const existing = await getSong(id)
  const now = Date.now()
  const songStatus = normalizeSongStatus(status)
  const sungAt = songStatus === "sung" ? now : 0

  await updateDocument<StoredSongDocument>(appConfig.entriesCollection, id, {
    coupleId: appConfig.coupleId,
    kind: "song",
    files: [],
    songStatus,
    sungAt,
    occurredAt: resolveOccurredAt(songStatus, sungAt, existing.createdAt, now),
    mood: songPriorityLabels[existing.songPriority],
    updatedAt: now
  })

  return getSong(id)
}

export const deleteSong = async (id: string): Promise<void> => {
  await getSong(id)
  await removeDocument(appConfig.entriesCollection, id)
}
