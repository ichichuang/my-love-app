import { appConfig } from "@/config/app"
import {
  addDocument,
  CloudBaseUserError,
  listDocuments,
  removeDocument,
  updateDocument
} from "@/services/cloudbase"
import type {
  HeartReactionRecord,
  HeartReactionType,
  HeartReactor,
  StoredHeartReactionDocument
} from "@/types/heart-reaction"

export type { HeartReactor }

const HEART_REACTION_TYPE: HeartReactionType = "heart"
const TARGET_COLLECTION = appConfig.entriesCollection
const TARGET_KIND = "memory"

const REACTION_NOT_FOUND_MESSAGE = "这颗小心心已经不在啦。"
const REACTION_SAVE_FAILED_MESSAGE = "这颗小心心暂时放不进去，请稍后再试。"
const REACTION_REMOVE_FAILED_MESSAGE = "撤销这颗小心心没成功，请稍后再试。"
const REACTION_LIST_FAILED_MESSAGE = "读取小心心状态失败，请稍后再试。"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" ? value : fallback

const normalizeReactionType = (value: unknown): HeartReactionType =>
  value === HEART_REACTION_TYPE ? HEART_REACTION_TYPE : "heart"

const normalizeReaction = (document: StoredHeartReactionDocument): HeartReactionRecord | null => {
  const id = asString(document._id)
  if (!id) {
    return null
  }

  if (document.coupleId !== appConfig.coupleId) {
    return null
  }

  if (document.targetCollection !== TARGET_COLLECTION) {
    return null
  }

  if (document.targetKind !== TARGET_KIND) {
    return null
  }

  const reactionType = normalizeReactionType(document.reactionType)
  const targetId = asString(document.targetId)
  if (!targetId) {
    return null
  }

  return {
    id,
    coupleId: appConfig.coupleId,
    targetCollection: TARGET_COLLECTION,
    targetKind: TARGET_KIND,
    targetId,
    reactionType,
    reactorKey: asString(document.reactorKey),
    reactorLabel: asString(document.reactorLabel),
    createdAt: asNumber(document.createdAt),
    updatedAt: asNumber(document.updatedAt)
  }
}

const toStoredDocument = (
  targetId: string,
  reactor: HeartReactor,
  timestamp: number
): StoredHeartReactionDocument => ({
  coupleId: appConfig.coupleId,
  targetCollection: TARGET_COLLECTION,
  targetKind: TARGET_KIND,
  targetId,
  reactionType: HEART_REACTION_TYPE,
  reactorKey: reactor.key.trim(),
  reactorLabel: reactor.label.trim(),
  createdAt: timestamp,
  updatedAt: timestamp
})

const buildBaseWhere = (targetId: string, reactorKey?: string): Record<string, unknown> => ({
  coupleId: appConfig.coupleId,
  targetCollection: TARGET_COLLECTION,
  targetKind: TARGET_KIND,
  targetId,
  reactionType: HEART_REACTION_TYPE,
  ...(reactorKey ? { reactorKey } : {})
})

const findExistingReaction = async (
  targetId: string,
  reactorKey: string
): Promise<StoredHeartReactionDocument | null> => {
  const documents = await listDocuments<StoredHeartReactionDocument>(appConfig.reactionsCollection, {
    where: buildBaseWhere(targetId, reactorKey),
    orderBy: {
      field: "createdAt",
      direction: "asc"
    },
    limit: 1
  })

  const document = documents[0]
  if (!document) {
    return null
  }

  return document
}

const reactionNotFoundError = (): CloudBaseUserError =>
  new CloudBaseUserError(REACTION_NOT_FOUND_MESSAGE)

export const isReactionNotFoundError = (error: unknown): boolean =>
  error instanceof CloudBaseUserError && error.message === REACTION_NOT_FOUND_MESSAGE

export const listHeartReactionsForMemory = async (targetId: string): Promise<HeartReactionRecord[]> => {
  if (!targetId) {
    return []
  }

  try {
    const documents = await listDocuments<StoredHeartReactionDocument>(appConfig.reactionsCollection, {
      where: buildBaseWhere(targetId),
      orderBy: {
        field: "createdAt",
        direction: "asc"
      },
      limit: 100
    })

    return documents.map(normalizeReaction).filter((reaction): reaction is HeartReactionRecord => reaction !== null)
  } catch (error) {
    throw new CloudBaseUserError(REACTION_LIST_FAILED_MESSAGE)
  }
}

export const listAllHeartReactionsForMemoryIds = async (
  targetIds: string[]
): Promise<Map<string, HeartReactionRecord[]>> => {
  const uniqueTargetIds = Array.from(new Set(targetIds.filter(Boolean)))
  const grouped = new Map<string, HeartReactionRecord[]>()

  if (uniqueTargetIds.length === 0) {
    return grouped
  }

  try {
    const documents = await listDocuments<StoredHeartReactionDocument>(appConfig.reactionsCollection, {
      where: {
        coupleId: appConfig.coupleId,
        targetCollection: TARGET_COLLECTION,
        targetKind: TARGET_KIND,
        reactionType: HEART_REACTION_TYPE,
        targetId: {
          $in: uniqueTargetIds
        }
      },
      orderBy: {
        field: "createdAt",
        direction: "asc"
      },
      limit: 1000
    })

    for (const document of documents) {
      const reaction = normalizeReaction(document)
      if (!reaction) {
        continue
      }

      const list = grouped.get(reaction.targetId) ?? []
      list.push(reaction)
      grouped.set(reaction.targetId, list)
    }

    return grouped
  } catch (error) {
    throw new CloudBaseUserError(REACTION_LIST_FAILED_MESSAGE)
  }
}

export const getMyHeartReactionForMemory = async (
  targetId: string,
  reactorKey: string
): Promise<HeartReactionRecord | null> => {
  if (!targetId || !reactorKey) {
    return null
  }

  try {
    const document = await findExistingReaction(targetId, reactorKey)
    if (!document) {
      return null
    }

    const reaction = normalizeReaction(document)
    if (!reaction) {
      return null
    }

    return reaction
  } catch (error) {
    throw new CloudBaseUserError(REACTION_LIST_FAILED_MESSAGE)
  }
}

export const upsertHeartReactionForMemory = async (
  targetId: string,
  reactor: HeartReactor
): Promise<HeartReactionRecord> => {
  const key = reactor.key.trim()
  const label = reactor.label.trim()

  if (!targetId || !key) {
    throw new CloudBaseUserError(REACTION_SAVE_FAILED_MESSAGE)
  }

  const now = Date.now()

  try {
    const existing = await findExistingReaction(targetId, key)

    if (existing && asString(existing._id)) {
      await updateDocument<StoredHeartReactionDocument>(appConfig.reactionsCollection, asString(existing._id), {
        reactorLabel: label,
        updatedAt: now
      })

      const reaction = normalizeReaction({
        ...existing,
        reactorLabel: label,
        updatedAt: now
      })

      if (!reaction) {
        throw new CloudBaseUserError(REACTION_SAVE_FAILED_MESSAGE)
      }

      return reaction
    }

    const id = await addDocument<StoredHeartReactionDocument>(
      appConfig.reactionsCollection,
      toStoredDocument(targetId, { key, label }, now)
    )

    return {
      id,
      coupleId: appConfig.coupleId,
      targetCollection: TARGET_COLLECTION,
      targetKind: TARGET_KIND,
      targetId,
      reactionType: HEART_REACTION_TYPE,
      reactorKey: key,
      reactorLabel: label,
      createdAt: now,
      updatedAt: now
    }
  } catch (error) {
    if (error instanceof CloudBaseUserError) {
      throw error
    }
    throw new CloudBaseUserError(REACTION_SAVE_FAILED_MESSAGE)
  }
}

export const removeHeartReactionForMemory = async (
  targetId: string,
  reactorKey: string
): Promise<void> => {
  if (!targetId || !reactorKey) {
    throw reactionNotFoundError()
  }

  try {
    const existing = await findExistingReaction(targetId, reactorKey)
    const id = existing && asString(existing._id)

    if (!id) {
      throw reactionNotFoundError()
    }

    await removeDocument(appConfig.reactionsCollection, id)
  } catch (error) {
    if (error instanceof CloudBaseUserError) {
      throw error
    }
    throw new CloudBaseUserError(REACTION_REMOVE_FAILED_MESSAGE)
  }
}

export const listHeartReactionStatesForMemoryIds = async (
  targetIds: string[],
  reactorKey: string
): Promise<Map<string, HeartReactionRecord | null>> => {
  const uniqueTargetIds = Array.from(new Set(targetIds.filter(Boolean)))
  const states = new Map<string, HeartReactionRecord | null>()

  if (uniqueTargetIds.length === 0 || !reactorKey) {
    return states
  }

  try {
    const results = await Promise.all(
      uniqueTargetIds.map(async (targetId) => {
        const reaction = await getMyHeartReactionForMemory(targetId, reactorKey)
        return [targetId, reaction] as const
      })
    )

    for (const [targetId, reaction] of results) {
      states.set(targetId, reaction)
    }

    return states
  } catch (error) {
    throw new CloudBaseUserError(REACTION_LIST_FAILED_MESSAGE)
  }
}
