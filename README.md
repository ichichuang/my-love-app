# UniApp Mini Program Architecture

Reusable WeChat Mini Program architecture built with UniApp, Vue 3, TypeScript, Vite, Pinia, Wot UI, and SCSS.

This `build` branch is a sanitized development baseline. It keeps only the app shell, theme system, settings page, and capability preview page. It intentionally does not include a production Mini Program AppID, cloud environment ID, OpenID allowlist, database rules, business pages, or private product copy.

## Included Pages

- `pages/settings/settings`
- `pages/design-preview/design-preview`

## Stack

- UniApp CLI
- Vue 3
- TypeScript
- Vite
- Pinia
- Wot UI
- Sass/SCSS
- Target: `mp-weixin`

## AppID Policy

The tracked manifest AppID is intentionally blank:

- `src/manifest.json`
- `manifest.config.ts`

Fill your own AppID in a project-specific branch or local working copy. Do not commit private AppIDs, cloud environment IDs, OpenIDs, AppSecrets, or production credentials back to this architecture branch.

## Development

Install dependencies:

```bash
pnpm install
```

Start the WeChat Mini Program target:

```bash
pnpm dev:mp-weixin
```

Production build:

```bash
pnpm build:mp-weixin
```

Import the generated folder in WeChat DevTools:

```text
dist/build/mp-weixin
```

## Architecture

- `src/components/AppShell.vue` is the runtime app shell and Wot UI provider boundary.
- `src/pages/settings/settings.vue` exposes runtime theme preferences.
- `src/pages/design-preview/design-preview.vue` previews theme, token, component, spacing, typography, status, shadow, and native chrome behavior.
- `src/stores/theme.ts` owns theme state, persistence, system-theme listening, and resolver calls.
- `src/design-system/**` resolves palettes, native chrome values, CSS variables, Wot UI theme variables, size tokens, and typography tokens.
- `src/design-system/nav-theme.ts` is the only module allowed to call native navigation/background theme APIs.
- `src/styles/tokens/**` and `src/styles/mixins.scss` define static token fallbacks and reusable style primitives.

## UI Rules

- Use Wot UI for polished business controls.
- Use `wd-button` for explicit actions.
- Use `app-shell`, `app-option-group`, `app-option-button`, and `theme-swatch-picker` when they fit the need.
- Do not add native raw interactive controls as primary business UI.
- Page templates must keep `page-meta` as the first node, bind it to `theme.nativeChromeTheme`, call `useNativeChromeSync()`, and wrap content in `app-shell`.
- User-facing UI copy must be Simplified Chinese.

## Validation

Run before pushing branch changes:

```bash
pnpm scan:ui-copy
pnpm scan:design-tokens
pnpm type-check
pnpm type-check:strict
pnpm build:mp-weixin
git diff --check
```

Additional branch checks:

- No committed production AppID.
- No cloud environment ID.
- No OpenID allowlist.
- No AppSecret.
- No UnoCSS or utility CSS framework.
- Only settings and capability preview pages are registered.
