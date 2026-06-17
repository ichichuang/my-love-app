<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="写小线索" nav-eyebrow="小纸条" nav-show-back nav-variant="page">
    <view class="memo-edit">
      <view class="memo-note">
        <view class="memo-note__paper-corner" />
        <view class="memo-note__head">
          <view class="memo-note__intro">
            <text class="memo-note__kicker">写一张小线索</text>
            <text class="memo-note__question">想记住什么？</text>
            <text class="memo-note__body">比如：她喜欢的花。</text>
          </view>
          <text class="memo-note__stamp">小纸条</text>
        </view>

        <view class="memo-slip">
          <text class="memo-slip__label">这一格以后会放标题</text>
          <text class="memo-slip__value">先把“她喜欢什么、想避开什么”留成一张小占位。</text>
        </view>

        <view class="memo-note__section">
          <view class="memo-note__section-head">
            <text class="memo-note__section-title">多写一句？</text>
            <text class="memo-note__section-body">留到下一步再慢慢补。</text>
          </view>

          <view class="memo-draft-placeholder">
            <text class="memo-draft-placeholder__line">这里以后会放下更完整的小描述。</text>
            <text class="memo-draft-placeholder__line">这轮先把小纸条的位置留出来。</text>
          </view>
        </view>

        <view class="memo-note__section">
          <view class="memo-note__section-head">
            <text class="memo-note__section-title">贴个小标签</text>
            <text class="memo-note__section-body">喜欢 / 小档案 / 避雷 / 礼物 / 日子 / 随手</text>
          </view>

          <app-option-group :columns="3">
            <app-option-button
              v-for="option in tagOptions"
              :key="option"
              class="memo-tag-button"
              :active="option === '喜欢'"
              @click="showTagHint"
            >
              <text>{{ option }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <view class="memo-note__footer">
          <text class="memo-note__footer-title">轻轻收好</text>
          <text class="memo-note__footer-body">这一步只把纸条样子摆好，真正写内容留到下一步。</text>
        </view>

        <wd-button block size="large" @click="showNextStepToast">轻轻收好</wd-button>
      </view>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"

const theme = useNativeChromeSync()

const tagOptions = ["喜欢", "小档案", "避雷", "礼物", "日子", "随手"] as const

const showTagHint = () => {
  uni.showToast({
    title: "小标签下一步再慢慢补。",
    icon: "none"
  })
}

const showNextStepToast = () => {
  uni.showToast({
    title: "小线索纸条下一步就能写啦",
    icon: "none"
  })
}
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.memo-edit,
.memo-note,
.memo-note__intro,
.memo-note__section,
.memo-note__section-head,
.memo-slip,
.memo-draft-placeholder,
.memo-note__footer {
  display: flex;
  flex-direction: column;
}

.memo-edit {
  gap: var(--app-form-gap);
  padding-bottom: calc(var(--app-card-padding) + env(safe-area-inset-bottom));
}

.memo-note {
  @include panel;
  position: relative;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
  overflow: hidden;
}

.memo-note::before {
  position: absolute;
  top: var(--app-card-padding);
  left: var(--app-card-padding);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  background: var(--app-accent);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-3deg);
}

.memo-note__paper-corner {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-14);
  width: var(--app-space-24);
  height: var(--app-space-20);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  background: var(--app-surface-strong);
  opacity: var(--app-decor-opacity);
  transform: rotate(-4deg);
}

.memo-note__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.memo-note__intro {
  min-width: 0;
  gap: var(--app-space-3);
  padding-top: var(--app-space-8);
}

.memo-note__kicker {
  @include label;
  display: block;
  color: var(--app-accent);
}

.memo-note__question,
.memo-note__section-title,
.memo-note__footer-title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.memo-note__body,
.memo-note__section-body,
.memo-note__footer-body,
.memo-slip__label,
.memo-draft-placeholder__line {
  display: block;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.memo-note__stamp {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-badge);
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font: var(--app-font-caption);
  transform: rotate(3deg);
}

.memo-slip,
.memo-draft-placeholder,
.memo-note__footer {
  position: relative;
  z-index: 1;
}

.memo-slip,
.memo-draft-placeholder {
  gap: var(--app-space-4);
  padding: var(--app-space-6) var(--app-field-padding-x);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-input);
  background: var(--app-field);
}

.memo-slip__value {
  color: var(--app-text);
  font: var(--app-font-body);
}

.memo-note__section {
  position: relative;
  z-index: 1;
  gap: var(--app-space-7);
  padding-top: var(--app-card-gap);
  border-top: var(--app-panel-border-width) dashed var(--app-divider);
}

.memo-note__section-head,
.memo-note__footer {
  gap: var(--app-space-3);
}

.memo-tag-button {
  min-height: var(--app-control-height-sm);
}

.memo-note__footer {
  padding: var(--app-space-6) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-accent);
  border-radius: var(--app-radius-badge);
  background: var(--app-accent-soft);
}
</style>
