<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell title="写下此刻" eyebrow="新的回忆">
    <view class="create-intro">
      <text class="create-intro__title">把这一刻放进私密盒子</text>
      <text class="create-intro__body">文字和照片会写入云开发，只在本人测试阶段可见。</text>
    </view>

    <view class="entry-form">
      <view class="form-section">
        <view class="form-section__head">
          <text class="form-section__title">基本内容</text>
          <text class="form-section__note">先写最想留下的部分</text>
        </view>

        <view class="field">
          <text class="field__label">标题</text>
          <input
            class="field__input"
            :value="title"
            placeholder="比如：一起散步的夜晚"
            placeholder-class="field__placeholder"
            maxlength="48"
            @input="onTitleInput"
          />
        </view>

        <view class="field">
          <text class="field__label">内容</text>
          <textarea
            class="field__textarea"
            :value="content"
            placeholder="写下想一起记住的话"
            placeholder-class="field__placeholder"
            maxlength="1200"
            @input="onContentInput"
          />
        </view>
      </view>

      <view class="form-section">
        <view class="form-section__head">
          <text class="form-section__title">时间和心情</text>
          <text class="form-section__note">给回忆一个坐标</text>
        </view>

        <view class="field-grid">
          <view class="field">
            <text class="field__label">日期</text>
            <picker mode="date" :value="occurredAt" @change="onDateChange">
              <view class="field__picker">{{ occurredAt }}</view>
            </picker>
          </view>

          <view class="field">
            <text class="field__label">心情</text>
            <input
              class="field__input"
              :value="mood"
              placeholder="温柔"
              placeholder-class="field__placeholder"
              maxlength="16"
              @input="onMoodInput"
            />
          </view>
        </view>
      </view>

      <view class="form-section upload-panel">
        <view class="upload-panel__head">
          <view>
            <text class="upload-panel__title">私密照片</text>
            <text class="upload-panel__note">最多上传 9 张，适合放小票、风景和合照。</text>
          </view>
          <text class="upload-panel__meta">{{ files.length }}/9</text>
        </view>
        <image-grid :files="files" editable @remove="removeFileAt" />
        <wd-button
          block
          plain
          :loading="uploading"
          custom-class="upload-panel__button"
          @click="chooseAndUploadImages"
        >
          添加照片
        </wd-button>
      </view>

      <view class="create-save">
        <wd-button block size="large" :loading="saving" @click="saveEntry">保存回忆</wd-button>
      </view>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { shallowRef } from "vue"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { useFileUpload } from "@/composables/useFileUpload"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { createEntry } from "@/services/repositories/entries"

const theme = useNativeChromeSync()
const today = new Date()
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

const title = shallowRef("")
const content = shallowRef("")
const mood = shallowRef("温柔")
const occurredAt = shallowRef(todayString)
const saving = shallowRef(false)

const { files, uploading, chooseAndUploadImages, removeFileAt } = useFileUpload()

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const eventValue = (event: Event): string => {
  const raw = event as unknown
  if (!isRecord(raw)) {
    return ""
  }

  const detail = raw.detail
  if (isRecord(detail) && typeof detail.value === "string") {
    return detail.value
  }

  return ""
}

const onTitleInput = (event: Event) => {
  title.value = eventValue(event)
}

const onMoodInput = (event: Event) => {
  mood.value = eventValue(event)
}

const onContentInput = (event: Event) => {
  content.value = eventValue(event)
}

const onDateChange = (event: Event) => {
  occurredAt.value = eventValue(event)
}

const saveEntry = async () => {
  if (!title.value.trim()) {
    uni.showToast({
      title: "请先写一个标题。",
      icon: "none"
    })
    return
  }

  if (!content.value.trim() && files.value.length === 0) {
    uni.showToast({
      title: "请写一点内容，或至少添加一张照片。",
      icon: "none"
    })
    return
  }

  saving.value = true
  try {
    const entry = await createEntry({
      title: title.value,
      content: content.value,
      mood: mood.value || "温柔",
      occurredAt: occurredAt.value,
      files: files.value
    })

    uni.redirectTo({
      url: `/pages/detail/detail?id=${encodeURIComponent(entry.id)}`
    })
  } catch (error) {
    uni.showToast({
      title: getFriendlyErrorMessage(error),
      icon: "none"
    })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.entry-form {
  display: flex;
  flex-direction: column;
  gap: var(--app-form-gap);
  padding-bottom: var(--app-safe-action-bottom-gap);
}

.create-intro,
.form-section {
  @include panel;
  padding: var(--app-card-padding);
}

.create-intro {
  margin-bottom: var(--app-form-gap);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.create-intro__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.create-intro__body {
  display: block;
  margin-top: var(--app-space-4);
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--app-card-gap);
}

.form-section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.form-section__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.form-section__note,
.upload-panel__note {
  color: var(--app-text-soft);
  font-size: var(--app-font-size-md);
  line-height: var(--app-line-height-normal);
}

.field-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--app-space-8);
}

.field__label,
.upload-panel__meta {
  @include label;
  display: block;
  margin-bottom: var(--app-space-5);
}

.field__input,
.field__picker {
  @include field;
  display: flex;
  align-items: center;
  padding: var(--app-space-0) var(--app-field-padding-x);
  line-height: var(--app-input-height);
}

.field__textarea {
  @include field;
  min-height: var(--app-textarea-min-height);
  padding: var(--app-field-padding-x);
  line-height: var(--app-line-height-relaxed);
}

.field__placeholder {
  color: var(--app-text-soft);
}

.upload-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
  margin-bottom: var(--app-space-7);
}

.upload-panel__title {
  display: block;
  color: var(--app-text);
  font-size: var(--app-font-size-xl);
  font-weight: var(--app-font-weight-semibold);
}

.upload-panel__note {
  display: block;
  margin-top: var(--app-space-2);
}

:deep(.upload-panel__button) {
  margin-top: var(--app-space-8);
}

.create-save {
  position: fixed;
  right: $app-page-x;
  bottom: 0;
  left: $app-page-x;
  z-index: 20;
  padding: var(--app-space-7) var(--app-space-0) calc(var(--app-space-8) + env(safe-area-inset-bottom));
  background:
    linear-gradient(180deg, transparent 0%, var(--app-bg) 38%, var(--app-bg) 100%);
}
</style>
