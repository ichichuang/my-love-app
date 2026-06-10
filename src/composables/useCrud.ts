import { shallowRef } from "vue"
import { getFriendlyErrorMessage } from "@/services/cloudbase"

export const useCrud = <T>(loader: () => Promise<T[]>) => {
  const items = shallowRef<T[]>([])
  const loading = shallowRef(false)
  const mutating = shallowRef(false)
  const errorMessage = shallowRef("")

  const reload = async () => {
    loading.value = true
    errorMessage.value = ""

    try {
      items.value = await loader()
    } catch (error) {
      errorMessage.value = getFriendlyErrorMessage(error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const mutate = async <R>(action: () => Promise<R>): Promise<R> => {
    mutating.value = true
    errorMessage.value = ""

    try {
      return await action()
    } catch (error) {
      errorMessage.value = getFriendlyErrorMessage(error)
      throw error
    } finally {
      mutating.value = false
    }
  }

  return {
    items,
    loading,
    mutating,
    errorMessage,
    reload,
    mutate
  }
}
