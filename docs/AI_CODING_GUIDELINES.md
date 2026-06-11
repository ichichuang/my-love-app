# AI Coding Guidelines

These guidelines are mandatory for future AI and Codex edits on the sanitized architecture branch.

## 1. Template Boundaries

- Preserve the reusable UniApp Mini Program architecture.
- Keep the settings page and capability preview page as the only registered pages unless a task explicitly asks for new pages.
- Do not restore removed private product pages.
- Do not add production AppIDs, cloud environment IDs, OpenIDs, AppSecrets, account credentials, or private product identifiers.
- Do not add cloud services, login pages, account systems, payment, push notifications, public feeds, public comments, public sharing, or public social features unless explicitly requested.
- Do not add UnoCSS or any utility CSS framework.

## 2. Page Shell and Native Chrome Rules

- Every page must keep `page-meta` as the first template node.
- Every page must bind `page-meta` to `theme.nativeChromeTheme`.
- Every page must call `useNativeChromeSync()`.
- Every page must wrap content in `app-shell`.
- Do not bypass `AppShell`.
- Do not bypass `wd-config-provider`.
- Do not call `uni.setNavigationBarColor`, `uni.setBackgroundColor`, or `uni.setBackgroundTextStyle` from pages, components, stores, or services.
- Native chrome updates must only go through `src/design-system/nav-theme.ts`.

## 3. UI Library First Rule

- Do not use native UI controls for business UI.
- Do not use native `button`, `input`, `textarea`, `checkbox`, `radio`, `switch`, `picker`, `slider`, `form`, or other raw interactive controls in new pages or business components.
- Use Wot UI components for all polished user-facing controls whenever possible.
- Use `wd-button` for CTA, save, delete, upload, confirmation, retry, and other explicit actions.
- Use Wot UI form components for inputs, textareas, checkboxes, pickers, selectors, dialogs, popups, cells, tabs, tags, badges, loading states, empty/error affordances, and other interactive controls whenever available.
- Use existing app components such as `app-shell`, `app-option-group`, `app-option-button`, and `theme-swatch-picker` when they already match the need.
- If Wot UI does not provide a suitable component, first create or reuse a small app-level component that still follows the design-token system. Do not hand-roll raw native-looking controls in pages.
- The only allowed platform-native structural exception is mandatory UniApp/page host infrastructure such as `page-meta`, and existing framework/layout primitives inside already-approved base components.

## 4. Design Token Rules

- Do not add raw hex colors in `src/pages/**` or `src/components/**`.
- Do not add `rgba()` in `src/pages/**` or `src/components/**`.
- Do not add fixed `rpx` or `px` values in `src/pages/**` or `src/components/**`.
- Do not add direct `box-shadow` values.
- Do not add direct transition durations.
- Do not add fixed font sizes.
- Do not add fixed border radius values.
- Use only registered `var(--app-*)` tokens, `src/styles/mixins.scss`, Wot UI, and existing app components.
- Pages and components may consume registered tokens but must not define new `--app-*` tokens.
- If a new token is unavoidable, add it only under `src/design-system/**` or `src/styles/tokens/**` and update `token-registry.ts`, documentation, and scanner expectations.

## 5. Language Rules

- User-facing UI copy must always be Simplified Chinese.
- Do not ship English labels, placeholders, empty states, modal text, toast text, or button text.
- English is allowed only in code identifiers, filenames, technical documentation, dependency names, and this AI coding guideline document.

## 6. New Feature Rules

- Add business pages only when explicitly requested.
- Register new pages in `src/pages.json`.
- New pages must follow the page shell and native chrome contract.
- Prefer existing theme, token, and Wot UI infrastructure over new styling systems.
- Keep private credentials and production identifiers outside tracked source.

## 7. Validation Rules

After any page, component, style, design-token, repository, or documentation change, run:

```bash
pnpm scan:ui-copy
pnpm scan:design-tokens
pnpm type-check
pnpm type-check:strict
pnpm build:mp-weixin
git diff --check
```

Also verify:

- There is no committed production AppID.
- There is no cloud environment ID.
- There is no OpenID allowlist.
- There is no AppSecret.
- There is no UnoCSS.
- There is no English user-facing UI copy.
- Only intended pages are registered.

## 8. Reporting Format

Return implementation results using:

- A. Summary
- B. Files changed
- C. Architecture constraints preserved
- D. UI library and native-control policy
- E. Privacy cleanup result
- F. Validation result
- G. Residual risks
