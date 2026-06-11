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

Design tokens live under `src/styles/tokens/**`. Theme state, curated palettes, Wot UI `themeVars`, density, and font scale are governed by `src/stores/theme.ts`. See `docs/DESIGN_SYSTEM.zh-CN.md` before changing UI colors, spacing, typography, shadows, radii, or motion.

## Validation

The project was verified with:

```bash
pnpm type-check
pnpm scan:ui-copy
pnpm scan:design-tokens
pnpm build:mp-weixin
pnpm dev:mp-weixin
```

`pnpm dev:mp-weixin` reached `Build complete. Watching for changes...` and was then stopped.

## Architecture

- `src/stores/theme.ts` owns theme mode, system theme listener, palette state, Wot theme vars, and app CSS variables.
- `src/services/cloudbase.ts` is the only native `wx.cloud` boundary.
- `src/services/repositories/entries.ts` maps database documents to typed entry records.
- `src/composables/useCrud.ts` and `src/composables/useFileUpload.ts` keep page async state predictable.
- `src/components/*` contains reusable app UI.
- `src/pages/*` contains the four Mini Program screens.

## Assets

No generated illustrations were present in `static/generated` during implementation. Optional future asset filenames are recorded in `static/generated/README.md`; the current UI uses SCSS placeholders and uploaded CloudBase images.
# my-love-app
# my-love-app
