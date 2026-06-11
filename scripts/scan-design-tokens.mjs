import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join, relative } from "node:path"
import vm from "node:vm"
import ts from "typescript"

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
  "--app-option-swatch-foreground",
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
    label: "warm paper red-blue preset",
    snippet: "warm-paper-red-blue"
  },
  {
    file: "src/design-system/palettes.ts",
    label: "peach mist blue preset",
    snippet: "peach-mist-blue"
  },
  {
    file: "src/design-system/palettes.ts",
    label: "wisteria tea preset",
    snippet: "wisteria-tea"
  },
  {
    file: "src/design-system/palettes.ts",
    label: "apricot sage preset",
    snippet: "apricot-sage"
  },
  {
    file: "src/design-system/palettes.ts",
    label: "plum garden preset",
    snippet: "plum-garden"
  },
  {
    file: "src/design-system/palettes.ts",
    label: "indigo letter preset",
    snippet: "indigo-letter"
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

const expectedPaletteContracts = {
  "warm-paper-red-blue": {
    name: "暖纸红蓝",
    light: { page: "#FFF8F1", card: "#FFFFFF", text: "#2F2427", primary: "#A84E5A", accent: "#3F7897" },
    dark: { page: "#101826", card: "#202B3B", primary: "#E28A93", accent: "#8DBBD4" }
  },
  "peach-mist-blue": {
    name: "桃雾蓝灰",
    light: { page: "#FFF6F2", card: "#FFFEFC", text: "#302327", primary: "#A94F5B", accent: "#446F8D" },
    dark: { page: "#151A24", card: "#262B37", primary: "#E99AA4", accent: "#9FC6DA" }
  },
  "wisteria-tea": {
    name: "紫藤杏茶",
    light: { page: "#F7F2FF", card: "#FFFFFF", text: "#2B2635", primary: "#7256A5", accent: "#A35461" },
    dark: { page: "#171624", card: "#282538", primary: "#B89AE6", accent: "#E59AA4" }
  },
  "apricot-sage": {
    name: "杏茶鼠尾草",
    light: { page: "#FBF4E7", card: "#FFFDF8", text: "#2D261E", primary: "#9A5A33", accent: "#3F6952" },
    dark: { page: "#181713", card: "#29251D", primary: "#E3A46D", accent: "#9AC2A8" }
  },
  "plum-garden": {
    name: "梅子庭院",
    light: { page: "#FCF6F4", card: "#FFFFFF", text: "#2B2328", primary: "#7F4865", accent: "#5D7D6D" },
    dark: { page: "#17171B", card: "#29272D", primary: "#D993B4", accent: "#A9C7B8" }
  },
  "indigo-letter": {
    name: "靛蓝信笺",
    light: { page: "#F8F4EC", card: "#FFFFFF", text: "#272626", primary: "#625C8E", accent: "#A15345" },
    dark: { page: "#121724", card: "#232A3A", primary: "#AAA6DA", accent: "#E09A88" }
  }
}

const expectedPaletteIds = Object.keys(expectedPaletteContracts)

const normalizeHexColor = (value) => {
  const hex = value.trim().replace("#", "")
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((character) => `${character}${character}`)
      .join("")
      .toUpperCase()}`
  }
  return `#${hex.toUpperCase()}`
}

const colorToRgb = (value, backdrop) => {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(trimmed)) {
    const hex = normalizeHexColor(trimmed).slice(1)
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16)
    }
  }

  const rgbaMatch = trimmed.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)$/)
  if (!rgbaMatch) {
    return null
  }

  const alpha = rgbaMatch[4] === undefined ? 1 : Number(rgbaMatch[4])
  const color = {
    r: Number(rgbaMatch[1]),
    g: Number(rgbaMatch[2]),
    b: Number(rgbaMatch[3])
  }

  if (alpha >= 1) {
    return color
  }

  const backdropColor = colorToRgb(backdrop)
  if (!backdropColor) {
    return null
  }

  return {
    r: color.r * alpha + backdropColor.r * (1 - alpha),
    g: color.g * alpha + backdropColor.g * (1 - alpha),
    b: color.b * alpha + backdropColor.b * (1 - alpha)
  }
}

const luminanceFromRgb = (color) => {
  const channel = (value) => {
    const normalized = value / 255
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
}

const contrastRatio = (foreground, background, backdrop) => {
  const foregroundColor = colorToRgb(foreground, backdrop)
  const backgroundColor = colorToRgb(background, backdrop)
  if (!foregroundColor || !backgroundColor) {
    return null
  }

  const foregroundLuminance = luminanceFromRgb(foregroundColor)
  const backgroundLuminance = luminanceFromRgb(backgroundColor)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

const loadRomanticPalettes = () => {
  const source = readProjectFile("src/design-system/palettes.ts")
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText

  const module = { exports: {} }
  const sandbox = {
    exports: module.exports,
    module,
    require: (id) => {
      if (id === "@/design-system/color-scale") {
        return {
          makeColorRole: (role) => role
        }
      }
      if (id.startsWith("@/design-system/types")) {
        return {}
      }
      throw new Error(`Unexpected palette import: ${id}`)
    }
  }

  vm.runInNewContext(output, sandbox, { filename: "src/design-system/palettes.ts" })
  return Array.isArray(module.exports.romanticPalettes) ? module.exports.romanticPalettes : []
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

const addPaletteFinding = (label, value) => {
  addFinding("src/design-system/palettes.ts", 1, label, value)
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

const validateContrast = ({ label, foreground, background, backdrop, minimum, findingLabel }) => {
  const ratio = contrastRatio(foreground, background, backdrop)
  if (ratio === null) {
    addPaletteFinding("unvalidated palette contrast", `${label}: ${foreground} on ${background}`)
    return
  }

  if (ratio < minimum) {
    addPaletteFinding(findingLabel, `${label}: ${ratio.toFixed(2)} < ${minimum}`)
  }
}

try {
  const palettes = loadRomanticPalettes()
  const paletteIds = palettes.map((palette) => palette.id)

  if (paletteIds.length !== expectedPaletteIds.length) {
    addPaletteFinding("palette count mismatch", `${paletteIds.length} !== ${expectedPaletteIds.length}`)
  }

  for (const paletteId of expectedPaletteIds) {
    if (!paletteIds.includes(paletteId)) {
      addPaletteFinding("missing palette preset", paletteId)
    }
  }

  for (const paletteId of paletteIds) {
    if (!expectedPaletteIds.includes(paletteId)) {
      addPaletteFinding("unexpected palette preset", paletteId)
    }
  }

  for (const palette of palettes) {
    const contract = expectedPaletteContracts[palette.id]
    if (!contract) {
      continue
    }

    if (palette.name !== contract.name) {
      addPaletteFinding("palette name mismatch", `${palette.id}: ${palette.name} !== ${contract.name}`)
    }

    const exactColorChecks = [
      ["light.page", palette.schemes?.light?.page?.base, contract.light.page],
      ["light.card", palette.schemes?.light?.card?.base, contract.light.card],
      ["light.text", palette.schemes?.light?.text?.primary, contract.light.text],
      ["light.primary", palette.schemes?.light?.primary?.base, contract.light.primary],
      ["light.accent", palette.schemes?.light?.accent?.base, contract.light.accent],
      ["dark.page", palette.schemes?.dark?.page?.base, contract.dark.page],
      ["dark.card", palette.schemes?.dark?.card?.base, contract.dark.card],
      ["dark.primary", palette.schemes?.dark?.primary?.base, contract.dark.primary],
      ["dark.accent", palette.schemes?.dark?.accent?.base, contract.dark.accent]
    ]

    for (const [label, actual, expected] of exactColorChecks) {
      if (typeof actual !== "string" || normalizeHexColor(actual) !== normalizeHexColor(expected)) {
        addPaletteFinding("palette source color mismatch", `${palette.id}.${label}: ${actual} !== ${expected}`)
      }
    }

    validateContrast({
      label: `${palette.id}.preview.primary`,
      foreground: palette.preview?.foreground,
      background: palette.preview?.primary,
      minimum: 4.5,
      findingLabel: "low action contrast"
    })
    validateContrast({
      label: `${palette.id}.preview.accent`,
      foreground: palette.preview?.foreground,
      background: palette.preview?.accent,
      minimum: 4.5,
      findingLabel: "low action contrast"
    })

    for (const mode of ["light", "dark"]) {
      const scheme = palette.schemes?.[mode]
      if (!scheme) {
        addPaletteFinding("missing palette scheme", `${palette.id}.${mode}`)
        continue
      }

      for (const [surfaceName, surfaceRole] of Object.entries({
        page: scheme.page,
        card: scheme.card,
        input: scheme.input,
        control: scheme.control
      })) {
        validateContrast({
          label: `${palette.id}.${mode}.${surfaceName}.text`,
          foreground: scheme.text.primary,
          background: surfaceRole.base,
          backdrop: scheme.page.base,
          minimum: 4.5,
          findingLabel: "low text contrast"
        })
      }

      const actionRoles = {
        primary: scheme.primary,
        accent: scheme.accent,
        redPerson: scheme.redPerson,
        bluePerson: scheme.bluePerson,
        danger: scheme.status.danger,
        warning: scheme.status.warning,
        success: scheme.status.success,
        info: scheme.status.info,
        swatch: scheme.swatch
      }

      for (const [roleName, colorRole] of Object.entries(actionRoles)) {
        validateContrast({
          label: `${palette.id}.${mode}.${roleName}`,
          foreground: colorRole.foreground,
          background: colorRole.base,
          backdrop: scheme.card.base,
          minimum: 4.5,
          findingLabel: "low action contrast"
        })
      }

      validateContrast({
        label: `${palette.id}.${mode}.onPrimary`,
        foreground: scheme.text.onPrimary,
        background: scheme.primary.base,
        backdrop: scheme.card.base,
        minimum: 4.5,
        findingLabel: "low action contrast"
      })
      validateContrast({
        label: `${palette.id}.${mode}.onAccent`,
        foreground: scheme.text.onAccent,
        background: scheme.accent.base,
        backdrop: scheme.card.base,
        minimum: 4.5,
        findingLabel: "low action contrast"
      })

      for (const [roleName, colorRole] of Object.entries(actionRoles)) {
        for (const stateName of ["soft", "muted", "active"]) {
          validateContrast({
            label: `${palette.id}.${mode}.${roleName}.${stateName}`,
            foreground: scheme.text.primary,
            background: colorRole[stateName],
            backdrop: scheme.card.base,
            minimum: 3,
            findingLabel: "low subtle contrast"
          })
        }
      }
    }
  }
} catch (error) {
  addPaletteFinding("palette validator failed", error instanceof Error ? error.message : String(error))
}

if (findings.length === 0) {
  console.log("No likely hardcoded design-token violations found.")
  process.exit(0)
}

for (const finding of findings) {
  console.log(`${finding.file}:${finding.line} [${finding.label}] ${finding.value}`)
}

process.exit(1)
