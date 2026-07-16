/**
 * 我们的小日子 —— `love_entries` 中 `kind: "moment"` 记录的仓储与缓存生命周期。
 *
 * 只负责持久化字段、防御性归一化与本地缓存同步；已过天数、剩余天数、周年数、
 * 里程碑等展示派生值永远由 `src/domain/moments` 的 `projectMoment(record, today)`
 * 在读取后现场计算，绝不落库。
 *
 * 存储字段（与 `src/domain/moments/types.ts` 的草稿一一对应）：
 * - 公共字段：`coupleId`、`kind`、`title`、`content`、`occurredAt`、`mood`、`files`、`createdAt`、`updatedAt`；
 *   其中 `occurredAt` 固定写入归一化后的源日期，`mood` 固定写入分类中文标签。
 * - 小日子字段：`momentCategory`、`momentSourceDate`、`momentPinned`、`momentTemplate`、
 *   `momentReminderOffsets`、`momentMilestoneValues`、`momentMode`、`momentRecurrence`、
 *   `momentCounting`、`momentDisplay`、`momentLeapDayPolicy`。
 */
import { appConfig } from "@/config/app"
import {
  compareCalendarDates,
  isValidCalendarDate,
  momentCategoryLabels,
  normalizeMilestoneValues,
  projectMoment,
  todayCalendarDate,
  type MomentCategory,
  type MomentCounting,
  type MomentDirection,
  type MomentDisplay,
  type MomentDisplayMode,
  type MomentDraft,
  type MomentFile,
  type MomentLeapDayPolicy,
  type MomentRecord,
  type MomentRecurrence
} from "@/domain/moments"
import {
  addDocument,
  CloudBaseUserError,
  getDocument,
  listDocuments,
  removeDocument,
  updateDocument
} from "@/services/cloudbase"
import { queueCloudFilesForCleanup } from "@/services/cloud-file-cleanup"
import {
  dataCacheKeys,
  mergeStableList,
  mergeStableRecord,
  readDataCache,
  removeCachedListItem,
  removeDataCache,
  upsertCachedListItem,
  writeDataCache
} from "@/services/data-cache"
import type { LoveEntryKind } from "@/services/repositories/entries"

interface StoredMomentDocument {
  _id?: string
  coupleId?: string
  kind?: LoveEntryKind
  title?: string
  content?: string
  occurredAt?: string
  mood?: string
  files?: unknown[]
  momentCategory?: MomentCategory
  momentSourceDate?: string
  momentPinned?: boolean
  momentTemplate?: string
  momentReminderOffsets?: number[]
  momentMilestoneValues?: number[]
  momentMode?: MomentDisplayMode
  momentRecurrence?: MomentRecurrence
  momentCounting?: MomentCounting
  momentDisplay?: MomentDisplay
  momentLeapDayPolicy?: MomentLeapDayPolicy
  createdAt?: number
  updatedAt?: number
}

const DEFAULT_MOMENT_TITLE = "未命名小日子"
const DEFAULT_MOMENT_TEMPLATE = "{title}"
const INVALID_SOURCE_DATE_MESSAGE = "这个小日子的日期不太对，请检查后再试。"

const MOMENT_UNAVAILABLE_MESSAGE = "这个小日子暂时打不开，请稍后再试一次。"

const momentUnavailableError = (): CloudBaseUserError => new CloudBaseUserError(MOMENT_UNAVAILABLE_MESSAGE)

export const isMomentUnavailableError = (error: unknown): boolean =>
  error instanceof CloudBaseUserError && error.message === MOMENT_UNAVAILABLE_MESSAGE

const wrapMomentCloudError = (message: string, error: unknown): never => {
  if (isMomentUnavailableError(error)) {
    throw error
  }

  if (error instanceof CloudBaseUserError) {
    throw new CloudBaseUserError(message, error.causeDetail || error.message)
  }

  throw error
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asString = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback)

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const normalizeMomentCategory = (value: unknown): MomentCategory =>
  value === "anniversary" ||
  value === "birthday" ||
  value === "first" ||
  value === "travel" ||
  value === "daily" ||
  value === "custom"
    ? value
    : "custom"

const normalizeMomentMode = (value: unknown): MomentDisplayMode =>
  value === "auto" || value === "countup" || value === "countdown" ? value : "auto"

const normalizeMomentRecurrence = (value: unknown): MomentRecurrence => (value === "yearly" ? "yearly" : "none")

const normalizeMomentCounting = (value: unknown): MomentCounting => (value === "ordinal" ? "ordinal" : "elapsed")

const normalizeMomentDisplay = (value: unknown): MomentDisplay => (value === "calendar" ? "calendar" : "days")

const normalizeMomentLeapDayPolicy = (value: unknown): MomentLeapDayPolicy =>
  value === "feb28" || value === "mar1" || value === "skip" ? value : "feb28"

/** 源日期必须是可以回读的真实公历日期；非法输入归一为空串，由调用方决定拒绝或回退。 */
const normalizeSourceDate = (value: unknown): string => {
  const trimmed = asString(value).trim()
  return isValidCalendarDate(trimmed) ? trimmed : ""
}

const normalizeTemplate = (value: unknown): string => asString(value).trim() || DEFAULT_MOMENT_TEMPLATE

/** 提醒偏移归一为「唯一、有限、非负整数」，升序排列保证读写两侧语义一致。 */
const normalizeReminderOffsets = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<number>()
  return value
    .filter((item): item is number => typeof item === "number" && Number.isFinite(item) && item >= 0)
    .map((item) => Math.trunc(item))
    .filter((item) => {
      if (seen.has(item)) {
        return false
      }
      seen.add(item)
      return true
    })
    .sort((left, right) => left - right)
}

/** 文件只保留持久化字段；运行时临时链接（resolvedTempURL / tempFileURL）不进记录、不落库。 */
const normalizeStoredFile = (value: unknown): MomentFile | null => {
  if (!isRecord(value)) {
    return null
  }

  const fileID = asString(value.fileID).trim()
  const cloudPath = asString(value.cloudPath).trim()
  if (!fileID || !cloudPath) {
    return null
  }

  const file: MomentFile = {
    fileID,
    cloudPath,
    name: asString(value.name).trim() || "memory.jpg",
    type: value.type === "file" ? "file" : "image"
  }

  if (typeof value.size === "number" && Number.isFinite(value.size)) {
    file.size = value.size
  }

  if (typeof value.uploadedAt === "number" && Number.isFinite(value.uploadedAt)) {
    file.uploadedAt = value.uploadedAt
  }

  return file
}

const stripRuntimeUrl = (file: MomentFile): MomentFile => {
  const stripped: MomentFile = {
    fileID: file.fileID,
    cloudPath: file.cloudPath,
    name: file.name,
    type: file.type
  }

  if (typeof file.size === "number") {
    stripped.size = file.size
  }

  if (typeof file.uploadedAt === "number") {
    stripped.uploadedAt = file.uploadedAt
  }

  return stripped
}

/**
 * 防御性归一化不可信文档：要求有效 id、`coupleId` 匹配、`kind` 精确为 `"moment"`、
 * 源日期合法（`momentSourceDate` 缺失或非法时允许回退到 `occurredAt`）；其余字段
 * 一律归一到安全默认值。不满足硬性条件的记录视为损坏，返回 `null` 拒绝。
 */
const normalizeMoment = (document: StoredMomentDocument): MomentRecord | null => {
  const id = asString(document._id).trim()
  if (!id || document.coupleId !== appConfig.coupleId || document.kind !== "moment") {
    return null
  }

  const sourceDate = normalizeSourceDate(document.momentSourceDate) || normalizeSourceDate(document.occurredAt)
  if (!sourceDate) {
    return null
  }

  const category = normalizeMomentCategory(document.momentCategory)
  const createdAt = asNumber(document.createdAt)
  const files = Array.isArray(document.files)
    ? document.files.map(normalizeStoredFile).filter((file): file is MomentFile => file !== null)
    : []

  return {
    id,
    kind: "moment",
    category,
    title: asString(document.title).trim() || DEFAULT_MOMENT_TITLE,
    content: asString(document.content).trim(),
    sourceDate,
    pinned: document.momentPinned === true,
    files,
    template: normalizeTemplate(document.momentTemplate),
    reminderOffsets: normalizeReminderOffsets(document.momentReminderOffsets),
    milestoneValues: normalizeMilestoneValues(document.momentMilestoneValues),
    mode: normalizeMomentMode(document.momentMode),
    recurrence: normalizeMomentRecurrence(document.momentRecurrence),
    counting: normalizeMomentCounting(document.momentCounting),
    display: normalizeMomentDisplay(document.momentDisplay),
    leapDayPolicy: normalizeMomentLeapDayPolicy(document.momentLeapDayPolicy),
    createdAt,
    updatedAt: asNumber(document.updatedAt, createdAt)
  }
}

const momentDirectionRank: Record<MomentDirection, number> = {
  today: 0,
  countdown: 1,
  countup: 2
}

/**
 * 确定性排序比较器，`today` 必须显式传入（`YYYY-MM-DD`）。
 *
 * 契约（所有方向与天数都通过 `projectMoment(record, today)` 派生，不重复日期运算）：
 * 1. 置顶优先；2. 今天发生的记录；3. 倒计时按剩余天数由近到远；
 * 4. 正计时按源日期由新到旧；5. `updatedAt` 倒序；6. `id` 升序。
 */
export const compareMoments = (left: MomentRecord, right: MomentRecord, today: string): number => {
  if (left.pinned !== right.pinned) {
    return left.pinned ? -1 : 1
  }

  const leftProjection = projectMoment(left, today)
  const rightProjection = projectMoment(right, today)

  const directionRankDiff = momentDirectionRank[leftProjection.direction] - momentDirectionRank[rightProjection.direction]
  if (directionRankDiff !== 0) {
    return directionRankDiff
  }

  if (leftProjection.direction === "countdown" && leftProjection.remainingDays !== rightProjection.remainingDays) {
    return leftProjection.remainingDays - rightProjection.remainingDays
  }

  if (leftProjection.direction === "countup") {
    const sourceDateDiff = compareCalendarDates(right.sourceDate, left.sourceDate)
    if (sourceDateDiff !== 0) {
      return sourceDateDiff
    }
  }

  return right.updatedAt - left.updatedAt || left.id.localeCompare(right.id)
}

const compareMomentsForToday = (): ((left: MomentRecord, right: MomentRecord) => number) => {
  const today = todayCalendarDate()
  return (left, right) => compareMoments(left, right, today)
}

/** 草稿的源日期必须先合法，否则拒绝写入，避免落库后被自身归一化逻辑判为损坏记录。 */
const ensureValidDraftSourceDate = (draft: MomentDraft): void => {
  if (!normalizeSourceDate(draft.sourceDate)) {
    throw new CloudBaseUserError(INVALID_SOURCE_DATE_MESSAGE)
  }
}

const toStoredMoment = (
  draft: MomentDraft,
  timestamp: number,
  existing: MomentRecord | null = null
): StoredMomentDocument => {
  const category = normalizeMomentCategory(draft.category)
  const sourceDate = normalizeSourceDate(draft.sourceDate)
  const createdAt = existing?.createdAt ?? timestamp

  return {
    coupleId: appConfig.coupleId,
    kind: "moment",
    title: draft.title.trim(),
    content: draft.content.trim(),
    occurredAt: sourceDate,
    mood: momentCategoryLabels[category],
    files: draft.files.map(stripRuntimeUrl),
    momentCategory: category,
    momentSourceDate: sourceDate,
    momentPinned: draft.pinned === true,
    momentTemplate: normalizeTemplate(draft.template),
    momentReminderOffsets: normalizeReminderOffsets(draft.reminderOffsets),
    momentMilestoneValues: normalizeMilestoneValues(draft.milestoneValues),
    momentMode: normalizeMomentMode(draft.mode),
    momentRecurrence: normalizeMomentRecurrence(draft.recurrence),
    momentCounting: normalizeMomentCounting(draft.counting),
    momentDisplay: normalizeMomentDisplay(draft.display),
    momentLeapDayPolicy: normalizeMomentLeapDayPolicy(draft.leapDayPolicy),
    createdAt,
    updatedAt: timestamp
  }
}

const writeMomentCache = (moment: MomentRecord, insertIfMissing = true): MomentRecord => {
  const detailKey = dataCacheKeys.momentDetail(moment.id)
  const cachedDetail = readDataCache<MomentRecord>(detailKey)
  const mergedMoment = cachedDetail ? mergeStableRecord(cachedDetail, moment) : moment
  writeDataCache(detailKey, mergedMoment)
  upsertCachedListItem(dataCacheKeys.momentList(), mergedMoment, {
    insertIfMissing,
    sort: compareMomentsForToday()
  })
  return mergedMoment
}

const writeMomentListCache = (moments: MomentRecord[]): MomentRecord[] => {
  const listKey = dataCacheKeys.momentList()
  const cachedList = readDataCache<MomentRecord[]>(listKey)
  const mergedList = cachedList ? mergeStableList(cachedList, moments) : moments
  writeDataCache(listKey, mergedList)
  return mergedList
}

const removeMomentCache = (id: string): void => {
  removeDataCache(dataCacheKeys.momentDetail(id))
  removeCachedListItem(dataCacheKeys.momentList(), id)
}

export const listMoments = async (): Promise<MomentRecord[]> => {
  try {
    const documents = await listDocuments<StoredMomentDocument>(appConfig.entriesCollection, {
      where: {
        coupleId: appConfig.coupleId,
        kind: "moment"
      },
      orderBy: {
        field: "updatedAt",
        direction: "desc"
      },
      limit: 100
    })

    const today = todayCalendarDate()
    const moments = documents
      .map(normalizeMoment)
      .filter((moment): moment is MomentRecord => moment !== null)
      .sort((left, right) => compareMoments(left, right, today))

    return writeMomentListCache(moments)
  } catch (error) {
    return wrapMomentCloudError("小日子暂时没翻到，请稍后再试。", error)
  }
}

export const getMoment = async (id: string): Promise<MomentRecord> => {
  try {
    const document = await getDocument<StoredMomentDocument>(appConfig.entriesCollection, id)
    const moment = normalizeMoment({
      ...(isRecord(document) ? document : {}),
      _id: id
    } as StoredMomentDocument)

    if (!moment) {
      throw momentUnavailableError()
    }

    return writeMomentCache(moment, false)
  } catch (error) {
    if (isMomentUnavailableError(error)) {
      removeDataCache(dataCacheKeys.momentDetail(id))
      throw error
    }
    return wrapMomentCloudError("这个小日子暂时没翻到，请稍后再试。", error)
  }
}

export const createMoment = async (draft: MomentDraft): Promise<MomentRecord> => {
  ensureValidDraftSourceDate(draft)

  try {
    const now = Date.now()
    const id = await addDocument(appConfig.entriesCollection, toStoredMoment(draft, now))
    const moment = await getMoment(id)
    return writeMomentCache(moment)
  } catch (error) {
    return wrapMomentCloudError("这个小日子暂时没收好，请稍后再试。", error)
  }
}

export const updateMoment = async (id: string, draft: MomentDraft): Promise<MomentRecord> => {
  ensureValidDraftSourceDate(draft)

  try {
    const existing = await getMoment(id)
    const now = Date.now()
    await updateDocument<StoredMomentDocument>(appConfig.entriesCollection, id, toStoredMoment(draft, now, existing))
    const moment = await getMoment(id)
    return writeMomentCache(moment)
  } catch (error) {
    return wrapMomentCloudError("这个小日子暂时没改好，请稍后再试。", error)
  }
}

export const deleteMoment = async (id: string): Promise<void> => {
  try {
    const moment = await getMoment(id)
    const fileIDs = moment.files.map((file) => file.fileID)
    await removeDocument(appConfig.entriesCollection, id)
    removeMomentCache(id)
    queueCloudFilesForCleanup(fileIDs)
  } catch (error) {
    return wrapMomentCloudError("这个小日子暂时没删掉，请稍后再试。", error)
  }
}
