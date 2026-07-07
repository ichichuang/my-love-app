<template>
  <view class="empty-state">
    <image
      v-if="imageSrc"
      class="empty-state__image"
      :src="imageSrc"
      mode="aspectFit"
      alt=""
    />
    <view v-else class="empty-state__mark">
      <view class="empty-state__line empty-state__line--top" />
      <view class="empty-state__line empty-state__line--bottom" />
    </view>
    <text class="empty-state__title">{{ title }}</text>
    <text class="empty-state__body">{{ body }}</text>
    <view class="app-handdrawn-divider" aria-hidden="true" />
    <slot />
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  body: string
  imageSrc?: string
}>()
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.empty-state {
  @include panel;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--app-empty-padding-y) var(--app-empty-padding-x);
  text-align: center;
  overflow: hidden;
  // 像一张手写小纸条被轻轻放下
  animation: app-soft-in var(--app-duration-slower) var(--app-ease-out) both;
}

.empty-state::before {
  position: absolute;
  top: var(--app-card-padding);
  right: var(--app-section-gap);
  width: var(--app-empty-decor-size);
  height: var(--app-empty-decor-size);
  border-top: var(--app-border-width-focus) solid var(--app-border);
  border-right: var(--app-border-width-focus) solid var(--app-border);
  content: "";
  opacity: var(--app-decor-opacity);
}

.empty-state__image {
  width: var(--app-empty-image-size);
  height: var(--app-empty-image-size);
  margin-bottom: var(--app-card-gap);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-image);
  background: var(--app-surface-strong);
  box-shadow: var(--app-shadow-logo);
  animation: app-pop-in var(--app-duration-slow) var(--app-ease-bounce) both;
}

.empty-state__mark {
  position: relative;
  width: var(--app-empty-mark-size);
  height: var(--app-empty-mark-size);
  margin-bottom: var(--app-card-gap);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-round);
  background: var(--app-surface-strong);
  // 手绘记号轻轻跳着落定
  animation: app-doodle-in var(--app-duration-slower) var(--app-ease-bounce) both;
}

.empty-state__line {
  position: absolute;
  left: var(--app-space-14);
  width: var(--app-space-24);
  height: var(--app-border-width-focus);
  background: var(--app-primary);
}

.empty-state__line--top {
  top: var(--app-space-20);
  transform: rotate(-22deg);
}

.empty-state__line--bottom {
  top: var(--app-space-28);
  transform: rotate(22deg);
}

.empty-state__title {
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.empty-state__body {
  margin-top: var(--app-space-5);
  color: var(--app-text-soft);
  font: var(--app-font-body);
}
</style>
