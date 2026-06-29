<template>
  <view class="app-custom-nav" :style="navStyle">
    <view class="app-custom-nav__status-bar" :style="statusStyle" />

    <view class="app-custom-nav__bar" :style="barStyle">
      <view class="app-custom-nav__leading">
        <view
          v-if="showBack"
          class="app-custom-nav__icon-button app-custom-nav__icon-button--back"
          hover-class="app-custom-nav__icon-button--pressed"
          hover-stay-time="80"
          role="button"
          aria-label="返回"
          @click="handleBack"
        >
          <view class="app-custom-nav__arrow" aria-hidden="true">
            <view class="app-custom-nav__arrow-line" />
            <view class="app-custom-nav__arrow-wing app-custom-nav__arrow-wing--top" />
            <view class="app-custom-nav__arrow-wing app-custom-nav__arrow-wing--bottom" />
          </view>
        </view>
        <view
          v-else-if="variant === 'home'"
          class="app-custom-nav__icon-button app-custom-nav__icon-button--home"
          aria-hidden="true"
        >
          <view class="app-custom-nav__icon app-custom-nav__icon--home">
            <view class="app-custom-nav__home-spine" />
            <view class="app-custom-nav__home-page" />
          </view>
        </view>
      </view>

      <view class="app-custom-nav__title">
        <text v-if="title" class="app-custom-nav__title-text">{{ title }}</text>
        <text v-else-if="$slots.title" class="app-custom-nav__title-text">
          <slot name="title" />
        </text>
        <text v-if="eyebrow" class="app-custom-nav__eyebrow">{{ eyebrow }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useCustomNavMetrics } from "@/composables/useCustomNavMetrics"

type NavVariant = "auto" | "home" | "page"

const props = withDefaults(
  defineProps<{
    title?: string
    eyebrow?: string
    showBack?: boolean
    autoBack?: boolean
    variant?: NavVariant
  }>(),
  {
    title: "",
    eyebrow: "",
    showBack: false,
    autoBack: true,
    variant: "auto"
  }
)

const emit = defineEmits<{
  back: []
}>()

const { metrics, refresh } = useCustomNavMetrics()

onMounted(() => {
  refresh()
})

const navStyle = computed(() => ({
  height: `${metrics.value.customNavHeight}px`,
  background: "var(--app-bg)"
}))

const statusStyle = computed(() => ({
  height: `${metrics.value.statusBarHeight}px`
}))

const barStyle = computed(() => ({
  height: `${metrics.value.navBarHeight}px`,
  paddingLeft: `${metrics.value.navSideGap}px`,
  paddingRight: `${metrics.value.navRightReserve}px`
}))

const resolveBack = (): void => {
  const pages = typeof getCurrentPages === "function" ? getCurrentPages() : []
  if (Array.isArray(pages) && pages.length > 1) {
    uni.navigateBack({
      delta: 1,
      fail: () => {
        uni.redirectTo({ url: "/pages/index/index" })
      }
    })
    return
  }
  uni.redirectTo({ url: "/pages/index/index" })
}

const handleBack = () => {
  emit("back")
  if (props.autoBack) {
    resolveBack()
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.app-custom-nav {
  position: sticky;
  top: 0;
  z-index: var(--app-z-index-nav);
  width: 100%;
}

.app-custom-nav__status-bar {
  width: 100%;
}

.app-custom-nav__bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--app-space-6);
  width: 100%;
}

.app-custom-nav__leading {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.app-custom-nav__title {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  text-align: center;
}

.app-custom-nav__title-text {
  display: block;
  max-width: 100%;
  color: var(--app-text);
  font: var(--app-font-card-title);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-custom-nav__eyebrow {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-accent);
  font-size: var(--app-font-size-2xs);
  line-height: var(--app-line-height-none);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-custom-nav__icon-button {
  @include pressable;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--app-nav-height);
  height: var(--app-nav-height);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-pill);
  background: var(--app-surface-strong);
  box-shadow: var(--app-shadow-sm);
}

.app-custom-nav__icon-button--pressed {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale-strong));
}

.app-custom-nav__icon-button--pressed .app-custom-nav__arrow {
  // 按下时小箭头往回靠一下，像轻轻往回翻一页
  transform: rotate(-8deg) translateX(calc(var(--app-space-1) * -1));
}

.app-custom-nav__icon-button--home {
  cursor: default;
  pointer-events: none;
  opacity: var(--app-muted-opacity);
}

.app-custom-nav__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--app-space-12);
  height: var(--app-space-12);
  color: var(--app-text);
}

.app-custom-nav__arrow {
  position: relative;
  width: var(--app-space-12);
  height: var(--app-space-10);
  color: var(--app-text);
  transform: rotate(-8deg);
  transition: transform var(--app-transition-fast);
}

.app-custom-nav__arrow-line,
.app-custom-nav__arrow-wing {
  position: absolute;
  left: var(--app-space-2);
  top: 50%;
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  background: currentColor;
  transform-origin: left center;
}

.app-custom-nav__arrow-line {
  width: var(--app-space-10);
}

.app-custom-nav__arrow-wing {
  width: var(--app-space-6);
}

.app-custom-nav__arrow-wing--top {
  transform: rotate(-42deg);
}

.app-custom-nav__arrow-wing--bottom {
  transform: rotate(42deg);
}

.app-custom-nav__icon--home {
  transform: rotate(-6deg);
}

.app-custom-nav__home-spine {
  position: absolute;
  left: 0;
  top: 50%;
  width: var(--app-space-5);
  height: var(--app-border-width-focus);
  margin-top: calc(var(--app-border-width-focus) / -2);
  border-radius: var(--app-radius-pill);
  background: var(--app-primary);
  transform: translateY(-30%);
}

.app-custom-nav__home-page {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: var(--app-space-10);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-sm);
  background: var(--app-primary-soft);
}
</style>
