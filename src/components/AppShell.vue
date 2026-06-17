<template>
  <wd-config-provider :key="theme.providerKey" :theme="theme.wotTheme" :theme-vars="theme.wotThemeVars">
    <view class="app-shell theme-transition" :class="theme.themeClasses" :style="theme.appStyle">
      <app-custom-nav
        v-if="navVisible"
        :title="navTitleText"
        :eyebrow="navEyebrowText"
        :show-back="navShowBack"
        :variant="navVariant"
        @back="emit('back')"
      >
        <template v-if="$slots['nav-actions']" #actions>
          <slot name="nav-actions" />
        </template>
        <template v-if="$slots['nav-title']" #title>
          <slot name="nav-title" />
        </template>
      </app-custom-nav>

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
  </wd-config-provider>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useThemeStore } from "@/stores/theme"

type NavVariant = "auto" | "home" | "page"

const props = withDefaults(
  defineProps<{
    title?: string
    eyebrow?: string
    navTitle?: string
    navEyebrow?: string
    navShowBack?: boolean
    navVariant?: NavVariant
    useCustomNav?: boolean
  }>(),
  {
    title: "",
    eyebrow: "",
    navTitle: "",
    navEyebrow: "",
    navShowBack: false,
    navVariant: "auto",
    useCustomNav: true
  }
)

const emit = defineEmits<{
  back: []
}>()

const theme = useThemeStore()

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