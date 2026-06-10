<template>
  <app-shell title="珊瑚行动" eyebrow="Private memory journal">
    <template #actions>
      <wd-button size="small" plain @click="goSettings">Settings</wd-button>
    </template>

    <view class="home-hero">
      <view class="home-hero__copy">
        <text class="home-hero__kicker">For two</text>
        <text class="home-hero__title">Save the small proof that today mattered.</text>
        <text class="home-hero__body">Photos, quiet notes, and dates stay inside your CloudBase environment.</text>
      </view>
      <wd-button block size="large" @click="goCreate">Write a memory</wd-button>
    </view>

    <view class="home-section">
      <view class="home-section__head">
        <text class="home-section__title">Timeline</text>
        <text class="home-section__count">{{ items.length }} entries</text>
      </view>

      <view v-if="loading" class="home-loading">
        <text>Loading private memories...</text>
      </view>

      <empty-state
        v-else-if="items.length === 0"
        title="No memories yet"
        body="Start with one sentence, one photo, or one date you do not want to lose."
      >
        <wd-button custom-class="home-empty__button" @click="goCreate">Create first entry</wd-button>
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
  </app-shell>
</template>

<script setup lang="ts">
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app"
import { useCrud } from "@/composables/useCrud"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { listEntries } from "@/services/repositories/entries"

const { items, loading, reload } = useCrud(listEntries)

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
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  padding: 34rpx;
}

.home-hero__copy {
  display: flex;
  flex-direction: column;
}

.home-hero__kicker {
  color: var(--app-accent);
  font-size: 24rpx;
}

.home-hero__title {
  margin-top: 14rpx;
  color: var(--app-text);
  font-family: "Songti SC", "STSong", serif;
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.15;
}

.home-hero__body {
  margin-top: 18rpx;
  color: var(--app-text-soft);
  font-size: 26rpx;
  line-height: 1.55;
}

.home-section {
  margin-top: 34rpx;
}

.home-section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.home-section__title {
  color: var(--app-text);
  font-size: 32rpx;
  font-weight: 600;
}

.home-section__count,
.home-loading {
  color: var(--app-text-soft);
  font-size: 24rpx;
}

.home-loading {
  padding: 36rpx 0;
}

.home-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

:deep(.home-empty__button) {
  margin-top: 28rpx;
}
</style>
