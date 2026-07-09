# UI Anti-Patterns

These patterns are forbidden in new code. Legacy code may contain some; do not spread them.

## Page Shell Anti-Patterns

- ❌ `<page-meta>` not the first node.
- ❌ `<page-meta>` after `<app-shell>`.
- ❌ Page root is a plain `<view>` instead of `<app-shell>`.
- ❌ Page calls `uni.setNavigationBarColor` / `setBackgroundColor` / `setBackgroundTextStyle` directly.
- ❌ Page does not call `useNativeChromeSync()`.

## Navigation Anti-Patterns

- ❌ Floating action button or nav action outside `AppShell`'s `#nav-actions` slot.
- ❌ Custom nav title collides with the WeChat capsule.
- ❌ Top blank gap or unthemed strip above the nav.
- ❌ Page-specific back logic that silently changes the expected destination.
- ❌ Sticky section `top` hardcoded as `88rpx` or any magic number.

## Background / Safe-Area Anti-Patterns

- ❌ Page-local `background` override on the content root.
- ❌ Inner container re-adds `env(safe-area-inset-bottom)` padding.
- ❌ `min-height: 100vh` on an inner panel instead of letting `AppShell` own the viewport.
- ❌ Unthemed white or black strip at the top or bottom.

## Scroll / Height Anti-Patterns

- ❌ Multiple nested scrollable containers.
- ❌ `scroll-view` used when page scroll would suffice.
- ❌ `height: 100vh` on inner containers.
- ❌ Magic-number `calc(100vh - 200rpx)` in page styles.
- ❌ Page shows scroll bar when content does not overflow.

## Keyboard Anti-Patterns

- ❌ Per-page magic `padding-bottom: 300rpx` for keyboards.
- ❌ Inputs with `:adjust-position="true"` while also using the governed composable.
- ❌ Manual `uni.pageScrollTo` calls outside `useKeyboardAvoidance`.
- ❌ Layout mutations during keyboard open that can steal focus on iOS.

## Token Anti-Patterns

- ❌ Raw hex color in a page or component style.
- ❌ Raw `rgba()` in a page or component style.
- ❌ Raw fixed `rpx`/`px` spacing.
- ❌ Raw `box-shadow` value.
- ❌ Raw `transition`/`animation` duration.
- ❌ Unregistered `--app-*` variable.
- ❌ Inline style map that invents new CSS variables.

## Control Anti-Patterns

- ❌ Raw `<button>` for business actions.
- ❌ Raw `<input>` / `<textarea>` for business forms.
- ❌ Raw `<checkbox>`, `<radio>`, `<switch>`, `<picker>`, `<slider>`, `<form>`.
- ❌ Creating a new "small app-level component" that is actually a generic raw-control wrapper.

## Visual Anti-Patterns

- ❌ Ocean, coral reef, shells, pearls, glassmorphism, heavy gradients, childish cartoon, over-3D.
- ❌ Dashboard-like dense data tables.
- ❌ Enterprise admin forms.
- ❌ Public social feeds, comments, profiles, sharing affordances.
- ❌ Page-level showpiece transitions.
- ❌ High-frequency looping animations.
- ❌ Particle effects or large animated gradients.

## Motion Anti-Patterns

- ❌ Raw `transition: 0.3s`.
- ❌ Raw `animation: 2s infinite`.
- ❌ Strong bounce that hurts readability.
- ❌ Animation that blocks tapping or scrolling.
- ❌ Pet navigator animation that does not pause during interaction.

## Copy Anti-Patterns

- ❌ English user-facing labels, placeholders, toasts, modals, empty states.
- ❌ Overly cutesy error copy ("数据飞走咯").
- ❌ Real names, phone numbers, OpenIDs, or secrets in UI copy.
