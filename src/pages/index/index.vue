<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell title="珊瑚行动" eyebrow="私密时间线">
    <template #actions>
      <wd-button size="small" plain @click="goSettings">设置</wd-button>
    </template>

    <view class="home-hero">
      <view class="home-hero__top">
        <image class="home-hero__icon" src="/static/logo-couple.png" mode="aspectFit" />
        <view class="home-hero__copy">
          <text class="home-hero__kicker">{{ todayGreeting }}</text>
          <text class="home-hero__title">把今天值得记住的小事收好</text>
        </view>
      </view>

      <text class="home-hero__body">照片、悄悄话和纪念日都会安静地保存在私密云端空间里。</text>

      <view class="home-hero__stats">
        <view class="home-hero__stat">
          <text class="home-hero__stat-value">{{ items.length }}</text>
          <text class="home-hero__stat-label">条记录</text>
        </view>
        <view class="home-hero__stage">
          <text>本人测试</text>
        </view>
      </view>

      <wd-button block size="large" custom-class="home-hero__button" @click="goCreate">写下此刻</wd-button>
    </view>

    <view class="home-section">
      <view class="home-section__head">
        <text class="home-section__title">回忆时间线</text>
        <text class="home-section__count">{{ items.length }} 条记录</text>
      </view>

      <view v-if="loading" class="home-loading">
        <text>正在读取私密回忆...</text>
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
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app"
import AppPetNavigator from "@/components/AppPetNavigator.vue"
import { useCrud } from "@/composables/useCrud"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { listEntries } from "@/services/repositories/entries"

const theme = useNativeChromeSync()
const { items, loading, reload } = useCrud(listEntries)
const hour = new Date().getHours()
const todayGreeting = hour < 12 ? "早安，今天也慢慢收藏" : hour < 18 ? "午后，把小事轻轻放好" : "晚上好，给今天留一盏小灯"

const loadEntries = async () => {
  try {
    await reload()
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

const goSettings = () => {
  uni.navigateTo({
    url: "/pages/settings/settings"
  })
}

const openEntry = (id: string) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${encodeURIComponent(id)}`
  })
}

onShow(loadEntries)
onPullDownRefresh(loadEntries)
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
  overflow: hidden;
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

.home-hero__stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-8);
  padding: var(--app-space-7) var(--app-space-8);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-field);
}

.home-hero__stat {
  display: flex;
  align-items: baseline;
  gap: var(--app-space-3);
}

.home-hero__stat-value {
  color: var(--app-primary);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-6xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-none);
}

.home-hero__stat-label,
.home-hero__stage {
  color: var(--app-text-soft);
  font-size: var(--app-font-size-base);
}

.home-hero__stage {
  padding: var(--app-space-3) var(--app-space-6);
  border-radius: var(--app-radius-pill);
  background: var(--app-surface-strong);
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
