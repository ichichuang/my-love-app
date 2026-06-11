# Project Instructions

This branch is a sanitized UniApp WeChat Mini Program architecture template.

## AI Coding Guidelines

- Future AI/Codex edits must read and follow `docs/AI_CODING_GUIDELINES.md` before changing project files.
- Preserve the template architecture unless the task explicitly asks for a feature extension.
- Do not commit production Mini Program AppIDs, cloud environment IDs, OpenIDs, AppSecrets, account credentials, or private product identifiers.
- Use Wot UI first for polished business UI. Do not introduce native `button`, `input`, `textarea`, `checkbox`, `radio`, `switch`, `picker`, `slider`, `form`, or other raw interactive controls in new pages or business components.
- Use `wd-button` for explicit actions and Wot UI form/dialog/popup/cell/tab/tag/badge/loading/empty/error components whenever available.
- If Wot UI does not fit, create or reuse a small app-level component that follows the design-token system.
- The only platform-native structural exception is mandatory UniApp/page host infrastructure such as `page-meta`, plus existing framework/layout primitives inside approved base components.

## Stack

- Use the official `dcloudio/uni-preset-vue#vite-ts` scaffold conventions.
- Use pnpm for all package operations.
- Use Vue 3, TypeScript, Vite, Pinia, Wot UI, and Sass/SCSS.
- Target only `mp-weixin`.
- Do not add UnoCSS or utility CSS frameworks.

## Template Scope

- Keep only the settings page and capability preview page unless a task explicitly asks to add business pages.
- Keep `src/pages/settings/settings.vue` as the default entry page.
- Keep `src/pages/design-preview/design-preview.vue` for local capability and design-token QA.
- Do not add cloud services, login systems, payment, push notifications, public feeds, public comments, public sharing, or public social features without an explicit task.

## UI Rules

- Configure Wot UI through `src/pages.json` easycom mapping.
- Wrap app pages in `wd-config-provider` through `AppShell.vue`.
- Every page must keep `page-meta` as the first template node.
- Every page must bind `page-meta` to `theme.nativeChromeTheme`.
- Every page must call `useNativeChromeSync()`.
- Every page must wrap content in `app-shell`.
- Do not bypass `AppShell`.
- Do not bypass `wd-config-provider`.
- Native navigation/status/window/pull-down theme updates must go through `theme.nativeChromeTheme`, `src/composables/useNativeChromeSync.ts`, page-level `page-meta`, and the debounced scheduler in `src/design-system/nav-theme.ts`.
- Do not call `uni.setNavigationBarColor`, `uni.setBackgroundColor`, or `uni.setBackgroundTextStyle` outside `src/design-system/nav-theme.ts`.
- Use SCSS and app CSS variables such as `--app-primary`, `--app-bg`, `--app-surface`, and `--app-text`.
- Use the design-token system in `src/styles/tokens/**`; page and component files must consume `var(--app-xxx)` or mixins from `src/styles/mixins.scss`.
- Pages and components may consume registered tokens but must not define new `--app-*` tokens, except for explicitly allowlisted component runtime variables.
- Do not add raw colors, fixed spacing, fixed radius, direct shadows, fixed font sizes, opacity values, or transition durations inside `src/pages/**` or `src/components/**`.
- Preserve the global WeChat `button`, `button::after`, and `button:after` reset in `src/App.vue`.
- All user-facing UI copy must be Simplified Chinese.

## Design System Rules

- Keep runtime theme resolution in `src/design-system/**`.
- `src/stores/theme.ts` should only own state, persistence, system theme listening, and calls into resolver modules.
- `nav-theme.ts` is the only design-system module allowed to schedule or call WeChat native chrome APIs.
- `AppShell.vue` is the only runtime app-level CSS variable injection root.
- Keep `providerKey` on `wd-config-provider` so Wot UI refreshes when resolved mode, palette, density, or font scale changes.
- Future AI edits should prefer typed helpers such as `makeCssVars`, `resolveAppCssAliases`, `scaleToCssVars`, `resolvePaletteColorVars`, `resolveSizeTokens`, `resolveTypographyTokens`, and `resolveWotThemeVars` over ad hoc CSS variable maps.

## Validation

- Run `pnpm scan:ui-copy` after UI copy changes.
- Run `pnpm scan:design-tokens` after UI styling or design-token changes.
- Run `pnpm type-check` after TypeScript changes.
- Run `pnpm type-check:strict` after design-system type or token-registry changes when the script exists.
- Run `pnpm build:mp-weixin` before reporting completion when practical.
- Run `git diff --check` before commit/push.
- Verify private AppIDs, cloud environment IDs, OpenIDs, AppSecrets, and unintended business pages are not present before pushing this branch.
