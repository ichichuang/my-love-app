// 访问控制运行时已在体验版构建中冻结。本文件保留源代码与历史，但当前不再执行启动拦截。
export type AccessControlRole = "owner" | "partner"

export type AccessControlMemberStatus = "active" | "disabled" | "revoked"

export type AccessControlDecision =
  | "allowed"
  | "configurationRequired"
  | "notWhitelisted"
  | "disabled"
  | "revoked"
  | "pairingRequired"
  | "pairingNotConfigured"
  | "invalidPairingCode"
  | "unknown"

export interface AccessStatus {
  coupleId: "main"
  configured: boolean
  allowed: boolean
  role: AccessControlRole | null
  memberStatus: AccessControlMemberStatus | null
  pairingCodeEnabled: boolean
  pairingCodeRequired: boolean
  pairingVerified: boolean
  decision: AccessControlDecision
}

export type AccessControlAction = "getAccessStatus" | "verifyPairingCode"

export interface GetAccessStatusRequest {
  action: "getAccessStatus"
}

export interface VerifyPairingCodeRequest {
  action: "verifyPairingCode"
  pairingCode: string
}

export type AccessControlRequest = GetAccessStatusRequest | VerifyPairingCodeRequest

export type AccessControlErrorCode =
  | "ACCESS_CONTROL_BAD_REQUEST"
  | "ACCESS_CONTROL_CONFIG_REQUIRED"
  | "ACCESS_CONTROL_NOT_ALLOWED"
  | "ACCESS_CONTROL_PAIRING_NOT_CONFIGURED"
  | "ACCESS_CONTROL_INVALID_PAIRING_CODE"
  | "ACCESS_CONTROL_INTERNAL_ERROR"

export interface AccessControlSuccessResponse {
  ok: true
  action: AccessControlAction
  data: AccessStatus
}

export interface AccessControlErrorResponse {
  ok: false
  action?: AccessControlAction
  errorCode: AccessControlErrorCode
  message: string
  data?: AccessStatus
}

export type AccessControlFunctionResponse = AccessControlSuccessResponse | AccessControlErrorResponse
