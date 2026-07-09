# Scroll Ownership and Height Calculation Checklist

Use this checklist before adding scroll containers, fixed panels, lists, or any height calculations.

## Scroll Ownership

- [ ] Page has exactly one intended scroll owner.
- [ ] Default owner is WeChat page scroll (no internal `scroll-view`).
- [ ] Internal scroll container is used only when the design genuinely requires it.
- [ ] No nested accidental scrolling exists.
- [ ] Scroll affordance is not shown when content does not overflow.

## Fixed Panels / Internal Scroll

If the design requires a fixed-height panel or internal scroll container:

- [ ] Height is computed from runtime window height.
- [ ] Custom nav height (`metrics.customNavHeight`) is subtracted.
- [ ] `AppShell` top/bottom padding (`--app-page-padding-y`) is accounted for.
- [ ] Bottom safe area (`env(safe-area-inset-bottom)`) is accounted for exactly once.
- [ ] Keyboard state (`useKeyboardAvoidance`) is accounted for when relevant.
- [ ] Fixed action bars or toolbars are accounted for.
- [ ] Calculation uses tokens and runtime metrics, not hardcoded `100vh - 200rpx`.

## Pull-to-Refresh

- [ ] Declared in `src/pages.json` only for pages that genuinely need it.
- [ ] Implementation uses `onPullDownRefresh` and calls `uni.stopPullDownRefresh`.

## Anti-Patterns to Avoid

- [ ] No `overflow: auto` or `overflow: scroll` added to arbitrary containers.
- [ ] No `height: 100vh` on inner panels.
- [ ] No manual `calc(100vh - ...)` with magic numbers in page styles.
- [ ] No duplicate `env(safe-area-inset-bottom)` padding when `AppShell` already owns it.
