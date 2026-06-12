<template>
  <view class="app-pet-host">
    <view
      class="app-pet-navigator"
      :class="{ 'app-pet-navigator--open': menuOpen }"
      hover-class="app-pet-navigator--pressed"
      @click.stop="openMenu"
    >
      <view class="app-pet-navigator__paper">
        <view class="app-pet-navigator__eyes">
          <view class="app-pet-navigator__eye" />
          <view class="app-pet-navigator__eye" />
        </view>
        <view class="app-pet-navigator__line app-pet-navigator__line--primary" />
        <view class="app-pet-navigator__line app-pet-navigator__line--accent" />
      </view>
    </view>

    <view
      v-if="menuOpen"
      class="app-pet-backdrop"
      @click="closeMenu"
    />

    <view
      class="app-pet-bubble"
      :class="{ 'app-pet-bubble--open': menuOpen }"
      @click.stop
    >
      <text class="app-pet-bubble__title">想去哪儿呀？</text>
      <text class="app-pet-bubble__subtitle">先挑一个，我带你过去。</text>

      <view class="app-pet-bubble__actions">
        <wd-button
          v-for="item in menuItems"
          :key="item.path"
          block
          size="small"
          :plain="item.plain"
          @click="navigateToMenuItem(item)"
        >
          {{ item.label }}
        </wd-button>
      </view>

      <view class="app-pet-bubble__close">
        <wd-button block plain size="small" @click="closeMenu">先藏起来</wd-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue"

interface MenuItem {
  label: string
  path: `/${string}`
  plain: boolean
}

type RuntimePage = {
  route?: string
  __route__?: string
}

const maxNavigateStackDepth = 9
const menuOpen = ref(false)

const menuItems: MenuItem[] = [
  {
    label: "写一条小回忆",
    path: "/pages/create/create",
    plain: false
  },
  {
    label: "去小歌单",
    path: "/pages/songs/songs",
    plain: true
  },
  {
    label: "勾一件小约定",
    path: "/pages/tasks/tasks",
    plain: true
  },
  {
    label: "换换小程序样子",
    path: "/pages/settings/settings",
    plain: true
  }
]

const normalizeRoute = (route: string): string => route.replace(/^\/+/, "")

const getCurrentRoute = (): string => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as RuntimePage | undefined

  return normalizeRoute(currentPage?.route ?? currentPage?.__route__ ?? "")
}

const openMenu = () => {
  menuOpen.value = true
}

const closeMenu = () => {
  menuOpen.value = false
}

const goToPath = (path: MenuItem["path"]) => {
  if (getCurrentPages().length >= maxNavigateStackDepth) {
    uni.redirectTo({ url: path })
    return
  }

  uni.navigateTo({
    url: path,
    fail: () => {
      uni.redirectTo({ url: path })
    }
  })
}

const navigateToMenuItem = async (item: MenuItem) => {
  const isCurrentPage = getCurrentRoute() === normalizeRoute(item.path)

  closeMenu()
  await nextTick()

  if (!isCurrentPage) {
    goToPath(item.path)
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.app-pet-host {
  position: relative;
}

.app-pet-navigator {
  @include pressable;
  position: fixed;
  right: var(--app-page-padding-x);
  bottom: calc(var(--app-page-padding-y) + env(safe-area-inset-bottom));
  z-index: 16;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--app-space-44);
  height: var(--app-space-40);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-floating);
}

.app-pet-navigator::before {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-13);
  height: var(--app-space-13);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-space-0) var(--app-radius-card) var(--app-space-0) var(--app-radius-xs);
  background: var(--app-field);
  content: "";
}

.app-pet-navigator--pressed,
.app-pet-navigator--open {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale));
}

.app-pet-navigator__paper {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-4);
  overflow: hidden;
}

.app-pet-navigator__eyes {
  display: flex;
  gap: var(--app-space-6);
}

.app-pet-navigator__eye {
  width: var(--app-space-2);
  height: var(--app-space-2);
  border-radius: var(--app-radius-round);
  background: var(--app-text);
}

.app-pet-navigator__line {
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  opacity: var(--app-decor-opacity);
}

.app-pet-navigator__line--primary {
  width: var(--app-space-18);
  background: var(--app-color-red-person);
}

.app-pet-navigator__line--accent {
  width: var(--app-space-24);
  background: var(--app-color-blue-person);
}

.app-pet-backdrop {
  position: fixed;
  inset: var(--app-space-0);
  z-index: 14;
}

.app-pet-bubble {
  @include pressable;
  position: fixed;
  right: calc(var(--app-page-padding-x) + var(--app-space-36));
  bottom: calc(var(--app-page-padding-y) + env(safe-area-inset-bottom) + var(--app-space-40));
  z-index: 15;
  display: flex;
  flex-direction: column;
  width: calc(var(--app-space-64) + var(--app-space-64));
  max-width: calc(100% - var(--app-page-padding-x) - var(--app-page-padding-x) - var(--app-space-36));
  gap: var(--app-space-7);
  padding: var(--app-card-padding);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-card) var(--app-radius-card) var(--app-radius-sm) var(--app-radius-card);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-field));
  box-shadow: var(--app-shadow-floating);
  opacity: var(--app-space-0);
  pointer-events: none;
  transform: scale(var(--app-press-scale));
  transform-origin: right bottom;
  visibility: hidden;
}

.app-pet-bubble--open {
  opacity: initial;
  pointer-events: auto;
  transform: none;
  visibility: visible;
}

.app-pet-bubble::before,
.app-pet-bubble::after {
  position: absolute;
  content: "";
  z-index: 0;
}

.app-pet-bubble::before {
  right: var(--app-space-10);
  bottom: calc(var(--app-space-0) - var(--app-space-6));
  width: var(--app-space-12);
  height: var(--app-space-12);
  border-right: var(--app-panel-border-width) solid var(--app-border);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-xs) var(--app-space-0) var(--app-radius-xs) var(--app-space-0);
  background: var(--app-field);
  transform: rotate(45deg);
}

.app-pet-bubble::after {
  top: var(--app-space-7);
  right: var(--app-space-12);
  width: var(--app-space-20);
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  background: var(--app-primary-soft);
  opacity: var(--app-decor-opacity);
}

.app-pet-bubble__title {
  position: relative;
  z-index: 1;
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.app-pet-bubble__subtitle {
  position: relative;
  z-index: 1;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.app-pet-bubble__actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-5);
}

.app-pet-bubble__close {
  position: relative;
  z-index: 1;
}
</style>
