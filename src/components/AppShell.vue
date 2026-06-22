<template>
  <wd-config-provider :key="theme.providerKey" :theme="theme.wotTheme" :theme-vars="theme.wotThemeVars">
    <view class="app-shell theme-transition" :class="theme.themeClasses" :style="theme.appStyle">
      <app-custom-nav
        v-if="navVisible"
        :title="navTitleText"
        :eyebrow="navEyebrowText"
        :show-back="navShowBack"
        :auto-back="props.navAutoBack"
        :variant="navVariant"
        @back="emit('back')"
      >
        <template v-if="$slots['nav-title']" #title>
          <slot name="nav-title" />
        </template>
      </app-custom-nav>

      <view v-if="navVisible && $slots['nav-actions']" class="app-shell__nav-actions">
        <slot name="nav-actions" />
      </view>

      <view class="app-shell__body" :class="{ 'app-shell__body--with-nav-actions': navVisible && $slots['nav-actions'] }">
        <view v-if="showLegacyHeader" class="app-shell__header">
          <view>
            <text v-if="eyebrow" class="app-shell__eyebrow">{{ eyebrow }}</text>
            <text v-if="title" class="app-shell__title">{{ title }}</text>
          </view>
          <view v-if="$slots.actions" class="app-shell__actions">
            <slot name="actions" />
          </view>
        </view>

        <slot />
      </view>

      <wd-toast />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useAppToastHost } from "@/composables/useAppToast"
import { useThemeStore } from "@/stores/theme"

type NavVariant = "auto" | "home" | "page"

const props = withDefaults(
  defineProps<{
    title?: string
    eyebrow?: string
    navTitle?: string
    navEyebrow?: string
    navShowBack?: boolean
    navAutoBack?: boolean
    navVariant?: NavVariant
    useCustomNav?: boolean
  }>(),
  {
    title: "",
    eyebrow: "",
    navTitle: "",
    navEyebrow: "",
    navShowBack: false,
    navAutoBack: true,
    navVariant: "auto",
    useCustomNav: true
  }
)

const emit = defineEmits<{
  back: []
}>()

const theme = useThemeStore()
useAppToastHost()

const navTitleText = computed(() => props.navTitle || props.title || "")
const navEyebrowText = computed(() => props.navEyebrow || props.eyebrow || "")
const navVisible = computed(() => props.useCustomNav && navTitleText.value.length > 0)
const navVariant = computed<NavVariant>(() => {
  if (props.navVariant !== "auto") {
    return props.navVariant
  }
  return props.navShowBack ? "page" : "home"
})
const showLegacyHeader = computed(() => !navVisible.value && (!!props.title || !!props.eyebrow))
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.app-shell {
  @include page-shell;
  padding: 0 0 calc(#{$app-page-y} + env(safe-area-inset-bottom));
}

.app-shell__body {
  padding: $app-page-y $app-page-x 0;
}

.app-shell__body--with-nav-actions {
  padding-top: var(--app-space-6);
}

.app-shell__nav-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--app-space-5);
  padding: var(--app-space-5) $app-page-x 0;
}

.app-shell__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-shell-header-gap);
  margin-bottom: var(--app-shell-header-bottom);
  padding-top: var(--app-shell-header-top);
}

.app-shell__eyebrow {
  display: block;
  margin-bottom: var(--app-shell-eyebrow-bottom);
  color: var(--app-accent);
  font-size: var(--app-font-size-md);
  letter-spacing: 0;
  line-height: var(--app-line-height-tight);
}

.app-shell__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-page-title);
}

.app-shell__actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-6);
  flex-shrink: 0;
}
</style>
