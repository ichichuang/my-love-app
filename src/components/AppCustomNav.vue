<template>
  <view class="app-custom-nav" :style="navStyle">
    <view class="app-custom-nav__status-bar" :style="{ height: `${metrics.statusBarHeight}px` }" />

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
          <view class="app-custom-nav__icon app-custom-nav__icon--back" aria-hidden="true">
            <view class="app-custom-nav__icon-tail" />
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

      <view class="app-custom-nav__title" :style="titleStyle">
        <text v-if="title" class="app-custom-nav__title-text">{{ title }}</text>
        <text v-else-if="$slots.title" class="app-custom-nav__title-text">
          <slot name="title" />
        </text>
        <text v-if="eyebrow" class="app-custom-nav__eyebrow">{{ eyebrow }}</text>
      </view>

      <view class="app-custom-nav__trailing" :style="trailingStyle">
        <slot name="actions" />
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
    variant?: NavVariant
  }>(),
  {
    title: "",
    eyebrow: "",
    showBack: false,
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
  paddingTop: `${metrics.value.statusBarHeight}px`,
  background: "transparent"
}))

const barStyle = computed(() => {
  const topGap = Math.max(0, metrics.value.capsuleGap)
  const height = metrics.value.contentHeight + topGap * 2
  const leftPad = Math.max(0, metrics.value.menuButtonLeft)
  const rightPad = metrics.value.capsuleRight
  return {
    height: `${height}px`,
    paddingLeft: `${leftPad}px`,
    paddingRight: `${rightPad}px`
  }
})

const titleStyle = computed(() => {
  const left = Math.max(0, metrics.value.menuButtonLeft)
  const right = metrics.value.capsuleRight
  const width = Math.max(0, metrics.value.windowWidth - left - right)
  return {
    marginLeft: `${left}px`,
    marginRight: `${right}px`,
    width: `${width}px`
  }
})

const trailingStyle = computed(() => {
  const gap = Math.max(0, metrics.value.capsuleGap)
  return {
    marginRight: `${gap}px`
  }
})

const resolveBack = (): void => {
  const pages = typeof getCurrentPages === "function" ? getCurrentPages() : []
  if (Array.isArray(pages) && pages.length > 1) {
    uni.navigateBack({ delta: 1, fail: () => {
      uni.reLaunch({ url: "/pages/index/index" })
    } })
    return
  }
  uni.reLaunch({ url: "/pages/index/index" })
}

const handleBack = () => {
  emit("back")
  resolveBack()
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.app-custom-nav {
  position: relative;
  z-index: 10;
  width: 100%;
}

.app-custom-nav__status-bar {
  width: 100%;
}

.app-custom-nav__bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-6);
  width: 100%;
}

.app-custom-nav__leading,
.app-custom-nav__trailing {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--app-space-5);
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
  transform: scale(var(--app-press-scale));
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

.app-custom-nav__icon--back {
  transform: rotate(-12deg);
}

.app-custom-nav__icon-tail {
  width: 0;
  height: 0;
  border-top: var(--app-space-5) solid transparent;
  border-bottom: var(--app-space-5) solid transparent;
  border-right: var(--app-space-8) solid currentColor;
  border-radius: var(--app-radius-xs);
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