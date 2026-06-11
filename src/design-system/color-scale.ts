import type { AppCssVars, AppTheme, ColorRole, RomanticPalette, SemanticColorScheme, StatusColorRoles } from "@/design-system/types"
import type { ColorRoleCssVarName, SemanticColorRoleName } from "@/design-system/token-registry"

export const makeColorRole = (role: ColorRole): ColorRole => role

const roleVars = <TPrefix extends SemanticColorRoleName>(prefix: TPrefix, role: ColorRole): AppCssVars => {
  type RoleVarName = Extract<ColorRoleCssVarName, `--app-color-${TPrefix}` | `--app-color-${TPrefix}-${string}`>

  return {
    [`--app-color-${prefix}`]: role.base,
    [`--app-color-${prefix}-soft`]: role.soft,
    [`--app-color-${prefix}-muted`]: role.muted,
    [`--app-color-${prefix}-pressed`]: role.pressed,
    [`--app-color-${prefix}-active`]: role.active,
    [`--app-color-${prefix}-foreground`]: role.foreground,
    [`--app-color-${prefix}-border`]: role.border,
    [`--app-color-${prefix}-disabled`]: role.disabled,
    [`--app-color-${prefix}-divider`]: role.divider,
    [`--app-color-${prefix}-focus-ring`]: role.focusRing
  } as Record<RoleVarName, string>
}

const statusVars = (status: StatusColorRoles): AppCssVars => ({
  ...roleVars("status-danger", status.danger),
  ...roleVars("status-warning", status.warning),
  ...roleVars("status-success", status.success),
  ...roleVars("status-info", status.info),
  "--app-color-danger": status.danger.base,
  "--app-color-danger-soft": status.danger.soft,
  "--app-color-danger-foreground": status.danger.foreground,
  "--app-color-danger-border": status.danger.border,
  "--app-color-warning": status.warning.base,
  "--app-color-warning-soft": status.warning.soft,
  "--app-color-warning-foreground": status.warning.foreground,
  "--app-color-warning-border": status.warning.border,
  "--app-color-success": status.success.base,
  "--app-color-success-soft": status.success.soft,
  "--app-color-success-foreground": status.success.foreground,
  "--app-color-success-border": status.success.border,
  "--app-color-info": status.info.base,
  "--app-color-info-soft": status.info.soft,
  "--app-color-info-foreground": status.info.foreground,
  "--app-color-info-border": status.info.border
} satisfies AppCssVars)

export const semanticColorSchemeToCssVars = (scheme: SemanticColorScheme): AppCssVars => ({
  ...roleVars("page", scheme.page),
  ...roleVars("card", scheme.card),
  ...roleVars("input", scheme.input),
  ...roleVars("control", scheme.control),
  ...roleVars("primary", scheme.primary),
  ...roleVars("accent", scheme.accent),
  ...roleVars("red-person", scheme.redPerson),
  ...roleVars("blue-person", scheme.bluePerson),
  ...roleVars("overlay", scheme.overlay),
  ...roleVars("swatch", scheme.swatch),
  ...roleVars("photo-badge", scheme.photoBadge),
  ...statusVars(scheme.status),

  "--app-color-bg-page": scheme.page.base,
  "--app-color-bg-page-soft": scheme.page.soft,
  "--app-color-bg-page-muted": scheme.page.muted,
  "--app-color-bg-card": scheme.card.base,
  "--app-color-bg-card-elevated": scheme.card.soft,
  "--app-color-bg-card-pressed": scheme.card.pressed,
  "--app-color-bg-input": scheme.input.base,
  "--app-color-bg-input-active": scheme.input.active,
  "--app-color-bg-control": scheme.control.base,
  "--app-color-bg-control-active": scheme.control.active,

  "--app-color-text-primary": scheme.text.primary,
  "--app-color-text-secondary": scheme.text.secondary,
  "--app-color-text-muted": scheme.text.muted,
  "--app-color-text-disabled": scheme.text.disabled,
  "--app-color-text-inverse": scheme.text.inverse,
  "--app-color-on-primary": scheme.text.onPrimary,
  "--app-color-on-accent": scheme.text.onAccent,
  "--app-color-on-overlay": scheme.text.onOverlay,
  "--app-color-overlay-strong": scheme.overlay.pressed,

  "--app-color-border": scheme.border.base,
  "--app-color-border-muted": scheme.border.muted,
  "--app-color-border-strong": scheme.border.strong,
  "--app-color-border-divider": scheme.border.divider,
  "--app-color-border-disabled": scheme.border.disabled,
  "--app-color-border-focus-ring": scheme.border.focusRing,

  "--app-color-heart-soft": scheme.heartSoft,
  "--app-color-page-glow": scheme.pageGlow,
  "--app-color-accent": scheme.accent.base,
  "--app-color-on-swatch": scheme.swatch.foreground,
  "--app-color-swatch-foreground": scheme.swatch.foreground,
  "--app-color-swatch-border": scheme.swatch.border,
  "--app-color-swatch-active-border": scheme.swatch.border,
  "--app-color-swatch-active-bg": scheme.swatch.active,
  "--app-color-photo-badge-bg": scheme.photoBadge.base,
  "--app-color-photo-badge-border": scheme.photoBadge.border,

  "--app-shadow-card": scheme.shadows.card,
  "--app-shadow-floating": scheme.shadows.floating,
  "--app-shadow-button": scheme.shadows.button,
  "--app-shadow-image": scheme.shadows.image,
  "--app-shadow-logo": scheme.shadows.logo
} satisfies AppCssVars)

export const resolvePaletteColorVars = (palette: RomanticPalette, theme: AppTheme): AppCssVars =>
  semanticColorSchemeToCssVars(palette.schemes[theme])

export const resolvePalettePreviewVars = (palette: RomanticPalette): AppCssVars => ({
  "--app-option-swatch-primary": palette.preview.primary,
  "--app-option-swatch-accent": palette.preview.accent,
  "--app-option-swatch-glow": palette.preview.glow,
  "--app-option-swatch-foreground": palette.preview.foreground
} satisfies AppCssVars)
