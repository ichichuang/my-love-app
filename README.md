# 珊瑚行动

Private WeChat Mini Program built with UniApp Vue 3, TypeScript, Vite, Pinia, Wot UI, SCSS, and native CloudBase `wx.cloud`.

## What It Does

- Light, dark, and follow-system theme modes.
- Curated romantic palette picker with governed design tokens.
- Full journal CRUD: create, list, view, edit, and delete memory entries.
- CloudBase document database storage for entries.
- CloudBase file upload, private file IDs, temporary-link display, and file deletion.
- Wot UI configured through `src/pages.json` easycom mapping.
- User-facing UI copy is Simplified Chinese only.
- Stage 1 scope is owner-only smoke testing with one WeChat account.
- Later product scope is private two-person memory keeping, not public social networking.

See `docs/PRODUCT_REQUIREMENTS.zh-CN.md` for the product rules future changes must preserve.

## Required Local Values

Copy `.env.example` to `.env` and fill:

```bash
VITE_WECHAT_APPID=wx04b0ef4f0de5c5c5
VITE_CLOUDBASE_ENV_ID=love-d4g006mox4b78e5c6
```

The WeChat Mini Program appid is also set in:

- `src/manifest.json` at `mp-weixin.appid`
- `manifest.config.ts` at `mp-weixin.appid` if you use the typed manifest file as your source of truth

UniApp uses `src/manifest.json` for the current CLI build.

## CloudBase Setup

Create a CloudBase environment linked to the Mini Program, then create the collection:

```text
love_entries
```

Stage 1 is owner-only testing. The only OpenID allowed to read, create, update, and delete `love_entries` is:

```text
oT1b65CCto1yDiTjtQvQASTsI0to
```

Apply the owner-only database rule file in the CloudBase console:

- `cloudbase/security/database.rules.json`

Do not add the partner OpenID during Stage 1. Partner access is a later TODO after the owner-only smoke test passes.

For CloudBase storage permissions during Stage 1, use this console preset if custom storage rules are not available:

```text
仅创建者及管理员可读写
```

`cloudbase/security/storage.rules.json` is kept as a reference-only custom rule for future use. If the CloudBase console cannot apply custom storage rules, use the preset permission above instead.

Storage paths are written under:

```text
love-entries/main/
```

The app stores CloudBase `fileID` values and requests temporary URLs through `wx.cloud.getTempFileURL`. It does not store public file URLs.

Later TODO: add the girlfriend's OpenID to the database and storage access model after the owner-only smoke test is complete.

## Development

Install dependencies:

```bash
pnpm install
```

Start the WeChat Mini Program target:

```bash
pnpm dev:mp-weixin
```

Import this folder in WeChat DevTools:

```text
/Users/cc/MyPorject/珊瑚行动/my-love-app/dist/dev/mp-weixin
```

Production build:

```bash
pnpm build:mp-weixin
```

Import this folder for the built output:

```text
/Users/cc/MyPorject/珊瑚行动/my-love-app/dist/build/mp-weixin
```

Scan for likely English user-facing text:

```bash
pnpm scan:ui-copy
```

The scan is intentionally narrow and checks likely Vue template text, labels, placeholders, modal text, and toast text. Technical identifiers and package names are allowed.

Scan for likely hardcoded design values outside the token system:

```bash
pnpm scan:design-tokens
```

Design tokens live under `src/styles/tokens/**` for static fallbacks and `src/design-system/**` for runtime resolution. Palettes define complete light/dark semantic schemes, `size-scale.ts` and `typography-resolver.ts` derive density/font-scale output, `css-vars.ts` emits terminal aliases, `wot-theme.ts` maps only supported Wot UI variables, and `nav-theme.ts` is the only native navigation-bar side-effect boundary. `src/stores/theme.ts` owns theme state, persistence, and system theme listening.

`AppShell.vue` is the only runtime CSS variable injection root. It binds `theme.appStyle` to the root view and passes `theme.wotThemeVars` plus `theme.providerKey` to `wd-config-provider`. Settings selectors and palette swatches use `AppOptionGroup.vue` and `AppOptionButton.vue`; CTA actions remain on Wot `wd-button`.

The design-token scan checks raw style values, unknown `--app-*` tokens, pages bypassing `AppShell`, selector buttons bypassing `AppOptionButton`, Wot/AppShell contracts, and forbidden theme side effects outside `nav-theme.ts`.

The developer-facing design-system preview page is registered at:

```text
pages/design-preview/design-preview
```

Open it from the settings page to QA current theme mode, palette, density, font scale, Wot UI theme output, semantic colors, spacing, radius, typography, component tokens, shadows, motion, overlays, photo badges, and status colors. It must remain a developer preview only and must not expose secrets or account-management flows.

## Validation

Before reporting a UI or theme-system change complete, run:

```bash
pnpm scan:ui-copy
pnpm scan:design-tokens
pnpm type-check
pnpm build:mp-weixin
git diff --check
```

After a production build, verify `dist/build/mp-weixin` still contains `love-d4g006mox4b78e5c6` and `wx04b0ef4f0de5c5c5`, contains no AppSecret pattern, has no UnoCSS dependency/config/reference, and has no English user-facing UI copy.

## Architecture

- `src/stores/theme.ts` owns theme mode, system theme listener, palette selection, density, font scale, and persistence.
- `src/design-system/*` resolves palettes, terminal app CSS variables, Wot theme vars, size tokens, and debounced navigation-bar theme updates.
- `src/services/cloudbase.ts` is the only native `wx.cloud` boundary.
- `src/services/repositories/entries.ts` maps database documents to typed entry records.
- `src/composables/useCrud.ts` and `src/composables/useFileUpload.ts` keep page async state predictable.
- `src/components/*` contains reusable app UI.
- `src/pages/*` contains the four Mini Program screens.

## Assets

No generated illustrations were present in `static/generated` during implementation. Optional future asset filenames are recorded in `static/generated/README.md`; the current UI uses SCSS placeholders and uploaded CloudBase images.
# my-love-app
# my-love-app
