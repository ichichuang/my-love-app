# Project Instructions

This project is a private UniApp WeChat Mini Program for romantic journal and memory keeping.

## Root Governance for Codex

Before any UI, page, component, layout, style, navigation, token, copy, interaction, scan, or visual-quality change, Codex must:

1. Read `.ai/skills/project-ui/SKILL.md`.
2. Read the relevant checklists under `.ai/skills/project-ui/checklists/`.
3. Read `CLAUDE.md` and the reference files under `.ai/skills/project-ui/references/` when the change touches visual quality, copy, motion, or interaction polish.
4. Then read `docs/AI_CODING_GUIDELINES.md`, `docs/PRODUCT_REQUIREMENTS.zh-CN.md`, `docs/EXPERIENCE_BUILD_CHANGE_LOG.zh-CN.md`, `src/pages.json`, `src/components/AppShell.vue`, `src/components/AppCustomNav.vue`, `src/composables/useCustomNavMetrics.ts`, `src/composables/useKeyboardAvoidance.ts`, `src/styles/mixins.scss`, `src/design-system/token-registry.ts`, and any relevant pages/components.

The Skill and its checklists override the generic AI Coding Guidelines where they conflict on UI matters.

## Codex Role

Codex acts as:

- Architecture-safe implementer.
- Producer of exact, minimal diffs.
- Maintainer of TypeScript correctness and strict-mode compatibility.
- Maintainer of static scan scripts and repository hygiene.
- Validation runner after every change.
- Non-destructive executor.

## Forbidden Actions

- Do not use `git add .`, broad `git reset`, `git clean`, `git stash`, or any other broad destructive git command.
- Do not stage, commit, push, deploy, upload, preview unless explicitly instructed.
- Do not inspect or print secrets, API keys, tokens, AppSecret, OpenID, pairing codes, passwords, or cloud keys.
- Do not redesign the base architecture, design-system foundation, CloudBase architecture, routing model, or product boundary unless explicitly requested.
- Do not restore runtime access gating: `pages/access/access` must not be re-registered in `src/pages.json` and must not become the first route; business pages must not call `useAccessGuard` or `requireAccess`.
- Do not modify CloudBase CRUD, image upload behavior, temp URL behavior, heart/reaction feature code, runtime route behavior, or current user-facing content unless explicitly asked.

## AI Coding Guidelines

- Future AI/Codex edits must read and follow `docs/AI_CODING_GUIDELINES.md` before changing project files.
- Future AI/Codex edits must also read and follow `docs/AI_FEATURE_STYLE_GUIDELINES.zh-CN.md` before adding or modifying user-facing features, pages, components, cards, containers, copy, states, or interactions.
- The feature style guide applies automatically to every future request. The user does not need to repeat the style direction each time.
- New UI must match the current `小珊的树洞` direction: playful, cute, restrained, hand-drawn, paper-note-like, private, and intimate.
- Follow the architecture frozen after `miniapp-architecture-freeze-v1`; do not redesign the base architecture, design-system foundation, CloudBase architecture, routing model, or product boundary unless explicitly requested.
- Use Wot UI first for polished business UI. Do not introduce native `button`, `input`, `textarea`, `checkbox`, `radio`, `switch`, `picker`, `slider`, `form`, or other raw interactive controls in new pages or business components.
- Use `wd-button` for explicit actions and Wot UI form/dialog/popup/cell/tab/tag/badge/loading/empty/error components whenever available. If Wot UI does not fit, create or reuse a small app-level component that follows the design-token system.
- The only platform-native structural exception is mandatory UniApp/page host infrastructure such as `page-meta`, plus existing framework/layout primitives inside already-approved base components.

## Stack

- Use the official `dcloudio/uni-preset-vue#vite-ts` scaffold.
- Use pnpm for all package operations.
- Use Vue 3, TypeScript, Vite, Pinia, Wot UI, and Sass/SCSS.
- Target only `mp-weixin`.
- Do not add UnoCSS or utility CSS frameworks.

## UI Rules

- Configure Wot UI through `src/pages.json` easycom mapping.
- Wrap app pages in `wd-config-provider` and drive Wot theme through `theme` and `themeVars`.
- Use SCSS and app CSS variables such as `--app-primary`, `--app-bg`, `--app-surface`, and `--app-text`.
- Keep runtime theme resolution in `src/design-system/**`; `src/stores/theme.ts` should only own state, persistence, system theme listening, and calls into resolver modules.
- Keep `palettes.ts`, `color-scale.ts`, `theme-resolver.ts`, `native-chrome-resolver.ts`, `size-scale.ts`, `size-resolver.ts`, `typography-resolver.ts`, `wot-theme.ts`, and `css-vars.ts` pure. `nav-theme.ts` is the only design-system module allowed to schedule or call WeChat native chrome APIs.
- Curated palette presets must define complete light and dark semantic schemes. Keep the fixed six-palette inventory and pass the palette contrast checks in `pnpm scan:design-tokens`. Do not add arbitrary user hex color input.
- `appCssVars` must output terminal alias variables such as `--app-bg`, `--app-surface`, `--app-primary`, and `--app-text`, not only `--app-color-*` canonical variables.
- `AppShell.vue` is the only runtime app-level CSS variable injection root. Keep `theme.appStyle` on its root `view`.
- Keep `providerKey` on `wd-config-provider` so Wot UI refreshes when resolved mode, palette, density, or font scale changes.
- Wot UI themeVars for font sizes, button heights, and button radii must come from `src/design-system/size-resolver.ts`.
- Native navigation/status/window/pull-down theme updates must go through `theme.nativeChromeTheme`, `src/composables/useNativeChromeSync.ts`, page-level `page-meta`, and the debounced scheduler in `src/design-system/nav-theme.ts`; do not call `uni.setNavigationBarColor`, `uni.setBackgroundColor`, or `uni.setBackgroundTextStyle` outside `nav-theme.ts`.
- Keep `theme.json`/`src/theme.json` as first-frame system-theme fallbacks only. Pinia runtime theme remains the source of truth for manual app theme, with AppShell controlling content CSS variables and `nativeChromeTheme` controlling WeChat native chrome.
- Use the design-token system in `src/styles/tokens/**`; page and component files must consume `var(--app-xxx)` or mixins from `src/styles/mixins.scss`.
- Keep app token names in `src/design-system/token-registry.ts`; derive `AppCssVarName` and related unions from those registries instead of scattering manual `--app-*` string unions.
- Add new `--app-*` token definitions only in `src/design-system/**` or `src/styles/tokens/**`. Pages and components may consume registered tokens but must not define new `--app-*` tokens, except for explicitly allowlisted component runtime variables such as `--app-option-group-columns` and `--app-option-swatch-*`.
- Future AI edits should prefer typed helpers such as `makeCssVars`, `resolveAppCssAliases`, `scaleToCssVars`, `resolvePaletteColorVars`, `resolveSizeTokens`, `resolveTypographyTokens`, and `resolveWotThemeVars` over ad hoc CSS variable maps.
- Do not add raw colors, fixed spacing, fixed radius, direct shadows, fixed font sizes, opacity values, or transition durations inside `src/pages/**` or `src/components/**`. Add or reuse tokens instead.
- Use `AppOptionGroup.vue` and `AppOptionButton.vue` for setting selectors and palette swatches. Keep CTA and destructive actions on Wot `wd-button` when appropriate.
- Preserve the global WeChat `button`, `button::after`, and `button:after` reset in `src/App.vue`.
- Run `pnpm scan:design-tokens` after UI styling changes.
- Run `pnpm scan:project-ui` after any page shell, navigation, scroll, safe-area, keyboard, or UI governance change.
- Keep components private, romantic, refined, and mobile-first.
- Avoid raw hardcoded component colors when a theme variable is available.
- All user-facing UI copy must be Simplified Chinese. Do not ship English labels, placeholders, empty states, modal text, or toasts.

## Product Rules

- This is a private owner-only Stage 1 Mini Program.
- Do not add public social features, discovery feeds, public comments, public profiles, or public sharing.
- Do not add username/password registration or a Web-style login system.
- Keep product requirements in `docs/PRODUCT_REQUIREMENTS.zh-CN.md` aligned with implementation changes.
- Do not restore runtime access gating. `pages/index/index` remains the first route; `pages/access/access` remains unregistered for the experience build.

## CloudBase Rules

- Scenario: Mini Program + CloudBase.
- Use native `wx.cloud` through `src/services/cloudbase.ts`.
- Do not call raw cloud APIs from pages or components.
- Keep document CRUD, uploads, temporary URLs, and file deletion behind typed wrappers.
- Do not manually set or overwrite `_openid`.
- Storage must use private file IDs and temporary links, not public readable URLs.
- Do not store or hardcode the WeChat Mini Program secret anywhere in this repo.
- Keep entry documents in the `love_entries` collection.
- Every entry document must include `coupleId: "main"`.
- Entry list queries must filter by `coupleId: "main"`.
- Entry uploads must use the `love-entries/main/` storage prefix.
- Security rule files live in `cloudbase/security`.

## Validation

- Run `pnpm type-check` after TypeScript changes.
- Run `pnpm type-check:strict` after design-system type or token-registry changes when the script exists.
- Run `pnpm build:mp-weixin` before reporting completion when practical.
- Run `pnpm scan:project-ui` after page shell, navigation, scroll, safe-area, keyboard, or UI governance changes.
- Report any environment placeholders that must be filled by the user.
