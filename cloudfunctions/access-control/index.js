const cloud = require("wx-server-sdk")
const crypto = require("crypto")

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const COUPLE_ID = "main"
const ROLES = ["owner", "partner"]
const STATUSES = ["active", "disabled", "revoked"]
const ACTIONS = ["getAccessStatus", "verifyPairingCode"]

const trim = (value) => (typeof value === "string" ? value.trim() : "")

const isPlaceholderOpenId = (value) => value === "OWNER_OPENID" || value === "PARTNER_OPENID"

const normalizeStatus = (value) => {
  const status = trim(value).toLowerCase()
  return STATUSES.includes(status) ? status : "active"
}

const readBoolean = (value) => {
  const normalized = trim(value).toLowerCase()
  return normalized === "1" || normalized === "true" || normalized === "yes"
}

const readMember = (role, env) => {
  const envPrefix = role === "owner" ? "OWNER" : "PARTNER"
  const openid = trim(env[`ACCESS_CONTROL_${envPrefix}_OPENID`])

  if (!openid || isPlaceholderOpenId(openid)) {
    return null
  }

  return {
    role,
    openid,
    status: normalizeStatus(env[`ACCESS_CONTROL_${envPrefix}_STATUS`])
  }
}

const resolveConfig = (env) => {
  const configuredCoupleId = trim(env.ACCESS_CONTROL_COUPLE_ID) || COUPLE_ID
  const members = ROLES.map((role) => readMember(role, env)).filter(Boolean)
  const uniqueOpenIds = new Set(members.map((member) => member.openid))
  const pairingCodeHash = trim(env.ACCESS_CONTROL_PAIRING_CODE_HASH)
  const pairingCodeSalt = trim(env.ACCESS_CONTROL_PAIRING_CODE_SALT)
  const pairingCodeEnabled = readBoolean(env.ACCESS_CONTROL_PAIRING_ENABLED) || Boolean(pairingCodeHash)
  const pairingCodeRequired = readBoolean(env.ACCESS_CONTROL_PAIRING_REQUIRED)
  const configErrors = []

  if (members.length === 0) {
    configErrors.push("missing_openid_slots")
  }

  if (configuredCoupleId !== COUPLE_ID) {
    configErrors.push("invalid_couple_id")
  }

  if (members.length > 2) {
    configErrors.push("too_many_openid_slots")
  }

  if (uniqueOpenIds.size !== members.length) {
    configErrors.push("duplicate_openid_slots")
  }

  if (pairingCodeEnabled && (!pairingCodeHash || !pairingCodeSalt)) {
    configErrors.push("pairing_code_config_incomplete")
  }

  if (pairingCodeRequired && !pairingCodeEnabled) {
    configErrors.push("pairing_code_required_without_config")
  }

  return {
    coupleId: COUPLE_ID,
    members,
    pairingCodeEnabled,
    pairingCodeRequired,
    pairingCodeHash,
    pairingCodeSalt,
    configured: configErrors.length === 0,
    configErrors
  }
}

const baseStatus = (config, member, overrides = {}) => ({
  coupleId: config.coupleId,
  configured: config.configured,
  allowed: false,
  role: member ? member.role : null,
  memberStatus: member ? member.status : null,
  pairingCodeEnabled: config.pairingCodeEnabled,
  pairingCodeRequired: config.pairingCodeRequired,
  pairingVerified: false,
  decision: "unknown",
  ...overrides
})

const getMemberForOpenId = (config, openid) => config.members.find((member) => member.openid === openid) || null

const getAccessStatusForOpenId = (config, openid, options = {}) => {
  const member = getMemberForOpenId(config, openid)

  if (!config.configured) {
    return baseStatus(config, member, {
      decision: "configurationRequired"
    })
  }

  if (!member) {
    return baseStatus(config, null, {
      decision: "notWhitelisted"
    })
  }

  if (member.status === "disabled" || member.status === "revoked") {
    return baseStatus(config, member, {
      decision: member.status
    })
  }

  if (config.pairingCodeRequired && !options.pairingVerified) {
    return baseStatus(config, member, {
      decision: "pairingRequired"
    })
  }

  return baseStatus(config, member, {
    allowed: true,
    pairingVerified: Boolean(options.pairingVerified),
    decision: "allowed"
  })
}

const hashPairingCode = (pairingCode, salt) =>
  crypto.createHmac("sha256", salt).update(pairingCode).digest("hex")

const safeEqualHex = (left, right) => {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right) || left.length !== right.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"))
}

const verifyPairingCodeForOpenId = (config, openid, event) => {
  const currentStatus = getAccessStatusForOpenId(config, openid)

  if (!config.configured) {
    return errorResponse("verifyPairingCode", "ACCESS_CONTROL_CONFIG_REQUIRED", currentStatus)
  }

  if (currentStatus.decision === "notWhitelisted") {
    return errorResponse("verifyPairingCode", "ACCESS_CONTROL_NOT_ALLOWED", currentStatus)
  }

  if (currentStatus.decision === "disabled" || currentStatus.decision === "revoked") {
    return errorResponse("verifyPairingCode", "ACCESS_CONTROL_NOT_ALLOWED", currentStatus)
  }

  if (!config.pairingCodeEnabled) {
    return errorResponse("verifyPairingCode", "ACCESS_CONTROL_PAIRING_NOT_CONFIGURED", {
      ...currentStatus,
      decision: "pairingNotConfigured"
    })
  }

  const pairingCode = trim(event.pairingCode)
  const expectedHash = config.pairingCodeHash.toLowerCase()
  const actualHash = hashPairingCode(pairingCode, config.pairingCodeSalt)

  if (!pairingCode || !safeEqualHex(actualHash, expectedHash)) {
    return errorResponse("verifyPairingCode", "ACCESS_CONTROL_INVALID_PAIRING_CODE", {
      ...currentStatus,
      decision: "invalidPairingCode"
    })
  }

  return successResponse("verifyPairingCode", getAccessStatusForOpenId(config, openid, { pairingVerified: true }))
}

const successResponse = (action, data) => ({
  ok: true,
  action,
  data
})

const errorResponse = (action, errorCode, data) => ({
  ok: false,
  action,
  errorCode,
  message: "访问校验暂时不可用。",
  data
})

const readAction = (event) => {
  const action = trim(event && event.action)
  return ACTIONS.includes(action) ? action : ""
}

exports.main = async (event = {}) => {
  try {
    const wxContext = cloud.getWXContext()
    const callerOpenId = trim(wxContext.OPENID)
    const action = readAction(event)
    const config = resolveConfig(process.env)

    if (!action) {
      return errorResponse(undefined, "ACCESS_CONTROL_BAD_REQUEST")
    }

    if (action === "getAccessStatus") {
      return successResponse(action, getAccessStatusForOpenId(config, callerOpenId))
    }

    return verifyPairingCodeForOpenId(config, callerOpenId, event)
  } catch (error) {
    return {
      ok: false,
      errorCode: "ACCESS_CONTROL_INTERNAL_ERROR",
      message: "访问校验暂时不可用。"
    }
  }
}
