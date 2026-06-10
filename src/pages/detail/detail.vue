<template>
  <app-shell :title="editing ? '编辑回忆' : '记忆详情'" eyebrow="私密档案">
    <template #actions>
      <wd-button v-if="entry && !editing" size="small" plain @click="startEditing">编辑</wd-button>
    </template>

    <view v-if="loading" class="status-panel">
      <text>正在读取回忆...</text>
    </view>

    <empty-state
      v-else-if="!entry"
      title="回忆暂时打不开"
      body="请检查云开发环境和访问权限。"
    />

    <view v-else-if="!editing" class="detail">
      <view class="detail__hero">
        <text class="detail__mood">{{ entry.mood }}</text>
        <text class="detail__title">{{ entry.title }}</text>
        <text class="detail__date">{{ entry.occurredAt }}</text>
      </view>

      <image-grid :files="entry.files" />

      <view class="detail__content">
        <text>{{ entry.content || "这段回忆还没有写下文字。" }}</text>
      </view>

      <view class="detail__actions">
        <wd-button plain block @click="startEditing">编辑回忆</wd-button>
        <wd-button block type="error" :loading="deleting" @click="confirmDelete">删除回忆</wd-button>
      </view>
    </view>

    <view v-else class="entry-form">
      <view class="field">
        <text class="field__label">标题</text>
        <input
          class="field__input"
          :value="title"
          maxlength="48"
          placeholder-class="field__placeholder"
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
            maxlength="16"
            placeholder-class="field__placeholder"
            @input="onMoodInput"
          />
        </view>
      </view>

      <view class="field">
        <text class="field__label">内容</text>
        <textarea
          class="field__textarea"
          :value="content"
          maxlength="1200"
          placeholder-class="field__placeholder"
          @input="onContentInput"
        />
      </view>

      <view class="upload-panel">
        <view class="upload-panel__head">
          <text class="upload-panel__title">私密照片</text>
          <text class="upload-panel__meta">{{ files.length }}/9</text>
        </view>
        <image-grid :files="files" editable @remove="removeEditFile" />
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

      <view class="detail__actions">
        <wd-button plain block @click="cancelEditing">取消</wd-button>
        <wd-button block size="large" :loading="saving" @click="saveChanges">保存修改</wd-button>
      </view>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { shallowRef } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import { useFileUpload } from "@/composables/useFileUpload"
import { getFriendlyErrorMessage, type CloudFile } from "@/services/cloudbase"
import {
  deleteEntry,
  deleteEntryFiles,
  getEntry,
  updateEntry,
  type EntryRecord
} from "@/services/repositories/entries"

const entryId = shallowRef("")
const entry = shallowRef<EntryRecord | null>(null)
const loading = shallowRef(false)
const editing = shallowRef(false)
const saving = shallowRef(false)
const deleting = shallowRef(false)
const removedFiles = shallowRef<CloudFile[]>([])

const title = shallowRef("")
const content = shallowRef("")
const mood = shallowRef("")
const occurredAt = shallowRef("")

const { files, uploading, setFiles, chooseAndUploadImages, removeFileAt } = useFileUpload()

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

const hydrateForm = (nextEntry: EntryRecord) => {
  title.value = nextEntry.title
  content.value = nextEntry.content
  mood.value = nextEntry.mood
  occurredAt.value = nextEntry.occurredAt
  setFiles(nextEntry.files)
  removedFiles.value = []
}

const loadEntry = async () => {
  if (!entryId.value) {
    return
  }

  loading.value = true
  try {
    const nextEntry = await getEntry(entryId.value)
    entry.value = nextEntry
    hydrateForm(nextEntry)
  } catch (error) {
    uni.showToast({
      title: getFriendlyErrorMessage(error),
      icon: "none"
    })
  } finally {
    loading.value = false
  }
}

const startEditing = () => {
  if (!entry.value) {
    return
  }
  hydrateForm(entry.value)
  editing.value = true
}

const cancelEditing = () => {
  if (entry.value) {
    hydrateForm(entry.value)
  }
  editing.value = false
}

const removeEditFile = async (index: number) => {
  const file = files.value[index]
  if (file) {
    removedFiles.value = [...removedFiles.value, file]
  }
  await removeFileAt(index, false)
}

const saveChanges = async () => {
  if (!entry.value) {
    return
  }

  if (!title.value.trim()) {
    uni.showToast({
      title: "请先写一个标题。",
      icon: "none"
    })
    return
  }

  saving.value = true
  try {
    const nextEntry = await updateEntry(entry.value.id, {
      title: title.value,
      content: content.value,
      mood: mood.value || "温柔",
      occurredAt: occurredAt.value,
      files: files.value
    })

    if (removedFiles.value.length > 0) {
      await deleteEntryFiles(removedFiles.value)
    }

    entry.value = nextEntry
    hydrateForm(nextEntry)
    editing.value = false
  } catch (error) {
    uni.showToast({
      title: getFriendlyErrorMessage(error),
      icon: "none"
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = () => {
  if (!entry.value) {
    return
  }

  uni.showModal({
    title: "删除回忆",
    content: "这会同时删除这条记录和它的云端文件。",
    confirmText: "删除",
    confirmColor: "#9f2f3e",
    success: (result) => {
      if (result.confirm) {
        void deleteCurrentEntry()
      }
    }
  })
}

const deleteCurrentEntry = async () => {
  if (!entry.value) {
    return
  }

  deleting.value = true
  try {
    await deleteEntry(entry.value.id)
    uni.redirectTo({
      url: "/pages/index/index"
    })
  } catch (error) {
    uni.showToast({
      title: getFriendlyErrorMessage(error),
      icon: "none"
    })
  } finally {
    deleting.value = false
  }
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

onLoad((query) => {
  const id = query && typeof query.id === "string" ? query.id : ""
  entryId.value = decodeURIComponent(id)
  void loadEntry()
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.status-panel,
.detail__hero,
.detail__content,
.field,
.upload-panel {
  @include panel;
  padding: 28rpx;
}

.status-panel {
  color: var(--app-text-soft);
  font-size: 26rpx;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.detail__hero {
  display: flex;
  flex-direction: column;
}

.detail__mood {
  color: var(--app-accent);
  font-size: 24rpx;
}

.detail__title {
  margin-top: 12rpx;
  color: var(--app-text);
  font-family: "Songti SC", "STSong", serif;
  font-size: 46rpx;
  font-weight: 600;
  line-height: 1.15;
}

.detail__date {
  margin-top: 18rpx;
  color: var(--app-text-soft);
  font-size: 24rpx;
}

.detail__content {
  color: var(--app-text);
  font-size: 30rpx;
  line-height: 1.7;
}

.detail__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18rpx;
}

.entry-form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
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
