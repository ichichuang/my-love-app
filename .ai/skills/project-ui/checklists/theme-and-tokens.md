# Theme and Design-Token Checklist

Use this checklist before adding colors, spacing, radius, shadows, typography, motion, or any new `--app-*` variable.

## Token Sources

- [ ] Existing registered `--app-*` tokens are used.
- [ ] Mixins from `src/styles/mixins.scss` are used where available (`page-shell`, `panel`, `label`, `field`, `pressable`, `sticky-section`, etc.).
- [ ] Wot UI theme variables are driven through `theme.wotThemeVars`.

## Forbidden Raw Values

In `src/pages/**` and `src/components/**`, do not add:

- [ ] raw hex colors
- [ ] raw `rgba()` / `rgb()`
- [ ] raw fixed `px` or `rpx` spacing
- [ ] raw border radius values
- [ ] raw `box-shadow` values
- [ ] raw transition durations
- [ ] raw animation durations
- [ ] raw `z-index` values
- [ ] unregistered `--app-*` variables

## Adding New Tokens

If a new token is unavoidable:

- [ ] Define it in `src/design-system/**` or `src/styles/tokens/**`.
- [ ] Register it in `src/design-system/token-registry.ts`.
- [ ] Update relevant scans (`scan-design-tokens`, `scan-project-ui`).
- [ ] Update documentation if it changes the public token contract.

## Dynamic Component Variables

- [ ] Component runtime variables such as `--app-option-group-columns` and `--app-option-swatch-*` are registered in `token-registry.ts` under `intentionalDynamicComponentVarNames`.
- [ ] No other inline `--app-*` definitions exist in page or component styles.

## Wot UI Theme

- [ ] `AppShell` provides `wd-config-provider` with `:key="theme.providerKey"`, `:theme="theme.wotTheme"`, and `:theme-vars="theme.wotThemeVars"`.
- [ ] Wot button heights, radii, and font sizes come from `src/design-system/size-resolver.ts`.

## Validation

- [ ] Run `pnpm scan:design-tokens` after styling changes.
