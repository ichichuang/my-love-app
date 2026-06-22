import { showAppSuccess } from "@/composables/useAppToast"

export type RouteFeedbackType = "success"

export interface RouteFeedback {
  targetRoute: string
  type: RouteFeedbackType
  message: string
  createdAt: number
}

const routeFeedbackStorageKey = "app-route-feedback-v1"
const routeFeedbackTtlMs = 5 * 60 * 1000

export const normalizeRouteFeedbackRoute = (route: string): string => route.trim().replace(/^\/+/, "").replace(/[?#].*$/, "")

const removeStoredRouteFeedback = (): void => {
  try {
    uni.removeStorageSync(routeFeedbackStorageKey)
  } catch {
    // Route feedback is best-effort and must not block navigation.
  }
}

const isRouteFeedback = (value: unknown): value is RouteFeedback => {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const feedback = value as Partial<RouteFeedback>
  return (
    typeof feedback.targetRoute === "string" &&
    normalizeRouteFeedbackRoute(feedback.targetRoute).length > 0 &&
    feedback.type === "success" &&
    typeof feedback.message === "string" &&
    feedback.message.trim().length > 0 &&
    typeof feedback.createdAt === "number" &&
    Number.isFinite(feedback.createdAt)
  )
}

const readStoredRouteFeedback = (): RouteFeedback | null => {
  try {
    const raw = uni.getStorageSync(routeFeedbackStorageKey) as unknown
    if (typeof raw === "undefined" || raw === null || raw === "") {
      return null
    }

    if (!isRouteFeedback(raw)) {
      removeStoredRouteFeedback()
      return null
    }

    if (Date.now() - raw.createdAt > routeFeedbackTtlMs) {
      removeStoredRouteFeedback()
      return null
    }

    return {
      ...raw,
      targetRoute: normalizeRouteFeedbackRoute(raw.targetRoute),
      message: raw.message.trim()
    }
  } catch {
    removeStoredRouteFeedback()
    return null
  }
}

export const setRouteSuccessFeedback = (targetRoute: string, message: string): void => {
  const normalizedTargetRoute = normalizeRouteFeedbackRoute(targetRoute)
  const normalizedMessage = message.trim()
  if (!normalizedTargetRoute || !normalizedMessage) {
    return
  }

  const feedback: RouteFeedback = {
    targetRoute: normalizedTargetRoute,
    type: "success",
    message: normalizedMessage,
    createdAt: Date.now()
  }

  try {
    uni.setStorageSync(routeFeedbackStorageKey, feedback)
  } catch {
    removeStoredRouteFeedback()
  }
}

export const consumeRouteFeedback = (targetRoute: string): void => {
  const normalizedTargetRoute = normalizeRouteFeedbackRoute(targetRoute)
  if (!normalizedTargetRoute) {
    return
  }

  const feedback = readStoredRouteFeedback()
  if (!feedback || feedback.targetRoute !== normalizedTargetRoute) {
    return
  }

  removeStoredRouteFeedback()
  showAppSuccess(feedback.message)
}
