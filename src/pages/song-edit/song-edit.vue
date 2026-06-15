<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell :title="pageTitle" :eyebrow="pageEyebrow">
    <template #actions>
      <wd-button size="small" plain :disabled="formDisabled" @click="backToSongs">取消</wd-button>
    </template>

    <view v-if="loading" class="song-edit-status">
      <text>正在翻这首歌…</text>
    </view>

    <empty-state
      v-else-if="hasLoadError"
      title="这首歌暂时没翻到"
      body="可能是网络慢了一点，稍后再试一次。"
    >
      <view class="song-edit-error__actions">
        <wd-button block :loading="loading" @click="loadSong">再试一次</wd-button>
        <wd-button block plain @click="backToSongs">返回小歌单</wd-button>
      </view>
    </empty-state>

    <view v-else class="song-edit">
      <view class="song-note">
        <view class="song-note__head">
          <view>
            <text class="song-note__title">点歌便签</text>
            <text class="song-note__body">歌名先收好，什么时候唱都不着急。</text>
          </view>
          <text class="song-note__stamp">{{ songStatusLabels[songStatus] }}</text>
        </view>

        <view class="song-note__fields">
          <view class="song-field">
            <text class="song-field__label">歌名</text>
            <wd-input
              v-model="title"
              clearable
              no-border
              :disabled="formDisabled"
              placeholder="歌名先写这里"
              :placeholder-style="placeholderStyle"
              :maxlength="48"
              custom-class="song-field__input-root"
              custom-input-class="song-field__input-inner"
            />
          </view>

          <view class="song-field">
            <text class="song-field__label">歌手 / 版本</text>
            <wd-input
              v-model="artist"
              clearable
              no-border
              :disabled="formDisabled"
              placeholder="是哪个版本呀？"
              :placeholder-style="placeholderStyle"
              :maxlength="48"
              custom-class="song-field__input-root"
              custom-input-class="song-field__input-inner"
            />
          </view>

          <view class="song-field">
            <text class="song-field__label">想听原因</text>
            <wd-textarea
              v-model="content"
              clearable
              no-border
              :disabled="formDisabled"
              placeholder="为什么想听这首？"
              :placeholder-style="placeholderStyle"
              :maxlength="240"
              custom-class="song-field__textarea-root"
              custom-textarea-container-class="song-field__textarea-box"
              custom-textarea-class="song-field__textarea-inner"
            />
          </view>
        </view>

        <view class="song-note__section">
          <view class="song-note__section-head">
            <text class="song-note__section-title">心愿程度</text>
            <text class="song-note__section-note">小印章一样选一下</text>
          </view>
          <app-option-group :columns="3">
            <app-option-button
              v-for="option in priorityOptions"
              :key="option.value"
              :active="songPriority === option.value"
              :disabled="formDisabled"
              @click="setSongPriority(option.value)"
            >
              <text class="song-choice__label">{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <view class="song-note__section">
          <view class="song-note__section-head">
            <text class="song-note__section-title">当前状态</text>
            <text class="song-note__section-note">只在小歌单里轻轻标记</text>
          </view>
          <app-option-group :columns="3">
            <app-option-button
              v-for="option in statusOptions"
              :key="option.value"
              :active="songStatus === option.value"
              :disabled="formDisabled"
              @click="setSongStatus(option.value)"
            >
              <text class="song-choice__label">{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <view v-if="saved" class="song-saved">
          <text>已经轻轻收好</text>
        </view>

        <view class="song-edit-actions">
          <wd-button block size="large" :loading="saving" :disabled="formDisabled" @click="saveSong">
            {{ saveButtonText }}
          </wd-button>
          <wd-button
            v-if="canDeleteSong"
            block
            type="text"
            :loading="deleting"
            :disabled="saving || saved"
            custom-class="song-delete-button"
            @click="confirmDeleteSong"
          >
            删除这首歌
          </wd-button>
        </view>
      </view>
    </view>

    <wd-message-box />
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import { useMessage } from "wot-design-uni/components/wd-message-box"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import {
  createSong,
  deleteSong,
  getSong,
  songPriorityLabels,
  songStatusLabels,
  updateSong,
  type SongDraft,
  type SongPriority,
  type SongStatus
} from "@/services/repositories/songs"

const saveFeedbackDelayMs = 520
const placeholderStyle = "color: var(--app-text-muted)"
const theme = useNativeChromeSync()
const message = useMessage()

const songId = shallowRef("")
const loading = shallowRef(false)
const hasLoadError = shallowRef(false)
const saving = shallowRef(false)
const saved = shallowRef(false)
const deleting = shallowRef(false)
const songLoaded = shallowRef(false)

const title = shallowRef("")
const artist = shallowRef("")
const content = shallowRef("")
const songPriority = shallowRef<SongPriority>("normal")
const songStatus = shallowRef<SongStatus>("wanted")

const priorityOptions: Array<{
  label: string
  value: SongPriority
}> = [
  {
    label: songPriorityLabels.high,
    value: "high"
  },
  {
    label: songPriorityLabels.normal,
    value: "normal"
  },
  {
    label: songPriorityLabels.anytime,
    value: "anytime"
  }
]

const statusOptions: Array<{
  label: string
  value: SongStatus
}> = [
  {
    label: songStatusLabels.wanted,
    value: "wanted"
  },
  {
    label: songStatusLabels.sung,
    value: "sung"
  },
  {
    label: songStatusLabels.paused,
    value: "paused"
  }
]

const isEditMode = computed(() => songId.value.length > 0)
const canDeleteSong = computed(() => isEditMode.value && songLoaded.value && !hasLoadError.value)
const formDisabled = computed(() => saving.value || saved.value || deleting.value)
const pageTitle = computed(() => (isEditMode.value ? "编辑曲目" : "加一首歌"))
const pageEyebrow = computed(() => (isEditMode.value ? "小小歌单" : "新的点歌"))
const saveButtonText = computed(() => {
  if (saving.value) {
    return "正在轻轻收好"
  }

  if (saved.value) {
    return "已经轻轻收好"
  }

  return isEditMode.value ? "保存修改" : "保存这首歌"
})

const decodeQueryId = (value: unknown): string => {
  if (typeof value !== "string") {
    return ""
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  try {
    return decodeURIComponent(trimmed)
  } catch {
    return trimmed
  }
}

const resetForm = () => {
  title.value = ""
  artist.value = ""
  content.value = ""
  songPriority.value = "normal"
  songStatus.value = "wanted"
  saved.value = false
  songLoaded.value = false
}

const setSongPriority = (value: SongPriority) => {
  songPriority.value = value
  saved.value = false
}

const setSongStatus = (value: SongStatus) => {
  songStatus.value = value
  saved.value = false
}

const loadSong = async () => {
  if (!songId.value) {
    resetForm()
    hasLoadError.value = false
    return
  }

  loading.value = true
  hasLoadError.value = false
  songLoaded.value = false

  try {
    const song = await getSong(songId.value)
    title.value = song.title
    artist.value = song.artist
    content.value = song.content
    songPriority.value = song.songPriority
    songStatus.value = song.songStatus
    saved.value = false
    songLoaded.value = true
  } catch {
    resetForm()
    hasLoadError.value = true
  } finally {
    loading.value = false
  }
}

const backToSongs = () => {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }

  uni.redirectTo({
    url: "/pages/songs/songs"
  })
}

const buildDraft = (): SongDraft => ({
  title: title.value,
  artist: artist.value,
  content: content.value,
  songPriority: songPriority.value,
  songStatus: songStatus.value
})

const waitForSaveFeedback = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, saveFeedbackDelayMs)
  })

const saveSong = async () => {
  if (saving.value) {
    return
  }

  if (!title.value.trim()) {
    uni.showToast({
      title: "先写下歌名",
      icon: "none"
    })
    return
  }

  saving.value = true
  saved.value = false

  try {
    if (isEditMode.value) {
      await updateSong(songId.value, buildDraft())
    } else {
      await createSong(buildDraft())
    }

    saving.value = false
    saved.value = true
    uni.showToast({
      title: "已经轻轻收好",
      icon: "none"
    })
    await waitForSaveFeedback()
    backToSongs()
  } catch (error) {
    uni.showToast({
      title: getFriendlyErrorMessage(error),
      icon: "none"
    })
  } finally {
    if (!saved.value) {
      saving.value = false
    }
  }
}

const deleteCurrentSong = async () => {
  if (!canDeleteSong.value || deleting.value) {
    return
  }

  deleting.value = true

  try {
    await deleteSong(songId.value)
    uni.showToast({
      title: "已经从小歌单移走",
      icon: "none"
    })
    backToSongs()
  } catch {
    uni.showToast({
      title: "这首歌暂时没删掉，请稍后再试。",
      icon: "none"
    })
  } finally {
    deleting.value = false
  }
}

const confirmDeleteSong = async () => {
  if (!canDeleteSong.value || deleting.value) {
    return
  }

  try {
    await message.confirm({
      title: "删除这首歌",
      msg: "这会删除这条点歌记录。",
      cancelButtonText: "取消",
      confirmButtonText: "删除",
      confirmButtonProps: {
        plain: true,
        type: "error"
      },
      cancelButtonProps: {
        plain: true,
        type: "info"
      }
    })
    await deleteCurrentSong()
  } catch {
    return
  }
}

onLoad((query) => {
  songId.value = decodeQueryId(query?.id)
  void loadSong()
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.song-edit,
.song-note,
.song-note__fields,
.song-note__section,
.song-edit-actions,
.song-edit-error__actions {
  display: flex;
  flex-direction: column;
}

.song-edit {
  gap: var(--app-form-gap);
  padding-bottom: calc(var(--app-card-padding) + env(safe-area-inset-bottom));
}

.song-edit-status,
.song-note {
  @include panel;
  padding: var(--app-card-padding);
}

.song-note__title,
.song-note__section-title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.song-note__body,
.song-note__section-note {
  display: block;
  margin-top: var(--app-space-3);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.song-edit-status {
  color: var(--app-text-soft);
  font: var(--app-font-body);
  text-align: center;
}

.song-note {
  position: relative;
  gap: var(--app-card-gap);
  overflow: hidden;
}

.song-note__head,
.song-note__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.song-note__stamp {
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-badge);
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font: var(--app-font-caption);
}

.song-note__fields,
.song-note__section {
  gap: var(--app-space-7);
}

.song-note__section {
  padding-top: var(--app-card-gap);
  border-top: var(--app-panel-border-width) solid var(--app-divider);
}

.song-field {
  position: relative;
}

.song-field__label {
  @include label;
  display: block;
  margin-bottom: var(--app-space-5);
}

:deep(.song-field__input-root),
:deep(.song-field__textarea-root) {
  @include field;
  box-sizing: border-box;
  overflow: hidden;
}

:deep(.song-field__input-root) {
  display: flex;
  align-items: center;
  padding: var(--app-space-0) var(--app-field-padding-x);
}

:deep(.song-field__input-root .wd-input__body),
:deep(.song-field__input-root .wd-input__value),
:deep(.song-field__textarea-root .wd-textarea__value) {
  width: 100%;
}

:deep(.song-field__input-inner) {
  min-height: var(--app-input-height);
  color: var(--app-text);
  font-size: var(--app-font-size-xl);
  line-height: var(--app-input-height);
}

:deep(.song-field__textarea-root) {
  min-height: var(--app-textarea-min-height);
  padding: var(--app-field-padding-x);
}

:deep(.song-field__textarea-box),
:deep(.song-field__textarea-inner) {
  min-height: var(--app-textarea-min-height);
}

:deep(.song-field__textarea-inner) {
  color: var(--app-text);
  font-size: var(--app-font-size-xl);
  line-height: var(--app-line-height-relaxed);
}

:deep(.song-field__input-root.is-disabled),
:deep(.song-field__textarea-root.is-disabled) {
  opacity: var(--app-disabled-opacity);
}

.song-choice__label {
  display: block;
  width: 100%;
}

.song-saved {
  padding: var(--app-space-6) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-success);
  border-radius: var(--app-radius-badge);
  border-color: var(--app-success);
  background: var(--app-success-soft);
  color: var(--app-success);
  font: var(--app-font-body);
  text-align: center;
  box-shadow: var(--app-shadow-none);
}

.song-edit-actions {
  gap: var(--app-space-6);
  padding-top: var(--app-space-3);
  padding-bottom: env(safe-area-inset-bottom);
}

:deep(.song-delete-button) {
  color: var(--app-danger);
  box-shadow: var(--app-shadow-none);
}

.song-edit-error__actions {
  width: 100%;
  gap: var(--app-space-6);
  margin-top: var(--app-card-padding);
}
</style>
