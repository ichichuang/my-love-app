import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join, relative } from "node:path"

console.log("Access-control runtime is frozen for experience-build usage; scanning only for direct cloud API misuse.")

const root = process.cwd()
const requiredFiles = [
  "cloudfunctions/access-control/index.js",
  "cloudfunctions/access-control/package.json",
  "src/services/access-control.ts",
  "src/types/access-control.ts",
  "src/stores/access.ts",
  "src/composables/useAccessGuard.ts",
  "src/pages/access/access.vue",
  "docs/ACCESS_CONTROL_RUNTIME_QA.zh-CN.md"
]

const sourceExtensions = new Set([".ts", ".vue"])
const findings = []

const normalizePath = (filePath) => relative(root, filePath).replaceAll("\\", "/")

const readIfExists = (relativePath) => {
  const absolutePath = join(root, relativePath)
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : ""
}

const readJsonIfExists = (relativePath) => {
  const source = readIfExists(relativePath)
  if (!source) {
    return null
  }

  try {
    return JSON.parse(source)
  } catch {
    findings.push(`${relativePath}: must contain valid JSON`)
    return null
  }
}

const collectSourceFiles = (directory) => {
  const absolutePath = join(root, directory)
  if (!existsSync(absolutePath)) {
    return []
  }

  return readdirSync(absolutePath).flatMap((entry) => {
    const filePath = join(absolutePath, entry)
    const stat = statSync(filePath)
    if (stat.isDirectory()) {
      return collectSourceFiles(normalizePath(filePath))
    }
    if (stat.isFile() && sourceExtensions.has(extname(filePath)) && !filePath.endsWith(".d.ts")) {
      return [normalizePath(filePath)]
    }
    return []
  })
}

for (const filePath of requiredFiles) {
  if (!existsSync(join(root, filePath))) {
    findings.push(`${filePath}: required access-control foundation file is missing`)
  }
}

const functionSource = readIfExists("cloudfunctions/access-control/index.js")
if (functionSource) {
  const requiredSnippets = ["exports.main", "cloud.getWXContext()", "OPENID", "getAccessStatus", "verifyPairingCode"]
  for (const snippet of requiredSnippets) {
    if (!functionSource.includes(snippet)) {
      findings.push(`cloudfunctions/access-control/index.js: missing required snippet ${snippet}`)
    }
  }

  const unsafeInputPatterns = [
    /\bevent\s*\.\s*(?:openid|openId|OPENID)\b/,
    /\bevent\s*\[\s*["'](?:openid|openId|OPENID)["']\s*\]/,
    /\bdata\s*\.\s*(?:openid|openId|OPENID)\b/,
    /\bdata\s*\[\s*["'](?:openid|openId|OPENID)["']\s*\]/
  ]
  if (unsafeInputPatterns.some((pattern) => pattern.test(functionSource))) {
    findings.push("cloudfunctions/access-control/index.js: caller OpenID must come from cloud.getWXContext(), not client input")
  }
}

const serviceSource = readIfExists("src/services/access-control.ts")
if (serviceSource) {
  if (!serviceSource.includes("callCloudFunction")) {
    findings.push("src/services/access-control.ts: must call CloudBase through the controlled callCloudFunction wrapper")
  }
  if (serviceSource.includes("wx.cloud.callFunction")) {
    findings.push("src/services/access-control.ts: must not call wx.cloud.callFunction directly")
  }

  const requiredRuntimeSnippets = [
    "classifyAccessRuntimeIssue",
    "ACCESS_RUNTIME_CLOUDBASE_UNCONFIGURED",
    "ACCESS_RUNTIME_FUNCTION_NOT_FOUND",
    "ACCESS_RUNTIME_PERMISSION_DENIED",
    "ACCESS_RUNTIME_NETWORK_TIMEOUT",
    "ACCESS_RUNTIME_RESPONSE_MALFORMED"
  ]
  for (const snippet of requiredRuntimeSnippets) {
    if (!serviceSource.includes(snippet)) {
      findings.push(`src/services/access-control.ts: missing runtime hardening snippet ${snippet}`)
    }
  }
}

const accessStoreSource = readIfExists("src/stores/access.ts")
if (accessStoreSource) {
  const requiredStoreSnippets = ["configurationRequired", "notWhitelisted", "disabled", "revoked", "pairingRequired"]
  for (const snippet of requiredStoreSnippets) {
    if (!accessStoreSource.includes(snippet)) {
      findings.push(`src/stores/access.ts: missing access state ${snippet}`)
    }
  }
}

const accessPageSource = readIfExists("src/pages/access/access.vue")
if (accessPageSource) {
  const requiredAccessPageStates = ["configurationRequired", "notWhitelisted", "disabled", "revoked", "pairingRequired"]
  for (const snippet of requiredAccessPageStates) {
    if (!accessPageSource.includes(snippet)) {
      findings.push(`src/pages/access/access.vue: missing status-only handling for ${snippet}`)
    }
  }

  if (accessPageSource.includes("verifyPairingCode")) {
    findings.push("src/pages/access/access.vue: access page must not call verifyPairingCode before the pairing-code UI phase")
  }
}

const runtimeQaSource = readIfExists("docs/ACCESS_CONTROL_RUNTIME_QA.zh-CN.md")
if (runtimeQaSource) {
  const requiredQaSnippets = [
    "owner 授权访问",
    "partner 授权访问",
    "未知账号拒绝",
    "撤销账号拒绝",
    "云函数未部署",
    "业务页直达拦截",
    "临时图片链接"
  ]
  for (const snippet of requiredQaSnippets) {
    if (!runtimeQaSource.includes(snippet)) {
      findings.push(`docs/ACCESS_CONTROL_RUNTIME_QA.zh-CN.md: missing runtime QA case ${snippet}`)
    }
  }
}

const pagesJson = readJsonIfExists("src/pages.json")
if (pagesJson) {
  const pages = Array.isArray(pagesJson.pages) ? pagesJson.pages : []
  const pagePaths = pages
    .map((page) => (page && typeof page.path === "string" ? page.path : ""))
    .filter(Boolean)

  for (const pagePath of pagePaths) {
    const pageFile = `src/${pagePath}.vue`
    const source = readIfExists(pageFile)
    if (!source) {
      findings.push(`${pageFile}: page listed in src/pages.json is missing`)
    }
  }
}

for (const filePath of collectSourceFiles("src")) {
  const source = readIfExists(filePath)
  const lines = source.split(/\r?\n/)
  lines.forEach((line, index) => {
    if (line.includes("wx.cloud.callFunction") && filePath !== "src/services/cloudbase.ts") {
      findings.push(`${filePath}:${index + 1}: direct wx.cloud.callFunction is only allowed in src/services/cloudbase.ts`)
    }

    if (/^src\/(?:pages|components)\//.test(filePath) && /\bcallFunction\s*\(/.test(line)) {
      findings.push(`${filePath}:${index + 1}: page/component code must not call CloudBase functions directly`)
    }

    if (/^src\/pages\//.test(filePath) && line.includes("verifyPairingCode")) {
      findings.push(`${filePath}:${index + 1}: pages must not call verifyPairingCode before the pairing-code UI phase`)
    }
  })
}

if (findings.length === 0) {
  console.log("Access-control cloud function and client boundary scan passed.")
  process.exit(0)
}

for (const finding of findings) {
  console.error(finding)
}

process.exit(1)
