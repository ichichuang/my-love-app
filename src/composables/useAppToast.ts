import { shallowRef, watch } from "vue"
import { useToast } from "wot-design-uni/components/wd-toast"
import type { ToastOptions } from "wot-design-uni/components/wd-toast/types"

type AppToastType = "plain" | "success" | "warning" | "error"

interface AppToastRequest {
  id: number
  message: string
  type: AppToastType
  duration?: number
}

let toastId = 0

const appToastRequest = shallowRef<AppToastRequest | null>(null)

const defaultDurationByType: Record<AppToastType, number> = {
  plain: 2000,
  success: 1500,
  warning: 2200,
  error: 2600
}

const publishToast = (message: string, type: AppToastType, duration?: number) => {
  appToastRequest.value = {
    id: toastId + 1,
    message,
    type,
    duration
  }
  toastId += 1
}

const toToastOptions = (request: AppToastRequest): ToastOptions => ({
  msg: request.message,
  duration: request.duration ?? defaultDurationByType[request.type],
  position: "middle"
})

export const showAppToast = (message: string, duration?: number) => {
  publishToast(message, "plain", duration)
}

export const showAppSuccess = (message: string, duration?: number) => {
  publishToast(message, "success", duration)
}

export const showAppWarning = (message: string, duration?: number) => {
  publishToast(message, "warning", duration)
}

export const showAppError = (message: string, duration?: number) => {
  publishToast(message, "error", duration)
}

export const useAppToastHost = () => {
  const toast = useToast()

  watch(
    appToastRequest,
    (request) => {
      if (!request) {
        return
      }

      const options = toToastOptions(request)

      if (request.type === "success") {
        toast.success(options)
        return
      }

      if (request.type === "warning") {
        toast.warning(options)
        return
      }

      if (request.type === "error") {
        toast.error(options)
        return
      }

      toast.show(options)
    },
    { flush: "post" }
  )
}
