<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell
    nav-title="翻这张小纸页"
    :nav-eyebrow="editing ? '改一张小纸条' : '收好的小事'"
    nav-show-back
    nav-variant="page"
    :nav-auto-back="false"
    @back="handleBackNavigation"
  >
    <template #nav-actions>
      <wd-button v-if="entry && !editing" size="small" plain @click="startEditing">编辑</wd-button>
    </template>

    <view v-if="loading" class="status-panel">
      <text>正在翻这张小纸条…</text>
    </view>

    <empty-state
      v-else-if="!entry"
      title="这张小纸条暂时打不开"
      body="可能是云开发慢了一点，请稍后再试。"
    />

    <view v-else-if="!editing" class="detail-page">
      <view class="memory-sheet">
        <view class="memory-sheet__fold" />
        <view class="memory-sheet__header">
          <view class="memory-sheet__stub">
            <text class="memory-sheet__stub-label">日期小票根</text>
            <text class="memory-sheet__date">{{ occurredAtDisplay }}</text>
          </view>
          <text class="memory-sheet__mood">{{ entry.mood || "温柔" }}</text>
        </view>

        <view class="memory-sheet__title-block">
          <text class="memory-sheet__kicker">收好的小纸页</text>
          <text class="memory-sheet__title">{{ entry.title }}</text>
        </view>

        <view v-if="entry.files.length > 0" class="album-panel">
          <view class="album-panel__tab">
            <text>私密相册页</text>
          </view>
          <view class="album-panel__body">
            <image-grid :files="entry.files" @image-error="recoverImage" />
          </view>
        </view>

        <view class="note-paper">
          <text class="note-paper__label">正文纸条</text>
          <text class="note-paper__content">{{ entry.content || "这段回忆还没有写下文字。" }}</text>
        </view>

        <view class="detail-actions">
          <wd-button block size="large" @click="startEditing">编辑这条回忆</wd-button>
        </view>
      </view>

      <view class="danger-zone">
        <view>
          <text class="danger-zone__title">删除这条回忆</text>
          <text class="danger-zone__body">这会删除这条记录和对应照片。</text>
        </view>
        <wd-button
          plain
          block
          type="error"
          :loading="deleting"
          @click="confirmDelete"
        >
          删除这条回忆
        </wd-button>
      </view>
    </view>

    <view v-else class="edit-page">
      <view class="edit-sheet">
        <view class="edit-sheet__fold" />
        <view class="edit-sheet__header">
          <view>
            <text class="edit-sheet__eyebrow">正在整理这一页</text>
            <text class="edit-sheet__title">把小纸条重新夹好</text>
          </view>
          <text class="edit-sheet__stamp">私密</text>
        </view>

        <view id="detail-title-field" class="paper-field paper-field--title">
          <text class="paper-field__question">把哪件小事收起来？</text>
          <wd-input
            v-model="title"
            no-border
            placeholder="比如：一起散步的夜晚"
            :placeholder-style="placeholderStyle"
            :maxlength="48"
            custom-class="paper-field__input-root paper-field__input-root--title"
            custom-input-class="paper-field__input-inner paper-field__input-inner--title"
            @focus="focusField('#detail-title-field')"
            @keyboardheightchange="syncKeyboardHeight"
          />
        </view>

        <view id="detail-content-field" class="paper-field">
          <text class="paper-field__question">想留下哪句话？</text>
          <wd-textarea
            v-model="content"
            no-border
            placeholder="写一点不想忘记的小事"
            :placeholder-style="placeholderStyle"
            :maxlength="1200"
            custom-class="paper-field__textarea-root"
            custom-textarea-container-class="paper-field__textarea-box"
            custom-textarea-class="paper-field__textarea-inner"
            @focus="focusField('#detail-content-field')"
            @keyboardheightchange="syncKeyboardHeight"
          />
        </view>

        <view class="paper-tag-row">
          <view class="paper-field paper-field--tag">
            <text class="paper-field__question">今天是哪一天？</text>
            <app-date-field v-model="occurredAt" placeholder="挑一个日子" />
          </view>

          <view id="detail-mood-field" class="paper-field paper-field--tag">
            <text class="paper-field__question">今天的小心情</text>
            <wd-input
              v-model="mood"
              no-border
              placeholder="温柔"
              :placeholder-style="placeholderStyle"
              :maxlength="16"
              custom-class="paper-field__input-root"
              custom-input-class="paper-field__input-inner"
              @focus="focusField('#detail-mood-field')"
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
                <text class="photo-folder__title">换一张或删一张</text>
                <text class="photo-folder__note">移除的照片，确认保存后才会从云端一起清理。</text>
              </view>
              <text class="photo-folder__count">{{ files.length }}/{{ maxUploadCount }}</text>
            </view>

            <image-grid
              :files="files"
              editable
              @image-error="recoverImage"
              @remove="removeEditFile"
            />

            <view class="photo-folder__upload">
              <wd-button
                block
                plain
                :loading="uploading"
                :disabled="maxUploadReached || uploading"
                custom-class="photo-folder__button"
                @click="chooseAndUploadImages"
              >
                {{ maxUploadReached ? "照片已经放满啦" : "再加一张" }}
              </wd-button>
              <text v-if="remainingUploadCount === 0" class="photo-folder__limit-note">
                最多 {{ maxUploadCount }} 张，已经放满啦。
              </text>
            </view>
          </view>
        </view>

        <view class="edit-actions">
          <wd-button plain block @click="handleCancelEditing">取消</wd-button>
          <wd-button block size="large" :loading="saving" @click="saveChanges">保存修改</wd-button>
        </view>
        <view class="keyboard-spacer" :style="keyboardSpacerStyle" aria-hidden="true" />
      </view>
    </view>

    <wd-message-box />
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue"
import { onBackPress, onLoad, onUnload } from "@dcloudio/uni-app"
import { useMessage } from "wot-design-uni/components/wd-message-box"
import { showAppError, showAppWarning } from "@/composables/useAppToast"
import { useCachedRecord } from "@/composables/useCachedRecord"
import { useFileUpload } from "@/composables/useFileUpload"
import { useKeyboardAvoidance } from "@/composables/useKeyboardAvoidance"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { setRouteSuccessFeedback } from "@/composables/useRouteFeedback"
import { getFriendlyErrorMessage, type CloudFile } from "@/services/cloudbase"
import {
  batchResolveEntries,
  getTempFileURLByFileIds,
  mergeResolvedTempURLsForEntry,
  mergeResolvedTempURLsForFiles,
  removeResolvedTempURLFromFiles,
  setResolvedTempURLForFile
} from "@/services/cloud-file-resolver"
import { dataCacheKeys } from "@/services/data-cache"
import {
  deleteEntry,
  getEntry,
  isEntryUnavailableError,
  queueEntryFilesForCleanup,
  updateEntry,
  type EntryRecord
} from "@/services/repositories/entries"
import { formatChineseDate, normalizeCalendarDate } from "@/utils/date"

const indexRoute = "/pages/index/index"
const placeholderStyle = "color: var(--app-text-muted);"

const entryId = shallowRef("")
const theme = useNativeChromeSync()
const message = useMessage()
const editing = shallowRef(false)
const saving = shallowRef(false)
const deleting = shallowRef(false)
const removedFiles = shallowRef<CloudFile[]>([])
const { keyboardSpacerStyle, syncKeyboardHeight, focusField } = useKeyboardAvoidance()
const {
  record: entry,
  loading,
  reload: reloadEntry
} = useCachedRecord<EntryRecord>({
  cacheKey: () => dataCacheKeys.memoryDetail(entryId.value),
  isUnavailableError: isEntryUnavailableError,
  loader: () => getEntry(entryId.value)
})

const title = shallowRef("")
const content = shallowRef("")
const mood = shallowRef("")
const occurredAt = shallowRef("")
const occurredAtDisplay = computed(() => {
  const value = entry.value?.occurredAt ?? ""
  return formatChineseDate(value) || value
})
const imageRecoveryFileKeys = new Set<string>()
let imageHydrationRun = 0

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
  queueUncommittedUploadedFilesForCleanup,
  isUncommittedUploadedFile
} = useFileUpload()

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

const hasSameFileIDOrder = (left: CloudFile[], right: CloudFile[]): boolean =>
  left.length === right.length && left.every((file, index) => file.fileID === right[index]?.fileID)

const hasDirtyDraft = computed(() => {
  const currentEntry = entry.value
  if (!editing.value || !currentEntry) {
    return false
  }

  return (
    title.value !== currentEntry.title ||
    content.value !== currentEntry.content ||
    mood.value !== currentEntry.mood ||
    occurredAt.value !== currentEntry.occurredAt ||
    !hasSameFileIDOrder(files.value, currentEntry.files) ||
    removedFiles.value.length > 0 ||
    files.value.some((file) => isUncommittedUploadedFile(file.fileID))
  )
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

const hydrateForm = (nextEntry: EntryRecord) => {
  title.value = nextEntry.title
  content.value = nextEntry.content
  mood.value = nextEntry.mood
  occurredAt.value = nextEntry.occurredAt
  setFiles(nextEntry.files)
  markFilesCommitted(nextEntry.files)
  removedFiles.value = []
}

const applyImageFallback = (fileID: string): void => {
  if (entry.value) {
    const nextEntryFiles = removeResolvedTempURLFromFiles(entry.value.files, fileID)
    if (nextEntryFiles !== entry.value.files) {
      entry.value = {
        ...entry.value,
        files: nextEntryFiles
      }
    }
  }

  if (editing.value) {
    const nextDraftFiles = removeResolvedTempURLFromFiles(files.value, fileID)
    if (nextDraftFiles !== files.value) {
      setFiles(nextDraftFiles)
    }
  }
}

const applyResolvedImageEntry = (nextEntry: EntryRecord): void => {
  if (entry.value) {
    const mergedEntry = mergeResolvedTempURLsForEntry(entry.value, nextEntry)
    if (mergedEntry !== entry.value) {
      entry.value = mergedEntry
    }
  }

  if (!editing.value) {
    return
  }

  const nextDraftFiles = mergeResolvedTempURLsForFiles(files.value, nextEntry.files)
  if (nextDraftFiles !== files.value) {
    setFiles(nextDraftFiles)
  }
}

const applyRecoveredImageUrl = (fileID: string, resolvedTempURL: string): void => {
  if (entry.value) {
    const nextEntryFiles = setResolvedTempURLForFile(entry.value.files, fileID, resolvedTempURL)
    if (nextEntryFiles !== entry.value.files) {
      entry.value = {
        ...entry.value,
        files: nextEntryFiles
      }
    }
  }

  if (editing.value) {
    const nextDraftFiles = setResolvedTempURLForFile(files.value, fileID, resolvedTempURL)
    if (nextDraftFiles !== files.value) {
      setFiles(nextDraftFiles)
    }
  }
}

const hydrateImageUrls = async (sourceEntry: EntryRecord | null = entry.value): Promise<void> => {
  const needsHydration = sourceEntry?.files.some((file) => file.fileID && !file.resolvedTempURL) ?? false
  if (!sourceEntry || !needsHydration) {
    return
  }

  const run = ++imageHydrationRun
  try {
    const [resolvedEntry] = await batchResolveEntries([sourceEntry])
    if (run !== imageHydrationRun || resolvedEntry.id !== entryId.value) {
      return
    }

    applyResolvedImageEntry(resolvedEntry)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.info(`[小珊的树洞] 图片链接暂时没取到：${getFriendlyErrorMessage(error)}`)
    }
  }
}

const loadEntry = async () => {
  if (!entryId.value) {
    return
  }

  try {
    await reloadEntry({
      applyCached: (nextEntry) => {
        if (!editing.value) {
          hydrateForm(nextEntry)
        }
        void hydrateImageUrls(nextEntry)
      },
      applyFresh: (nextEntry) => {
        if (!editing.value) {
          hydrateForm(nextEntry)
        }
        void hydrateImageUrls(nextEntry)
      },
      canApplyFresh: () => !editing.value
    })
  } catch (error) {
    showAppError(getFriendlyErrorMessage(error))
  }
}

const startEditing = () => {
  if (!entry.value) {
    return
  }
  hydrateForm(entry.value)
  editing.value = true
  void hydrateImageUrls(entry.value)
}

const cancelEditing = () => {
  queueUncommittedUploadedFilesForCleanup(entry.value?.files)
  if (entry.value) {
    hydrateForm(entry.value)
  }
  editing.value = false
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

const navigateBackFromDetail = () => {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }

  uni.redirectTo({
    url: indexRoute
  })
}

const handleBackNavigation = async () => {
  if (!editing.value || !hasDirtyDraft.value) {
    navigateBackFromDetail()
    return
  }

  if (await confirmDiscardDraft()) {
    queueUncommittedUploadedFilesForCleanup(entry.value?.files)
    navigateBackFromDetail()
  }
}

const handleCancelEditing = async () => {
  if (!hasDirtyDraft.value) {
    cancelEditing()
    return
  }

  if (await confirmDiscardDraft()) {
    cancelEditing()
  }
}

const removeEditFile = async (index: number) => {
  const file = files.value[index]
  if (!file) {
    return
  }

  await removeFileAt(index, false)

  if (isUncommittedUploadedFile(file.fileID)) {
    queueUncommittedUploadedFilesForCleanup(files.value)
    return
  }

  removedFiles.value = [...removedFiles.value, file]
}

const recoverImage = async (fileID: string) => {
  const currentEntry = entry.value
  if (!entryId.value || !currentEntry) {
    return
  }

  applyImageFallback(fileID)
  const recoveryKey = `${entryId.value}:${fileID}`
  if (imageRecoveryFileKeys.has(recoveryKey)) {
    return
  }

  imageRecoveryFileKeys.add(recoveryKey)
  try {
    const urls = await getTempFileURLByFileIds([fileID], {
      force: true
    })
    const resolvedTempURL = urls.get(fileID)
    if (resolvedTempURL) {
      applyRecoveredImageUrl(fileID, resolvedTempURL)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.info(`[小珊的树洞] 单张图片链接刷新失败：${getFriendlyErrorMessage(error)}`)
    }
  } finally {
    imageRecoveryFileKeys.delete(recoveryKey)
  }
}

const saveChanges = async () => {
  if (!entry.value || saving.value) {
    return
  }

  const titleToSave = title.value.trim()
  const contentToSave = content.value.trim()
  const moodToSave = mood.value.trim() || "温柔"
  const dateToSave = normalizeCalendarDate(occurredAt.value)

  if (!titleToSave) {
    showAppWarning("先给这条小回忆起个名字")
    return
  }

  if (!dateToSave) {
    showAppWarning("先挑一个日子吧")
    return
  }

  saving.value = true
  const removedFilesSnapshot = [...removedFiles.value]
  let filesToCleanupAfterSave: CloudFile[] = []
  try {
    const nextEntry = await updateEntry(entry.value.id, {
      title: titleToSave,
      content: contentToSave,
      mood: moodToSave,
      occurredAt: dateToSave,
      files: files.value
    })

    const visibleEntry: EntryRecord = {
      ...nextEntry,
      files: mergeResolvedTempURLsForFiles(nextEntry.files, files.value)
    }
    entry.value = visibleEntry
    markFilesCommitted(visibleEntry.files)
    hydrateForm(visibleEntry)
    editing.value = false
    void hydrateImageUrls(nextEntry)
    const visibleFileIDs = new Set(visibleEntry.files.map((file) => file.fileID))
    filesToCleanupAfterSave = removedFilesSnapshot.filter((file) => !visibleFileIDs.has(file.fileID))
  } catch (error) {
    showAppError(getFriendlyErrorMessage(error))
  } finally {
    saving.value = false
  }

  if (filesToCleanupAfterSave.length > 0) {
    queueEntryFilesForCleanup(filesToCleanupAfterSave)
  }
}

const confirmDelete = async () => {
  if (!entry.value || deleting.value) {
    return
  }

  try {
    await message.confirm({
      title: "删除这条回忆",
      msg: "这会删除这条记录和对应照片。",
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
    await deleteCurrentEntry()
  } catch {
    return
  }
}

const deleteCurrentEntry = async () => {
  if (!entry.value) {
    return
  }

  deleting.value = true
  try {
    await deleteEntry(entry.value.id)
    setRouteSuccessFeedback(indexRoute, "这条回忆已经收起来")
    uni.redirectTo({
      url: indexRoute
    })
  } catch (error) {
    showAppError(getFriendlyErrorMessage(error))
  } finally {
    deleting.value = false
  }
}

onLoad((query) => {
  entryId.value = decodeQueryId(query?.id)
  void loadEntry()
})

onBackPress((options) => {
  if (options.from === "navigateBack" || !editing.value || !hasDirtyDraft.value) {
    return false
  }

  void handleBackNavigation()
  return true
})

onUnload(() => {
  if (!editing.value) {
    return
  }

  queueUncommittedUploadedFilesForCleanup(entry.value?.files)
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.status-panel,
.memory-sheet,
.danger-zone,
.edit-sheet,
.album-panel__body,
.photo-folder__body,
.note-paper {
  @include panel;
}

.status-panel {
  padding: var(--app-card-padding);
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.detail-page,
.edit-page {
  display: flex;
  flex-direction: column;
  gap: var(--app-form-gap);
}

.memory-sheet,
.edit-sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--app-card-gap);
  overflow: hidden;
  padding: var(--app-card-padding);
  background:
    linear-gradient(180deg, var(--app-surface-strong), var(--app-surface));
}

.memory-sheet::before,
.memory-sheet::after,
.edit-sheet::before,
.edit-sheet::after {
  position: absolute;
  left: var(--app-card-padding);
  right: var(--app-card-padding);
  border-top: var(--app-panel-border-width) dashed var(--app-divider);
  content: "";
  opacity: var(--app-decor-opacity);
}

.memory-sheet::before,
.edit-sheet::before {
  top: var(--app-space-48);
}

.memory-sheet::after,
.edit-sheet::after {
  bottom: var(--app-space-48);
}

.memory-sheet__fold,
.edit-sheet__fold {
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
}

.memory-sheet__header,
.edit-sheet__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.memory-sheet__stub {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
  padding: var(--app-space-5) var(--app-space-8);
  border: var(--app-panel-border-width) dashed var(--app-border);
  border-radius: var(--app-radius-badge);
  background: var(--app-field);
}

.memory-sheet__stub-label,
.memory-sheet__kicker,
.edit-sheet__eyebrow,
.photo-folder__count,
.note-paper__label {
  @include label;
}

.memory-sheet__date {
  color: var(--app-text);
  font: var(--app-font-caption);
}

.memory-sheet__mood,
.edit-sheet__stamp {
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-badge);
  color: var(--app-primary);
  font: var(--app-font-caption);
  opacity: var(--app-decor-opacity);
  transform: rotate(6deg);
}

.memory-sheet__title-block,
.album-panel,
.note-paper,
.detail-actions,
.paper-field,
.photo-folder,
.edit-actions {
  position: relative;
  z-index: 1;
}

.memory-sheet__title-block {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
}

.memory-sheet__title {
  color: var(--app-text);
  font: var(--app-font-detail-title);
}

.album-panel,
.photo-folder {
  display: flex;
  flex-direction: column;
  padding-top: var(--app-space-7);
}

.album-panel__tab,
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

.album-panel__body,
.photo-folder__body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-8);
  padding: var(--app-card-padding);
  border-top-left-radius: var(--app-space-0);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-none);
}

.note-paper {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-5);
  padding: var(--app-card-padding);
  background: var(--app-field);
  box-shadow: var(--app-shadow-none);
}

.note-paper__content {
  color: var(--app-text);
  font-size: var(--app-font-size-xl);
  line-height: var(--app-line-height-loose);
}

.detail-actions,
.edit-actions {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-6);
}

.danger-zone {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-8);
  padding: var(--app-card-padding);
  border-color: var(--app-color-danger-border);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-none);
}

.danger-zone__title {
  display: block;
  color: var(--app-text);
  font-size: var(--app-font-size-lg);
  font-weight: var(--app-font-weight-semibold);
}

.danger-zone__body {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.edit-sheet__title {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text);
  font: var(--app-font-section-title);
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

:deep(.paper-field__input-root),
:deep(.paper-field__textarea-root) {
  @include wot-paper-input-root;
}

:deep(.paper-field__textarea-root) {
  @include wot-paper-textarea-root;
}

:deep(.paper-field__input-root--title) {
  background: var(--app-surface);
}

:deep(.paper-field__input-root .wd-input__body),
:deep(.paper-field__input-root .wd-input__value),
:deep(.paper-field__textarea-root .wd-textarea__value) {
  @include wot-paper-control-value;
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

.photo-folder__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.photo-folder__title {
  display: block;
  color: var(--app-text);
  font-size: var(--app-font-size-xl);
  font-weight: var(--app-font-weight-semibold);
}

.photo-folder__note {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-md);
  line-height: var(--app-line-height-normal);
}

:deep(.photo-folder__button) {
  margin-top: var(--app-space-2);
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

.keyboard-spacer {
  flex-shrink: 0;
}
</style>
