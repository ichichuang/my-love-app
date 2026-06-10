<template>
  <app-shell title="珊瑚行动" eyebrow="私密回忆簿">
    <template #actions>
      <wd-button size="small" plain @click="goSettings">设置</wd-button>
    </template>

    <view class="home-hero">
      <view class="home-hero__copy">
        <text class="home-hero__kicker">只属于我们两个人</text>
        <text class="home-hero__title">把今天值得记住的小事收好</text>
        <text class="home-hero__body">照片、悄悄话和纪念日都会安静地保存在我们的云端空间里。</text>
      </view>
      <wd-button block size="large" @click="goCreate">写下此刻</wd-button>
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
        title="还没有回忆"
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
