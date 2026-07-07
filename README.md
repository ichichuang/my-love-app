# 珊瑚行动

Private WeChat Mini Program built with UniApp Vue 3, TypeScript, Vite, Pinia, Wot UI, SCSS, and native CloudBase `wx.cloud`.

## What It Does

- Light, dark, and follow-system theme modes.
- Six contrast-validated curated romantic palettes with governed design tokens.
- Full journal CRUD: create, list, view, edit, and delete memory entries.
- CloudBase document database storage for entries.
- CloudBase file upload, private file IDs, temporary-link display, and file deletion.
- Wot UI configured through `src/pages.json` easycom mapping.
- User-facing UI copy is Simplified Chinese only.
- Stage 1 UI behavior remains private and unchanged; Phase 1 only updates the repository CloudBase access-control baseline for a two-person OpenID whitelist.
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

The committed rule files and access-control function source are repository-safe templates. They must only contain placeholders or environment-variable names:

```text
OWNER_OPENID
PARTNER_OPENID
```

The database rule template documents a two-person OpenID whitelist for reading, creating, updating, and deleting `love_entries`. Creates must also require:

```text
doc.coupleId == 'main'
```

Apply the real database rule in the CloudBase console or a private deployment channel:

- `cloudbase/security/database.rules.json`

The storage rule template documents the same two-person OpenID whitelist, limited to:

```text
love-entries/main/
```

For CloudBase storage permissions, use this console preset if custom storage rules are not available:

```text
仅创建者及管理员可读写
```

`cloudbase/security/storage.rules.json` is kept as a reference-only custom rule if the CloudBase console cannot apply custom storage rules. In that case, use the preset permission above instead.

Storage paths are written under:

```text
love-entries/main/
```

The app stores CloudBase `fileID` values and requests temporary URLs through `wx.cloud.getTempFileURL`. It does not store public file URLs.

Do not commit real OpenIDs, pairing codes, passwords, AppSecret values, cloud credentials, tokens, or other secrets to this public repository. Replace `OWNER_OPENID` and `PARTNER_OPENID` only inside the CloudBase console or a private deployment channel. The current access-control phase includes a status-only access entry page, business-page guard shell, and safe runtime error handling. It still does not add password input, pairing-code input or verification UI, invitation flow, or account-management screens.

Access control uses a private CloudBase Event Function:

- `cloudfunctions/access-control`

The function supports `getAccessStatus` and `verifyPairingCode`, reads the caller OpenID from `cloud.getWXContext().OPENID`, and uses private CloudBase environment variables for the two-person whitelist and optional pairing-code hash. It is source-ready only until deployed manually. See `docs/ACCESS_CONTROL_SETUP.zh-CN.md` for the required private setup and `docs/ACCESS_CONTROL_RUNTIME_QA.zh-CN.md` for WeChat DevTools and real-device runtime QA.

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

The design-token scan checks raw style values, unknown `--app-*` tokens, the fixed six-palette inventory, palette source colors, palette contrast, pages bypassing `AppShell`, selector buttons bypassing `AppOptionButton`, Wot/AppShell contracts, and forbidden theme side effects outside `nav-theme.ts`.

Scan CloudBase rule templates and public docs for committed real OpenID-like literals:

```bash
pnpm scan:security-baseline
```

The security scan reports only redacted findings. Placeholders such as `OWNER_OPENID` and `PARTNER_OPENID` are allowed.

Scan the access-control cloud-function source and Mini Program call boundary:

```bash
pnpm scan:access-control
```

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
pnpm scan:security-baseline
pnpm scan:access-control
pnpm type-check
pnpm build:mp-weixin
git diff --check
```

After a production build, verify `dist/build/mp-weixin` still contains `love-d4g006mox4b78e5c6` and `wx04b0ef4f0de5c5c5`, contains no AppSecret pattern, has no real OpenID, has no UnoCSS dependency/config/reference, and has no English user-facing UI copy.

## Architecture

- `src/stores/theme.ts` owns theme mode, system theme listener, palette selection, density, font scale, and persistence.
- `src/design-system/*` resolves palettes, terminal app CSS variables, Wot theme vars, size tokens, and debounced navigation-bar theme updates.
- `src/services/cloudbase.ts` is the only native `wx.cloud` boundary.
- `src/services/access-control.ts` calls `cloudfunctions/access-control` through the typed `cloudbase.ts` wrapper.
- `src/services/repositories/entries.ts` maps database documents to typed entry records.
- `src/composables/useCrud.ts` and `src/composables/useFileUpload.ts` keep page async state predictable.
- `src/components/*` contains reusable app UI.
- `src/pages/*` contains the four Mini Program screens.

## Assets

No generated illustrations were present in `static/generated` during implementation. Optional future asset filenames are recorded in `static/generated/README.md`; the current UI uses SCSS placeholders and uploaded CloudBase images.
# my-love-app
# my-love-app
