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
- Keep components private, romantic, refined, and mobile-first.
- Avoid raw hardcoded component colors when a theme variable is available.

## CloudBase Rules

- Scenario: Mini Program + CloudBase.
- Use native `wx.cloud` through `src/services/cloudbase.ts`.
- Do not call raw cloud APIs from pages or components.
- Keep document CRUD, uploads, temporary URLs, and file deletion behind typed wrappers.
- Do not manually set or overwrite `_openid`.
- Storage must use private file IDs and temporary links, not public readable URLs.
- Security rule files live in `cloudbase/security`.

## Validation

- Run `pnpm type-check` after TypeScript changes.
- Run `pnpm build:mp-weixin` before reporting completion when practical.
- Report any environment placeholders that must be filled by the user.
