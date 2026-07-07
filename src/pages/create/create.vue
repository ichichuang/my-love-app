<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell
    nav-title="写进小本本"
    nav-eyebrow="新的回忆"
    nav-show-back
    nav-variant="page"
    :nav-auto-back="false"
    @back="handleBackNavigation"
  >
    <template #nav-actions>
      <wd-button size="small" plain :disabled="saving" @click="handleBackNavigation">先不写了</wd-button>
    </template>

    <view class="create-page">
      <view class="create-hero app-reveal-1">
        <view class="create-hero__copy">
          <text class="create-hero__kicker">把小事夹进来</text>
          <text class="create-hero__title">写一张小日记纸页</text>
          <text class="create-hero__body">像贴一张手写小纸条，文字和照片都安静收进回忆里。</text>
        </view>
        <view class="create-hero__marks">
          <view class="create-hero__mark create-hero__mark--red" />
          <view class="create-hero__mark create-hero__mark--blue" />
        </view>
      </view>

      <view class="app-notebook-rings app-reveal-2" aria-hidden="true">
        <view v-for="i in 6" :key="i" class="app-notebook-rings__ring" />
      </view>
      <view class="memory-paper app-reveal-2 app-notebook-page">
        <view class="memory-paper__fold" />
        <view class="memory-paper__header">
          <view>
            <text class="memory-paper__eyebrow">小日记纸页</text>
            <text class="memory-paper__title">新的小回忆</text>
          </view>
          <text class="memory-paper__stamp">私密</text>
        </view>

        <view id="create-title-field" class="paper-field paper-field--title">
          <text class="paper-field__question">把哪件小事收起来？</text>
          <wd-input
            v-model="title"
            no-border
            :adjust-position="false"
            placeholder="比如：一起散步的夜晚"
            :placeholder-style="placeholderStyle"
            :maxlength="48"
            custom-class="paper-field__input-root paper-field__input-root--title"
            custom-input-class="paper-field__input-inner paper-field__input-inner--title"
            @focus="focusField('#create-title-field')"
            @keyboardheightchange="syncKeyboardHeight"
          />
        </view>

        <view class="paper-field">
          <text class="paper-field__question">想留下哪句话？</text>
          <view id="create-content-field" class="paper-field__textarea-hitarea">
            <wd-textarea
              v-model="content"
              no-border
              :adjust-position="false"
              placeholder="写一点不想忘记的小事"
              :placeholder-style="placeholderStyle"
              :maxlength="1200"
              custom-class="paper-field__textarea-root"
              custom-textarea-container-class="paper-field__textarea-box"
              custom-textarea-class="paper-field__textarea-inner"
              @focus="focusField('#create-content-field')"
              @keyboardheightchange="syncKeyboardHeight"
            />
          </view>
        </view>

        <view class="paper-tag-row">
          <view class="paper-field paper-field--tag">
            <text class="paper-field__question">今天是哪一天？</text>
            <app-date-field v-model="occurredAt" placeholder="挑一个日子" />
          </view>

          <view id="create-mood-field" class="paper-field paper-field--tag">
            <text class="paper-field__question">今天的小心情</text>
            <wd-input
              v-model="mood"
              no-border
              :adjust-position="false"
              placeholder="温柔"
              :placeholder-style="placeholderStyle"
              :maxlength="16"
              custom-class="paper-field__input-root"
              custom-input-class="paper-field__input-inner"
              @focus="focusField('#create-mood-field')"
              @keyboardheightchange="syncKeyboardHeight"
            />
          </view>
        </view>

        <view class="photo-folder">
          <view class="photo-folder__tab">
            <text>私密相册夹</text>
          </view>
          <view class="photo-folder__body">
            <view class="photo-folder__head">
              <view>
                <text class="photo-folder__title">把小照片放进来</text>
                <text class="photo-folder__note">小票、风景、合照都行，最多放 {{ maxUploadCount }} 张。</text>
              </view>
              <text class="photo-folder__count">{{ files.length }}/{{ maxUploadCount }}</text>
            </view>

            <image-grid :files="files" editable @image-error="recoverImage" @remove="guardedRemoveFileAt" />

            <view class="photo-folder__upload">
              <wd-button
                block
                plain
                :loading="uploading"
                :disabled="maxUploadReached || uploading"
                custom-class="photo-folder__button"
                @click="guardedChooseAndUploadImages"
              >
                {{ maxUploadReached ? "照片已经放满啦" : "轻轻放进一张" }}
              </wd-button>
              <text v-if="remainingUploadCount === 0" class="photo-folder__limit-note">
                最多 {{ maxUploadCount }} 张，已经放满啦。
              </text>
            </view>
          </view>
        </view>

        <view class="create-save">
          <wd-button block size="large" :loading="saving" @click="saveEntry">{{ saveButtonText }}</wd-button>
        </view>
        <view class="keyboard-spacer" :style="keyboardSpacerStyle" aria-hidden="true" />
      </view>
    </view>

    <wd-message-box :root-portal="true" />
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue"
import { onBackPress, onShow, onUnload } from "@dcloudio/uni-app"
import { useMessage } from "wot-design-uni/components/wd-message-box"
import { useKeyboardAvoidance } from "@/composables/useKeyboardAvoidance"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { showAppError, showAppToast, showAppWarning } from "@/composables/useAppToast"
import { useFileUpload } from "@/composables/useFileUpload"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import {
  getTempFileURLByFileIds,
  removeResolvedTempURLFromFiles,
  setResolvedTempURLForFile
} from "@/services/cloud-file-resolver"
import { createEntry } from "@/services/repositories/entries"
import { normalizeCalendarDate } from "@/utils/date"

const theme = useNativeChromeSync()
const message = useMessage()
const today = new Date()
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
const placeholderStyle = "color: var(--app-text-muted);"

const title = shallowRef("")
const content = shallowRef("")
const mood = shallowRef("温柔")
const occurredAt = shallowRef(todayString)
const saving = shallowRef(false)
const saveSucceeded = shallowRef(false)
const saveButtonText = computed(() => (saving.value ? "正在轻轻收好" : "轻轻收好"))
const { keyboardSpacerStyle, syncKeyboardHeight, focusField } = useKeyboardAvoidance()

const imageRecoveryFileIDs = new Set<string>()
const {
  files,
  uploading,
  maxUploadCount,
  remainingUploadCount,
  maxUploadReached,
  setFiles,
  chooseAndUploadImages,
  removeFileAt,
  markFilesCommitted,
  queueUncommittedUploadedFilesForCleanup
} = useFileUpload()

const draftDirty = shallowRef(false)
watch(
  [title, content, mood, occurredAt],
  () => {
    draftDirty.value = true
  },
  {
    flush: "sync"
  }
)
const hasUnsavedDraft = computed(
  () => !saveSucceeded.value && (draftDirty.value || files.value.length > 0)
)
const discardDraftConfirmOptions = {
  title: "这张纸条还没收好",
  msg: "离开后，这次没保存的内容不会留下。",
  cancelButtonText: "继续写",
  confirmButtonText: "不保存离开",
  confirmButtonProps: {
    plain: true,
    type: "error" as const
  },
  cancelButtonProps: {
    plain: true,
    type: "info" as const
  }
}
const isLeaveConfirming = shallowRef(false)

const leaveCreate = () => {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }

  uni.redirectTo({
    url: "/pages/index/index"
  })
}

const confirmDiscardDraft = async (): Promise<boolean> => {
  if (isLeaveConfirming.value) {
    return false
  }

  isLeaveConfirming.value = true
  try {
    await message.confirm(discardDraftConfirmOptions)
    return true
  } catch {
    return false
  } finally {
    isLeaveConfirming.value = false
  }
}

const handleBackNavigation = async () => {
  if (saving.value) {
    showAppToast("正在轻轻收好，先等它一下下")
    return
  }

  if (!hasUnsavedDraft.value) {
    leaveCreate()
    return
  }

  if (await confirmDiscardDraft()) {
    leaveCreate()
  }
}

const recoverImage = async (fileID: string) => {
  const fallbackFiles = removeResolvedTempURLFromFiles(files.value, fileID)
  if (fallbackFiles !== files.value) {
    setFiles(fallbackFiles)
  }

  if (imageRecoveryFileIDs.has(fileID)) {
    return
  }

  imageRecoveryFileIDs.add(fileID)
  try {
    const urls = await getTempFileURLByFileIds([fileID], {
      force: true
    })
    const resolvedTempURL = urls.get(fileID)
    if (resolvedTempURL) {
      setFiles(setResolvedTempURLForFile(files.value, fileID, resolvedTempURL))
    }
  } catch {
    showAppWarning("这张图片暂时没取到，请稍后再试。")
  } finally {
    imageRecoveryFileIDs.delete(fileID)
  }
}

const guardedChooseAndUploadImages = async () => {
  await chooseAndUploadImages()
}

const guardedRemoveFileAt = async (index: number) => {
  await removeFileAt(index)
}

const saveEntry = async () => {
  const titleToSave = title.value.trim()
  const contentToSave = content.value.trim()
  const moodToSave = mood.value.trim() || "温柔"
  const dateToSave = normalizeCalendarDate(occurredAt.value) || todayString

  if (!titleToSave) {
    showAppWarning("先给这条小回忆起个名字")
    return
  }

  if (!contentToSave && files.value.length === 0) {
    showAppWarning("写一句话，或者放一张照片进去")
    return
  }

  saving.value = true
  try {
    const entry = await createEntry({
      title: titleToSave,
      content: contentToSave,
      mood: moodToSave,
      occurredAt: dateToSave,
      files: files.value
    })

    markFilesCommitted(entry.files)
    saveSucceeded.value = true
    uni.redirectTo({
      url: `/pages/detail/detail?id=${encodeURIComponent(entry.id)}`
    })
  } catch (error) {
    showAppError(getFriendlyErrorMessage(error))
  } finally {
    saving.value = false
  }
}

onBackPress((options) => {
  if (options.from === "navigateBack") {
    return false
  }

  if (saving.value) {
    showAppToast("正在轻轻收好，先等它一下下")
    return true
  }

  if (!hasUnsavedDraft.value) {
    return false
  }

  void handleBackNavigation()
  return true
})

onUnload(() => {
  if (saving.value || saveSucceeded.value) {
    return
  }

  queueUncommittedUploadedFilesForCleanup()
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.create-page {
  display: flex;
  flex-direction: column;
  gap: var(--app-form-gap);
}

.create-hero,
.memory-paper,
.photo-folder__body {
  @include panel;
}

.create-hero {
  position: relative;
  overflow: hidden;
  padding: var(--app-card-padding);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.create-hero::before {
  position: absolute;
  right: var(--app-space-10);
  bottom: var(--app-space-8);
  width: var(--app-space-40);
  height: var(--app-space-20);
  border-top: var(--app-panel-border-width) dashed var(--app-divider);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-7deg);
  pointer-events: none;
}

.create-hero__copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
}

.create-hero__kicker,
.memory-paper__eyebrow,
.photo-folder__count {
  @include label;
}

.create-hero__title {
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.create-hero__body {
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.create-hero__marks {
  position: absolute;
  top: var(--app-card-padding);
  right: var(--app-card-padding);
  display: flex;
  gap: var(--app-space-4);
  pointer-events: none;
}

.create-hero__mark {
  width: var(--app-space-4);
  height: var(--app-space-18);
  border-radius: var(--app-radius-pill);
  opacity: var(--app-decor-opacity);
}

.create-hero__mark--red {
  background: var(--app-color-red-person);
  transform: rotate(-12deg);
}

.create-hero__mark--blue {
  background: var(--app-color-blue-person);
  transform: rotate(10deg);
}

.memory-paper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--app-card-gap);
  overflow: hidden;
  padding: var(--app-card-padding);
  background:
    linear-gradient(180deg, var(--app-surface-strong), var(--app-surface));
}

.memory-paper::before,
.memory-paper::after {
  position: absolute;
  left: var(--app-card-padding);
  right: var(--app-card-padding);
  border-top: var(--app-panel-border-width) dashed var(--app-divider);
  content: "";
  opacity: var(--app-decor-opacity);
  pointer-events: none;
}

.memory-paper::before {
  top: var(--app-space-48);
}

.memory-paper::after {
  bottom: var(--app-space-48);
}

.memory-paper__fold {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-28);
  height: var(--app-space-28);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-bottom-left-radius: var(--app-radius-md);
  background: var(--app-primary-soft);
  opacity: var(--app-decor-opacity);
  pointer-events: none;
}

.memory-paper__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.memory-paper__title {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.memory-paper__stamp {
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-badge);
  color: var(--app-primary);
  font: var(--app-font-caption);
  opacity: var(--app-decor-opacity);
  transform: rotate(6deg);
}

.paper-field,
.photo-folder,
.create-save {
  position: relative;
  z-index: 1;
}

.paper-field {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-5);
}

.paper-field__question {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

:deep(.paper-field__input-root) {
  @include wot-paper-input-root;
}

:deep(.paper-field__textarea-root) {
  @include wot-paper-textarea-root;
}

.paper-field__textarea-hitarea {
  display: block;
  width: 100%;
}

:deep(.paper-field__input-root .wd-input__body),
:deep(.paper-field__input-root .wd-input__value) {
  @include wot-paper-control-value;
}

:deep(.paper-field__textarea-root .wd-textarea__value) {
  @include wot-paper-textarea-value;
}

:deep(.paper-field__input-inner) {
  @include wot-paper-input-inner;
}

:deep(.paper-field__input-inner--title) {
  @include wot-paper-title-input-inner;
}

:deep(.paper-field__textarea-box),
:deep(.paper-field__textarea-inner) {
  min-height: var(--app-textarea-min-height);
}

:deep(.paper-field__textarea-inner) {
  @include wot-paper-textarea-inner;
}

.paper-tag-row {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(min(100%, var(--app-paper-tag-field-min-width)), 1fr));
  gap: var(--app-space-8);
}

.paper-tag-row > .paper-field {
  min-width: 0;
}

.photo-folder {
  display: flex;
  flex-direction: column;
  padding-top: var(--app-space-7);
}

.photo-folder__tab {
  align-self: flex-start;
  max-width: 100%;
  padding: var(--app-space-4) var(--app-space-9);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-bottom-width: var(--app-space-0);
  border-radius: var(--app-radius-lg) var(--app-radius-lg) var(--app-space-0) var(--app-space-0);
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font: var(--app-font-caption);
}

.photo-folder__body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-8);
  padding: var(--app-card-padding);
  border-top-left-radius: var(--app-space-0);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-none);
}

.photo-folder__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.photo-folder__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.photo-folder__note {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

:deep(.photo-folder__button) {
  box-shadow: var(--app-shadow-none);
}

.photo-folder__upload {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
}

.photo-folder__limit-note {
  color: var(--app-primary);
  font: var(--app-font-caption);
}

.create-save {
  display: flex;
  flex-direction: column;
  padding-top: var(--app-space-2);
}

.keyboard-spacer {
  flex-shrink: 0;
}
</style>
