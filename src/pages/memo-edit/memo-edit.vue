<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell
    :nav-title="pageTitle"
    :nav-eyebrow="pageEyebrow"
    nav-show-back
    nav-variant="page"
    :nav-auto-back="false"
    @back="handleBackNavigation"
  >
    <view v-if="loading" class="memo-edit-status">
      <text>正在翻这张小线索…</text>
    </view>

    <empty-state
      v-else-if="hasLoadError"
      title="这张小线索暂时没翻到"
      body="可能是网络慢了一点，稍后再试一次。"
    >
      <view class="memo-edit-error__actions">
        <wd-button block :loading="loading" @click="loadMemo">再试一次</wd-button>
        <wd-button block plain @click="handleBackNavigation">返回小档案</wd-button>
      </view>
    </empty-state>

    <view v-else class="memo-edit">
      <view class="memo-note" :class="{ 'memo-note--pinned': memoPinned }">
        <view class="memo-note__paper-corner" />
        <view class="memo-note__head">
          <view class="memo-note__intro">
            <text class="memo-note__kicker">{{ introKicker }}</text>
            <text class="memo-note__question">想记住什么？</text>
            <text class="memo-note__body">写成一张小纸条，以后翻起来会更快一点。</text>
          </view>
          <text class="memo-note__stamp">{{ noteStampText }}</text>
        </view>

        <view id="memo-title-field" class="memo-title-slip">
          <text class="memo-field__prompt">想记住什么？</text>
          <wd-input
            v-model="title"
            no-border
            :disabled="formDisabled"
            placeholder="比如：她喜欢的花"
            :placeholder-style="placeholderStyle"
            :maxlength="48"
            custom-class="memo-title-slip__input-root"
            custom-input-class="memo-title-slip__input-inner"
            @focus="focusField('#memo-title-field')"
            @keyboardheightchange="syncKeyboardHeight"
          />
        </view>

        <view class="memo-note__section">
          <view class="memo-note__section-head">
            <text class="memo-note__section-title">多写一句？</text>
            <text class="memo-note__section-note">空着也没关系，先把标题收好就行。</text>
          </view>

          <view id="memo-content-field" class="memo-field">
            <wd-textarea
              v-model="content"
              no-border
              :disabled="formDisabled"
              placeholder="比如：小雏菊，比玫瑰更喜欢一点。"
              :placeholder-style="placeholderStyle"
              :maxlength="240"
              custom-class="memo-field__textarea-root"
              custom-textarea-container-class="memo-field__textarea-box"
              custom-textarea-class="memo-field__textarea-inner"
              @focus="focusField('#memo-content-field')"
              @keyboardheightchange="syncKeyboardHeight"
            />
          </view>
        </view>

        <view class="memo-note__section">
          <view class="memo-note__section-head">
            <text class="memo-note__section-title">贴个小标签</text>
            <text class="memo-note__section-note">分进小抽屉里，以后翻起来更快一点。</text>
          </view>

          <app-option-group :columns="3" responsive="auto">
            <app-option-button
              v-for="option in categoryOptions"
              :key="option.value"
              :active="memoCategory === option.value"
              :disabled="formDisabled"
              @click="setMemoCategory(option.value)"
            >
              <text class="memo-choice__label">{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <view class="memo-note__section">
          <view class="memo-note__section-head">
            <text class="memo-note__section-title">要不要放到上面？</text>
            <text class="memo-note__section-note">常翻的小线索，就先贴在最上面。</text>
          </view>

          <app-option-group :columns="2" responsive="auto">
            <app-option-button
              v-for="option in pinnedOptions"
              :key="option.label"
              :active="memoPinned === option.value"
              :disabled="formDisabled"
              @click="setMemoPinned(option.value)"
            >
              <text class="memo-choice__label">{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <view v-if="saved" class="memo-saved">
          <text class="memo-saved__title">已经轻轻收好</text>
          <text class="memo-saved__body">这张小线索已经放回小线索本里了。</text>
        </view>

        <view class="memo-note__footer">
          <text class="memo-note__footer-title">轻轻收好</text>
          <text class="memo-note__footer-body">{{ footerBody }}</text>
        </view>

        <view class="memo-edit-actions">
          <wd-button block size="large" :loading="saving" :disabled="formDisabled" @click="saveMemo">
            {{ saveButtonText }}
          </wd-button>
          <wd-button
            v-if="canDeleteMemo"
            block
            type="text"
            custom-class="memo-delete-button"
            @click="confirmDeleteMemo"
          >
            删除这条小线索
          </wd-button>
        </view>
        <view class="keyboard-spacer" :style="keyboardSpacerStyle" aria-hidden="true" />
      </view>
    </view>

    <wd-message-box />
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue"
import { onBackPress, onLoad } from "@dcloudio/uni-app"
import { useMessage } from "wot-design-uni/components/wd-message-box"
import { showAppError, showAppWarning } from "@/composables/useAppToast"
import { useCachedRecord } from "@/composables/useCachedRecord"
import { useKeyboardAvoidance } from "@/composables/useKeyboardAvoidance"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { setRouteSuccessFeedback } from "@/composables/useRouteFeedback"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { dataCacheKeys } from "@/services/data-cache"
import {
  createMemo,
  deleteMemo,
  getMemo,
  isMemoUnavailableError,
  memoCategoryLabels,
  updateMemo,
  type MemoCategory,
  type MemoDraft,
  type MemoRecord
} from "@/services/repositories/memos"

const memosRoute = "/pages/memos/memos"
const placeholderStyle = "color: var(--app-text-muted)"
const theme = useNativeChromeSync()
const message = useMessage()
const { keyboardSpacerStyle, syncKeyboardHeight, focusField } = useKeyboardAvoidance()

const memoCategoryOrder: MemoCategory[] = ["favorite", "profile", "avoid", "gift", "date", "note"]

const memoId = shallowRef("")
const hasLoadError = shallowRef(false)
const saving = shallowRef(false)
const saved = shallowRef(false)
const deleting = shallowRef(false)
const memoLoaded = shallowRef(false)
const draftDirty = shallowRef(false)
const hydratingDraft = shallowRef(false)
const {
  loading,
  reload: reloadMemo
} = useCachedRecord<MemoRecord>({
  cacheKey: () => dataCacheKeys.memoDetail(memoId.value),
  isUnavailableError: isMemoUnavailableError,
  loader: () => getMemo(memoId.value)
})

const title = shallowRef("")
const content = shallowRef("")
const memoCategory = shallowRef<MemoCategory>("note")
const memoPinned = shallowRef(false)

const categoryOptions = memoCategoryOrder.map((value) => ({
  label: memoCategoryLabels[value],
  value
}))

const pinnedOptions = [
  {
    label: "先放着",
    value: false
  },
  {
    label: "常看",
    value: true
  }
]

const isEditMode = computed(() => memoId.value.length > 0)
const canDeleteMemo = computed(
  () =>
    isEditMode.value &&
    memoLoaded.value &&
    !loading.value &&
    !hasLoadError.value &&
    !saving.value &&
    !deleting.value &&
    !saved.value
)
const formDisabled = computed(() => saving.value || saved.value || deleting.value)
const hasUnsavedDraft = computed(
  () => draftDirty.value && !saving.value && !deleting.value && !saved.value && !formDisabled.value
)
const pageTitle = computed(() => (isEditMode.value ? "改小线索" : "写小线索"))
const pageEyebrow = computed(() => (isEditMode.value ? "重新整理" : "小纸条"))
const introKicker = computed(() => (isEditMode.value ? "把这张小线索理一理" : "写一张小线索"))
const noteStampText = computed(() => (memoPinned.value ? "常看" : memoCategoryLabels[memoCategory.value]))
const footerBody = computed(() =>
  isEditMode.value ? "改完就轻轻放回原来的位置。" : "只写标题也能先收好，剩下的以后再慢慢补。"
)
const saveButtonText = computed(() => {
  if (saving.value) {
    return "正在轻轻收好"
  }

  if (saved.value) {
    return "已经轻轻收好"
  }

  return isEditMode.value ? "收好这张小线索" : "轻轻收好"
})
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

const updateDraftWithoutTracking = (update: () => void) => {
  hydratingDraft.value = true
  update()
  hydratingDraft.value = false
  draftDirty.value = false
}

const resetForm = () => {
  updateDraftWithoutTracking(() => {
    title.value = ""
    content.value = ""
    memoCategory.value = "note"
    memoPinned.value = false
    saved.value = false
    memoLoaded.value = false
  })
}

const hydrateMemo = (memo: MemoRecord) => {
  updateDraftWithoutTracking(() => {
    title.value = memo.title
    content.value = memo.content
    memoCategory.value = memo.memoCategory
    memoPinned.value = memo.memoPinned
    saved.value = false
    memoLoaded.value = true
  })
}

const loadMemo = async () => {
  if (!memoId.value) {
    resetForm()
    hasLoadError.value = false
    return
  }

  hasLoadError.value = false
  memoLoaded.value = false

  try {
    await reloadMemo({
      applyCached: hydrateMemo,
      applyFresh: hydrateMemo,
      canApplyFresh: () => !draftDirty.value && !formDisabled.value
    })
  } catch {
    resetForm()
    hasLoadError.value = true
  }
}

watch(
  [title, content, memoCategory, memoPinned],
  () => {
    if (!hydratingDraft.value && !formDisabled.value) {
      draftDirty.value = true
      saved.value = false
    }
  },
  {
    flush: "sync"
  }
)

const setMemoCategory = (value: MemoCategory) => {
  memoCategory.value = value
}

const setMemoPinned = (value: boolean) => {
  memoPinned.value = value
}

const backToMemos = () => {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }

  uni.redirectTo({
    url: memosRoute
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
  if (!hasUnsavedDraft.value) {
    backToMemos()
    return
  }

  if (await confirmDiscardDraft()) {
    backToMemos()
  }
}

const buildDraft = (): MemoDraft => ({
  title: title.value,
  content: content.value,
  memoCategory: memoCategory.value,
  memoPinned: memoPinned.value
})

const resolveSaveErrorMessage = (error: unknown): string => {
  const message = getFriendlyErrorMessage(error)
  return message.includes("纪念") ? "小线索暂时没收好，请稍后再试。" : message
}

const saveMemo = async () => {
  if (saving.value) {
    return
  }

  if (!title.value.trim()) {
    showAppWarning("先写下一条小线索")
    return
  }

  saving.value = true
  saved.value = false

  try {
    if (isEditMode.value) {
      await updateMemo(memoId.value, buildDraft())
    } else {
      await createMemo(buildDraft())
    }

    saving.value = false
    saved.value = true
    draftDirty.value = false
    setRouteSuccessFeedback(memosRoute, "小线索已经轻轻收好")
    backToMemos()
  } catch (error) {
    showAppError(resolveSaveErrorMessage(error))
  } finally {
    if (!saved.value) {
      saving.value = false
    }
  }
}

const deleteCurrentMemo = async () => {
  if (!canDeleteMemo.value || deleting.value) {
    return
  }

  deleting.value = true

  try {
    await deleteMemo(memoId.value)
    setRouteSuccessFeedback(memosRoute, "已经从小档案移走")
    backToMemos()
  } catch {
    showAppError("这条小线索暂时没删掉，请稍后再试。")
  } finally {
    deleting.value = false
  }
}

const confirmDeleteMemo = async () => {
  if (!canDeleteMemo.value || deleting.value) {
    return
  }

  try {
    await message.confirm({
      title: "删除这条小线索",
      msg: "这会删除这条记录。",
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
    await deleteCurrentMemo()
  } catch {
    return
  }
}

onLoad((query) => {
  memoId.value = decodeQueryId(query?.id)
  void loadMemo()
})

onBackPress((options) => {
  if (options.from === "navigateBack" || !hasUnsavedDraft.value) {
    return false
  }

  void handleBackNavigation()
  return true
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.memo-edit,
.memo-note,
.memo-note__intro,
.memo-note__section,
.memo-note__section-head,
.memo-edit-actions,
.memo-edit-error__actions,
.memo-field,
.memo-note__footer,
.memo-saved {
  display: flex;
  flex-direction: column;
}

.memo-edit {
  gap: var(--app-form-gap);
  padding-bottom: calc(var(--app-card-padding) + env(safe-area-inset-bottom));
}

.memo-edit-status,
.memo-note {
  @include panel;
  padding: var(--app-card-padding);
}

.memo-edit-status {
  color: var(--app-text-soft);
  font: var(--app-font-body);
  text-align: center;
}

.memo-edit-error__actions {
  gap: var(--app-space-5);
  width: 100%;
  margin-top: var(--app-card-gap);
}

.memo-note {
  position: relative;
  gap: var(--app-card-gap);
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

.memo-note--pinned::before {
  background: var(--app-primary);
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
.memo-field__prompt,
.memo-saved__title,
.memo-note__footer-title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.memo-note__body,
.memo-note__section-note,
.memo-saved__body,
.memo-note__footer-body {
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

.memo-title-slip,
.memo-note__footer,
.memo-saved {
  position: relative;
  z-index: 1;
}

.memo-title-slip {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-5);
  padding: var(--app-space-7) var(--app-field-padding-x);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-input);
  background: var(--app-field);
}

:deep(.memo-title-slip__input-root) {
  @include wot-paper-inline-input-root;
}

:deep(.memo-title-slip__input-root .wd-input__body),
:deep(.memo-title-slip__input-root .wd-input__value) {
  @include wot-paper-control-value;
}

:deep(.memo-title-slip__input-inner) {
  @include wot-paper-input-inner;
}

.memo-note__section {
  position: relative;
  z-index: 1;
  gap: var(--app-space-7);
  padding-top: var(--app-card-gap);
  border-top: var(--app-panel-border-width) dashed var(--app-divider);
}

.memo-note__section-head,
.memo-field,
.memo-note__footer,
.memo-saved {
  gap: var(--app-space-5);
}

:deep(.memo-field__textarea-root) {
  @include wot-paper-textarea-root;
}

:deep(.memo-field__textarea-root .wd-textarea__value) {
  @include wot-paper-control-value;
}

:deep(.memo-field__textarea-box),
:deep(.memo-field__textarea-inner) {
  min-height: var(--app-textarea-min-height);
}

:deep(.memo-field__textarea-inner) {
  @include wot-paper-textarea-inner;
}

:deep(.memo-title-slip__input-root.is-disabled),
:deep(.memo-field__textarea-root.is-disabled) {
  @include wot-paper-control-disabled;
}

.memo-choice__label {
  display: block;
  width: 100%;
}

.memo-saved {
  padding: var(--app-space-6) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-success);
  border-radius: var(--app-radius-badge);
  background: var(--app-success-soft);
  color: var(--app-success);
  box-shadow: var(--app-shadow-none);
}

.memo-note__footer {
  padding: var(--app-space-6) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-divider);
  border-radius: var(--app-radius-badge);
  background: var(--app-surface-strong);
  box-shadow: var(--app-shadow-none);
}

.memo-edit-actions {
  gap: var(--app-space-6);
  padding-top: var(--app-space-3);
  padding-bottom: env(safe-area-inset-bottom);
}

:deep(.memo-delete-button) {
  color: var(--app-danger);
  box-shadow: var(--app-shadow-none);
}

.keyboard-spacer {
  flex-shrink: 0;
}
</style>
