# Project UI Skill — 小珊的树洞

## Purpose

This Skill governs every UI, layout, styling, navigation, token, component, copy, interaction, and visual-quality change in the `my-love-app` UniApp Vue 3 WeChat Mini Program. It exists because the app has a sealed runtime architecture, a custom design-token system, a non-traditional pet navigator, strict Wot UI-first rules, and a fragile full-viewport background/safe-area/keyboard story that must not be reinvented per page.

Codex and Claude must read this Skill and the relevant checklists before changing any user-facing surface. The Skill is intentionally more specific than the generic AI Coding Guidelines and overrides them where they conflict on UI matters.

## Project Context

- **Product**: private owner-only romantic journal / memory mini program, Stage 1.
- **Platform**: WeChat Mini Program (`mp-weixin`) only.
- **Stack**: UniApp CLI + Vue 3 + TypeScript + Vite + Pinia + Wot Design Uni + Sass/SCSS.
- **No**: UnoCSS, utility CSS frameworks, traditional bottom `tabBar`, WeChat `custom-tab-bar`, public social features, runtime access gating (currently frozen), partner access, login/account system.
- **Design system**: `src/design-system/**` and `src/styles/tokens/**` produce `--app-*` CSS variables consumed through `src/styles/mixins.scss`.
- **Theme state**: `src/stores/theme.ts` owns persistence, system theme listening, and calls into pure resolver modules.
- **Native chrome**: only `src/design-system/nav-theme.ts` may call `uni.setNavigationBarColor`, `uni.setBackgroundColor`, `uni.setBackgroundTextStyle`.
- **Shell root**: `src/components/AppShell.vue` is the only runtime app-level CSS variable injection root.
- **Navigation owner**: `src/components/AppCustomNav.vue` owns status bar, nav bar, title, eyebrow, back/home affordance, capsule reserve, and trailing actions.
- **Keyboard / scroll**: `src/composables/useKeyboardAvoidance.ts` and `src/composables/useStickySectionOffset.ts` are the governed patterns.

## Required Read Order

Before any UI work, read in this order:

1. This Skill (`SKILL.md`).
2. The checklist files under `checklists/` that match the task.
3. `AGENTS.md` and `CLAUDE.md` at the project root for agent-specific rules.
4. `docs/AI_CODING_GUIDELINES.md` and `docs/PRODUCT_REQUIREMENTS.zh-CN.md` for product context.
5. `docs/EXPERIENCE_BUILD_CHANGE_LOG.zh-CN.md` to confirm access-control is frozen.
6. Source files referenced by the checklists, especially:
   - `src/pages.json`
   - `src/App.vue`
   - `src/components/AppShell.vue`
   - `src/components/AppCustomNav.vue`
   - `src/composables/useCustomNavMetrics.ts`
   - `src/composables/useKeyboardAvoidance.ts`
   - `src/composables/useStickySectionOffset.ts`
   - `src/styles/mixins.scss`
   - `src/design-system/token-registry.ts`
   - relevant pages and components

## Source-of-Truth Order

When requirements conflict, resolve in this order:

1. Explicit user instruction in the current turn.
2. This Skill and its checklists.
3. `AGENTS.md` / `CLAUDE.md`.
4. `docs/AI_CODING_GUIDELINES.md`.
5. `docs/PRODUCT_REQUIREMENTS.zh-CN.md`.
6. `docs/EXPERIENCE_BUILD_CHANGE_LOG.zh-CN.md`.
7. Frozen runtime files (`src/components/AppShell.vue`, `src/design-system/nav-theme.ts`, etc.).

## Non-Negotiable Rules

These are hard failures for any future UI change:

- `pages/index/index` must remain the first registered route.
- `pages/access/access` must not be restored as a runtime route or the first route.
- Business pages must not call `useAccessGuard` or `requireAccess`.
- Public launch / security hardening remains frozen.
- CloudBase CRUD, image upload, temp URL behavior, `love_entries`, `coupleId: "main"`, and `love-entries/main/` storage prefix must remain unchanged.
- Do not redesign pages, change business page layouts, fix current UI defects, modify visual styling of existing features, add heart/reaction features, change runtime route behavior, or alter user-facing content unless explicitly asked.
- Do not stage, commit, push, deploy, upload, preview, clean, reset, stash, inspect secrets, or print secrets unless explicitly instructed.
- Do not use `git add .` or other broad destructive git commands.

## Page Shell Rules

- Every registered page must use `<page-meta>` as the **first** template node.
- Every registered page must bind `page-meta` attributes to `theme.nativeChromeTheme`:
  - `background-text-style`
  - `background-color`
  - `background-color-top`
  - `background-color-bottom`
  - `page-style`
- Every registered page must call `useNativeChromeSync()`.
- Every registered page must wrap its content in `<app-shell>`.
- Do not bypass `AppShell` with alternative root wrappers.
- Do not bypass `wd-config-provider`; it lives inside `AppShell.vue`.
- `AppShell.vue` must remain the only runtime app-level CSS variable injection root. Its root `view` owns `theme.appStyle`, `theme.themeClasses`, and the full viewport background.
- Legacy header props (`title`, `eyebrow`, `actions`) are discouraged for new pages; prefer `nav-title`, `nav-eyebrow`, and `nav-actions`.

## Custom Navigation Rules

- `AppCustomNav.vue` is the navigation owner. It must own:
  - status-bar height
  - nav-bar height
  - title and eyebrow
  - back affordance or home affordance
  - menu-button / capsule right reserve
  - trailing actions via the `#trailing` slot
- Page-level floating navigation actions outside the navigation owner are forbidden for future work.
- The nav must never collide with the WeChat capsule. `useCustomNavMetrics.ts` provides `navRightReserve` for this.
- The nav must not create top blank gaps or expose unthemed backgrounds. Its background is `var(--app-bg)` and it is `position: sticky; top: 0`.
- Back behavior must be consistent:
  - If page stack depth > 1, `uni.navigateBack`.
  - Otherwise `uni.redirectTo({ url: "/pages/index/index" })` or the appropriate parent list route.
  - Do not invent page-specific back behavior unless explicitly justified and documented.
- Home variant shows a decorative notebook icon and no back affordance; page variant shows back.

## Full Background Coverage Rules

- `AppShell.vue` must own the full viewport background coverage.
- The background must visually cover:
  - status bar area
  - custom nav area
  - content area
  - bottom safe area
- There must be no blank gaps between these regions.
- The `page-shell` mixin in `src/styles/mixins.scss` sets `min-height: 100vh` and a themed gradient background. Do not override this with page-local backgrounds.
- Do not introduce `env(safe-area-inset-bottom)` padding on inner containers when `AppShell.vue` already applies it on the root.

## Scroll Ownership Rules

- Every page must have exactly **one** intended scroll owner.
- The default owner is WeChat page scroll (no internal `scroll-view`).
- Use an explicit internal scroll container only when the design genuinely requires it (e.g., a horizontally scrollable chip list inside a page that still page-scrolls).
- Nested accidental scrolling is forbidden.
- A page must not show scroll affordance when content does not overflow.
- Sticky sections must use `useStickySectionOffset.ts` and must not collide with the custom nav.
- Pull-to-refresh is allowed only on pages that genuinely need it and must be declared in `src/pages.json`.

## Intelligent Height Calculation Rules

- When a fixed-height panel or non-page scroll container is needed, its height must be computed from:
  - runtime window height (`useCustomNavMetrics` or `uni.getSystemInfoSync`)
  - custom nav height (`metrics.customNavHeight`)
  - `AppShell` padding (`$app-page-y` / `--app-page-padding-y`)
  - bottom safe area (`env(safe-area-inset-bottom)`)
  - keyboard state (`useKeyboardAvoidance`)
  - fixed action bars or toolbars
- Duplicate `env(safe-area-inset-bottom)` padding is forbidden when `AppShell` already owns bottom safe-area padding.
- Prefer token-based calculations; do not hardcode `100vh - 200rpx` in page styles.

## Bottom Safe-Area Rules

- `AppShell.vue` applies bottom safe-area padding once via `calc($app-page-y + env(safe-area-inset-bottom))`.
- Inner containers must not re-add `env(safe-area-inset-bottom)` unless they are intentionally extending beyond `AppShell` (rare and must be documented).
- `--app-safe-action-bottom-gap` is for spacing above bottom action areas, not for safe-area compensation.

## Keyboard Avoidance Rules

- Keyboard avoidance must use the shared governed pattern: `useKeyboardAvoidance.ts`.
- It must not be solved by page-specific magic spacing, ad hoc spacer heights, or hardcoded `padding-bottom`.
- Inputs must set `:adjust-position="false"` so the governed composable can handle scroll.
- Inputs must emit `@focus="focusField('#selector')"` and `@keyboardheightchange="syncKeyboardHeight"`.
- The current implementation keeps a visually inert spacer and uses `uni.pageScrollTo`; do not replace this with per-page `setData` layout mutations that can steal focus on iOS.

## Wot UI First Rules

- Future business UI must use Wot Design Uni first.
- Default to `wd-button`, `wd-input`, `wd-textarea`, `wd-popup`, `wd-message-box`, `wd-toast`, `wd-tag`, `wd-cell`, `wd-tabs`, `wd-loading`, `wd-empty`, `wd-picker`, `wd-calendar`, etc.
- Use Wot UI theme variables through `theme.wotThemeVars` rather than overriding component styles with raw values.

## Raw Native Control Ban

- New pages and components must not introduce raw `button`, `input`, `textarea`, `checkbox`, `radio`, `switch`, `picker`, `slider`, `form`, or other raw native-looking business controls.
- The only allowed exceptions are:
  - mandatory UniApp/page host infrastructure such as `page-meta`
  - existing framework/layout primitives inside already-approved base components
  - small app-level components documented in the native-control allowlist
- If Wot UI does not provide a suitable component, create or reuse a small app-level component that follows the token system and add it to the documented exception list.

## Design-Token Rules

- Pages and components must not add raw hex colors, raw `rgba()`, raw fixed `px`/`rpx` spacing, raw border radius, raw `box-shadow`, raw transition durations, raw animation durations, raw `z-index` values, or unregistered `--app-*` variables.
- All new visual values must use:
  - existing registered `--app-*` tokens
  - mixins from `src/styles/mixins.scss`
  - Wot UI theme variables
  - or new tokens added through `src/design-system/**` or `src/styles/tokens/**` with `token-registry.ts` and scans updated
- No one-off styling hacks are allowed in page files.
- Component-specific runtime variables (e.g., `--app-option-group-columns`, `--app-option-swatch-*`) are allowed only when registered in `token-registry.ts` under `intentionalDynamicComponentVarNames`.

## Custom Component Rules

- Prefer existing components: `app-shell`, `app-custom-nav`, `empty-state`, `app-option-group`, `app-option-button`, `app-date-field`, `app-collapse-section`, `app-animated-swap`, `entry-card`, `image-grid`, `theme-swatch-picker`, `app-pet-navigator`.
- New reusable UI should be added to `src/components/` with an `App` or domain prefix.
- New components must follow the token system and must not leak raw native controls.

## Visual Style Direction

- **Direction**: private, intimate, cute but not childish, warm, paper-note-like, hand-drawn, readable, mobile-first.
- **Cues**: red/blue couple marks, soft cards, small tags, stamp-like details, gentle completion feedback, restrained decorative lines.
- **Must not become**: generic dashboard, enterprise admin UI, public social app, heavy cartoon mascot product, glassmorphism UI, ocean/coral themed app, animation showcase.
- **Must avoid**: ocean, coral reef, shells, pearls, heavy gradients, childish cartoon, over-3D, large-area animation, high-frequency loops, particles, strong bounce.
- **Motion**: token-driven, light, must not harm reading, tapping, scrolling, keyboard use, or page performance.

## Pet Navigator Rules

- `src/components/AppPetNavigator.vue` is the Stage 1 owner-only guide.
- It must remain a gentle guide, not a chatbot, account avatar, online indicator, social entry, or AI assistant.
- It must not read or rewrite user data automatically.
- It must not add partner access, invitations, binding, sharing, comments, or public features.
- Stage 1 mounts only on the home page unless explicitly re-evaluated.
- Menu items must use Chinese copy.
- Menu actions must use Wot UI components (`wd-button`, `wd-popup`).
- Pet visuals must follow the allowlist: paper-ball, note, red/blue line-person, short hand-drawn line, slight blink/breath/nod, short Chinese prompts.

## State / Copy / Motion Rules

- All user-facing copy must be Simplified Chinese.
- No English labels, placeholders, empty states, modal text, toast text, button text, tabs, tags.
- Playful copy is allowed for home guidance, pet menu, empty states, completion feedback, song/task explanations.
- Error, delete, permission, cloud, and save-failure copy must stay restrained and explicit.
- Motion must use registered motion tokens. No raw `transition: 0.3s` or `animation: 2s`.
- Completion feedback must be gentle (e.g., "已经轻轻收好").

## CloudBase / Data Boundary Reminders

- Do not call `wx.cloud` directly from pages or components.
- Use typed wrappers in `src/services/cloudbase.ts`.
- Keep `love_entries` collection, `coupleId: "main"`, and `love-entries/main/` prefix unchanged.
- Do not manually set or overwrite `_openid`.
- Store private file IDs and temporary links only.

## Codex / Claude Working Model

- **Codex**:
  - Architecture-safe implementation, exact diffs, TypeScript correctness.
  - Maintain static scans and repository hygiene.
  - Run validation after changes.
  - Non-destructive execution.
- **Claude**:
  - Visual refinement, screenshot-based UI review, copy nuance, spacing and composition critique, motion and interaction polish, user-facing quality review.
  - Must still obey all token, Wot UI, architecture, validation, and forbidden-action rules.
  - Must not bypass the Skill or invent a separate visual system.

## Validation Requirements

After any UI change, run:

```bash
pnpm scan:project-ui
pnpm scan:ui-copy
pnpm scan:design-tokens
pnpm scan:access-control
pnpm scan:security-baseline
pnpm type-check
pnpm type-check:strict
pnpm build:mp-weixin
git diff --check
```

If any command is unavailable, inspect `package.json` and report the exact reason.

## Forbidden Actions

- Do not redesign pages or business page layouts.
- Do not fix current UI defects unless the task explicitly asks for it.
- Do not modify CloudBase runtime behavior, access-control runtime behavior, image upload behavior, temp URL behavior, heart/reaction feature code, product features, runtime route behavior, or current user-facing content.
- Do not stage, commit, push, deploy, upload, preview, clean, reset, stash.
- Do not inspect or print secrets.
- Do not use `git add .` or broad destructive git commands.
- Do not restore runtime access gating or move `pages/access/access` back into the route table.

## Reporting Format

When completing a UI task, report using:

- A. Summary
- B. Files changed
- C. Skill sections applied
- D. Checklists used
- E. Architecture / product constraints preserved
- F. Validation results
- G. Known warnings or future work
