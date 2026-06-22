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
      <wd-button size="small" plain :disabled="formDisabled" @click="backToTasks">{{ backActionText }}</wd-button>
    </template>

    <view v-if="loading" class="task-edit-status">
      <text>正在翻这张小票根…</text>
    </view>

    <empty-state
      v-else-if="hasLoadError"
      title="这件小事暂时没翻到"
      body="可能是网络慢了一点，稍后再试一次。"
    >
      <view class="task-edit-error__actions">
        <wd-button block :loading="loading" @click="loadTask">再试一次</wd-button>
        <wd-button block plain @click="backToTasks">返回小清单</wd-button>
      </view>
    </empty-state>

    <view v-else class="task-edit">
      <view class="task-ticket" :class="{ 'task-ticket--done': taskDone }">
        <view class="task-ticket__perforation" />
        <view class="task-ticket__head">
          <view class="task-ticket__intro">
            <text class="task-ticket__kicker">小约定票根</text>
            <text class="task-ticket__question">想一起做什么？</text>
            <text class="task-ticket__body">先写下来，什么时候完成都不急。</text>
          </view>
          <text class="task-ticket__stamp">小票根</text>
        </view>

        <view id="task-title-field" class="task-title-slip">
          <view class="task-title-slip__pin task-title-slip__pin--red" />
          <view class="task-title-slip__pin task-title-slip__pin--blue" />
          <wd-input
            v-model="title"
            no-border
            :disabled="formDisabled"
            placeholder="比如：一起去看一场日落"
            :placeholder-style="placeholderStyle"
            :maxlength="48"
            custom-class="task-title-slip__input-root"
            custom-input-class="task-title-slip__input-inner"
            @focus="focusField('#task-title-field')"
            @keyboardheightchange="syncKeyboardHeight"
          />
        </view>

        <view class="task-detail-toggle-row">
          <wd-button
            size="small"
            plain
            :disabled="formDisabled"
            custom-class="task-detail-toggle"
            @click="toggleDetails"
          >
            {{ detailToggleText }}
          </wd-button>
        </view>

        <view v-if="detailsExpanded" class="task-ticket__details">
          <view id="task-content-field" class="task-field">
            <text class="task-field__prompt">想留点什么小备注？</text>
            <wd-textarea
              v-model="content"
              no-border
              :disabled="formDisabled"
              placeholder="留一点小备注"
              :placeholder-style="placeholderStyle"
              :maxlength="240"
              custom-class="task-field__textarea-root"
              custom-textarea-container-class="task-field__textarea-box"
              custom-textarea-class="task-field__textarea-inner"
              @focus="focusField('#task-content-field')"
              @keyboardheightchange="syncKeyboardHeight"
            />
          </view>

          <view id="task-date-field" class="task-field">
            <text class="task-field__prompt">想什么时候去做？</text>
            <text class="task-field__hint">空着也没关系，写了就用 2026-01-01 这样。</text>
            <wd-input
              v-model="taskDueDate"
              no-border
              :disabled="formDisabled"
              placeholder="可以先空着"
              :placeholder-style="placeholderStyle"
              :maxlength="10"
              custom-class="task-field__input-root"
              custom-input-class="task-field__input-inner"
              @focus="focusField('#task-date-field')"
              @keyboardheightchange="syncKeyboardHeight"
            />
          </view>

          <view class="task-ticket__section">
            <view class="task-ticket__section-head">
              <text class="task-ticket__section-title">现在状态</text>
              <text class="task-ticket__section-note">只在小清单里轻轻标记</text>
            </view>
            <app-option-group :columns="2">
              <app-option-button
                v-for="option in statusOptions"
                :key="option.label"
                :active="taskDone === option.value"
                :disabled="formDisabled"
                @click="setTaskDone(option.value)"
              >
                <text class="task-choice__label">{{ option.label }}</text>
              </app-option-button>
            </app-option-group>
          </view>
        </view>

        <view v-if="saved" class="task-saved">
          <text class="task-saved__title">已经轻轻收好</text>
          <text class="task-saved__body">这件小事放进清单啦</text>
        </view>

        <view class="task-edit-actions">
          <wd-button block size="large" :loading="saving" :disabled="formDisabled" @click="saveTask">
            {{ saveButtonText }}
          </wd-button>
          <wd-button
            v-if="canDeleteTask"
            block
            type="text"
            custom-class="task-delete-button"
            @click="confirmDeleteTask"
          >
            删除这件事
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
import { onLoad } from "@dcloudio/uni-app"
import { useMessage } from "wot-design-uni/components/wd-message-box"
import { showAppError, showAppWarning } from "@/composables/useAppToast"
import { useCachedRecord } from "@/composables/useCachedRecord"
import { useKeyboardAvoidance } from "@/composables/useKeyboardAvoidance"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { setRouteSuccessFeedback } from "@/composables/useRouteFeedback"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { dataCacheKeys } from "@/services/data-cache"
import {
  createTask,
  deleteTask,
  getTask,
  isTaskUnavailableError,
  updateTask,
  type TaskDraft,
  type TaskRecord
} from "@/services/repositories/tasks"

const tasksRoute = "/pages/tasks/tasks"
const placeholderStyle = "color: var(--app-text-muted)"
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const theme = useNativeChromeSync()
const message = useMessage()
const { keyboardSpacerStyle, syncKeyboardHeight, focusField } = useKeyboardAvoidance()

const taskId = shallowRef("")
const hasLoadError = shallowRef(false)
const saving = shallowRef(false)
const saved = shallowRef(false)
const deleting = shallowRef(false)
const taskLoaded = shallowRef(false)
const detailsExpanded = shallowRef(false)
const draftDirty = shallowRef(false)
const hydratingDraft = shallowRef(false)
const {
  loading,
  reload: reloadTask
} = useCachedRecord<TaskRecord>({
  cacheKey: () => dataCacheKeys.taskDetail(taskId.value),
  isUnavailableError: isTaskUnavailableError,
  loader: () => getTask(taskId.value)
})

const title = shallowRef("")
const content = shallowRef("")
const taskDueDate = shallowRef("")
const taskDone = shallowRef(false)

const statusOptions: Array<{
  label: string
  value: boolean
}> = [
  {
    label: "未完成",
    value: false
  },
  {
    label: "已完成",
    value: true
  }
]

const isEditMode = computed(() => taskId.value.length > 0)
const canDeleteTask = computed(
  () => isEditMode.value && taskLoaded.value && !hasLoadError.value && !saving.value && !saved.value && !deleting.value
)
const formDisabled = computed(() => saving.value || saved.value || deleting.value)
const pageTitle = computed(() => "小约定票根")
const pageEyebrow = computed(() => (isEditMode.value ? "改一张小计划" : "新的计划"))
const backActionText = computed(() => (isEditMode.value ? "先不改了" : "先不写了"))
const detailToggleText = computed(() => (detailsExpanded.value ? "先收起小细节" : "再加一点小细节"))
const saveButtonText = computed(() => {
  if (saving.value) {
    return "正在轻轻收好"
  }

  if (saved.value) {
    return "已经轻轻收好"
  }

  return isEditMode.value ? "收好这张票根" : "收进小清单"
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
    taskDueDate.value = ""
    taskDone.value = false
    detailsExpanded.value = false
    saved.value = false
    taskLoaded.value = false
  })
}

const shouldExpandTaskDetails = (task: TaskDraft): boolean =>
  task.content.trim().length > 0 || task.taskDueDate.trim().length > 0 || task.taskDone

const toggleDetails = () => {
  detailsExpanded.value = !detailsExpanded.value
  draftDirty.value = true
}

const setTaskDone = (value: boolean) => {
  taskDone.value = value
  saved.value = false
}

const hydrateTask = (task: TaskRecord) => {
  updateDraftWithoutTracking(() => {
    title.value = task.title
    content.value = task.content
    taskDueDate.value = task.taskDueDate
    taskDone.value = task.taskDone
    detailsExpanded.value = shouldExpandTaskDetails(task)
    saved.value = false
    taskLoaded.value = true
  })
}

const loadTask = async () => {
  if (!taskId.value) {
    resetForm()
    hasLoadError.value = false
    return
  }

  hasLoadError.value = false
  taskLoaded.value = false

  try {
    await reloadTask({
      applyCached: hydrateTask,
      applyFresh: hydrateTask,
      canApplyFresh: () => !draftDirty.value && !formDisabled.value
    })
  } catch {
    resetForm()
    hasLoadError.value = true
  }
}

watch(
  [title, content, taskDueDate, taskDone],
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

const backToTasks = () => {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }

  uni.redirectTo({
    url: tasksRoute
  })
}

const buildDraft = (): TaskDraft => ({
  title: title.value,
  content: content.value,
  taskDone: taskDone.value,
  taskDueDate: taskDueDate.value
})

const resolveSaveErrorMessage = (error: unknown): string => {
  const message = getFriendlyErrorMessage(error)
  return message.includes("纪念") ? "小约定暂时没改好，请稍后再试。" : message
}

const saveTask = async () => {
  if (saving.value) {
    return
  }

  if (!title.value.trim()) {
    showAppWarning("先写下一件小事")
    return
  }

  const trimmedDate = taskDueDate.value.trim()
  if (trimmedDate && !datePattern.test(trimmedDate)) {
    showAppWarning("日期先写成 2026-01-01 这样")
    return
  }

  saving.value = true
  saved.value = false
  taskDueDate.value = trimmedDate

  try {
    if (isEditMode.value) {
      await updateTask(taskId.value, buildDraft())
    } else {
      await createTask(buildDraft())
    }

    saving.value = false
    saved.value = true
    setRouteSuccessFeedback(tasksRoute, "这件小事已经轻轻收好")
    backToTasks()
  } catch (error) {
    showAppError(resolveSaveErrorMessage(error))
  } finally {
    if (!saved.value) {
      saving.value = false
    }
  }
}

const deleteCurrentTask = async () => {
  if (!canDeleteTask.value || deleting.value) {
    return
  }

  deleting.value = true

  try {
    await deleteTask(taskId.value)
    setRouteSuccessFeedback(tasksRoute, "已经从小清单移走")
    backToTasks()
  } catch {
    showAppError("这件小事暂时没删掉，请稍后再试。")
  } finally {
    deleting.value = false
  }
}

const confirmDeleteTask = async () => {
  if (!canDeleteTask.value || deleting.value) {
    return
  }

  try {
    await message.confirm({
      title: "删除这件事",
      msg: "这会删除这条必做事项记录。",
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
    await deleteCurrentTask()
  } catch {
    return
  }
}

onLoad((query) => {
  taskId.value = decodeQueryId(query?.id)
  void loadTask()
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.task-edit,
.task-ticket,
.task-ticket__intro,
.task-ticket__details,
.task-ticket__section,
.task-edit-actions,
.task-edit-error__actions,
.task-field,
.task-saved {
  display: flex;
  flex-direction: column;
}

.task-edit {
  gap: var(--app-form-gap);
  padding-bottom: calc(var(--app-card-padding) + env(safe-area-inset-bottom));
}

.task-edit-status,
.task-ticket {
  @include panel;
  padding: var(--app-card-padding);
}

.task-edit-status {
  color: var(--app-text-soft);
  font: var(--app-font-body);
  text-align: center;
}

.task-ticket {
  position: relative;
  gap: var(--app-card-gap);
  overflow: hidden;
}

.task-ticket::before {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-28);
  height: var(--app-space-28);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-bottom-left-radius: var(--app-radius-lg);
  background: var(--app-field);
  content: "";
  opacity: var(--app-muted-opacity);
}

.task-ticket::after {
  position: absolute;
  top: var(--app-card-padding);
  left: var(--app-card-padding);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  background: var(--app-color-blue-person);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-3deg);
}

.task-ticket--done {
  background: var(--app-surface-strong);
}

.task-ticket__perforation {
  position: absolute;
  top: var(--app-space-24);
  right: var(--app-space-14);
  bottom: var(--app-space-24);
  border-left: var(--app-panel-border-width) dashed var(--app-border);
  opacity: var(--app-decor-opacity);
}

.task-ticket__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.task-ticket__intro {
  min-width: 0;
  gap: var(--app-space-3);
  padding-top: var(--app-space-8);
}

.task-ticket__kicker {
  @include label;
  display: block;
  color: var(--app-accent);
}

.task-ticket__question,
.task-ticket__section-title,
.task-field__prompt {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.task-ticket__body,
.task-ticket__section-note,
.task-field__hint {
  display: block;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.task-ticket__stamp {
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

.task-title-slip {
  position: relative;
  z-index: 1;
  padding: var(--app-space-5) var(--app-field-padding-x);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-input);
  background: var(--app-field);
}

.task-title-slip::after {
  position: absolute;
  right: var(--app-field-padding-x);
  bottom: var(--app-space-5);
  left: var(--app-field-padding-x);
  height: var(--app-panel-border-width);
  background: var(--app-divider);
  content: "";
}

.task-title-slip__pin {
  position: absolute;
  top: var(--app-space-6);
  width: var(--app-space-5);
  height: var(--app-space-5);
  border-radius: var(--app-radius-round);
  opacity: var(--app-decor-opacity);
}

.task-title-slip__pin--red {
  left: var(--app-space-6);
  background: var(--app-color-red-person);
}

.task-title-slip__pin--blue {
  right: var(--app-space-6);
  background: var(--app-color-blue-person);
}

:deep(.task-title-slip__input-root) {
  @include wot-paper-inline-input-root;
}

:deep(.task-title-slip__input-root .wd-input__body),
:deep(.task-title-slip__input-root .wd-input__value) {
  @include wot-paper-control-value;
}

:deep(.task-title-slip__input-inner) {
  @include wot-paper-input-inner;
}

.task-detail-toggle-row {
  position: relative;
  z-index: 1;
  display: flex;
}

:deep(.task-detail-toggle) {
  color: var(--app-accent);
  box-shadow: var(--app-shadow-none);
}

:deep(.task-delete-button) {
  color: var(--app-danger);
  box-shadow: var(--app-shadow-none);
}

.task-ticket__details {
  position: relative;
  z-index: 1;
  gap: var(--app-space-7);
  padding-top: var(--app-card-gap);
  border-top: var(--app-panel-border-width) dashed var(--app-divider);
}

.task-ticket__section {
  gap: var(--app-space-7);
  padding-top: var(--app-card-gap);
  border-top: var(--app-panel-border-width) solid var(--app-divider);
}

.task-ticket__section-head,
.task-field {
  gap: var(--app-space-5);
}

:deep(.task-field__input-root),
:deep(.task-field__textarea-root) {
  @include wot-paper-input-root;
}

:deep(.task-field__textarea-root) {
  @include wot-paper-textarea-root;
}

:deep(.task-field__input-root .wd-input__body),
:deep(.task-field__input-root .wd-input__value),
:deep(.task-field__textarea-root .wd-textarea__value) {
  @include wot-paper-control-value;
}

:deep(.task-field__input-inner) {
  @include wot-paper-input-inner;
}

:deep(.task-field__textarea-box),
:deep(.task-field__textarea-inner) {
  min-height: var(--app-textarea-min-height);
}

:deep(.task-field__textarea-inner) {
  @include wot-paper-textarea-inner;
}

:deep(.task-field__input-root.is-disabled),
:deep(.task-field__textarea-root.is-disabled) {
  @include wot-paper-control-disabled;
}

.task-choice__label {
  display: block;
  width: 100%;
}

.task-saved {
  gap: var(--app-space-3);
  padding: var(--app-space-6) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-success);
  border-radius: var(--app-radius-badge);
  background: var(--app-success-soft);
  color: var(--app-success);
  text-align: center;
  box-shadow: var(--app-shadow-none);
}

.task-saved__title {
  font: var(--app-font-section-title);
}

.task-saved__body {
  font: var(--app-font-caption);
}

.task-edit-actions {
  gap: var(--app-space-6);
  padding-top: var(--app-space-3);
  padding-bottom: env(safe-area-inset-bottom);
}

.task-edit-error__actions {
  width: 100%;
  gap: var(--app-space-6);
  margin-top: var(--app-card-padding);
}

.keyboard-spacer {
  flex-shrink: 0;
}
</style>
