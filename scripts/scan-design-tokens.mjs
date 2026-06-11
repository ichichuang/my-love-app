import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join, relative } from "node:path"

const root = process.cwd()
const scanRoots = ["src/components", "src/pages", "src/App.vue"]
const definitionRoots = ["src/styles", "src/design-system", "src/components"]
const sourceExtensions = new Set([".vue", ".scss", ".ts"])

const allowedPathPatterns = [
  /^src\/styles\//,
  /^src\/design-system\//,
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
  "50%",
  "1200"
])

const scaleKeys = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"]

const dynamicAppTokens = new Set([
  "--app-option-group-columns",
  "--app-option-swatch-primary",
  "--app-option-swatch-accent",
  "--app-option-swatch-glow",
  ...scaleKeys.flatMap((key) => [
    `--app-space-scale-${key}`,
    `--app-radius-scale-${key}`,
    `--app-control-scale-${key}`
  ])
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
const appTokenPattern = /--app-[a-z0-9-]+/g
const appTokenDefinitionPattern = /(--app-[a-z0-9-]+)\s*:/g

const requiredThemeContractSnippets = [
  {
    file: "src/components/AppShell.vue",
    label: "AppShell Wot provider",
    snippet: "<wd-config-provider"
  },
  {
    file: "src/components/AppShell.vue",
    label: "AppShell provider refresh key",
    snippet: ':key="theme.providerKey"'
  },
  {
    file: "src/components/AppShell.vue",
    label: "AppShell Wot theme",
    snippet: ':theme="theme.wotTheme"'
  },
  {
    file: "src/components/AppShell.vue",
    label: "AppShell Wot theme vars",
    snippet: ':theme-vars="theme.wotThemeVars"'
  },
  {
    file: "src/components/AppShell.vue",
    label: "AppShell app style vars",
    snippet: ':style="theme.appStyle"'
  },
  {
    file: "src/stores/theme.ts",
    label: "provider key resolver",
    snippet: "resolveThemeProviderKey"
  },
  {
    file: "src/design-system/palettes.ts",
    label: "warm red-blue preset",
    snippet: "warm-red-blue"
  },
  {
    file: "src/design-system/palettes.ts",
    label: "soft pink-blue preset",
    snippet: "soft-pink-blue"
  },
  {
    file: "src/design-system/palettes.ts",
    label: "night red-blue preset",
    snippet: "night-red-blue"
  },
  {
    file: "src/design-system/color-scale.ts",
    label: "semantic color family resolver",
    snippet: "semanticColorSchemeToCssVars"
  },
  {
    file: "src/design-system/size-scale.ts",
    label: "rpx scale keys",
    snippet: "\"2xs\""
  },
  {
    file: "src/design-system/typography-resolver.ts",
    label: "font scale resolver",
    snippet: "resolveTypographyTokens"
  },
  {
    file: "src/design-system/wot-theme.ts",
    label: "Wot supported theme var typing",
    snippet: "ConfigProviderThemeVars"
  },
  {
    file: "src/design-system/wot-theme.ts",
    label: "Wot button height resolver",
    snippet: "size.wot.buttonLargeHeight"
  },
  {
    file: "src/design-system/wot-theme.ts",
    label: "Wot button radius resolver",
    snippet: "size.wot.buttonLargeRadius"
  },
  {
    file: "src/design-system/nav-theme.ts",
    label: "navigation theme fail callback",
    snippet: "fail:"
  },
  {
    file: "src/design-system/nav-theme.ts",
    label: "navigation theme debounce",
    snippet: "setTimeout"
  },
  {
    file: "src/App.vue",
    label: "App navigation scheduler",
    snippet: "scheduleNavigationTheme(theme.navigationTheme)"
  },
  {
    file: "src/App.vue",
    label: "WeChat button pseudo reset",
    snippet: "button::after"
  },
  {
    file: "src/components/AppOptionButton.vue",
    label: "option button component",
    snippet: "app-option-button"
  },
  {
    file: "src/components/AppOptionGroup.vue",
    label: "option group component",
    snippet: "app-option-group"
  },
  {
    file: "src/pages.json",
    label: "option button easycom",
    snippet: "^app-option-button$"
  },
  {
    file: "src/pages.json",
    label: "design preview route",
    snippet: "pages/design-preview/design-preview"
  },
  {
    file: "src/pages/settings/settings.vue",
    label: "design preview settings entry",
    snippet: "openDesignPreview"
  }
]

const requiredAliasVars = [
  "--app-primary",
  "--app-primary-soft",
  "--app-accent",
  "--app-bg",
  "--app-bg-deep",
  "--app-surface",
  "--app-surface-strong",
  "--app-field",
  "--app-control",
  "--app-text",
  "--app-text-soft",
  "--app-text-muted",
  "--app-text-disabled",
  "--app-border",
  "--app-divider",
  "--app-focus-ring",
  "--app-glow",
  "--app-shadow"
]

const normalizePath = (filePath) => relative(root, filePath).replaceAll("\\", "/")

const isAllowedPath = (relativePath) => allowedPathPatterns.some((pattern) => pattern.test(relativePath))

const collectFiles = (target, allowAllowedPath = false) => {
  const absolutePath = join(root, target)
  if (!existsSync(absolutePath)) {
    return []
  }

  const stat = statSync(absolutePath)
  if (stat.isDirectory()) {
    return readdirSync(absolutePath).flatMap((entry) => collectFiles(join(target, entry), allowAllowedPath))
  }

  const relativePath = normalizePath(absolutePath)
  if (!allowAllowedPath && isAllowedPath(relativePath)) {
    return []
  }

  return sourceExtensions.has(extname(absolutePath)) ? [absolutePath] : []
}

const readProjectFile = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), "utf8")
  } catch {
    return ""
  }
}

const findings = []

const addFinding = (file, line, label, value) => {
  findings.push({
    file,
    line,
    label,
    value
  })
}

const addContractFinding = (file, label, value) => {
  addFinding(file, 1, label, value)
}

const knownAppTokens = new Set(dynamicAppTokens)
for (const filePath of definitionRoots.flatMap((target) => collectFiles(target, true))) {
  const content = readFileSync(filePath, "utf8")
  appTokenDefinitionPattern.lastIndex = 0
  let match = appTokenDefinitionPattern.exec(content)
  while (match) {
    knownAppTokens.add(match[1])
    match = appTokenDefinitionPattern.exec(content)
  }

  appTokenPattern.lastIndex = 0
  match = appTokenPattern.exec(content)
  while (match) {
    if (normalizePath(filePath).startsWith("src/design-system/")) {
      knownAppTokens.add(match[0])
    }
    match = appTokenPattern.exec(content)
  }
}

for (const filePath of scanRoots.flatMap((target) => collectFiles(target))) {
  const relativePath = normalizePath(filePath)
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/)

  lines.forEach((line, index) => {
    checks.forEach((check) => {
      check.pattern.lastIndex = 0
      let match = check.pattern.exec(line)
      while (match) {
        const value = match[1] ?? match[0]
        if (!check.isAllowed(line, value)) {
          addFinding(relativePath, index + 1, check.label, value.trim())
        }
        match = check.pattern.exec(line)
      }
    })

    lengthPattern.lastIndex = 0
    let lengthMatch = lengthPattern.exec(line)
    while (lengthMatch) {
      const value = lengthMatch[0]
      if (!line.includes("var(") && !allowedLengthValues.has(value)) {
        addFinding(relativePath, index + 1, "raw style length", value)
      }
      lengthMatch = lengthPattern.exec(line)
    }

    appTokenPattern.lastIndex = 0
    let tokenMatch = appTokenPattern.exec(line)
    while (tokenMatch) {
      const value = tokenMatch[0]
      if (!knownAppTokens.has(value)) {
        addFinding(relativePath, index + 1, "unknown app token", value)
      }
      tokenMatch = appTokenPattern.exec(line)
    }
  })
}

for (const check of requiredThemeContractSnippets) {
  const content = readProjectFile(check.file)
  if (!content.includes(check.snippet)) {
    addContractFinding(check.file, "missing theme contract", check.label)
  }
}

const cssVarsContent = readProjectFile("src/design-system/css-vars.ts")
for (const aliasName of requiredAliasVars) {
  if (!cssVarsContent.includes(aliasName)) {
    addContractFinding("src/design-system/css-vars.ts", "missing app CSS alias", aliasName)
  }
}

for (const pagePath of collectFiles("src/pages", true).filter((file) => file.endsWith(".vue"))) {
  const relativePath = normalizePath(pagePath)
  const content = readFileSync(pagePath, "utf8")
  if (!content.includes("<app-shell")) {
    addContractFinding(relativePath, "page bypasses AppShell", "<app-shell")
  }
}

for (const relativePath of ["src/pages/settings/settings.vue", "src/components/ThemeSwatchPicker.vue"]) {
  const content = readProjectFile(relativePath)
  if (content.includes("<button")) {
    addContractFinding(relativePath, "raw option button bypass", "use AppOptionButton")
  }
}

const appStyleReferences = scanRoots
  .flatMap((target) => collectFiles(target, true))
  .map((filePath) => normalizePath(filePath))
  .filter((relativePath) => readProjectFile(relativePath).includes("theme.appStyle"))

if (appStyleReferences.some((relativePath) => relativePath !== "src/components/AppShell.vue")) {
  addContractFinding("src/components/AppShell.vue", "AppShell style root bypass", appStyleReferences.join(", "))
}

for (const relativePath of [
  "src/stores/theme.ts",
  ...collectFiles("src/pages", true).map(normalizePath),
  ...collectFiles("src/components", true).map(normalizePath),
  ...collectFiles("src/design-system", true).map(normalizePath).filter((file) => file !== "src/design-system/nav-theme.ts")
]) {
  const content = readProjectFile(relativePath)
  if (content.includes("setNavigationBarColor")) {
    addContractFinding(relativePath, "forbidden navigation side effect", "setNavigationBarColor")
  }

  if (relativePath.startsWith("src/design-system/") && /(?:uni|wx)\./.test(content)) {
    addContractFinding(relativePath, "runtime API in pure design-system module", "uni/wx")
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
