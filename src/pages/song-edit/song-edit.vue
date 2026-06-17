<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell :nav-title="pageTitle" :nav-eyebrow="pageEyebrow" nav-show-back nav-variant="page">
    <template #nav-actions>
      <wd-button size="small" plain :disabled="formDisabled" @click="backToSongs">{{ backActionText }}</wd-button>
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
          <view class="song-note__intro">
            <text class="song-note__kicker">点歌便签</text>
            <text class="song-note__question">想把哪首歌放进小歌单？</text>
            <text class="song-note__body">只写歌名也可以，剩下的以后慢慢补。</text>
          </view>
          <text class="song-note__stamp">{{ songStatusLabels[songStatus] }}</text>
        </view>

        <view class="song-title-slip">
          <view class="song-title-slip__line">
            <text class="song-title-slip__quote">《</text>
            <wd-input
              v-model="title"
              no-border
              :disabled="formDisabled"
              placeholder="歌名先写这里"
              :placeholder-style="placeholderStyle"
              :maxlength="48"
              custom-class="song-title-slip__input-root"
              custom-input-class="song-title-slip__input-inner"
            />
            <text class="song-title-slip__quote">》</text>
          </view>
        </view>

        <view class="song-detail-toggle-row">
          <wd-button
            size="small"
            plain
            :disabled="formDisabled"
            custom-class="song-detail-toggle"
            @click="toggleDetails"
          >
            {{ detailToggleText }}
          </wd-button>
        </view>

        <view v-if="detailsExpanded" class="song-note__details">
          <view class="song-field">
            <text class="song-field__prompt">是谁的版本？</text>
            <wd-input
              v-model="artist"
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
            <text class="song-field__prompt">为什么想听？</text>
            <wd-textarea
              v-model="content"
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

          <view class="song-note__section">
            <view class="song-note__section-head">
              <text class="song-note__section-title">心愿贴纸</text>
              <text class="song-note__section-note">像小印章一样贴一下</text>
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
              <text class="song-note__section-title">小歌单状态</text>
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
const detailsExpanded = shallowRef(false)

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
const pageTitle = computed(() => "点歌便签")
const pageEyebrow = computed(() => (isEditMode.value ? "改一张小纸条" : "丢进小歌单"))
const backActionText = computed(() => (isEditMode.value ? "先不改了" : "先不写了"))
const detailToggleText = computed(() => (detailsExpanded.value ? "先收起小细节" : "想再补一句"))
const saveButtonText = computed(() => {
  if (saving.value) {
    return "正在轻轻收好"
  }

  if (saved.value) {
    return "已经轻轻收好"
  }

  return isEditMode.value ? "收好这张纸条" : "放进小歌单"
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
  detailsExpanded.value = false
}

const setSongPriority = (value: SongPriority) => {
  songPriority.value = value
  saved.value = false
}

const setSongStatus = (value: SongStatus) => {
  songStatus.value = value
  saved.value = false
}

const shouldExpandSongDetails = (song: SongDraft): boolean =>
  song.artist.trim().length > 0 ||
  song.content.trim().length > 0 ||
  song.songPriority !== "normal" ||
  song.songStatus !== "wanted"

const toggleDetails = () => {
  detailsExpanded.value = !detailsExpanded.value
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
    detailsExpanded.value = shouldExpandSongDetails(song)
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
.song-note__intro,
.song-note__details,
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

.song-note::before {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-14);
  width: var(--app-space-24);
  height: var(--app-space-20);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  background: var(--app-surface-strong);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-3deg);
}

.song-note::after {
  position: absolute;
  top: var(--app-card-padding);
  left: var(--app-card-padding);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  background: var(--app-accent);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-2deg);
}

.song-note__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.song-note__intro {
  min-width: 0;
  gap: var(--app-space-3);
  padding-top: var(--app-space-8);
}

.song-note__kicker {
  @include label;
  display: block;
  color: var(--app-accent);
}

.song-note__question,
.song-note__section-title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.song-note__body,
.song-note__section-note {
  display: block;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.song-note__stamp {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-badge);
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font: var(--app-font-caption);
}

.song-title-slip {
  position: relative;
  z-index: 1;
  padding: var(--app-space-5) var(--app-field-padding-x);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-input);
  background: var(--app-field);
}

.song-title-slip::after {
  position: absolute;
  right: var(--app-field-padding-x);
  bottom: var(--app-space-5);
  left: var(--app-field-padding-x);
  height: var(--app-panel-border-width);
  background: var(--app-divider);
  content: "";
}

.song-title-slip__line {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
}

.song-title-slip__quote {
  flex-shrink: 0;
  color: var(--app-primary);
  font: var(--app-font-section-title);
  line-height: var(--app-line-height-none);
}

:deep(.song-title-slip__input-root) {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  padding: var(--app-space-0);
  background: transparent;
  color: var(--app-text);
}

:deep(.song-title-slip__input-root .wd-input__body),
:deep(.song-title-slip__input-root .wd-input__value) {
  width: 100%;
}

:deep(.song-title-slip__input-inner) {
  min-height: var(--app-input-height);
  color: var(--app-text);
  font-size: var(--app-font-size-xl);
  line-height: var(--app-input-height);
}

.song-detail-toggle-row {
  position: relative;
  z-index: 1;
  display: flex;
}

:deep(.song-detail-toggle) {
  color: var(--app-primary);
  box-shadow: var(--app-shadow-none);
}

.song-note__details {
  position: relative;
  z-index: 1;
  gap: var(--app-space-7);
  padding-top: var(--app-card-gap);
  border-top: var(--app-panel-border-width) solid var(--app-divider);
}

.song-note__section {
  gap: var(--app-space-7);
  padding-top: var(--app-card-gap);
  border-top: var(--app-panel-border-width) solid var(--app-divider);
}

.song-note__section-head {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
}

.song-field {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-5);
}

.song-field__prompt {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
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
