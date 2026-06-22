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
import { normalizeCalendarDate } from "@/utils/date"

export interface TaskDraft {
  title: string
  content: string
  taskDone: boolean
  taskDueDate: string
}

export interface TaskRecord extends TaskDraft {
  id: string
  kind: "task"
  occurredAt: string
  mood: string
  createdAt: number
  updatedAt: number
  taskCompletedAt?: number
}

interface StoredTaskDocument {
  _id?: string
  coupleId?: string
  kind?: LoveEntryKind
  title?: string
  content?: string
  occurredAt?: string
  mood?: string
  files?: unknown[]
  taskDone?: boolean
  taskDueDate?: string
  taskCompletedAt?: number
  createdAt?: number
  updatedAt?: number
}

const asString = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback)

const asNumber = (value: unknown, fallback = 0): number => (typeof value === "number" ? value : fallback)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asPositiveNumber = (value: unknown): number | undefined =>
  typeof value === "number" && value > 0 ? value : undefined

const normalizeKind = (value: unknown): LoveEntryKind =>
  value === "memory" || value === "song" || value === "task" || value === "memo" ? value : "memory"

const taskMood = (done: boolean): string => (done ? "已完成" : "未完成")

const TASK_UNAVAILABLE_MESSAGE = "这张小票根暂时打不开，请稍后再试一次。"

const taskUnavailableError = (): CloudBaseUserError => new CloudBaseUserError(TASK_UNAVAILABLE_MESSAGE)

export const isTaskUnavailableError = (error: unknown): boolean =>
  error instanceof CloudBaseUserError && error.message === TASK_UNAVAILABLE_MESSAGE

const normalizeTask = (document: StoredTaskDocument): TaskRecord | null => {
  const id = asString(document._id)
  if (!id || document.coupleId !== appConfig.coupleId || normalizeKind(document.kind) !== "task") {
    return null
  }

  const taskDone = document.taskDone === true
  const taskDueDate = asString(document.taskDueDate, asString(document.occurredAt)).trim()
  const taskCompletedAt = taskDone ? asPositiveNumber(document.taskCompletedAt) : undefined
  const createdAt = asNumber(document.createdAt)
  const record: TaskRecord = {
    id,
    kind: "task",
    title: asString(document.title, "未命名事项"),
    content: asString(document.content),
    taskDone,
    taskDueDate,
    occurredAt: asString(document.occurredAt, taskDueDate),
    mood: asString(document.mood, taskMood(taskDone)),
    createdAt,
    updatedAt: asNumber(document.updatedAt, createdAt)
  }

  if (typeof taskCompletedAt === "number") {
    record.taskCompletedAt = taskCompletedAt
  }

  return record
}

const compareIncompleteTasks = (left: TaskRecord, right: TaskRecord): number => {
  const leftDueDate = normalizeCalendarDate(left.taskDueDate)
  const rightDueDate = normalizeCalendarDate(right.taskDueDate)

  if (leftDueDate && rightDueDate && leftDueDate !== rightDueDate) {
    return leftDueDate.localeCompare(rightDueDate)
  }

  if (leftDueDate && !rightDueDate) {
    return -1
  }

  if (!leftDueDate && rightDueDate) {
    return 1
  }

  return right.createdAt - left.createdAt || left.id.localeCompare(right.id)
}

const compareTasks = (left: TaskRecord, right: TaskRecord): number => {
  if (left.taskDone !== right.taskDone) {
    return left.taskDone ? 1 : -1
  }

  if (!left.taskDone) {
    return compareIncompleteTasks(left, right)
  }

  return (
    (right.taskCompletedAt ?? right.updatedAt) - (left.taskCompletedAt ?? left.updatedAt) ||
    right.updatedAt - left.updatedAt ||
    left.id.localeCompare(right.id)
  )
}

const resolveTaskCompletedAt = (done: boolean, existing: TaskRecord | null, timestamp: number): number => {
  if (!done) {
    return 0
  }

  return existing?.taskDone === true && typeof existing.taskCompletedAt === "number" ? existing.taskCompletedAt : timestamp
}

const toStoredTask = (
  draft: TaskDraft,
  timestamp: number,
  existing: TaskRecord | null = null
): StoredTaskDocument => {
  const taskDone = draft.taskDone === true
  const taskDueDate = draft.taskDueDate.trim()
  const createdAt = existing?.createdAt ?? timestamp

  return {
    coupleId: appConfig.coupleId,
    kind: "task",
    title: draft.title.trim(),
    content: draft.content.trim(),
    occurredAt: taskDueDate,
    mood: taskMood(taskDone),
    files: [],
    taskDone,
    taskDueDate,
    taskCompletedAt: resolveTaskCompletedAt(taskDone, existing, timestamp),
    createdAt,
    updatedAt: timestamp
  }
}

const writeTaskCache = (task: TaskRecord, insertIfMissing = true): void => {
  writeDataCache(dataCacheKeys.taskDetail(task.id), task)
  upsertCachedListItem(dataCacheKeys.taskList(), task, {
    insertIfMissing,
    sort: compareTasks
  })
}

const removeTaskCache = (id: string): void => {
  removeDataCache(dataCacheKeys.taskDetail(id))
  removeCachedListItem(dataCacheKeys.taskList(), id)
}

export const listTasks = async (): Promise<TaskRecord[]> => {
  const documents = await listDocuments<StoredTaskDocument>(appConfig.entriesCollection, {
    where: {
      coupleId: appConfig.coupleId
    },
    orderBy: {
      field: "updatedAt",
      direction: "desc"
    },
    limit: 100
  })

  const tasks = documents.map(normalizeTask).filter((task): task is TaskRecord => task !== null).sort(compareTasks)
  writeDataCache(dataCacheKeys.taskList(), tasks)
  return tasks
}

export const getTask = async (id: string): Promise<TaskRecord> => {
  try {
    const document = await getDocument<StoredTaskDocument>(appConfig.entriesCollection, id)
    const task = normalizeTask({
      ...(isRecord(document) ? document : {}),
      _id: id
    } as StoredTaskDocument)

    if (!task) {
      throw taskUnavailableError()
    }

    writeTaskCache(task, false)
    return task
  } catch (error) {
    if (isTaskUnavailableError(error)) {
      removeDataCache(dataCacheKeys.taskDetail(id))
    }
    throw error
  }
}

export const createTask = async (draft: TaskDraft): Promise<TaskRecord> => {
  const now = Date.now()
  const id = await addDocument(appConfig.entriesCollection, toStoredTask(draft, now))
  const task = await getTask(id)
  writeTaskCache(task)
  return task
}

export const updateTask = async (id: string, draft: TaskDraft): Promise<TaskRecord> => {
  const existing = await getTask(id)
  const now = Date.now()
  await updateDocument<StoredTaskDocument>(appConfig.entriesCollection, id, toStoredTask(draft, now, existing))
  const task = await getTask(id)
  writeTaskCache(task)
  return task
}

export const toggleTaskDone = async (id: string, done: boolean): Promise<TaskRecord> => {
  const existing = await getTask(id)
  const now = Date.now()
  const taskDone = done === true

  await updateDocument<StoredTaskDocument>(appConfig.entriesCollection, id, {
    coupleId: appConfig.coupleId,
    kind: "task",
    files: [],
    taskDone,
    taskCompletedAt: taskDone ? now : 0,
    taskDueDate: existing.taskDueDate,
    occurredAt: existing.taskDueDate,
    mood: taskMood(taskDone),
    updatedAt: now
  })

  const task = await getTask(id)
  writeTaskCache(task)
  return task
}

export const deleteTask = async (id: string): Promise<void> => {
  await getTask(id)
  await removeDocument(appConfig.entriesCollection, id)
  removeTaskCache(id)
}
