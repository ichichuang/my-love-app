# Full Background Coverage, Safe-Area, and Keyboard Avoidance Checklist

Use this checklist before changing `AppShell.vue`, `AppCustomNav.vue`, page backgrounds, bottom spacing, or keyboard handling.

## Full Background Coverage

- [ ] `AppShell.vue` remains the only runtime app-level CSS variable injection root.
- [ ] `AppShell` root `view` binds `theme.appStyle` and `theme.themeClasses`.
- [ ] Background visually covers status bar, custom nav, content, and bottom safe area.
- [ ] No blank gaps appear between these regions.
- [ ] No page-local background overrides the `page-shell` mixin background.

## Safe Area

- [ ] `AppShell.vue` applies bottom safe-area padding once: `calc($app-page-y + env(safe-area-inset-bottom))`.
- [ ] Inner containers do not re-add `env(safe-area-inset-bottom)` unless explicitly documented.
- [ ] `--app-safe-action-bottom-gap` is used for spacing above actions, not for safe-area compensation.

## Keyboard Avoidance

- [ ] Editable pages use `useKeyboardAvoidance()` from `@/composables/useKeyboardAvoidance`.
- [ ] Inputs set `:adjust-position="false"`.
- [ ] Inputs emit `@focus="focusField('#selector')"`.
- [ ] Inputs emit `@keyboardheightchange="syncKeyboardHeight"`.
- [ ] A visually inert `keyboard-spacer` is rendered at the bottom of the form.
- [ ] No page-specific magic spacing or hardcoded `padding-bottom` solves keyboard overlap.

## Token Additions

- [ ] If a `--app-keyboard-height` or `--app-safe-keyboard-bottom` token is added, it goes through `src/design-system/token-registry.ts` and is consumed by the shared composable, not by individual pages.

## Anti-Patterns

- [ ] No per-page `safe-area-inset-bottom` padding.
- [ ] No manual `pageScrollTo` calls outside the shared composable.
- [ ] No `setData` layout mutations during keyboard open that could steal focus on iOS.
