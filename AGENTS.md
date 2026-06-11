# Project Instructions

This project is a private UniApp WeChat Mini Program for romantic journal and memory keeping.

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
- Keep `palettes.ts`, `color-scale.ts`, `theme-resolver.ts`, `size-scale.ts`, `size-resolver.ts`, `typography-resolver.ts`, `wot-theme.ts`, and `css-vars.ts` pure. `nav-theme.ts` is the only design-system module allowed to schedule or call native navigation APIs.
- Curated palette presets must define complete light and dark semantic schemes. Do not add arbitrary user hex color input.
- `appCssVars` must output terminal alias variables such as `--app-bg`, `--app-surface`, `--app-primary`, and `--app-text`, not only `--app-color-*` canonical variables.
- `AppShell.vue` is the only runtime app-level CSS variable injection root. Keep `theme.appStyle` on its root `view`.
- Keep `providerKey` on `wd-config-provider` so Wot UI refreshes when resolved mode, palette, density, or font scale changes.
- Wot UI themeVars for font sizes, button heights, and button radii must come from `src/design-system/size-resolver.ts`.
- Native navigation-bar theme updates must go through the debounced scheduler in `src/design-system/nav-theme.ts`; do not call `uni.setNavigationBarColor` synchronously from palette or theme setters.
- Use the design-token system in `src/styles/tokens/**`; page and component files must consume `var(--app-xxx)` or mixins from `src/styles/mixins.scss`.
- Do not add raw colors, fixed spacing, fixed radius, direct shadows, fixed font sizes, opacity values, or transition durations inside `src/pages/**` or `src/components/**`. Add or reuse tokens instead.
- Use `AppOptionGroup.vue` and `AppOptionButton.vue` for setting selectors and palette swatches. Keep CTA and destructive actions on Wot `wd-button` when appropriate.
- Preserve the global WeChat `button`, `button::after`, and `button:after` reset in `src/App.vue`.
- Run `pnpm scan:design-tokens` after UI styling changes.
- Keep components private, romantic, refined, and mobile-first.
- Avoid raw hardcoded component colors when a theme variable is available.
- All user-facing UI copy must be Simplified Chinese. Do not ship English labels, placeholders, empty states, modal text, or toasts.

## Product Rules

- This is a two-person private app only for the owner and girlfriend.
- Do not add public social features, discovery feeds, public comments, public profiles, or public sharing.
- Do not add username/password registration or a Web-style login system.
- Keep product requirements in `docs/PRODUCT_REQUIREMENTS.zh-CN.md` aligned with implementation changes.

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
- Run `pnpm build:mp-weixin` before reporting completion when practical.
- Report any environment placeholders that must be filled by the user.
