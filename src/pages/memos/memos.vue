<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="她的小档案" nav-eyebrow="小线索本" nav-show-back nav-variant="page">
    <view class="memos-page">
      <view class="memos-intro">
        <view class="memos-intro__paper-corner" />
        <view class="memos-intro__head">
          <view class="memos-intro__copy">
            <text class="memos-intro__kicker">她的小档案</text>
            <text class="memos-intro__title">喜欢什么、怕踩雷什么，都悄悄收在这里。</text>
            <text class="memos-intro__body">先留出一页小线索本，之后再把每一条慢慢夹进来。</text>
          </view>
          <text class="memos-intro__stamp">小线索本</text>
        </view>
      </view>

      <view class="memos-categories">
        <view class="memos-categories__head">
          <text class="memos-categories__title">先摆好几枚小标签</text>
          <text class="memos-categories__body">这一轮先放占位，真正筛选下一步再慢慢补。</text>
        </view>

        <app-option-group :columns="3">
          <app-option-button
            v-for="option in categoryOptions"
            :key="option"
            class="memos-category-button"
            :active="option === '全部'"
            @click="showCategoryHint"
          >
            <text>{{ option }}</text>
          </app-option-button>
        </app-option-group>
      </view>

      <empty-state
        title="先记下第一条小线索"
        body="比如她喜欢什么花、什么饮料，或者是什么星座。"
      >
        <wd-button custom-class="memos-empty__button" @click="goMemoEdit">记一条小线索</wd-button>
      </empty-state>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"

const theme = useNativeChromeSync()

const categoryOptions = ["全部", "喜欢", "小档案", "避雷", "礼物", "日子", "随手"] as const

const goMemoEdit = () => {
  uni.navigateTo({
    url: "/pages/memo-edit/memo-edit"
  })
}

const showCategoryHint = () => {
  uni.showToast({
    title: "小标签下一步再慢慢补。",
    icon: "none"
  })
}
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.memos-page,
.memos-intro,
.memos-intro__copy,
.memos-categories,
.memos-categories__head {
  display: flex;
  flex-direction: column;
}

.memos-page {
  gap: var(--app-form-gap);
  padding-bottom: calc(var(--app-card-padding) + env(safe-area-inset-bottom));
}

.memos-intro,
.memos-categories {
  @include panel;
  position: relative;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
  overflow: hidden;
}

.memos-intro {
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.memos-intro::before {
  position: absolute;
  top: var(--app-card-padding);
  left: var(--app-card-padding);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  background: var(--app-color-blue-person);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-3deg);
}

.memos-intro__paper-corner {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-28);
  height: var(--app-space-28);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-bottom-left-radius: var(--app-radius-lg);
  background: var(--app-field);
  opacity: var(--app-muted-opacity);
}

.memos-intro__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.memos-intro__copy {
  min-width: 0;
  gap: var(--app-space-3);
  padding-top: var(--app-space-8);
}

.memos-intro__kicker {
  @include label;
  display: block;
  color: var(--app-accent);
}

.memos-intro__title,
.memos-categories__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.memos-intro__body,
.memos-categories__body {
  display: block;
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.memos-intro__stamp {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-badge);
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font: var(--app-font-caption);
  transform: rotate(4deg);
}

.memos-categories {
  gap: var(--app-space-7);
}

.memos-category-button {
  min-height: var(--app-control-height-sm);
}

:deep(.memos-empty__button) {
  margin-top: var(--app-card-padding);
}
</style>
