import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const sourceRoot = join(process.cwd(), "src")
const sourceExtensions = new Set([".vue", ".ts"])
const ignoredSuffixes = [".d.ts"]

const userFacingChecks = [
  {
    label: "template text",
    pattern: />\s*([A-Za-z][^<>{}]*)\s*</g,
    vueOnly: true
  },
  {
    label: "template attribute",
    pattern: /\b(?:title|body|placeholder|confirmText|cancelText|content|label|eyebrow)\s*=\s*"([^"{]*[A-Za-z][^"]*)"/g,
    vueOnly: true
  },
  {
    label: "script UI string",
    pattern: /\b(?:title|body|content|confirmText|cancelText|label|name|message)\s*:\s*"([^"]*[A-Za-z][^"]*)"/g
  }
]

const extensionOf = (filePath) => {
  const match = filePath.match(/\.[^.]+$/)
  return match ? match[0] : ""
}

const collectFiles = (directory) => {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = join(directory, entry)
    const stat = statSync(absolutePath)

    if (stat.isDirectory()) {
      return collectFiles(absolutePath)
    }

    if (ignoredSuffixes.some((suffix) => absolutePath.endsWith(suffix))) {
      return []
    }

    return sourceExtensions.has(extensionOf(absolutePath)) ? [absolutePath] : []
  })
}

const findings = []

const shouldIgnoreValue = (value) => {
  return /^#[0-9a-fA-F]{6}$/.test(value) || /^[A-Z][A-Za-z0-9]+Error$/.test(value)
}

for (const filePath of collectFiles(sourceRoot)) {
  const relativePath = filePath.slice(process.cwd().length + 1)
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/)
  const isVueFile = filePath.endsWith(".vue")

  lines.forEach((line, index) => {
    for (const check of userFacingChecks) {
      if (check.vueOnly && !isVueFile) {
        continue
      }

      check.pattern.lastIndex = 0
      let match = check.pattern.exec(line)
      while (match) {
        const matchedValue = match[1].trim()
        const charBeforeMatch = line[Math.max(0, match.index - 1)]
        if (charBeforeMatch !== ":" && !shouldIgnoreValue(matchedValue)) {
          findings.push({
            file: relativePath,
            line: index + 1,
            label: check.label,
            text: matchedValue
          })
        }
        match = check.pattern.exec(line)
      }
    }
  })
}

if (findings.length === 0) {
  console.log("No likely English user-facing strings found.")
  process.exit(0)
}

for (const finding of findings) {
  console.log(`${finding.file}:${finding.line} [${finding.label}] ${finding.text}`)
}

process.exit(1)
