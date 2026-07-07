// 访问控制运行时已在体验版构建中冻结。本文件保留源代码与历史，但当前不再执行启动拦截。
import { callCloudFunction, CloudBaseUserError } from "@/services/cloudbase"
import type {
  AccessControlErrorCode,
  AccessControlFunctionResponse,
  AccessControlRequest,
  AccessControlSuccessResponse,
  AccessStatus
} from "@/types/access-control"

const ACCESS_CONTROL_FUNCTION_NAME = "access-control"
const ACCESS_CONTROL_UNAVAILABLE_MESSAGE = "访问校验暂时不可用，请稍后再试。"

type AccessRuntimeIssueCode =
  | "ACCESS_RUNTIME_CLOUDBASE_UNCONFIGURED"
  | "ACCESS_RUNTIME_FUNCTION_NOT_FOUND"
  | "ACCESS_RUNTIME_PERMISSION_DENIED"
  | "ACCESS_RUNTIME_NETWORK_TIMEOUT"
  | "ACCESS_RUNTIME_RESPONSE_MALFORMED"
  | "ACCESS_RUNTIME_UNKNOWN"

interface AccessRuntimeIssue {
  code: AccessRuntimeIssueCode
  message: string
}

const errorMessages: Record<AccessControlErrorCode, string> = {
  ACCESS_CONTROL_BAD_REQUEST: "访问校验请求没写清楚，请稍后再试。",
  ACCESS_CONTROL_CONFIG_REQUIRED: "访问名单还没在云开发里配置好。",
  ACCESS_CONTROL_NOT_ALLOWED: "这里暂时只给被允许的人访问。",
  ACCESS_CONTROL_PAIRING_NOT_CONFIGURED: "暗号校验还没在云开发里配置好。",
  ACCESS_CONTROL_INVALID_PAIRING_CODE: "这段暗号没对上，请再检查一次。",
  ACCESS_CONTROL_INTERNAL_ERROR: ACCESS_CONTROL_UNAVAILABLE_MESSAGE
}

const runtimeIssueMessages: Record<AccessRuntimeIssueCode, string> = {
  ACCESS_RUNTIME_CLOUDBASE_UNCONFIGURED: "云端小仓库还没配置好，请稍后再试。",
  ACCESS_RUNTIME_FUNCTION_NOT_FOUND: "访问校验云函数还没部署好，请稍后再试。",
  ACCESS_RUNTIME_PERMISSION_DENIED: "访问校验没有被云开发放行，请稍后再试。",
  ACCESS_RUNTIME_NETWORK_TIMEOUT: "网络有点慢，访问校验暂时没完成，请稍后再试。",
  ACCESS_RUNTIME_RESPONSE_MALFORMED: ACCESS_CONTROL_UNAVAILABLE_MESSAGE,
  ACCESS_RUNTIME_UNKNOWN: ACCESS_CONTROL_UNAVAILABLE_MESSAGE
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const readErrorSignal = (error: unknown): string => {
  const signals: string[] = []

  if (error instanceof Error) {
    signals.push(error.name, error.message)
  }

  if (error instanceof CloudBaseUserError) {
    signals.push(error.causeDetail)
  }

  if (isRecord(error)) {
    ;["errMsg", "message", "code", "errCode"].forEach((key) => {
      const value = error[key]
      if (typeof value === "string" || typeof value === "number") {
        signals.push(String(value))
      }
    })
  }

  return signals.join(" ").toLowerCase()
}

const classifyAccessRuntimeIssue = (error: unknown): AccessRuntimeIssue => {
  const signal = readErrorSignal(error)

  if (/还没配置好|not initialized|cloudbase init|env/.test(signal)) {
    return {
      code: "ACCESS_RUNTIME_CLOUDBASE_UNCONFIGURED",
      message: runtimeIssueMessages.ACCESS_RUNTIME_CLOUDBASE_UNCONFIGURED
    }
  }

  if (/function.*not.*found|not.*found.*function|函数不存在|函数.*不存在|functionnotfound/.test(signal)) {
    return {
      code: "ACCESS_RUNTIME_FUNCTION_NOT_FOUND",
      message: runtimeIssueMessages.ACCESS_RUNTIME_FUNCTION_NOT_FOUND
    }
  }

  if (/exceed_authority|permission|forbidden|unauthori[sz]ed|not authorized|authority|权限/.test(signal)) {
    return {
      code: "ACCESS_RUNTIME_PERMISSION_DENIED",
      message: runtimeIssueMessages.ACCESS_RUNTIME_PERMISSION_DENIED
    }
  }

  if (/timeout|time out|timed out|etimedout|network|request:fail|超时|网络/.test(signal)) {
    return {
      code: "ACCESS_RUNTIME_NETWORK_TIMEOUT",
      message: runtimeIssueMessages.ACCESS_RUNTIME_NETWORK_TIMEOUT
    }
  }

  return {
    code: "ACCESS_RUNTIME_UNKNOWN",
    message: runtimeIssueMessages.ACCESS_RUNTIME_UNKNOWN
  }
}

const makeAccessRuntimeError = (issue: AccessRuntimeIssue): CloudBaseUserError =>
  new CloudBaseUserError(issue.message, issue.code)

const isAccessControlResponse = (value: unknown): value is AccessControlFunctionResponse => {
  if (typeof value !== "object" || value === null || !("ok" in value)) {
    return false
  }

  return typeof (value as { ok?: unknown }).ok === "boolean"
}

const mapAccessControlError = (response: AccessControlFunctionResponse): CloudBaseUserError => {
  if (response.ok) {
    return new CloudBaseUserError(ACCESS_CONTROL_UNAVAILABLE_MESSAGE, "Unexpected successful response in error mapper.")
  }

  return new CloudBaseUserError(
    errorMessages[response.errorCode] || ACCESS_CONTROL_UNAVAILABLE_MESSAGE,
    response.errorCode
  )
}

const callAccessControl = async (request: AccessControlRequest): Promise<AccessControlSuccessResponse> => {
  let response: AccessControlFunctionResponse
  try {
    response = await callCloudFunction<AccessControlRequest, AccessControlFunctionResponse>({
      name: ACCESS_CONTROL_FUNCTION_NAME,
      data: request
    })
  } catch (error) {
    throw makeAccessRuntimeError(classifyAccessRuntimeIssue(error))
  }

  if (!isAccessControlResponse(response)) {
    throw makeAccessRuntimeError({
      code: "ACCESS_RUNTIME_RESPONSE_MALFORMED",
      message: runtimeIssueMessages.ACCESS_RUNTIME_RESPONSE_MALFORMED
    })
  }

  if (!response.ok) {
    throw mapAccessControlError(response)
  }

  return response
}

export const getAccessStatus = async (): Promise<AccessStatus> => {
  const response = await callAccessControl({
    action: "getAccessStatus"
  })

  return response.data
}

export const verifyPairingCode = async (pairingCode: string): Promise<AccessStatus> => {
  const response = await callAccessControl({
    action: "verifyPairingCode",
    pairingCode
  })

  return response.data
}
