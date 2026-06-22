import { appConfig } from "@/config/app"
import {
  addDocument,
  CloudBaseUserError,
  getDocument,
  listDocuments,
  removeDocument,
  updateDocument
} from "@/services/cloudbase"
import {
  dataCacheKeys,
  removeCachedListItem,
  removeDataCache,
  upsertCachedListItem,
  writeDataCache
} from "@/services/data-cache"
import type { LoveEntryKind } from "@/services/repositories/entries"

export type MemoCategory = "favorite" | "profile" | "avoid" | "gift" | "date" | "note"

export const memoCategoryLabels: Record<MemoCategory, string> = {
  favorite: "喜欢",
  profile: "小档案",
  avoid: "避雷",
  gift: "礼物线索",
  date: "重要日子",
  note: "随手记"
}

export interface MemoDraft {
  title: string
  content: string
  memoCategory: MemoCategory
  memoPinned: boolean
}

export interface MemoRecord extends MemoDraft {
  id: string
  kind: "memo"
  occurredAt: string
  mood: string
  createdAt: number
  updatedAt: number
}

interface StoredMemoDocument {
  _id?: string
  coupleId?: string
  kind?: LoveEntryKind
  title?: string
  content?: string
  occurredAt?: string
  mood?: string
  files?: unknown[]
  memoCategory?: MemoCategory
  memoPinned?: boolean
  createdAt?: number
  updatedAt?: number
}

const asString = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback)

const asNumber = (value: unknown, fallback = 0): number => (typeof value === "number" ? value : fallback)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const normalizeKind = (value: unknown): LoveEntryKind =>
  value === "memory" || value === "song" || value === "task" || value === "memo" ? value : "memory"

const normalizeMemoCategory = (value: unknown): MemoCategory =>
  value === "favorite" ||
  value === "profile" ||
  value === "avoid" ||
  value === "gift" ||
  value === "date" ||
  value === "note"
    ? value
    : "note"

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const MEMO_UNAVAILABLE_MESSAGE = "这张小线索暂时打不开，请稍后再试一次。"

const memoUnavailableError = (): CloudBaseUserError => new CloudBaseUserError(MEMO_UNAVAILABLE_MESSAGE)

export const isMemoUnavailableError = (error: unknown): boolean =>
  error instanceof CloudBaseUserError && error.message === MEMO_UNAVAILABLE_MESSAGE

const wrapMemoCloudError = (message: string, error: unknown): never => {
  if (isMemoUnavailableError(error)) {
    throw error
  }

  if (error instanceof CloudBaseUserError) {
    throw new CloudBaseUserError(message, error.causeDetail || error.message)
  }

  throw error
}

const normalizeMemo = (document: StoredMemoDocument): MemoRecord | null => {
  const id = asString(document._id)
  if (!id || document.coupleId !== appConfig.coupleId || normalizeKind(document.kind) !== "memo") {
    return null
  }

  const memoCategory = normalizeMemoCategory(document.memoCategory)
  const createdAt = asNumber(document.createdAt)

  return {
    id,
    kind: "memo",
    title: asString(document.title, "未命名小线索"),
    content: asString(document.content),
    memoCategory,
    memoPinned: document.memoPinned === true,
    occurredAt: asString(document.occurredAt, formatDate(createdAt > 0 ? createdAt : Date.now())),
    mood: asString(document.mood, memoCategoryLabels[memoCategory]),
    createdAt,
    updatedAt: asNumber(document.updatedAt, createdAt)
  }
}

const compareMemos = (left: MemoRecord, right: MemoRecord): number => {
  if (left.memoPinned !== right.memoPinned) {
    return left.memoPinned ? -1 : 1
  }

  return right.updatedAt - left.updatedAt || right.createdAt - left.createdAt || left.id.localeCompare(right.id)
}

const toStoredMemo = (
  draft: MemoDraft,
  timestamp: number,
  existing: MemoRecord | null = null
): StoredMemoDocument => {
  const memoCategory = normalizeMemoCategory(draft.memoCategory)
  const createdAt = existing?.createdAt ?? timestamp

  return {
    coupleId: appConfig.coupleId,
    kind: "memo",
    title: draft.title.trim(),
    content: draft.content.trim(),
    occurredAt: existing?.occurredAt ?? formatDate(createdAt),
    mood: memoCategoryLabels[memoCategory],
    files: [],
    memoCategory,
    memoPinned: draft.memoPinned === true,
    createdAt,
    updatedAt: timestamp
  }
}

const writeMemoCache = (memo: MemoRecord, insertIfMissing = true): void => {
  writeDataCache(dataCacheKeys.memoDetail(memo.id), memo)
  upsertCachedListItem(dataCacheKeys.memoList(), memo, {
    insertIfMissing,
    sort: compareMemos
  })
}

const removeMemoCache = (id: string): void => {
  removeDataCache(dataCacheKeys.memoDetail(id))
  removeCachedListItem(dataCacheKeys.memoList(), id)
}

export const listMemos = async (): Promise<MemoRecord[]> => {
  try {
    const documents = await listDocuments<StoredMemoDocument>(appConfig.entriesCollection, {
      where: {
        coupleId: appConfig.coupleId
      },
      orderBy: {
        field: "updatedAt",
        direction: "desc"
      },
      limit: 100
    })

    const memos = documents.map(normalizeMemo).filter((memo): memo is MemoRecord => memo !== null).sort(compareMemos)
    writeDataCache(dataCacheKeys.memoList(), memos)
    return memos
  } catch (error) {
    return wrapMemoCloudError("小线索暂时没翻到，请稍后再试。", error)
  }
}

export const getMemo = async (id: string): Promise<MemoRecord> => {
  try {
    const document = await getDocument<StoredMemoDocument>(appConfig.entriesCollection, id)
    const memo = normalizeMemo({
      ...(isRecord(document) ? document : {}),
      _id: id
    } as StoredMemoDocument)

    if (!memo) {
      throw memoUnavailableError()
    }

    writeMemoCache(memo, false)
    return memo
  } catch (error) {
    if (isMemoUnavailableError(error)) {
      removeDataCache(dataCacheKeys.memoDetail(id))
      throw error
    }
    return wrapMemoCloudError("这张小线索暂时没翻到，请稍后再试。", error)
  }
}

export const createMemo = async (draft: MemoDraft): Promise<MemoRecord> => {
  try {
    const now = Date.now()
    const id = await addDocument(appConfig.entriesCollection, toStoredMemo(draft, now))
    const memo = await getMemo(id)
    writeMemoCache(memo)
    return memo
  } catch (error) {
    return wrapMemoCloudError("小线索暂时没收好，请稍后再试。", error)
  }
}

export const updateMemo = async (id: string, draft: MemoDraft): Promise<MemoRecord> => {
  try {
    const existing = await getMemo(id)
    const now = Date.now()
    await updateDocument<StoredMemoDocument>(appConfig.entriesCollection, id, toStoredMemo(draft, now, existing))
    const memo = await getMemo(id)
    writeMemoCache(memo)
    return memo
  } catch (error) {
    return wrapMemoCloudError("小线索暂时没改好，请稍后再试。", error)
  }
}

export const deleteMemo = async (id: string): Promise<void> => {
  try {
    await getMemo(id)
    await removeDocument(appConfig.entriesCollection, id)
    removeMemoCache(id)
  } catch (error) {
    return wrapMemoCloudError("这条小线索暂时没删掉，请稍后再试。", error)
  }
}

export const toggleMemoPinned = async (id: string, pinned: boolean): Promise<MemoRecord> => {
  try {
    await getMemo(id)
    const now = Date.now()

    await updateDocument<StoredMemoDocument>(appConfig.entriesCollection, id, {
      coupleId: appConfig.coupleId,
      kind: "memo",
      files: [],
      memoPinned: pinned === true,
      updatedAt: now
    })

    const memo = await getMemo(id)
    writeMemoCache(memo)
    return memo
  } catch (error) {
    return wrapMemoCloudError("小线索暂时没改好，请稍后再试。", error)
  }
}
