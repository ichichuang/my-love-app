<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell
    nav-title="小日子票根"
    nav-eyebrow="记一个日子"
    nav-show-back
    nav-variant="page"
    :nav-auto-back="false"
    @back="handleBackNavigation"
  >
    <view class="moment-edit">
      <view class="moment-ticket app-reveal-1 app-ticket-stump">
        <view class="app-ticket-stump__punch app-ticket-stump__punch--left" />
        <view class="app-ticket-stump__punch app-ticket-stump__punch--right" />
        <view class="moment-ticket__perforation" />
        <view class="moment-ticket__head">
          <view class="moment-ticket__intro">
            <text class="moment-ticket__kicker">小日子票根</text>
            <text class="moment-ticket__question">想记住哪个日子？</text>
            <text class="moment-ticket__body">写下来，它会替你们一直数着。</text>
          </view>
          <text class="moment-ticket__stamp">小票根</text>
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">这是一个什么样的日子？</text>
          <app-option-group :columns="3" responsive="auto">
            <app-option-button
              v-for="option in categoryOptions"
              :key="option.value"
              :active="category === option.value"
              :disabled="formDisabled"
              @click="category = option.value"
            >
              <text class="moment-choice__label">{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">给它起个名字</text>
          <view id="moment-title-field" class="moment-field__input-hitarea">
            <wd-input
              v-model="title"
              no-border
              :adjust-position="false"
              :disabled="formDisabled"
              placeholder="比如：第一次一起看的海"
              :placeholder-style="placeholderStyle"
              :maxlength="48"
              custom-class="moment-field__input-root"
              custom-input-class="moment-field__input-inner"
              @focus="focusField('#moment-title-field')"
              @keyboardheightchange="syncKeyboardHeight"
            />
          </view>
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">是哪一个日子？</text>
          <app-date-field
            v-model="sourceDate"
            placeholder="挑一个日子"
            title="挑个日子"
            :disabled="formDisabled"
          />
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">想怎么数它？</text>
          <app-option-group :columns="3" responsive="auto">
            <app-option-button
              v-for="option in modeOptions"
              :key="option.value"
              :active="mode === option.value"
              :disabled="formDisabled"
              @click="mode = option.value"
            >
              <text class="moment-choice__label">{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">每年都要回来吗？</text>
          <app-option-group :columns="2" responsive="auto">
            <app-option-button
              v-for="option in recurrenceOptions"
              :key="option.value"
              :active="recurrence === option.value"
              :disabled="formDisabled"
              @click="recurrence = option.value"
            >
              <text class="moment-choice__label">{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">想留一句悄悄话吗？</text>
          <text class="moment-field__hint">空着也没关系。</text>
          <view id="moment-note-field" class="moment-field__textarea-hitarea">
            <wd-textarea
              v-model="content"
              no-border
              :adjust-position="false"
              :disabled="formDisabled"
              placeholder="留一句悄悄话"
              :placeholder-style="placeholderStyle"
              :maxlength="240"
              custom-class="moment-field__textarea-root"
              custom-textarea-container-class="moment-field__textarea-box"
              custom-textarea-class="moment-field__textarea-inner"
              @focus="focusField('#moment-note-field')"
              @keyboardheightchange="syncKeyboardHeight"
            />
          </view>
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">先看看它的样子</text>
          <moment-card v-if="previewReady" :moment="previewRecord" :projection="previewProjection" />
          <view v-else class="moment-preview-placeholder">
            <text class="moment-field__hint">挑好日子后，这里会先演一遍它的样子。</text>
          </view>
        </view>

        <view class="moment-edit-actions">
          <wd-button block size="large" :loading="saving" :disabled="formDisabled" @click="saveMoment">
            {{ saveButtonText }}
          </wd-button>
        </view>
        <view class="keyboard-spacer" :style="keyboardSpacerStyle" aria-hidden="true" />
      </view>
    </view>

    <wd-message-box :root-portal="true" />
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue"
import { onBackPress } from "@dcloudio/uni-app"
import { useMessage } from "wot-design-uni/components/wd-message-box"
import { showAppError, showAppWarning } from "@/composables/useAppToast"
import { useKeyboardAvoidance } from "@/composables/useKeyboardAvoidance"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { setRouteSuccessFeedback } from "@/composables/useRouteFeedback"
import {
  isValidCalendarDate,
  momentCategoryLabels,
  projectMoment,
  todayCalendarDate,
  type MomentCategory,
  type MomentDisplayMode,
  type MomentDraft,
  type MomentRecord,
  type MomentRecurrence
} from "@/domain/moments"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { createMoment } from "@/services/repositories/moments"
import { normalizeCalendarDate } from "@/utils/date"

const momentsRoute = "/pages/moments/moments"
const placeholderStyle = "color: var(--app-text-muted)"
const theme = useNativeChromeSync()
const message = useMessage()
const { keyboardSpacerStyle, syncKeyboardHeight, focusField } = useKeyboardAvoidance()

const saving = shallowRef(false)
const saved = shallowRef(false)
const draftDirty = shallowRef(false)
const isLeaveConfirming = shallowRef(false)

const category = shallowRef<MomentCategory>("anniversary")
const title = shallowRef("")
const sourceDate = shallowRef("")
const mode = shallowRef<MomentDisplayMode>("auto")
const recurrence = shallowRef<MomentRecurrence>("none")
const content = shallowRef("")

const categoryOptions = (Object.keys(momentCategoryLabels) as MomentCategory[]).map((value) => ({
  value,
  label: momentCategoryLabels[value]
}))

const modeOptions: Array<{
  label: string
  value: MomentDisplayMode
}> = [
  {
    label: "自动判断",
    value: "auto"
  },
  {
    label: "正计时",
    value: "countup"
  },
  {
    label: "倒计时",
    value: "countdown"
  }
]

const recurrenceOptions: Array<{
  label: string
  value: MomentRecurrence
}> = [
  {
    label: "不重复",
    value: "none"
  },
  {
    label: "每年回来",
    value: "yearly"
  }
]

const formDisabled = computed(() => saving.value || saved.value)
const hasUnsavedDraft = computed(() => draftDirty.value && !saving.value && !saved.value)
const saveButtonText = computed(() => {
  if (saving.value) {
    return "正在轻轻收好"
  }

  if (saved.value) {
    return "已经轻轻收好"
  }

  return "收进小日子"
})
const discardDraftConfirmOptions = {
  title: "这张票根还没收好",
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

/** M4A 未暴露的字段固定走安全默认值；展示派生值永远只由 projectMoment 现场计算。 */
const buildDraft = (): MomentDraft => ({
  category: category.value,
  title: title.value.trim(),
  content: content.value.trim(),
  sourceDate: sourceDate.value,
  pinned: false,
  files: [],
  template: "{title}",
  reminderOffsets: [],
  milestoneValues: [],
  mode: mode.value,
  recurrence: recurrence.value,
  counting: "elapsed",
  display: "days",
  leapDayPolicy: "feb28"
})

const previewReady = computed(() => isValidCalendarDate(normalizeCalendarDate(sourceDate.value)))

/**
 * 预览记录只是本地草稿的临时投影载体：`id`/`createdAt`/`updatedAt` 为占位值，
 * 从不写入 CloudBase；只有用户点保存时才走 createMoment。
 */
const previewRecord = computed<MomentRecord>(() => ({
  ...buildDraft(),
  title: title.value.trim() || "未命名小日子",
  id: "moment-edit-preview",
  kind: "moment",
  createdAt: 0,
  updatedAt: 0
}))

const previewProjection = computed(() => projectMoment(previewRecord.value, todayCalendarDate()))

watch(
  [category, title, sourceDate, mode, recurrence, content],
  () => {
    if (!formDisabled.value) {
      draftDirty.value = true
    }
  },
  {
    flush: "sync"
  }
)

const backToMoments = () => {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }

  uni.redirectTo({
    url: momentsRoute
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
    showAppWarning("正在轻轻收好，请稍等")
    return
  }

  if (!hasUnsavedDraft.value) {
    backToMoments()
    return
  }

  if (await confirmDiscardDraft()) {
    backToMoments()
  }
}

const saveMoment = async () => {
  if (saving.value) {
    return
  }

  if (!title.value.trim()) {
    showAppWarning("先给这个小日子起个名字")
    return
  }

  const trimmedDate = normalizeCalendarDate(sourceDate.value)
  if (!isValidCalendarDate(trimmedDate)) {
    showAppWarning("先挑好这个日子的日期")
    return
  }

  saving.value = true
  saved.value = false
  sourceDate.value = trimmedDate

  try {
    await createMoment(buildDraft())

    saving.value = false
    saved.value = true
    setRouteSuccessFeedback(momentsRoute, "这个小日子已经悄悄收好")
    backToMoments()
  } catch (error) {
    showAppError(getFriendlyErrorMessage(error))
  } finally {
    if (!saved.value) {
      saving.value = false
    }
  }
}

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

.moment-edit,
.moment-ticket,
.moment-ticket__intro,
.moment-field,
.moment-edit-actions {
  display: flex;
  flex-direction: column;
}

.moment-edit {
  gap: var(--app-form-gap);
  padding-bottom: var(--app-card-padding);
}

.moment-ticket {
  @include panel;
  position: relative;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
  overflow: hidden;
}

.moment-ticket::before {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-28);
  height: var(--app-space-28);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom-left-radius: var(--app-radius-lg);
  background: var(--app-field);
  content: "";
  opacity: var(--app-muted-opacity);
  pointer-events: none;
}

.moment-ticket::after {
  position: absolute;
  top: var(--app-card-padding);
  left: var(--app-card-padding);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  background: var(--app-color-blue-person);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-3deg);
  pointer-events: none;
}

.moment-ticket__perforation {
  position: absolute;
  top: var(--app-space-24);
  right: var(--app-space-14);
  bottom: var(--app-space-24);
  border-left: var(--app-panel-border-width) dashed var(--app-border);
  opacity: var(--app-decor-opacity);
  pointer-events: none;
}

.moment-ticket__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.moment-ticket__intro {
  min-width: 0;
  gap: var(--app-space-3);
  padding-top: var(--app-space-8);
}

.moment-ticket__kicker {
  @include label;
  display: block;
  color: var(--app-accent);
}

.moment-ticket__question,
.moment-field__prompt {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.moment-ticket__body,
.moment-field__hint {
  display: block;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.moment-ticket__stamp {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-accent);
  border-radius: var(--app-radius-badge);
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font: var(--app-font-caption);
  transform: rotate(3deg);
}

.moment-field {
  position: relative;
  z-index: 1;
  gap: var(--app-space-5);
}

.moment-field__input-hitarea,
.moment-field__textarea-hitarea {
  display: block;
  width: 100%;
}

:deep(.moment-field__input-root) {
  @include wot-paper-input-root;
}

:deep(.moment-field__textarea-root) {
  @include wot-paper-textarea-root;
}

:deep(.moment-field__input-root .wd-input__body),
:deep(.moment-field__input-root .wd-input__value) {
  @include wot-paper-control-value;
}

:deep(.moment-field__textarea-root .wd-textarea__value) {
  @include wot-paper-textarea-value;
}

:deep(.moment-field__input-inner) {
  @include wot-paper-input-inner;
}

:deep(.moment-field__textarea-box),
:deep(.moment-field__textarea-inner) {
  min-height: var(--app-textarea-min-height);
}

:deep(.moment-field__textarea-inner) {
  @include wot-paper-textarea-inner;
}

:deep(.moment-field__input-root.is-disabled),
:deep(.moment-field__textarea-root.is-disabled) {
  @include wot-paper-control-disabled;
}

.moment-choice__label {
  display: block;
  width: 100%;
}

.moment-preview-placeholder {
  padding: var(--app-space-6) var(--app-field-padding-x);
  border: var(--app-panel-border-width) dashed var(--app-divider);
  border-radius: var(--app-radius-input);
  background: var(--app-field);
}

.moment-edit-actions {
  gap: var(--app-space-6);
  padding-top: var(--app-space-3);
}

.keyboard-spacer {
  flex-shrink: 0;
}
</style>
