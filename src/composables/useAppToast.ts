import { onHide, onShow } from "@dcloudio/uni-app"
import { onMounted, onUnmounted, shallowRef, watch } from "vue"
import { useToast } from "wot-design-uni/components/wd-toast"
import type { ToastOptions } from "wot-design-uni/components/wd-toast/types"

type AppToastType = "plain" | "success" | "warning" | "error"

interface AppToastRequest {
  id: number
  message: string
  type: AppToastType
  duration?: number
}

interface ToastHostPage {
  route?: string
  __route__?: string
}

let toastId = 0
let toastHostId = 0
let lastHandledToastId = 0

const appToastRequest = shallowRef<AppToastRequest | null>(null)
const toastHostStack: number[] = []

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

const removeToastHost = (hostId: number) => {
  const index = toastHostStack.lastIndexOf(hostId)
  if (index >= 0) {
    toastHostStack.splice(index, 1)
  }
}

const getCurrentToastHostId = (): number | null => toastHostStack[toastHostStack.length - 1] ?? null

const normalizeToastRoute = (route: string): string => route.replace(/^\/+/, "").replace(/[?#].*$/, "")

const getCurrentPageRoute = (): string => {
  if (typeof getCurrentPages !== "function") {
    return ""
  }

  const pages = getCurrentPages() as ToastHostPage[]
  const currentPage = pages[pages.length - 1]
  return normalizeToastRoute(currentPage?.route ?? currentPage?.__route__ ?? "")
}

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
  const hostId = ++toastHostId
  let mounted = false
  let visible = true
  let hostRoute = ""

  const syncHostRoute = () => {
    const currentRoute = getCurrentPageRoute()
    if (currentRoute) {
      hostRoute = currentRoute
    }
  }

  const isCurrentPageHost = () => {
    const currentRoute = getCurrentPageRoute()
    return !hostRoute || !currentRoute || hostRoute === currentRoute
  }

  const canShowToast = () => mounted && visible && getCurrentToastHostId() === hostId && isCurrentPageHost()

  const showToastRequest = (request: AppToastRequest) => {
    if (!canShowToast() || request.id <= lastHandledToastId) {
      return
    }

    lastHandledToastId = request.id
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
  }

  const showCurrentToastRequest = () => {
    const request = appToastRequest.value
    if (request) {
      showToastRequest(request)
    }
  }

  onMounted(() => {
    mounted = true
    syncHostRoute()
    toastHostStack.push(hostId)
    showCurrentToastRequest()
  })

  onUnmounted(() => {
    mounted = false
    removeToastHost(hostId)
  })

  onShow(() => {
    visible = true
    syncHostRoute()
    showCurrentToastRequest()
  })

  onHide(() => {
    visible = false
  })

  watch(
    appToastRequest,
    (request) => {
      if (!request) {
        return
      }
      showToastRequest(request)
    },
    { flush: "post" }
  )
}
