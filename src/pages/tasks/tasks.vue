<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell title="必做事项" eyebrow="我们的清单">
    <view class="tasks-intro">
      <text class="tasks-intro__title">以后想一起做的事，慢慢勾上</text>
      <text class="tasks-intro__body">不是压力清单，是给未来留的位置。</text>
    </view>

    <empty-state
      title="先写下一件想一起做的事"
      body="可以是一次散步、一顿饭，也可以是一个以后再慢慢实现的小愿望。"
    >
      <wd-button custom-class="tasks-empty__button" @click="goTaskEdit">加一件事</wd-button>
    </empty-state>

    <app-pet-navigator />
  </app-shell>
</template>

<script setup lang="ts">
import AppPetNavigator from "@/components/AppPetNavigator.vue"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"

const theme = useNativeChromeSync()

const goTaskEdit = () => {
  uni.navigateTo({
    url: "/pages/task-edit/task-edit"
  })
}
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.tasks-intro {
  @include panel;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  margin-bottom: var(--app-form-gap);
  padding: var(--app-card-padding);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.tasks-intro__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.tasks-intro__body {
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

:deep(.tasks-empty__button) {
  margin-top: var(--app-card-padding);
}
</style>
