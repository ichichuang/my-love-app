import { readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join, relative } from "node:path"

const root = process.cwd()
const scanRoots = ["src/components", "src/pages", "src/App.vue"]
const sourceExtensions = new Set([".vue", ".scss", ".ts"])

const allowedPathPatterns = [
  /^src\/styles\//,
  /^src\/uni\.scss$/,
  /^src\/theme\.json$/,
  /^theme\.json$/,
  /^src\/manifest\.json$/,
  /^manifest\.config\.ts$/,
  /^static\//,
  /^dist\//,
  /^docs\//,
  /^tests?\//
]

const allowedLengthValues = new Set([
  "0",
  "0%",
  "100%",
  "1fr",
  "2",
  "3",
  "9",
  "16",
  "48",
  "1200"
])

const checks = [
  {
    label: "hex color",
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    isAllowed: (line) => line.includes("var(")
  },
  {
    label: "rgb color",
    pattern: /\brgba?\([^)]+\)/g,
    isAllowed: (line) => line.includes("var(")
  },
  {
    label: "direct box-shadow",
    pattern: /\bbox-shadow\s*:\s*([^;]+)/g,
    isAllowed: (_line, value) => value.includes("var(") || value.trim() === "none"
  },
  {
    label: "direct transition duration",
    pattern: /\btransition(?:-[a-z-]+)?\s*:\s*([^;]*(?:\d+(?:\.\d+)?m?s)[^;]*)/g,
    isAllowed: (line, value) => line.includes("var(") || value.includes("var(")
  }
]

const lengthPattern = /\b\d+(?:\.\d+)?(?:rpx|px|ms|s)\b/g

const normalizePath = (filePath) => relative(root, filePath).replaceAll("\\", "/")

const isAllowedPath = (relativePath) => {
  return allowedPathPatterns.some((pattern) => pattern.test(relativePath))
}

const collectFiles = (target) => {
  const absolutePath = join(root, target)
  const stat = statSync(absolutePath)

  if (stat.isDirectory()) {
    return readdirSync(absolutePath).flatMap((entry) => collectFiles(join(target, entry)))
  }

  const relativePath = normalizePath(absolutePath)
  if (isAllowedPath(relativePath)) {
    return []
  }

  return sourceExtensions.has(extname(absolutePath)) ? [absolutePath] : []
}

const files = scanRoots.flatMap(collectFiles)
const findings = []
const lengthFindingsByValue = new Map()

for (const filePath of files) {
  const relativePath = normalizePath(filePath)
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/)

  lines.forEach((line, index) => {
    checks.forEach((check) => {
      check.pattern.lastIndex = 0
      let match = check.pattern.exec(line)
      while (match) {
        const value = match[1] ?? match[0]
        if (!check.isAllowed(line, value)) {
          findings.push({
            file: relativePath,
            line: index + 1,
            label: check.label,
            value: value.trim()
          })
        }
        match = check.pattern.exec(line)
      }
    })

    lengthPattern.lastIndex = 0
    let lengthMatch = lengthPattern.exec(line)
    while (lengthMatch) {
      const value = lengthMatch[0]
      if (!line.includes("var(") && !allowedLengthValues.has(value)) {
        const existing = lengthFindingsByValue.get(value) ?? []
        existing.push({
          file: relativePath,
          line: index + 1,
          label: "repeated raw length",
          value
        })
        lengthFindingsByValue.set(value, existing)
      }
      lengthMatch = lengthPattern.exec(line)
    }
  })
}

for (const repeated of lengthFindingsByValue.values()) {
  if (repeated.length > 1) {
    findings.push(...repeated)
  }
}

if (findings.length === 0) {
  console.log("No likely hardcoded design-token violations found.")
  process.exit(0)
}

for (const finding of findings) {
  console.log(`${finding.file}:${finding.line} [${finding.label}] ${finding.value}`)
}

process.exit(1)
