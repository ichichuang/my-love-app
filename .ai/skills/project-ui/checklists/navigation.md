# Custom Navigation Checklist

Use this checklist before adding or changing navigation chrome, nav actions, back behavior, or sticky headers.

## Navigation Owner

- [ ] `AppCustomNav.vue` is the navigation owner for every page.
- [ ] Status-bar height, nav-bar height, title, eyebrow, back/home affordance, capsule reserve, and trailing actions live inside `AppCustomNav` or its slots.
- [ ] No page-level floating navigation actions exist outside the navigation owner for new work.

## Capsule Safety

- [ ] Trailing actions respect `navRightReserve` from `useCustomNavMetrics` (handled inside `AppCustomNav`).
- [ ] Nav content does not overlap the WeChat capsule.
- [ ] Long titles truncate with ellipsis rather than pushing into the capsule area.

## No Top Gaps

- [ ] `AppCustomNav` background is `var(--app-bg)`.
- [ ] No unthemed blank strip appears above or behind the nav bar.
- [ ] `position: sticky; top: 0` is preserved.

## Back Behavior

- [ ] Back navigates with `uni.navigateBack` when page stack depth > 1.
- [ ] Falls back to `uni.redirectTo({ url: "/pages/index/index" })` or the appropriate parent list route when at the root of the stack.
- [ ] Does not invent ad hoc back targets unless explicitly justified.

## Variant Choice

- [ ] Home/root pages use `nav-variant="home"` and do not show a back affordance.
- [ ] Drill-down pages use `nav-variant="page"` and `nav-show-back`.
- [ ] Auto variant resolves correctly based on `nav-show-back`.

## Sticky Sections

- [ ] Sticky bars use `useStickySectionOffset.ts`.
- [ ] Sticky `top` value equals `metrics.customNavHeight`.
- [ ] Sticky sections do not create double nav bars or overlap the custom nav.
