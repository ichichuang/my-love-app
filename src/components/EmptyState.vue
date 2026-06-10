<template>
  <view class="empty-state">
    <view class="empty-state__mark">
      <view class="empty-state__line empty-state__line--top" />
      <view class="empty-state__line empty-state__line--bottom" />
    </view>
    <text class="empty-state__title">{{ title }}</text>
    <text class="empty-state__body">{{ body }}</text>
    <slot />
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  body: string
}>()
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.empty-state {
  @include panel;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 54rpx 36rpx;
  text-align: center;
}

.empty-state__mark {
  position: relative;
  width: 128rpx;
  height: 128rpx;
  margin-bottom: 26rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 50%;
  background: var(--app-surface-strong);
}

.empty-state__line {
  position: absolute;
  left: 32rpx;
  width: 64rpx;
  height: 2rpx;
  background: var(--app-primary);
}

.empty-state__line--top {
  top: 48rpx;
  transform: rotate(-22deg);
}

.empty-state__line--bottom {
  top: 74rpx;
  transform: rotate(22deg);
}

.empty-state__title {
  color: var(--app-text);
  font-family: "Songti SC", "STSong", serif;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.25;
}

.empty-state__body {
  margin-top: 14rpx;
  color: var(--app-text-soft);
  font-size: 25rpx;
  line-height: 1.55;
}
</style>
