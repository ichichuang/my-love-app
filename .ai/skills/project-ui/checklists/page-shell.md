# Page Shell Checklist

Use this checklist before adding, modifying, or reviewing any page file under `src/pages/**`.

## First-Node Rule

- [ ] `<page-meta>` is the first template node in the page.
- [ ] `<page-meta>` appears before `<app-shell>`.
- [ ] No other root-level element precedes `<page-meta>`.

## page-meta Bindings

- [ ] `background-text-style` bound to `theme.nativeChromeTheme.backgroundTextStyle`.
- [ ] `background-color` bound to `theme.nativeChromeTheme.backgroundColor`.
- [ ] `background-color-top` bound to `theme.nativeChromeTheme.backgroundColorTop`.
- [ ] `background-color-bottom` bound to `theme.nativeChromeTheme.backgroundColorBottom`.
- [ ] `page-style` bound to `theme.nativeChromeTheme.pageStyle`.

## App Shell Wrapper

- [ ] Page content is wrapped in `<app-shell>`.
- [ ] No alternative root wrapper bypasses `AppShell`.
- [ ] `AppShell` receives `nav-title`, `nav-eyebrow`, `nav-show-back`, `nav-variant`, or `nav-auto-back` as appropriate.
- [ ] Trailing nav actions use `app-shell`'s `#nav-actions` slot.
- [ ] Legacy `title`/`eyebrow`/`actions` props are avoided unless matching an existing legacy pattern.

## Native Chrome Sync

- [ ] Page script calls `useNativeChromeSync()`.
- [ ] The returned `theme` object is used for `page-meta` bindings.
- [ ] No direct call to `uni.setNavigationBarColor`, `uni.setBackgroundColor`, or `uni.setBackgroundTextStyle` exists in the page.

## Route Safety

- [ ] If editing `src/pages.json`, `pages/index/index` remains the first route.
- [ ] `pages/access/access` is not re-registered and is not moved to the first route.

## Example Template

```vue
<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="页面标题" nav-eyebrow="眉题" nav-show-back nav-variant="page">
    <!-- page content -->
  </app-shell>
</template>

<script setup lang="ts">
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"

const theme = useNativeChromeSync()
</script>
```
