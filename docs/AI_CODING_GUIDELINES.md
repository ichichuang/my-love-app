# AI Coding Guidelines

These guidelines are mandatory for future AI and Codex edits in this project. They preserve the architecture frozen after `miniapp-architecture-freeze-v1` and the product direction captured in the final design and development document in the project root.

## 1. Architecture Boundaries

- Do not refactor the sealed base architecture.
- Do not redesign the design-system foundation.
- Do not change the CloudBase architecture.
- Do not change the routing architecture beyond explicitly requested page additions.
- Do not change the product boundary.
- Do not add partner access.
- Do not add cloud functions.
- Do not add AppSecret.
- Do not add UnoCSS or any utility CSS framework.
- Do not add login pages, account systems, payment, push notifications, public feeds, public comments, public sharing, or public social features.

## 2. Page Shell and Native Chrome Rules

- Every page must keep `page-meta` as the first template node.
- Every page must bind `page-meta` to `theme.nativeChromeTheme`.
- Every page must call `useNativeChromeSync()`.
- Every page must wrap content in `app-shell`.
- Do not bypass `AppShell`.
- Do not bypass `wd-config-provider`.
- Do not call `uni.setNavigationBarColor`, `uni.setBackgroundColor`, or `uni.setBackgroundTextStyle` from pages, components, stores, or services.
- Native chrome updates must only go through `src/design-system/nav-theme.ts`.

## 2.1 Non-Traditional Navigation and Pet Guide Rules

- Do not add a traditional bottom `tabBar`.
- Do not use WeChat `custom-tab-bar`.
- Implement the future pet navigator as a normal Vue component, recommended path `src/components/AppPetNavigator.vue`.
- Keep page routes registered through `src/pages.json`.
- Keep navigation actions on `uni.navigateTo`, `uni.redirectTo`, and `uni.navigateBack`.
- The pet navigator is only a Stage 1 owner-only guide into writing memories, song list, must-do tasks, and settings.
- The pet navigator must not represent the girlfriend account, imply both people are online, act as a chatbot, automatically read or rewrite user data, or add partner access, invitations, binding, sharing, comments, or public features.
- First implementation should manually mount `AppPetNavigator` on selected pages before changing `AppShell`. Only evaluate an optional `AppShell` slot or optional child component after that need is proven.
- Pet visuals may use paper-ball, note, red/blue line-person, short hand-drawn line, slight blink/breath/nod, and short Chinese prompt patterns. Do not use ocean, coral reef, shells, pearls, complex animal IP, childish cartoon, mascot branding, 3D pets, sticker-heavy UI, or large-area animation.

## 3. UI Library First Rule

- Do not use native UI controls for business UI.
- Do not use native `button`, `input`, `textarea`, `checkbox`, `radio`, `switch`, `picker`, `slider`, `form`, or other raw interactive controls in new pages or business components.
- Use Wot UI components for all polished user-facing controls whenever possible.
- Use `wd-button` for CTA, save, delete, upload, confirmation, retry, and other explicit actions.
- Use Wot UI form components for inputs, textareas, checkboxes, pickers, selectors, dialogs, popups, cells, tabs, tags, badges, loading states, empty/error affordances, and other interactive controls whenever available.
- Use existing app components such as `app-shell`, `empty-state`, `app-option-group`, `app-option-button`, `entry-card`, `image-grid`, and `theme-swatch-picker` when they already match the need.
- If Wot UI does not provide a suitable component, first create or reuse a small app-level component that still follows the design-token system. Do not hand-roll raw native-looking controls in pages.
- The only allowed platform-native structural exception is mandatory UniApp/page host infrastructure such as `page-meta`, and existing framework/layout primitives inside already-approved base components. New business UI must not introduce raw native controls as the primary user-facing control.

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

## 5. Visual and Emotional Direction

- The app must feel private, warm, cute, hand-drawn, clean, light, and intimate.
- Cute means soft, private, gentle, and couple-oriented. Do not make it childish.
- Hand-drawn feeling should come from red/blue couple cues, soft note-like cards, small tags, stamp-like details, gentle completion feedback, and restrained decorative marks.
- Do not create ocean, coral reef, shell, pearl, commercial brand, glassmorphism, heavy gradient, childish cartoon, or over-3D styles.
- Micro-animations must be gentle and token-driven: slight pet breathing, soft menu expansion, card press, completion tuck-away, or gentle check feedback. Do not add page-level showpiece transitions, high-frequency loops, particles, strong bounce, large animated gradients, or decoration that hurts reading or tapping.
- Use registered motion tokens for transition and animation durations. Do not write raw transition duration or raw animation duration in pages or components.
- Song pages should feel like "songs she wants to hear me sing," not a generic music manager.
- Task pages should feel like "small things we want to do together," not an enterprise todo app.
- Home should feel like a private memory stopover, not a dashboard.

## 6. Language Rules

- User-facing UI copy must always be Simplified Chinese.
- Do not ship English labels, placeholders, empty states, modal text, toast text, or button text.
- English is allowed only in code identifiers, filenames, technical documentation, dependency names, and this AI coding guideline document.
- Playful copy is allowed for home guidance, the pet menu, empty states, completion feedback, song explanations, and task explanations.
- Delete confirmations, errors, permission failures, cloud failures, save failures, and irreversible-data warnings must stay restrained and explicit.

## 7. CloudBase and Data Rules

- Use the existing CloudBase service/repository/composable architecture.
- Do not call `wx.cloud` directly from pages or components.
- Keep `love_entries` as the database collection.
- Keep `coupleId: "main"`.
- Keep storage prefix `love-entries/main/`.
- Keep owner-only Stage 1 behavior.
- Do not manually set or overwrite `_openid`.
- Store private file IDs and use temporary URLs; do not store public readable file URLs.

## 8. New Feature Implementation Rules

- Use the final design and development document in the project root as the product and page-design source of truth.
- Implement song list and must-do task features within the existing architecture.
- Prefer a single `love_entries` collection with kind-compatible records if implementing these pages:
  - `memory`
  - `song`
  - `task`
- Old records without `kind` must remain compatible as memory records.
- Song/task records must not appear in the memory timeline.
- Existing memory CRUD, image upload, image temporary URLs, and file deletion must remain intact.

## 9. Validation Rules

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

- The build output still contains `love-d4g006mox4b78e5c6`.
- The build output still contains `wx04b0ef4f0de5c5c5`.
- There is no AppSecret.
- There is no UnoCSS.
- There is no English user-facing UI copy.
- CloudBase collection, storage prefix, and owner-only constraints are unchanged.

## 10. Reporting Format

Return implementation results using:

- A. Summary
- B. Files changed
- C. AI coding guideline content added
- D. UI library and native-control policy
- E. Architecture constraints preserved
- F. Validation result
- G. Manual review checklist
