# Wot UI and Native Control Checklist

Use this checklist before adding or replacing interactive controls.

## Wot UI First

- [ ] Wot Design Uni component is used if one exists for the need.
- [ ] `wd-button` is used for explicit actions: CTA, save, delete, upload, confirmation, retry.
- [ ] Wot form components are used for inputs, textareas, checkboxes, pickers, selectors.
- [ ] Wot dialog/popup/toast/empty/loading components are used for overlays and feedback.

## Raw Native Control Ban

- [ ] New pages and components do not introduce raw `button`, `input`, `textarea`, `checkbox`, `radio`, `switch`, `picker`, `slider`, `form`, or raw native-looking business controls.

## Allowed Exceptions

The following are allowed because they are mandatory infrastructure or documented app-level components:

- [ ] `page-meta` and other mandatory UniApp/page host infrastructure.
- [ ] Framework/layout primitives inside already-approved base components.
- [ ] `AppOptionButton.vue` for option selectors and palette swatches.
- [ ] Any new exception must be documented in the native-control allowlist and follow the token system.

## Creating a New Exception

If Wot UI genuinely does not fit:

- [ ] Create a small app-level component in `src/components/`.
- [ ] Use tokens and mixins only.
- [ ] Keep it reusable and not page-specific.
- [ ] Add it to the native-control exception documentation.
- [ ] Do not use it to introduce a new generic raw-control escape hatch.

## Styling Wot Components

- [ ] Prefer Wot UI props and theme variables.
- [ ] Custom classes use `var(--app-*)` tokens and existing mixins.
- [ ] No raw hex/rpx/px/shadow values override Wot internals.
