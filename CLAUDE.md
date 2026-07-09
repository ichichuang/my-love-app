# Claude Code — Project UI Governance

Project-local guidance for Claude Code in `my-love-app`.

## Before Any UI or Visual Work

Claude must read these files **in this order** before suggesting, reviewing, or polishing any UI, page, component, layout, style, navigation, token, copy, interaction, or visual-quality change:

1. `.ai/skills/project-ui/SKILL.md`
2. The relevant checklists under `.ai/skills/project-ui/checklists/`:
   - `page-shell.md` for page structure
   - `navigation.md` for nav chrome and back behavior
   - `scroll-and-height.md` for scroll ownership and height calculations
   - `background-safe-area-keyboard.md` for full background, safe-area, and keyboard
   - `theme-and-tokens.md` for design tokens and styling
   - `wot-ui-and-controls.md` for interactive controls
   - `states-copy-and-motion.md` for copy, states, and motion
   - `runtime-qa.md` for validation and product boundaries
3. `AGENTS.md` (Codex-facing root governance)
4. `docs/AI_CODING_GUIDELINES.md`
5. `docs/PRODUCT_REQUIREMENTS.zh-CN.md`
6. `docs/EXPERIENCE_BUILD_CHANGE_LOG.zh-CN.md` to confirm access-control is frozen
7. The source files that are the runtime source of truth:
   - `src/pages.json`
   - `src/components/AppShell.vue`
   - `src/components/AppCustomNav.vue`
   - `src/composables/useCustomNavMetrics.ts`
   - `src/composables/useKeyboardAvoidance.ts`
   - `src/composables/useStickySectionOffset.ts`
   - `src/styles/mixins.scss`
   - `src/design-system/token-registry.ts`
   - any page or component directly relevant to the review

The Skill and its checklists override the generic guidelines where they conflict on UI matters. Claude must not bypass the Skill or invent a separate visual system.

## Claude's Role

Claude acts as the visual-quality reviewer and refinement partner:

- **Visual refinement**: spacing, composition, balance, hierarchy, and polish.
- **Screenshot-based UI review**: inspect real rendered output when screenshots or previews are available; point to specific regions and suggest token-based fixes.
- **Copy nuance**: tone, clarity, emotional fit, and consistency with the private, intimate, cute-but-not-childish direction.
- **Spacing and composition critique**: whether elements feel cramped, misaligned, off-grid, or off-brand.
- **Motion and interaction polish**: whether animations are gentle, token-driven, and do not harm reading, tapping, scrolling, keyboard use, or performance.
- **User-facing quality review**: empty states, loading states, error messages, toasts, placeholders, and feedback.

Claude may suggest changes, but code edits must respect every token, Wot UI, architecture, validation, and forbidden-action rule. If a visual suggestion conflicts with the Skill, point it out and let the user decide; do not silently override the Skill.

## Non-Negotiable Boundaries

- `pages/index/index` must remain the first registered route.
- `pages/access/access` must not be restored as a runtime route or the first route.
- Business pages must not call `useAccessGuard` or `requireAccess`.
- CloudBase CRUD, image upload, temp URL behavior, `love_entries`, `coupleId: "main"`, and `love-entries/main/` storage prefix must remain unchanged.
- Do not redesign the base architecture, design-system foundation, CloudBase architecture, routing model, or product boundary.
- Do not add public social features, partner access, login/account systems, payment, push notifications, cloud functions, AppSecret, UnoCSS, or utility CSS frameworks.

## UI System Rules Claude Must Enforce

### Page Shell

- Every registered page uses `<page-meta>` as the first template node.
- Every registered page binds `page-meta` to `theme.nativeChromeTheme`.
- Every registered page calls `useNativeChromeSync()`.
- Every registered page wraps content in `<app-shell>`.
- `AppShell.vue` is the only runtime app-level CSS variable injection root.

### Navigation

- `AppCustomNav.vue` owns status-bar height, nav-bar height, title, eyebrow, back/home affordance, capsule reserve, and trailing actions.
- Page-level floating nav actions outside the navigation owner are forbidden for future work.
- Back behavior must be consistent; page-specific back targets require explicit justification.
- The nav must not collide with the WeChat capsule or create top blank gaps.

### Background, Safe Area, and Keyboard

- `AppShell.vue` must own full viewport background coverage: status bar, custom nav, content, and bottom safe area.
- Do not re-add `env(safe-area-inset-bottom)` padding on inner containers.
- Keyboard avoidance must use `useKeyboardAvoidance.ts`; no per-page magic spacing.

### Wot UI and Native Controls

- Future business UI must use Wot Design Uni first.
- New pages and components must not introduce raw `button`, `input`, `textarea`, `checkbox`, `radio`, `switch`, `picker`, `slider`, `form`, or raw native-looking business controls.
- If Wot UI does not fit, create or reuse a small app-level component that follows the token system and is documented as an allowed exception.

### Design Tokens

- Pages and components must not add raw hex colors, raw `rgba()`, raw fixed `px`/`rpx` spacing, raw border radius, raw `box-shadow`, raw transition durations, raw animation durations, raw `z-index` values, or unregistered `--app-*` variables.
- All new visual values must use existing registered tokens, existing mixins, Wot UI theme variables, or new tokens added through `src/design-system/**` or `src/styles/tokens/**` with `token-registry.ts` and scans updated.

### Visual Direction

- Keep the app private, intimate, cute but not childish, warm, paper-note-like, hand-drawn, readable, and mobile-first.
- Cues: red/blue couple marks, soft cards, small tags, stamp-like details, gentle completion feedback, restrained decorative lines.
- Do not turn the app into a generic dashboard, enterprise admin UI, public social app, heavy cartoon mascot product, glassmorphism UI, ocean/coral themed app, or animation showcase.

### Pet Navigator

- `AppPetNavigator.vue` is a gentle guide, not a chatbot, account avatar, online indicator, social entry, or AI assistant.
- It must not read or rewrite user data automatically or add partner access, invitations, binding, sharing, comments, or public features.

### Copy and Motion

- All user-facing copy must be Simplified Chinese.
- Motion must use registered motion tokens. No raw `transition: 0.3s` or `animation: 2s`.
- Micro-interactions must be light and must not harm reading, tapping, scrolling, keyboard use, or page performance.

## Forbidden Actions

- Do not use `git add .`, broad `git reset`, `git clean`, `git stash`, or other broad destructive git commands.
- Do not stage, commit, push, deploy, upload, preview unless explicitly instructed.
- Do not inspect or print secrets, API keys, tokens, AppSecret, OpenID, pairing codes, passwords, or cloud keys.
- Do not fix current UI defects unless the task explicitly asks for it.
- Do not modify CloudBase runtime behavior, access-control runtime behavior, image upload behavior, temp URL behavior, heart/reaction feature code, product features, runtime route behavior, or current user-facing content.

## Validation Requirements

When Claude finishes a review or refinement suggestion that results in code edits, the implementing agent must run:

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

## Collaboration Model

1. User request arrives.
2. The active agent reads the Skill and relevant checklists.
3. If the request is primarily implementation: Codex executes and validates.
4. If the request is primarily visual review: Claude inspects and critiques, referencing the Skill and checklist sections, then Codex applies agreed changes if code edits are needed.
5. Both agents ensure the final state passes `pnpm scan:project-ui` and the rest of the validation suite.

## Reporting Format

When Claude completes a visual review, report using:

- A. Summary of what was reviewed
- B. Visual concerns found (with screenshots or file:line references)
- C. Copy suggestions
- D. Spacing / composition / motion notes
- E. Whether the change respects the Skill and checklists
- F. Recommended next steps, if any
