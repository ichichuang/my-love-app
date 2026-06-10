# 珊瑚行动

Private two-person WeChat Mini Program built with UniApp Vue 3, TypeScript, Vite, Pinia, Wot UI, SCSS, and native CloudBase `wx.cloud`.

## What It Does

- Light, dark, and follow-system theme modes.
- Romantic palette picker plus custom hex seed color.
- Full journal CRUD: create, list, view, edit, and delete memory entries.
- CloudBase document database storage for entries.
- CloudBase file upload, private file IDs, temporary-link display, and file deletion.
- Wot UI configured through `src/pages.json` easycom mapping.
- User-facing UI copy is Simplified Chinese only.
- Product scope is private two-person memory keeping, not public social networking.

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

Apply these rule files in the CloudBase console:

- `cloudbase/security/database.rules.json`
- `cloudbase/security/storage.rules.json`

Before applying them, replace `__OWNER_OPENID__` and `__PARTNER_OPENID__` with the two real Mini Program OpenIDs allowed to access the shared archive.

Storage paths are written under:

```text
love-entries/main/
```

The app stores CloudBase `fileID` values and requests temporary URLs through `wx.cloud.getTempFileURL`. It does not store public file URLs.

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

## Validation

The project was verified with:

```bash
pnpm type-check
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
