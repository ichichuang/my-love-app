<template>
  <app-shell title="写下此刻" eyebrow="新的回忆">
    <view class="entry-form">
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

      <view class="upload-panel">
        <view class="upload-panel__head">
          <text class="upload-panel__title">私密照片</text>
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

      <wd-button block size="large" :loading="saving" @click="saveEntry">保存回忆</wd-button>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { shallowRef } from "vue"
import { useFileUpload } from "@/composables/useFileUpload"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { createEntry } from "@/services/repositories/entries"

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
  gap: 24rpx;
}

.field,
.upload-panel {
  @include panel;
  padding: 26rpx;
}

.field-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20rpx;
}

.field__label,
.upload-panel__meta {
  @include label;
  display: block;
  margin-bottom: 14rpx;
}

.field__input,
.field__picker {
  @include field;
  display: flex;
  align-items: center;
  padding: 0 22rpx;
  line-height: 88rpx;
}

.field__textarea {
  @include field;
  min-height: 260rpx;
  padding: 22rpx;
  line-height: 1.55;
}

.field__placeholder {
  color: var(--app-text-soft);
}

.upload-panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.upload-panel__title {
  color: var(--app-text);
  font-size: 30rpx;
  font-weight: 600;
}

:deep(.upload-panel__button) {
  margin-top: 20rpx;
}
</style>
