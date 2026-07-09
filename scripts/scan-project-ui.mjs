import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join, relative } from "node:path"

const root = process.cwd()

const hardFailures = []
const warnings = []
const notes = []

const normalizePath = (filePath) => relative(root, filePath).replaceAll("\\", "/")

const readIfExists = (relativePath) => {
  const absolutePath = join(root, relativePath)
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : ""
}

const readJsonIfExists = (relativePath) => {
  const source = readIfExists(relativePath)
  if (!source) return null
  try {
    return JSON.parse(source)
  } catch {
    hardFailures.push(`${relativePath}: must contain valid JSON`)
    return null
  }
}

const addHard = (message) => hardFailures.push(message)
const addWarn = (message) => warnings.push(message)
const addNote = (message) => notes.push(message)

const collectSourceFiles = (directory, extensions) => {
  const absolutePath = join(root, directory)
  if (!existsSync(absolutePath)) return []

  return readdirSync(absolutePath).flatMap((entry) => {
    const filePath = join(absolutePath, entry)
    const stat = statSync(filePath)
    if (stat.isDirectory()) {
      return collectSourceFiles(normalizePath(filePath), extensions)
    }
    if (stat.isFile() && extensions.has(extname(filePath)) && !filePath.endsWith(".d.ts")) {
      return [normalizePath(filePath)]
    }
    return []
  })
}

// -----------------------------------------------------------------------------
// 1. Route table checks
// -----------------------------------------------------------------------------

const pagesJson = readJsonIfExists("src/pages.json")
let registeredPages = []

if (pagesJson) {
  registeredPages = Array.isArray(pagesJson.pages) ? pagesJson.pages : []
  const pagePaths = registeredPages
    .map((page) => (page && typeof page.path === "string" ? page.path : ""))
    .filter(Boolean)

  if (pagePaths.length === 0) {
    addHard("src/pages.json: no registered pages found")
  } else {
    const firstRoute = pagePaths[0]
    if (firstRoute !== "pages/index/index") {
      addHard(`src/pages.json: first registered route is ${firstRoute}, must be pages/index/index`)
    }

    if (pagePaths.includes("pages/access/access")) {
      addHard("src/pages.json: pages/access/access must not be restored as a runtime route")
    }

    if (firstRoute === "pages/access/access") {
      addHard("src/pages.json: pages/access/access must not be the first route")
    }
  }
}

// -----------------------------------------------------------------------------
// 2. Registered page shell checks
// -----------------------------------------------------------------------------

const pageMetaPattern = /^\s*<page-meta\b/
const appShellPattern = /<app-shell\b/
const nativeChromeSyncPattern = /\buseNativeChromeSync\s*\(\)/

for (const page of registeredPages) {
  const pagePath = page && typeof page.path === "string" ? page.path : ""
  if (!pagePath) continue

  const pageFile = `src/${pagePath}.vue`
  const source = readIfExists(pageFile)

  if (!source) {
    addHard(`${pageFile}: registered page file is missing`)
    continue
  }

  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/)
  if (!templateMatch) {
    addHard(`${pageFile}: missing <template> block`)
    continue
  }

  const templateWithoutComments = templateMatch[1].replace(/<!--[\s\S]*?-->/g, "").trim()

  if (!pageMetaPattern.test(templateWithoutComments)) {
    addHard(`${pageFile}: <page-meta> must be the first template node`)
  }

  if (!appShellPattern.test(source)) {
    addHard(`${pageFile}: registered page must wrap content in <app-shell>`)
  }

  if (!nativeChromeSyncPattern.test(source)) {
    addHard(`${pageFile}: registered page must call useNativeChromeSync()`)
  }
}

// -----------------------------------------------------------------------------
// 3. Business pages must not call access-control guards
// -----------------------------------------------------------------------------

const accessGuardPattern = /\b(useAccessGuard|requireAccess)\s*\(/
for (const page of registeredPages) {
  const pagePath = page && typeof page.path === "string" ? page.path : ""
  if (!pagePath) continue

  const pageFile = `src/${pagePath}.vue`
  const source = readIfExists(pageFile)
  if (!source) continue

  if (accessGuardPattern.test(source)) {
    addHard(`${pageFile}: business pages must not call useAccessGuard or requireAccess`)
  }
}

// -----------------------------------------------------------------------------
// 4. Direct wx.cloud calls in pages or components
// -----------------------------------------------------------------------------

const cloudApiPattern = /\bwx\.cloud\./
const pageAndComponentFiles = [
  ...collectSourceFiles("src/pages", new Set([".ts", ".vue"])),
  ...collectSourceFiles("src/components", new Set([".ts", ".vue"]))
]

for (const filePath of pageAndComponentFiles) {
  const source = readIfExists(filePath)
  const lines = source.split(/\r?\n/)
  lines.forEach((line, index) => {
    if (cloudApiPattern.test(line)) {
      addHard(`${filePath}:${index + 1}: direct wx.cloud call in page/component is forbidden`)
    }
  })
}

// -----------------------------------------------------------------------------
// 5. Native chrome API boundary
// -----------------------------------------------------------------------------

const nativeChromePattern = /uni\.set(?:NavigationBarColor|BackgroundColor|BackgroundTextStyle)\s*\(/
const allSourceFiles = collectSourceFiles("src", new Set([".ts", ".vue"]))

for (const filePath of allSourceFiles) {
  const source = readIfExists(filePath)
  const lines = source.split(/\r?\n/)
  lines.forEach((line, index) => {
    if (nativeChromePattern.test(line) && filePath !== "src/design-system/nav-theme.ts") {
      addHard(`${filePath}:${index + 1}: native chrome API calls are only allowed in src/design-system/nav-theme.ts`)
    }
  })
}

// -----------------------------------------------------------------------------
// 6. Obvious real secret literals (lightweight companion to scan:security-baseline)
// -----------------------------------------------------------------------------

const scanTargets = ["src", "docs", "scripts", "cloudfunctions", "cloudbase", "README.md", "package.json"]
const scannedExtensions = new Set([".json", ".md", ".txt", ".ts", ".tsx", ".vue", ".js", ".mjs"])
const openidPattern = /(^|[^A-Za-z0-9_-])(o[A-Za-z0-9_-]{27})(?=$|[^A-Za-z0-9_-])/g
const sensitiveLiteralPattern =
  /\b(?:pairingCode|pairing_code|PAIRING_CODE|password|PASSWORD|appSecret|AppSecret|APPSECRET|accessToken|refreshToken|idToken|authToken|apiToken|apiKey|api_secret|apiSecret|ACCESS_TOKEN|REFRESH_TOKEN|ID_TOKEN|AUTH_TOKEN|API_TOKEN|API_KEY)\b\s*[:=]\s*(["'`])([^"'`\r\n]{4,})\1/g
const allowedSecretLiteralPattern =
  /^(?:<[A-Z0-9_]+>|[A-Z0-9_]*(?:PLACEHOLDER|ENV_NAME|TOKEN_NAME|SECRET_NAME)|ACCESS_CONTROL_PAIRING_CODE_HASH|ACCESS_CONTROL_PAIRING_CODE_SALT|PAIRING_CODE_HASH_PLACEHOLDER|PAIRING_CODE_SALT_PLACEHOLDER|PAIRING_CODE_PLACEHOLDER|PASSWORD_PLACEHOLDER)$/

const collectExistingFiles = (target) => {
  const absolutePath = join(root, target)
  if (!existsSync(absolutePath)) return []
  const stat = statSync(absolutePath)
  if (stat.isFile()) return [absolutePath]
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

const secretFiles = Array.from(candidateFiles())
  .filter((filePath) => scannedExtensions.has(extname(filePath)))
  .sort()

for (const filePath of secretFiles) {
  const absolutePath = join(root, filePath)
  const source = readFileSync(absolutePath, "utf8")
  const lines = source.split(/\r?\n/)

  lines.forEach((line, index) => {
    openidPattern.lastIndex = 0
    let match = openidPattern.exec(line)
    while (match) {
      addHard(`${filePath}:${index + 1}:${match.index + match[1].length + 1}: WeChat OpenID-like literal must not be committed`)
      match = openidPattern.exec(line)
    }

    sensitiveLiteralPattern.lastIndex = 0
    let literalMatch = sensitiveLiteralPattern.exec(line)
    while (literalMatch) {
      const literalValue = literalMatch[2].trim()
      if (!allowedSecretLiteralPattern.test(literalValue)) {
        addHard(`${filePath}:${index + 1}:${literalMatch.index + 1}: secret-like literal must be a placeholder or environment variable`)
      }
      literalMatch = sensitiveLiteralPattern.exec(line)
    }
  })
}

// -----------------------------------------------------------------------------
// 7. AGENTS.md and CLAUDE.md must reference the project UI Skill
// -----------------------------------------------------------------------------

const skillReference = ".ai/skills/project-ui/SKILL.md"

for (const governanceFile of ["AGENTS.md", "CLAUDE.md"]) {
  const source = readIfExists(governanceFile)
  if (!source) {
    addHard(`${governanceFile}: missing root governance file`)
    continue
  }
  if (!source.includes(skillReference)) {
    addHard(`${governanceFile}: must reference ${skillReference}`)
  }
}

// -----------------------------------------------------------------------------
// 8. Warning-level checks (legacy-safe)
// -----------------------------------------------------------------------------

// Scroll ownership anti-patterns
const scrollViewPattern = /<scroll-view\b/
const overflowScrollPattern = /overflow\s*:\s*(auto|scroll)\b/
const fullHeightPattern = /(?:min-)?height\s*:\s*(?:100vh|calc\s*\(\s*100vh\s*-)/

for (const filePath of pageAndComponentFiles) {
  const source = readIfExists(filePath)
  const lines = source.split(/\r?\n/)
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/)
  const styleMatches = [...source.matchAll(/<style[\s\S]*?<\/style>/g)]

  if (templateMatch && scrollViewPattern.test(templateMatch[1])) {
    addWarn(`${filePath}: internal <scroll-view> detected; verify scroll ownership is intentional`)
  }

  for (const styleBlock of styleMatches) {
    const styleLines = styleBlock[0].split(/\r?\n/)
    styleLines.forEach((line, index) => {
      if (overflowScrollPattern.test(line)) {
        addWarn(`${filePath}:style:${index + 1}: overflow:auto/scroll may create nested scrolling`)
      }
      if (fullHeightPattern.test(line)) {
        addWarn(`${filePath}:style:${index + 1}: fixed viewport height calculation should use runtime metrics and tokens`)
      }
    })
  }
}

// Raw native controls in legacy code
const rawControlPattern = /<(button|input|textarea|checkbox|radio|switch|picker|slider|form)\b/
const rawControlExceptions = new Set(["src/components/AppOptionButton.vue"])

for (const filePath of pageAndComponentFiles) {
  if (rawControlExceptions.has(filePath)) continue
  const source = readIfExists(filePath)
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/)
  if (!templateMatch) continue
  const lines = templateMatch[1].split(/\r?\n/)
  lines.forEach((line, index) => {
    const controlMatch = rawControlPattern.exec(line)
    if (controlMatch) {
      addWarn(`${filePath}:${index + 1}: raw native control <${controlMatch[1]}> should be replaced by Wot UI or an approved app component`)
    }
  })
}

// Raw style values (companion to scan:design-tokens)
const rawStylePatterns = [
  { pattern: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/, label: "raw hex color" },
  { pattern: /\brgba?\s*\(/, label: "raw rgb/rgba color" },
  { pattern: /(?<!\d)(?:[1-9]\d{0,2})\s*(?:px|rpx)\b/, label: "raw fixed px/rpx value" },
  { pattern: /box-shadow\s*:\s*[^;]*\d/, label: "raw box-shadow" },
  { pattern: /(?:transition|animation)\s*:\s*[^;]*\d/, label: "raw transition/animation duration" }
]

for (const filePath of pageAndComponentFiles) {
  const source = readIfExists(filePath)
  const styleMatches = [...source.matchAll(/<style[\s\S]*?<\/style>/g)]
  if (styleMatches.length === 0) continue

  for (const styleBlock of styleMatches) {
    const lines = styleBlock[0].split(/\r?\n/)
    lines.forEach((line, index) => {
      for (const { pattern, label } of rawStylePatterns) {
        if (pattern.test(line)) {
          addWarn(`${filePath}:style:${index + 1}: ${label} should be a design token`)
        }
      }
    })
  }
}

// Duplicate safe-area padding
const safeAreaPattern = /env\s*\(\s*safe-area-inset-bottom\s*\)/

for (const filePath of pageAndComponentFiles) {
  if (filePath === "src/components/AppShell.vue") continue
  const source = readIfExists(filePath)
  const lines = source.split(/\r?\n/)
  lines.forEach((line, index) => {
    if (safeAreaPattern.test(line)) {
      addWarn(`${filePath}:${index + 1}: duplicate env(safe-area-inset-bottom) padding; AppShell already owns bottom safe-area padding`)
    }
  })
}

// Nav action ownership: fixed-position floating actions outside nav owner
const fixedPositionPattern = /position\s*:\s*fixed\b/
const fixedPositionExceptions = new Set(["src/components/AppPetNavigator.vue"])

for (const filePath of pageAndComponentFiles) {
  if (fixedPositionExceptions.has(filePath)) continue
  const source = readIfExists(filePath)
  const styleMatches = [...source.matchAll(/<style[\s\S]*?<\/style>/g)]
  for (const styleBlock of styleMatches) {
    const lines = styleBlock[0].split(/\r?\n/)
    lines.forEach((line, index) => {
      if (fixedPositionPattern.test(line)) {
        addWarn(`${filePath}:style:${index + 1}: position:fixed action may bypass AppCustomNav; use #nav-actions slot or document the exception`)
      }
    })
  }
}

// Keyboard avoidance completeness
const keyboardAvoidancePattern = /\buseKeyboardAvoidance\s*\(/
const keyboardSpacerPattern = /keyboardSpacerStyle/
const adjustPositionFalsePattern = /:adjust-position\s*=\s*["']false["']/g

for (const filePath of collectSourceFiles("src/pages", new Set([".vue"]))) {
  const source = readIfExists(filePath)
  if (!keyboardAvoidancePattern.test(source)) continue

  if (!keyboardSpacerPattern.test(source)) {
    addWarn(`${filePath}: useKeyboardAvoidance is used but no keyboardSpacerStyle spacer is rendered`)
  }

  const inputCount = (source.match(/<(?:wd-input|wd-textarea)\b/g) || []).length
  const adjustFalseCount = (source.match(adjustPositionFalsePattern) || []).length
  if (inputCount > 0 && adjustFalseCount < inputCount) {
    addWarn(`${filePath}: some editable Wot controls do not set :adjust-position="false"; keyboard handling may conflict with native adjustment`)
  }
}

// Missing shared keyboard/safe-area tokens
const tokenRegistrySource = readIfExists("src/design-system/token-registry.ts")
const expectedKeyboardTokens = ["--app-keyboard-height", "--app-safe-keyboard-bottom"]
for (const token of expectedKeyboardTokens) {
  if (!tokenRegistrySource.includes(token)) {
    addWarn(`src/design-system/token-registry.ts: ${token} is not registered; add it if the keyboard/safe-area pattern needs a shared token`)
  }
}

// -----------------------------------------------------------------------------
// Report
// -----------------------------------------------------------------------------

console.log("Project UI governance scan")
console.log("")

if (notes.length > 0) {
  for (const note of notes) {
    console.log(`[INFO] ${note}`)
  }
  console.log("")
}

if (warnings.length > 0) {
  for (const warning of warnings) {
    console.log(`[WARN] ${warning}`)
  }
  console.log("")
}

if (hardFailures.length > 0) {
  for (const failure of hardFailures) {
    console.error(`[FAIL] ${failure}`)
  }
  console.log("")
  console.error(`Scan failed with ${hardFailures.length} hard failure(s) and ${warnings.length} warning(s).`)
  process.exit(1)
}

console.log(`Scan passed. ${warnings.length} warning(s) to review.`)
process.exit(0)
