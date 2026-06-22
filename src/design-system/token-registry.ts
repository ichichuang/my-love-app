export const scaleKeys = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const

export type CssVarName = `--${string}`
export type ScaleKey = (typeof scaleKeys)[number]

export const scaleCssVarPrefixes = ["space-scale", "radius-scale", "control-scale"] as const

export type ScaleCssVarPrefix = (typeof scaleCssVarPrefixes)[number]
export type ScaleCssVarName = `--app-${ScaleCssVarPrefix}-${ScaleKey}`

export const scaleCssVarNames = scaleCssVarPrefixes.flatMap((prefix) =>
  scaleKeys.map((key) => `--app-${prefix}-${key}` as const)
) as readonly ScaleCssVarName[]

export const primitiveColorVarNames = [
  "--app-red-50",
  "--app-red-100",
  "--app-red-300",
  "--app-red-500",
  "--app-red-700",
  "--app-blue-50",
  "--app-blue-100",
  "--app-blue-300",
  "--app-blue-500",
  "--app-blue-700",
  "--app-pink-50",
  "--app-pink-100",
  "--app-pink-300",
  "--app-pink-500",
  "--app-ivory-50",
  "--app-ivory-100",
  "--app-ivory-200",
  "--app-navy-700",
  "--app-navy-800",
  "--app-navy-900",
  "--app-neutral-50",
  "--app-neutral-100",
  "--app-neutral-200",
  "--app-neutral-500",
  "--app-neutral-700",
  "--app-neutral-900",
  "--app-white",
  "--app-black"
] as const

export type PrimitiveColorVarName = (typeof primitiveColorVarNames)[number]

export const semanticColorRoleNames = [
  "page",
  "card",
  "input",
  "control",
  "primary",
  "accent",
  "red-person",
  "blue-person",
  "overlay",
  "swatch",
  "photo-badge",
  "status-danger",
  "status-warning",
  "status-success",
  "status-info"
] as const

export const colorRoleStateSuffixes = [
  "soft",
  "muted",
  "pressed",
  "active",
  "foreground",
  "border",
  "disabled",
  "divider",
  "focus-ring"
] as const

export type SemanticColorRoleName = (typeof semanticColorRoleNames)[number]
export type ColorRoleStateSuffix = (typeof colorRoleStateSuffixes)[number]
export type ColorRoleCssVarName =
  | `--app-color-${SemanticColorRoleName}`
  | `--app-color-${SemanticColorRoleName}-${ColorRoleStateSuffix}`

export const colorRoleCssVarNames = semanticColorRoleNames.flatMap((role) => [
  `--app-color-${role}` as const,
  ...colorRoleStateSuffixes.map((state) => `--app-color-${role}-${state}` as const)
]) as readonly ColorRoleCssVarName[]

export const semanticColorAliasVarNames = [
  "--app-color-bg-page",
  "--app-color-bg-page-soft",
  "--app-color-bg-page-muted",
  "--app-color-bg-card",
  "--app-color-bg-card-elevated",
  "--app-color-bg-card-pressed",
  "--app-color-bg-input",
  "--app-color-bg-input-active",
  "--app-color-bg-control",
  "--app-color-bg-control-active",
  "--app-color-text-primary",
  "--app-color-text-secondary",
  "--app-color-text-muted",
  "--app-color-text-disabled",
  "--app-color-text-inverse",
  "--app-color-on-primary",
  "--app-color-on-accent",
  "--app-color-on-overlay",
  "--app-color-overlay-strong",
  "--app-color-border",
  "--app-color-border-muted",
  "--app-color-border-strong",
  "--app-color-border-divider",
  "--app-color-border-disabled",
  "--app-color-border-focus-ring",
  "--app-color-heart-soft",
  "--app-color-page-glow",
  "--app-color-on-swatch",
  "--app-color-swatch-foreground",
  "--app-color-swatch-border",
  "--app-color-swatch-active-border",
  "--app-color-swatch-active-bg",
  "--app-color-photo-badge-bg",
  "--app-color-photo-badge-border",
  "--app-color-danger",
  "--app-color-danger-soft",
  "--app-color-danger-foreground",
  "--app-color-danger-border",
  "--app-color-warning",
  "--app-color-warning-soft",
  "--app-color-warning-foreground",
  "--app-color-warning-border",
  "--app-color-success",
  "--app-color-success-soft",
  "--app-color-success-foreground",
  "--app-color-success-border",
  "--app-color-info",
  "--app-color-info-soft",
  "--app-color-info-foreground",
  "--app-color-info-border"
] as const

export type SemanticColorAliasVarName = (typeof semanticColorAliasVarNames)[number]
export type SemanticColorVarName = ColorRoleCssVarName | SemanticColorAliasVarName

export const semanticColorVarNames = [
  ...colorRoleCssVarNames,
  ...semanticColorAliasVarNames
] as readonly SemanticColorVarName[]

export const appAliasVarNames = [
  "--app-primary",
  "--app-primary-soft",
  "--app-primary-muted",
  "--app-primary-pressed",
  "--app-primary-active",
  "--app-accent",
  "--app-accent-soft",
  "--app-bg",
  "--app-bg-deep",
  "--app-bg-muted",
  "--app-surface",
  "--app-surface-strong",
  "--app-surface-pressed",
  "--app-field",
  "--app-control",
  "--app-text",
  "--app-text-soft",
  "--app-text-muted",
  "--app-text-disabled",
  "--app-text-inverse",
  "--app-border",
  "--app-border-muted",
  "--app-border-strong",
  "--app-divider",
  "--app-focus-ring",
  "--app-danger",
  "--app-danger-soft",
  "--app-warning",
  "--app-warning-soft",
  "--app-success",
  "--app-success-soft",
  "--app-heart-soft",
  "--app-overlay-soft",
  "--app-overlay-strong",
  "--app-photo-badge",
  "--app-glow",
  "--app-shadow"
] as const

export type AppAliasVarName = (typeof appAliasVarNames)[number]

export const spaceStepKeys = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "18",
  "20",
  "24",
  "28",
  "32",
  "36",
  "40",
  "44",
  "48",
  "56",
  "64"
] as const

export type SpaceStepKey = (typeof spaceStepKeys)[number]
export type SpaceVarName = `--app-space-${SpaceStepKey}` | `--app-space-scale-${ScaleKey}`

export const spaceVarNames = [
  ...spaceStepKeys.map((key) => `--app-space-${key}` as const),
  ...scaleKeys.map((key) => `--app-space-scale-${key}` as const)
] as readonly SpaceVarName[]

export const radiusTokenKeys = [
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "pill",
  "round",
  "card",
  "button",
  "input",
  "image",
  "sheet",
  "badge"
] as const

export type RadiusTokenKey = (typeof radiusTokenKeys)[number]
export type RadiusVarName = `--app-radius-${RadiusTokenKey}` | `--app-radius-scale-${ScaleKey}`

export const radiusVarNames = [
  ...radiusTokenKeys.map((key) => `--app-radius-${key}` as const),
  ...scaleKeys.map((key) => `--app-radius-scale-${key}` as const)
] as readonly RadiusVarName[]

export const borderWidthVarNames = [
  "--app-border-width-hairline",
  "--app-border-width-focus"
] as const

export type BorderWidthVarName = (typeof borderWidthVarNames)[number]

export const controlVarNames = [
  "--app-control-height-sm",
  "--app-control-height-md",
  "--app-control-height-lg",
  "--app-button-height",
  "--app-input-height",
  "--app-nav-height",
  ...scaleKeys.map((key) => `--app-control-scale-${key}` as const)
] as const

export type ControlVarName = (typeof controlVarNames)[number]

export const typographyVarNames = [
  "--app-font-family-body",
  "--app-font-family-display",
  "--app-font-weight-medium",
  "--app-font-weight-semibold",
  "--app-line-height-none",
  "--app-line-height-tight",
  "--app-line-height-snug",
  "--app-line-height-normal",
  "--app-line-height-relaxed",
  "--app-line-height-loose",
  "--app-font-size-2xs",
  "--app-font-size-xs",
  "--app-font-size-sm",
  "--app-font-size-md",
  "--app-font-size-base",
  "--app-font-size-body",
  "--app-font-size-lg",
  "--app-font-size-xl",
  "--app-font-size-2xl",
  "--app-font-size-3xl",
  "--app-font-size-4xl",
  "--app-font-size-5xl",
  "--app-font-size-6xl",
  "--app-font-size-7xl",
  "--app-font-size-page-title",
  "--app-font-page-title",
  "--app-font-section-title",
  "--app-font-body",
  "--app-font-caption",
  "--app-font-button",
  "--app-font-card-title",
  "--app-font-hero-title",
  "--app-font-detail-title"
] as const

export type TypographyVarName = (typeof typographyVarNames)[number]

export const shadowVarNames = [
  "--app-shadow-color-soft",
  "--app-shadow-color-card",
  "--app-shadow-color-dark",
  "--app-shadow-none",
  "--app-shadow-sm",
  "--app-shadow-md",
  "--app-shadow-lg",
  "--app-shadow-xl",
  "--app-shadow-card",
  "--app-shadow-floating",
  "--app-shadow-button",
  "--app-shadow-image",
  "--app-shadow-logo",
  "--app-shadow-focus"
] as const

export type ShadowVarName = (typeof shadowVarNames)[number]

export const motionVarNames = [
  "--app-duration-fast",
  "--app-duration-normal",
  "--app-duration-slow",
  "--app-ease-standard",
  "--app-ease-emphasized",
  "--app-transition-fast",
  "--app-transition-normal",
  "--app-transition-slow",
  "--app-transition-theme",
  "--app-press-scale",
  "--app-press-opacity",
  "--app-muted-opacity",
  "--app-decor-opacity",
  "--app-disabled-opacity",
  "--app-fade-offset-y"
] as const

export type MotionVarName = (typeof motionVarNames)[number]

export const componentVarNames = [
  "--app-page-padding-x",
  "--app-page-padding-y",
  "--app-section-gap",
  "--app-card-padding",
  "--app-card-gap",
  "--app-list-gap",
  "--app-form-gap",
  "--app-image-grid-gap",
  "--app-entry-card-min-height",
  "--app-safe-action-bottom-gap",
  "--app-textarea-min-height",
  "--app-shell-header-gap",
  "--app-shell-header-bottom",
  "--app-shell-header-top",
  "--app-shell-eyebrow-bottom",
  "--app-panel-border-width",
  "--app-field-padding-x",
  "--app-empty-padding-y",
  "--app-empty-padding-x",
  "--app-empty-decor-size",
  "--app-empty-image-size",
  "--app-empty-mark-size",
  "--app-home-logo-size",
  "--app-home-decor-width",
  "--app-home-decor-height",
  "--app-home-decor-bottom",
  "--app-entry-date-width",
  "--app-entry-cover-width",
  "--app-entry-cover-height",
  "--app-entry-meta-padding-y",
  "--app-entry-meta-padding-x",
  "--app-image-badge-size",
  "--app-image-remove-touch-size",
  "--app-image-remove-height",
  "--app-image-remove-padding-x",
  "--app-option-group-gap",
  "--app-option-group-auto-min-width",
  "--app-option-group-swatch-min-width",
  "--app-option-padding-x",
  "--app-option-padding-y",
  "--app-option-min-height",
  "--app-option-swatch-primary",
  "--app-option-swatch-accent",
  "--app-option-swatch-glow",
  "--app-option-swatch-foreground",
  "--app-swatch-height",
  "--app-swatch-gradient-size",
  "--app-swatch-custom-button-width",
  "--app-cloud-value-width"
] as const

export type ComponentVarName = (typeof componentVarNames)[number]

export const wotRequiredAppVarNames = [
  "--app-color-text-primary",
  "--app-color-text-secondary",
  "--app-color-text-muted",
  "--app-color-text-disabled",
  "--app-color-text-inverse",
  "--app-color-border",
  "--app-color-border-strong",
  "--app-color-bg-page",
  "--app-color-bg-card",
  "--app-color-bg-card-elevated",
  "--app-color-primary",
  "--app-color-danger",
  "--app-color-warning",
  "--app-color-success",
  "--app-color-blue-person",
  "--app-color-on-primary",
  "--app-color-on-accent",
  "--app-color-on-overlay",
  "--app-color-success-foreground",
  "--app-color-warning-foreground",
  "--app-color-danger-foreground",
  "--app-color-accent",
  "--app-color-accent-border",
  "--app-font-weight-medium",
  "--app-font-weight-semibold",
  "--app-disabled-opacity"
] as const satisfies readonly AppCssVarName[]

export type WotRequiredAppVarName = (typeof wotRequiredAppVarNames)[number]

export const intentionalDynamicComponentVarNames = [
  "--app-option-group-columns",
  "--app-option-swatch-primary",
  "--app-option-swatch-accent",
  "--app-option-swatch-glow",
  "--app-option-swatch-foreground"
] as const

export type IntentionalDynamicComponentVarName = (typeof intentionalDynamicComponentVarNames)[number]

export type AppCssVarName =
  | PrimitiveColorVarName
  | SemanticColorVarName
  | AppAliasVarName
  | SpaceVarName
  | RadiusVarName
  | BorderWidthVarName
  | ControlVarName
  | TypographyVarName
  | ShadowVarName
  | MotionVarName
  | ComponentVarName

export const appCssVarNames = [
  ...primitiveColorVarNames,
  ...semanticColorVarNames,
  ...appAliasVarNames,
  ...spaceVarNames,
  ...radiusVarNames,
  ...borderWidthVarNames,
  ...controlVarNames,
  ...typographyVarNames,
  ...shadowVarNames,
  ...motionVarNames,
  ...componentVarNames
] as readonly AppCssVarName[]
