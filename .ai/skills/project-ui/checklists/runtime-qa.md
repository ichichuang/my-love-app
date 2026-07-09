# Runtime QA Checklist

Use this checklist before declaring a UI change complete.

## Build and Type Safety

- [ ] `pnpm type-check` passes.
- [ ] `pnpm type-check:strict` passes (if script exists).
- [ ] `pnpm build:mp-weixin` passes.

## Static Scans

- [ ] `pnpm scan:project-ui` passes or only reports pre-agreed legacy warnings.
- [ ] `pnpm scan:ui-copy` passes.
- [ ] `pnpm scan:design-tokens` passes.
- [ ] `pnpm scan:access-control` passes.
- [ ] `pnpm scan:security-baseline` passes.
- [ ] `git diff --check` passes.

## Manual Checks

- [ ] Background covers status bar, nav, content, and bottom safe area.
- [ ] Custom nav does not overlap the WeChat capsule.
- [ ] No top blank gap or unthemed strip.
- [ ] Page has one clear scroll owner.
- [ ] Inputs with keyboards scroll into view using the shared composable.
- [ ] No raw native controls introduced in new code.
- [ ] No raw hex/rpx/px/shadow values introduced in new code.
- [ ] All copy is Simplified Chinese.

## Product Boundaries

- [ ] `pages/index/index` is still the first route.
- [ ] `pages/access/access` is not re-registered.
- [ ] Business pages do not call `useAccessGuard` or `requireAccess`.
- [ ] CloudBase data/storage rules and runtime behavior are unchanged.
- [ ] No public social features added.
