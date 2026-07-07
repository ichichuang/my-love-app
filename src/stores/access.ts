// 访问控制运行时已在体验版构建中冻结。本文件保留源代码与历史，但当前不再执行启动拦截。
import { computed, ref } from "vue"
import { defineStore } from "pinia"
import { getAccessStatus } from "@/services/access-control"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import type { AccessStatus } from "@/types/access-control"

interface CheckAccessOptions {
  force?: boolean
}

export const useAccessStore = defineStore("access", () => {
  const status = ref<AccessStatus | null>(null)
  const checking = ref(false)
  const error = ref("")

  let pendingCheck: Promise<AccessStatus | null> | null = null

  const decision = computed(() => status.value?.decision ?? null)
  const authorized = computed(() => status.value?.allowed === true)
  const configurationRequired = computed(() => decision.value === "configurationRequired")
  const notWhitelisted = computed(() => decision.value === "notWhitelisted")
  const disabled = computed(() => decision.value === "disabled")
  const revoked = computed(() => decision.value === "revoked")
  const pairingRequired = computed(() => decision.value === "pairingRequired")
  const denied = computed(() => Boolean(status.value && !authorized.value && !pairingRequired.value && !error.value))

  const applyStatus = (nextStatus: AccessStatus | null) => {
    status.value = nextStatus
    error.value = ""
  }

  const checkAccess = async (options: CheckAccessOptions = {}): Promise<AccessStatus | null> => {
    if (!options.force && status.value && !error.value) {
      return status.value
    }

    if (pendingCheck) {
      return pendingCheck
    }

    checking.value = true
    pendingCheck = getAccessStatus()
      .then((nextStatus) => {
        applyStatus(nextStatus)
        return nextStatus
      })
      .catch((caughtError: unknown) => {
        status.value = null
        error.value = getFriendlyErrorMessage(caughtError)
        return null
      })
      .finally(() => {
        checking.value = false
        pendingCheck = null
      })

    return pendingCheck
  }

  const resetAccess = () => {
    status.value = null
    error.value = ""
    pendingCheck = null
    checking.value = false
  }

  return {
    status,
    decision,
    checking,
    authorized,
    configurationRequired,
    notWhitelisted,
    disabled,
    revoked,
    denied,
    pairingRequired,
    error,
    checkAccess,
    resetAccess
  }
})
