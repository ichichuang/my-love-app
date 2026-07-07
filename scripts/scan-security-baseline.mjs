import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join, relative } from "node:path"

const root = process.cwd()
const scanTargets = ["cloudbase/security", "cloudfunctions", "docs", "src", "scripts", "README.md", "package.json"]
const scannedExtensions = new Set([".json", ".md", ".txt", ".ts", ".tsx", ".vue", ".js", ".mjs"])
const openidPattern = /(^|[^A-Za-z0-9_-])(o[A-Za-z0-9_-]{27})(?=$|[^A-Za-z0-9_-])/g
const sensitiveLiteralPattern =
  /\b(?:pairingCode|pairing_code|PAIRING_CODE|password|PASSWORD|appSecret|AppSecret|APPSECRET|accessToken|refreshToken|idToken|authToken|apiToken|ACCESS_TOKEN|REFRESH_TOKEN|ID_TOKEN|AUTH_TOKEN|API_TOKEN)\b\s*[:=]\s*(["'`])([^"'`\r\n]{4,})\1/g
const allowedSecretLiteralPattern =
  /^(?:<[A-Z0-9_]+>|[A-Z0-9_]*(?:PLACEHOLDER|ENV_NAME|TOKEN_NAME|SECRET_NAME)|ACCESS_CONTROL_PAIRING_CODE_HASH|ACCESS_CONTROL_PAIRING_CODE_SALT|PAIRING_CODE_HASH_PLACEHOLDER|PAIRING_CODE_SALT_PLACEHOLDER|PAIRING_CODE_PLACEHOLDER|PASSWORD_PLACEHOLDER)$/

const normalizePath = (filePath) => relative(root, filePath).replaceAll("\\", "/")

const collectExistingFiles = (target) => {
  const absolutePath = join(root, target)
  if (!existsSync(absolutePath)) {
    return []
  }

  const stat = statSync(absolutePath)
  if (stat.isFile()) {
    return [absolutePath]
  }

  return readdirSync(absolutePath).flatMap((entry) => collectExistingFiles(join(target, entry)))
}

const candidateFiles = () => {
  try {
    return new Set(
      execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--", ...scanTargets], {
        cwd: root,
        encoding: "utf8"
      })
        .split(/\r?\n/)
        .filter(Boolean)
    )
  } catch {
    return new Set(scanTargets.flatMap(collectExistingFiles).map(normalizePath))
  }
}

const files = Array.from(candidateFiles())
  .filter((filePath) => scannedExtensions.has(extname(filePath)))
  .sort()

const findings = []

for (const filePath of files) {
  const absolutePath = join(root, filePath)
  const lines = readFileSync(absolutePath, "utf8").split(/\r?\n/)

  lines.forEach((line, index) => {
    openidPattern.lastIndex = 0
    let match = openidPattern.exec(line)
    while (match) {
      findings.push({
        file: filePath,
        line: index + 1,
        column: match.index + match[1].length + 1,
        label: "wechat-openid"
      })
      match = openidPattern.exec(line)
    }

    sensitiveLiteralPattern.lastIndex = 0
    let literalMatch = sensitiveLiteralPattern.exec(line)
    while (literalMatch) {
      const literalValue = literalMatch[2].trim()
      if (!allowedSecretLiteralPattern.test(literalValue)) {
        findings.push({
          file: filePath,
          line: index + 1,
          column: literalMatch.index + 1,
          label: "secret-like-literal"
        })
      }
      literalMatch = sensitiveLiteralPattern.exec(line)
    }
  })
}

if (findings.length === 0) {
  console.log("No real OpenID-like, pairing-code, password, AppSecret, or token literals found in scanned repository files.")
  process.exit(0)
}

console.error("Real OpenID-like literals and pairing-code/password/AppSecret/token literals are not allowed in scanned repository files.")
console.error("Use placeholders or documented environment-variable names, then apply real values privately.")

for (const finding of findings) {
  console.error(`${finding.file}:${finding.line}:${finding.column} [${finding.label}] [REDACTED_SECRET]`)
}

process.exit(1)
