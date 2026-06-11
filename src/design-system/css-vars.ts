import { appAliasVarNames } from "@/design-system/token-registry"
import type { AppAliasVarName, AppCssVarName, CssVarName } from "@/design-system/token-registry"
import type { AppCssVars, CssVarRecord } from "@/design-system/types"

export const appCssAliasMap = {
  "--app-primary": "--app-color-primary",
  "--app-primary-soft": "--app-color-primary-soft",
  "--app-primary-muted": "--app-color-primary-muted",
  "--app-primary-pressed": "--app-color-primary-pressed",
  "--app-primary-active": "--app-color-primary-active",
  "--app-accent": "--app-color-accent",
  "--app-accent-soft": "--app-color-accent-soft",
  "--app-bg": "--app-color-bg-page",
  "--app-bg-deep": "--app-color-bg-page-soft",
  "--app-bg-muted": "--app-color-bg-page-muted",
  "--app-surface": "--app-color-bg-card",
  "--app-surface-strong": "--app-color-bg-card-elevated",
  "--app-surface-pressed": "--app-color-bg-card-pressed",
  "--app-field": "--app-color-bg-input",
  "--app-control": "--app-color-bg-control",
  "--app-text": "--app-color-text-primary",
  "--app-text-soft": "--app-color-text-secondary",
  "--app-text-muted": "--app-color-text-muted",
  "--app-text-disabled": "--app-color-text-disabled",
  "--app-text-inverse": "--app-color-text-inverse",
  "--app-border": "--app-color-border",
  "--app-border-muted": "--app-color-border-muted",
  "--app-border-strong": "--app-color-border-strong",
  "--app-divider": "--app-color-border-divider",
  "--app-focus-ring": "--app-color-border-focus-ring",
  "--app-danger": "--app-color-danger",
  "--app-danger-soft": "--app-color-danger-soft",
  "--app-warning": "--app-color-warning",
  "--app-warning-soft": "--app-color-warning-soft",
  "--app-success": "--app-color-success",
  "--app-success-soft": "--app-color-success-soft",
  "--app-decor-soft": "--app-color-decor-soft",
  "--app-overlay-soft": "--app-color-overlay-soft",
  "--app-overlay-strong": "--app-color-overlay-strong",
  "--app-media-badge": "--app-color-media-badge-bg",
  "--app-glow": "--app-color-page-glow",
  "--app-shadow": "--app-shadow-card"
} as const satisfies Record<AppAliasVarName, AppCssVarName>

export const appCssAliasNames = appAliasVarNames

export const resolveAppCssAliases = (vars: AppCssVars): AppCssVars => {
  const entries = Object.entries(appCssAliasMap) as Array<[AppAliasVarName, AppCssVarName]>

  return entries.reduce<AppCssVars>((aliases, [aliasName, sourceName]) => {
    const value = vars[sourceName]
    if (typeof value === "string") {
      aliases[aliasName] = value
    }
    return aliases
  }, {})
}

export const makeCssVars = <TName extends CssVarName>(vars: CssVarRecord<TName>): string =>
  Object.entries(vars)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ")
