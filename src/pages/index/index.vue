<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="小珊的树洞" nav-eyebrow="悄悄停靠处" :nav-show-back="false" nav-variant="home">

    <view class="home-hero">
      <view class="home-hero__top">
        <image class="home-hero__icon" src="/static/logo-couple.png" mode="aspectFit" />
        <view class="home-hero__copy">
          <text class="home-hero__kicker">{{ todayGreeting }}</text>
          <text class="home-hero__title">把今天值得记住的小事收好</text>
        </view>
      </view>

      <text class="home-hero__body">照片、悄悄话、想听的歌和以后要做的事，都安静停靠在这里。</text>

      <view class="home-hero__stamps">
        <text class="home-hero__stamp home-hero__stamp--memory">{{ memoryCountText }}</text>
        <text class="home-hero__stamp">本人测试</text>
      </view>

      <wd-button block size="large" custom-class="home-hero__button" @click="goCreate">写下此刻</wd-button>
    </view>

    <view class="home-dock">
      <view class="home-dock__head">
        <text class="home-dock__title">夹在回忆本里的小纸签</text>
        <text class="home-dock__body">点一首，勾一件，慢慢收着。</text>
      </view>

      <view class="home-note-stack">
        <view class="home-note home-note--song" hover-class="home-note--pressed" @click="goSongs">
          <view class="home-note__mark home-note__mark--song">
            <text>歌</text>
          </view>
          <view class="home-note__copy">
            <text class="home-note__title">小歌单</text>
            <text class="home-note__body">她想听的歌先收着</text>
          </view>
          <wd-button
            size="small"
            plain
            custom-class="home-note__button"
            @click.stop="goSongs"
          >
            去小歌单
          </wd-button>
        </view>

        <view class="home-note home-note--task" hover-class="home-note--pressed" @click="goTasks">
          <view class="home-note__mark home-note__mark--task">
            <text>约</text>
          </view>
          <view class="home-note__copy">
            <text class="home-note__title">小约定</text>
            <text class="home-note__body">想一起做的事慢慢勾</text>
          </view>
          <wd-button
            size="small"
            plain
            custom-class="home-note__button"
            @click.stop="goTasks"
          >
            去小约定
          </wd-button>
        </view>
      </view>
    </view>

    <view class="home-section">
      <view class="home-section__head">
        <text class="home-section__title">回忆时间线</text>
        <text class="home-section__count">{{ items.length }} 条回忆</text>
      </view>

      <view v-if="loading" class="home-loading">
        <text>正在慢慢读取…</text>
      </view>

      <empty-state
        v-else-if="items.length === 0"
        image-src="/static/logo-couple.png"
        title="先放进第一颗小记忆"
        body="可以先写一句话、放一张照片，或者记下一个不想忘记的日子。"
      >
        <wd-button custom-class="home-empty__button" @click="goCreate">记录第一个瞬间</wd-button>
      </empty-state>

      <view v-else class="home-list">
        <entry-card
          v-for="entry in items"
          :key="entry.id"
          :entry="entry"
          @open="openEntry"
        />
      </view>
    </view>

    <app-pet-navigator />
  </app-shell>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app"
import AppPetNavigator from "@/components/AppPetNavigator.vue"
import { useCachedList } from "@/composables/useCachedList"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { dataCacheKeys } from "@/services/data-cache"
import { listEntries } from "@/services/repositories/entries"

const theme = useNativeChromeSync()
const { items, loading, reload } = useCachedList({
  cacheKey: dataCacheKeys.memoryList,
  loader: listEntries
})
const hour = new Date().getHours()
const todayGreeting = hour < 12 ? "早安，今天也慢慢收藏" : hour < 18 ? "午后，把小事轻轻放好" : "晚上好，给今天留一盏小灯"
const memoryCountText = computed(() => (items.value.length > 0 ? `已收好 ${items.value.length} 条回忆` : "等第一颗小记忆"))

const loadEntries = async (notifyCachedFailure = false) => {
  try {
    const result = await reload()
    if (notifyCachedFailure && result.fromCache && !result.refreshed) {
      uni.showToast({
        title: "小纸条暂时没更新好，请稍后再试。",
        icon: "none"
      })
    }
  } catch (error) {
    uni.showToast({
      title: getFriendlyErrorMessage(error),
      icon: "none"
    })
  } finally {
    uni.stopPullDownRefresh()
  }
}

const goCreate = () => {
  uni.navigateTo({
    url: "/pages/create/create"
  })
}

const goSongs = () => {
  uni.navigateTo({
    url: "/pages/songs/songs"
  })
}

const goTasks = () => {
  uni.navigateTo({
    url: "/pages/tasks/tasks"
  })
}

const openEntry = (id: string) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${encodeURIComponent(id)}`
  })
}

onShow(() => {
  void loadEntries()
})
onPullDownRefresh(() => {
  void loadEntries(true)
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.home-hero {
  @include panel;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
  overflow: hidden;
}

.home-hero::before {
  position: absolute;
  top: var(--app-card-padding);
  right: var(--app-card-padding);
  width: var(--app-space-28);
  height: var(--app-space-20);
  border-top: var(--app-panel-border-width) dashed var(--app-divider);
  border-bottom: var(--app-panel-border-width) dashed var(--app-divider);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(8deg);
}

.home-hero::after {
  position: absolute;
  right: var(--app-card-padding);
  bottom: var(--app-home-decor-bottom);
  width: var(--app-home-decor-width);
  height: var(--app-home-decor-height);
  border-right: var(--app-border-width-focus) solid var(--app-border);
  border-bottom: var(--app-border-width-focus) solid var(--app-border);
  border-radius: var(--app-space-0) var(--app-space-0) var(--app-radius-2xl) var(--app-space-0);
  content: "";
  opacity: var(--app-decor-opacity);
}

.home-hero__top {
  display: grid;
  grid-template-columns: var(--app-home-logo-size) minmax(0, 1fr);
  gap: var(--app-space-9);
  align-items: center;
}

.home-hero__top,
.home-hero__body,
.home-hero__stamps {
  position: relative;
  z-index: 1;
}

.home-hero__icon {
  width: var(--app-home-logo-size);
  height: var(--app-home-logo-size);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-surface-strong);
  box-shadow: var(--app-shadow-logo);
}

.home-hero__copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.home-hero__kicker {
  color: var(--app-accent);
  font-size: var(--app-font-size-base);
}

.home-hero__title {
  margin-top: var(--app-space-5);
  color: var(--app-text);
  font: var(--app-font-hero-title);
}

.home-hero__body {
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.home-hero__stamps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-5);
}

.home-hero__stamp {
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-badge);
  background: var(--app-field);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  transform: rotate(-2deg);
}

.home-hero__stamp--memory {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  color: var(--app-primary);
  transform: rotate(2deg);
}

.home-dock {
  position: relative;
  margin-top: var(--app-section-gap);
}

.home-dock__head {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-7);
}

.home-dock__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.home-dock__body {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.home-note-stack {
  display: flex;
  flex-direction: column;
  gap: var(--app-list-gap);
}

.home-note {
  @include panel;
  @include pressable;
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--app-space-8);
  align-items: center;
  padding: var(--app-space-9);
  overflow: hidden;
  background: var(--app-field);
}

.home-note::before {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-24);
  height: var(--app-space-24);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-bottom-left-radius: var(--app-radius-lg);
  background: var(--app-surface);
  content: "";
  opacity: var(--app-muted-opacity);
}

.home-note::after {
  position: absolute;
  left: var(--app-card-padding);
  bottom: var(--app-space-5);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-3deg);
}

.home-note--song::after {
  background: var(--app-color-red-person);
}

.home-note--task::after {
  background: var(--app-color-blue-person);
}

.home-note--pressed {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale));
}

.home-note__mark {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--app-space-36);
  height: var(--app-space-32);
  border: var(--app-panel-border-width) solid currentColor;
  border-radius: var(--app-radius-lg) var(--app-radius-2xl) var(--app-radius-lg) var(--app-radius-sm);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-4xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-none);
  transform: rotate(-4deg);
}

.home-note__mark--song {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.home-note__mark--task {
  background: var(--app-accent-soft);
  color: var(--app-accent);
  transform: rotate(4deg);
}

.home-note__copy {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-2);
}

.home-note__title {
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.home-note__body {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

:deep(.home-note__button) {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  min-height: var(--app-control-scale-xs);
  border-radius: var(--app-radius-badge);
  box-shadow: var(--app-shadow-none);
  font: var(--app-font-caption);
}

.home-section {
  margin-top: var(--app-section-gap);
}

.home-section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--app-space-7);
}

.home-section__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.home-section__count,
.home-loading {
  color: var(--app-text-soft);
  font-size: var(--app-font-size-base);
}

.home-loading {
  padding: var(--app-space-16) var(--app-space-0);
}

.home-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-list-gap);
}

:deep(.home-empty__button) {
  margin-top: var(--app-card-padding);
}

:deep(.home-hero__button) {
  position: relative;
  z-index: 1;
}
</style>
