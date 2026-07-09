# Governed Page Patterns

## Standard Registered Page

```vue
<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell
    nav-title="页面标题"
    nav-eyebrow="眉题"
    nav-show-back
    nav-variant="page"
    :nav-auto-back="false"
    @back="handleBack"
  >
    <template #nav-actions>
      <wd-button size="small" plain @click="handleAction">动作</wd-button>
    </template>

    <!-- page content -->
  </app-shell>
</template>

<script setup lang="ts">
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"

const theme = useNativeChromeSync()

const handleBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }
  uni.redirectTo({ url: "/pages/index/index" })
}

const handleAction = () => {
  // explicit action
}
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

/* Use tokens and mixins only */
</style>
```

## Home Page Variant

```vue
<app-shell nav-title="小珊的树洞" nav-eyebrow="悄悄停靠处" :nav-show-back="false" nav-variant="home">
  <!-- content -->
</app-shell>
```

## Edit Page with Keyboard Avoidance

```vue
<script setup lang="ts">
import { useKeyboardAvoidance } from "@/composables/useKeyboardAvoidance"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"

const theme = useNativeChromeSync()
const { keyboardSpacerStyle, syncKeyboardHeight, focusField } = useKeyboardAvoidance()
</script>

<template>
  <!-- inside app-shell -->
  <view id="field-id" class="field">
    <wd-input
      v-model="value"
      no-border
      :adjust-position="false"
      placeholder="占位符"
      :placeholder-style="placeholderStyle"
      @focus="focusField('#field-id')"
      @keyboardheightchange="syncKeyboardHeight"
    />
  </view>
  <view class="keyboard-spacer" :style="keyboardSpacerStyle" aria-hidden="true" />
</template>
```

## Sticky Filter Bar

```vue
<script setup lang="ts">
import { useStickySectionOffset } from "@/composables/useStickySectionOffset"

const { stickySectionStyle } = useStickySectionOffset()
</script>

<template>
  <view class="filter-bar" :style="stickySectionStyle">
    <!-- filters -->
  </view>
</template>
```

## Option Group

```vue
<app-option-group :columns="3" responsive="auto">
  <app-option-button
    v-for="option in options"
    :key="option.value"
    :active="active === option.value"
    @click="active = option.value"
  >
    <text>{{ option.label }}</text>
  </app-option-button>
</app-option-group>
```
