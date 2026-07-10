import { computed, shallowRef } from "vue"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import {
  getMyHeartReactionForMemory,
  listAllHeartReactionsForMemoryIds,
  listHeartReactionsForMemory,
  removeHeartReactionForMemory,
  upsertHeartReactionForMemory
} from "@/services/repositories/reactions"
import type { UseLocalPersonResult } from "@/composables/useLocalPerson"
import type { HeartReactionRecord, HeartReactionState, HeartReactor } from "@/types/heart-reaction"

export interface UseHeartReactionOptions {
  reactor?: HeartReactor
  localPerson?: UseLocalPersonResult
}

export const useHeartReaction = (options: UseHeartReactionOptions) => {
  const reactor = computed<HeartReactor>(() => {
    if (options.reactor) {
      return options.reactor
    }

    const selected = options.localPerson?.selectedPerson.value
    if (selected) {
      return selected
    }

    return { key: "", label: "" }
  })

  const canSendHeart = computed(() => reactor.value.key !== "")

  const loading = shallowRef(false)
  const sending = shallowRef(false)
  const removing = shallowRef(false)
  const reactions = shallowRef<HeartReactionRecord[]>([])
  const myReaction = shallowRef<HeartReactionRecord | null>(null)
  const errorMessage = shallowRef("")

  const setError = (error: unknown) => {
    errorMessage.value = getFriendlyErrorMessage(error)
  }

  const clearError = () => {
    errorMessage.value = ""
  }

  const loadReactions = async (targetId: string) => {
    if (!targetId || !reactor.value.key) {
      return
    }

    loading.value = true
    clearError()

    try {
      const [allReactions, mine] = await Promise.all([
        listHeartReactionsForMemory(targetId),
        getMyHeartReactionForMemory(targetId, reactor.value.key)
      ])

      reactions.value = allReactions
      myReaction.value = mine
    } catch (error) {
      setError(error)
    } finally {
      loading.value = false
    }
  }

  const sendHeart = async (targetId: string) => {
    if (!targetId || !reactor.value.key || sending.value) {
      return
    }

    sending.value = true
    clearError()

    try {
      const reaction = await upsertHeartReactionForMemory(targetId, reactor.value)
      myReaction.value = reaction

      const existingIndex = reactions.value.findIndex((item) => item.id === reaction.id)
      if (existingIndex < 0) {
        reactions.value = [...reactions.value, reaction]
      } else {
        reactions.value = reactions.value.map((item) => (item.id === reaction.id ? reaction : item))
      }
    } catch (error) {
      setError(error)
      throw error
    } finally {
      sending.value = false
    }
  }

  const removeHeart = async (targetId: string) => {
    if (!targetId || !reactor.value.key || removing.value) {
      return
    }

    removing.value = true
    clearError()

    try {
      await removeHeartReactionForMemory(targetId, reactor.value.key)
      myReaction.value = null
      reactions.value = reactions.value.filter((item) => item.reactorKey !== reactor.value.key)
    } catch (error) {
      setError(error)
      throw error
    } finally {
      removing.value = false
    }
  }

  const batchLoadStates = async (targetIds: string[]): Promise<Map<string, HeartReactionState>> => {
    const states = new Map<string, HeartReactionState>()

    if (targetIds.length === 0) {
      return states
    }

    clearError()

    try {
      const grouped = await listAllHeartReactionsForMemoryIds(targetIds)
      const myKey = reactor.value.key

      for (const targetId of targetIds) {
        const reactions = grouped.get(targetId) ?? []
        const mine = myKey ? reactions.find((reaction) => reaction.reactorKey === myKey) ?? null : null
        const hasReceived = myKey !== "" && reactions.some((reaction) => reaction.reactorKey !== myKey)

        states.set(targetId, {
          targetId,
          hasReacted: mine !== null,
          hasReceived,
          reactorLabel: mine?.reactorLabel,
          reactedAt: mine?.updatedAt ?? mine?.createdAt
        })
      }
    } catch (error) {
      setError(error)
    }

    return states
  }

  return {
    loading,
    sending,
    removing,
    canSendHeart,
    reactions,
    myReaction,
    errorMessage,
    loadReactions,
    sendHeart,
    removeHeart,
    batchLoadStates
  }
}
