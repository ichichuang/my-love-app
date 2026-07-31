<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="小约定" nav-eyebrow="我们的清单" nav-show-back nav-variant="page">
    <template #nav-actions>
      <wd-button size="small" plain @click="goTaskEdit">加一件事</wd-button>
    </template>

    <view class="tasks-intro app-reveal-1">
      <text class="tasks-intro__title">以后想一起做的事，慢慢勾上</text>
      <text class="tasks-intro__body">不是压力清单，是给未来留的位置。</text>
    </view>

    <view v-if="loading" class="tasks-status app-anim-breath">
      <text>正在翻我们的小清单…</text>
    </view>

    <empty-state
      v-else-if="hasError"
      title="小清单暂时没翻到"
      body="可能是网络慢了一点，稍后再试一次。"
    >
      <wd-button custom-class="tasks-state__button" @click="loadTasks">再试一次</wd-button>
    </empty-state>

    <view v-else class="tasks-content">
      <view v-if="showProgress" class="tasks-progress app-reveal-1">
        <view class="tasks-progress__head">
          <view class="tasks-progress__copy">
            <text class="tasks-progress__title">{{ progressTitle }}</text>
            <text class="tasks-progress__body">小约定慢慢完成中</text>
          </view>
          <text class="tasks-progress__note">{{ undoneCountText }}</text>
        </view>
        <view class="tasks-progress__track">
          <view class="tasks-progress__bar" :style="{ width: progressWidth }" />
        </view>
      </view>

      <empty-state
        v-if="tasks.length === 0"
        title="先写下一件想一起做的事"
        body="可以是一次散步、一顿饭，也可以是一个以后再慢慢实现的小愿望。"
      >
        <wd-button custom-class="tasks-state__button" @click="goTaskEdit">加一件事</wd-button>
      </empty-state>

      <template v-else>
        <view class="tasks-filter-bar" :style="stickySectionStyle">
          <app-option-group :columns="3" responsive="auto">
            <app-option-button
              v-for="option in filterOptions"
              :key="option.value"
              :active="activeFilter === option.value"
              @click="setActiveFilter(option.value)"
            >
              <text>{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <app-animated-swap :value="activeFilter" v-slot="{ displayValue: currentFilter, phase }">
          <view class="tasks-swap-container">
            <template v-if="getFilteredTasks(currentFilter).length === 0">
              <view v-if="isFilterBackfilling" class="tasks-status app-anim-breath">
                <text>正在翻这个清单里的小约定……</text>
              </view>

              <empty-state
                v-else-if="isFilterBackfillPaused"
                title="后面可能还有这个分类的小约定"
                body="刚自动翻了几页都没翻到，可以再往后找找。"
              >
                <wd-button custom-class="tasks-state__button" @click="continueFilterBackfill">继续翻找</wd-button>
              </empty-state>

              <empty-state
                v-else
                title="这个小分类暂时空着"
                body="换个分类看看，或者再写下一件想一起做的小事。"
              >
                <wd-button custom-class="tasks-state__button" @click="goTaskEdit">加一件事</wd-button>
              </empty-state>
            </template>

            <view v-else class="task-list">
              <view
                v-for="(task, index) in getFilteredTasks(currentFilter)"
                :key="`${currentFilter}-${task.id}`"
                class="task-card app-rise-stagger app-ticket-stump"
                :class="{
                  'task-card--done': task.taskDone,
                  'app-card-exit': phase === 'leaving'
                }"
                :style="{ animationDelay: phase === 'leaving' ? '0s' : `calc(var(--app-stagger-reveal) * ${index})` }"
                hover-class="task-card--pressed"
                @click="openTask(task.id)"
              >
                <view class="app-ticket-stump__punch app-ticket-stump__punch--left" />
                <view class="app-ticket-stump__punch app-ticket-stump__punch--right" />
                <view class="task-card__paper-corner" />
                <view class="task-card__head">
                  <view class="task-card__title-group">
                    <text class="task-card__status" :class="task.statusClass">{{ task.statusLabel }}</text>
                    <text class="task-card__title">{{ task.title }}</text>
                  </view>
                  <view v-if="task.taskDone" class="app-stamp-mark app-stamp-mark--success">约定达成</view>
                  <text v-else class="task-card__stamp">{{ task.stampText }}</text>
                </view>

                <text v-if="task.content" class="task-card__content">{{ task.content }}</text>

                <view v-if="task.taskDueDateLabel || task.taskCompletedAtLabel" class="task-card__meta">
                  <text v-if="task.taskDueDateLabel" class="task-card__meta-item">{{ task.taskDueDateLabel }}</text>
                  <text v-if="task.taskCompletedAtLabel" class="task-card__meta-item task-card__meta-item--done">
                    {{ task.taskCompletedAtLabel }}
                  </text>
                </view>

                <view class="task-card__actions" @click.stop>
                  <wd-button
                    size="small"
                    plain
                    :type="task.actionType"
                    :loading="isTaskToggling(task.id)"
                    :disabled="isTaskToggling(task.id)"
                    custom-class="task-card__action"
                    @click.stop="toggleTask(task)"
                  >
                    {{ task.actionLabel }}
                  </wd-button>
                </view>
              </view>
            </view>
          </view>
        </app-animated-swap>
      </template>

      <template v-if="tasks.length > 0">
        <view v-if="loadingMore" class="tasks-list-footer tasks-list-footer--loading">
          <wd-loading size="20" />
          <text>正在翻后面的小约定…</text>
        </view>

        <view
          v-else-if="loadMoreError"
          class="tasks-list-footer tasks-list-footer--retry"
          @click="retryLoadMoreTasks"
        >
          <text>后面的小约定暂时没拿到，请再试一次。</text>
        </view>

        <view v-else-if="!hasMore" class="tasks-list-footer">
          <text>没有更多啦~</text>
        </view>
      </template>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue"
import { onPullDownRefresh, onReachBottom, onShow } from "@dcloudio/uni-app"
import { showAppSuccess, showAppWarning } from "@/composables/useAppToast"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { usePaginatedList } from "@/composables/usePaginatedList"
import { consumeRouteFeedback } from "@/composables/useRouteFeedback"
import { useStickySectionOffset } from "@/composables/useStickySectionOffset"
import { consumeTimelineNeedsRefresh } from "@/composables/useTimelineRefreshSignal"
import { appConfig } from "@/config/app"
import { countDocuments } from "@/services/cloudbase"
import { dataCacheKeys } from "@/services/data-cache"
import {
  compareTasks,
  listTasksPage,
  TASK_PAGINATION_CACHE_VERSION,
  toggleTaskDone,
  type TaskListCursor,
  type TaskRecord
} from "@/services/repositories/tasks"

const theme = useNativeChromeSync()
const { stickySectionStyle } = useStickySectionOffset()
const tasksRoute = "/pages/tasks/tasks"

type FilterValue = "all" | "undone" | "done"

interface TaskListItem extends TaskRecord {
  actionLabel: string
  actionType: "primary" | "success"
  stampText: string
  statusClass: string
  statusLabel: string
  taskCompletedAtLabel: string
  taskDueDateLabel: string
}

const {
  items: tasks,
  initialLoading: loading,
  refreshing,
  loadingMore,
  revalidating,
  hasMore,
  loadMoreError,
  errorMessage,
  refresh,
  loadMore,
  retryLoadMore,
  syncFromCache,
  replaceItem
} = usePaginatedList<TaskRecord, TaskListCursor>({
  loadPage: listTasksPage,
  getItemId: (item) => item.id,
  compareItems: compareTasks,
  compareCursors: (left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id),
  revalidateOnCacheRestore: true,
  cacheKey: dataCacheKeys.taskPagination,
  cacheVersion: TASK_PAGINATION_CACHE_VERSION,
  fallbackMessages: {
    initial: "小约定暂时没翻到，请稍后再试。",
    refresh: "小约定暂时没更新好，请稍后再试。",
    loadMore: "后面的小约定暂时没拿到，请稍后再试。"
  },
  debugTag: "tasks"
})
const activeFilter = shallowRef<FilterValue>("all")
const togglingById = shallowRef<Partial<Record<string, boolean>>>({})

const filterOptions: Array<{
  label: string
  value: FilterValue
}> = [
  {
    label: "全部",
    value: "all"
  },
  {
    label: "未完成",
    value: "undone"
  },
  {
    label: "已完成",
    value: "done"
  }
]

const formatDateText = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return ""
  }

  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`
}

const formatTimestampText = (timestamp?: number): string => {
  if (typeof timestamp !== "number" || timestamp <= 0) {
    return ""
  }

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

type TaskCountState =
  | { status: "loading" }
  | { status: "ready"; total: number; done: number }
  | { status: "error" }

const taskCountState = shallowRef<TaskCountState>({ status: "loading" })

const loadTaskCounts = async (): Promise<void> => {
  try {
    const [total, done] = await Promise.all([
      countDocuments(appConfig.entriesCollection, {
        where: { coupleId: appConfig.coupleId, kind: "task" }
      }),
      countDocuments(appConfig.entriesCollection, {
        where: { coupleId: appConfig.coupleId, kind: "task", taskDone: true }
      })
    ])
    taskCountState.value = { status: "ready", total, done }
  } catch {
    taskCountState.value = { status: "error" }
  }
}

const showProgress = computed(() => {
  const state = taskCountState.value
  if (state.status === "ready") {
    return state.total > 0
  }

  return tasks.value.length > 0
})

const progressTitle = computed(() => {
  const state = taskCountState.value
  if (state.status === "ready") {
    return `已经轻轻勾上 ${state.done} / ${state.total}`
  }

  return state.status === "loading" ? "正在整理小约定数量" : "数量暂时没整理好"
})

const undoneCountText = computed(() => {
  const state = taskCountState.value
  if (state.status !== "ready" || state.total === 0) {
    return ""
  }

  const undone = state.total - state.done
  return undone > 0 ? `还有 ${undone} 件等我们` : "这页小约定都收好啦"
})

const progressWidth = computed(() => {
  const state = taskCountState.value
  if (state.status !== "ready" || state.total <= 0) {
    return "0%"
  }

  return `${Math.round((state.done / state.total) * 100)}%`
})

const decoratedTasks = computed<TaskListItem[]>(() =>
  tasks.value.map((task) => {
    const completedAtText = formatTimestampText(task.taskCompletedAt)
    const dueDateText = formatDateText(task.taskDueDate)

    return {
      ...task,
      actionLabel: task.taskDone ? "放回清单" : "轻轻勾上",
      actionType: task.taskDone ? "primary" : "success",
      stampText: task.taskDone ? "收好" : "待勾",
      statusClass: task.taskDone ? "task-card__status--done" : "task-card__status--undone",
      statusLabel: task.taskDone ? "已经勾上" : "还在等我们",
      taskCompletedAtLabel: completedAtText ? `${completedAtText}轻轻勾上` : "",
      taskDueDateLabel: dueDateText ? `想 ${dueDateText} 完成` : ""
    }
  })
)

const filteredTasks = computed(() => {
  if (activeFilter.value === "done") {
    return decoratedTasks.value.filter((task) => task.taskDone)
  }

  if (activeFilter.value === "undone") {
    return decoratedTasks.value.filter((task) => !task.taskDone)
  }

  return decoratedTasks.value
})

const getFilteredTasks = (filterVal: FilterValue) => {
  if (filterVal === "done") {
    return decoratedTasks.value.filter((task) => task.taskDone)
  }
  if (filterVal === "undone") {
    return decoratedTasks.value.filter((task) => !task.taskDone)
  }
  return decoratedTasks.value
}

const hasError = computed(() => errorMessage.value.length > 0 && tasks.value.length === 0)

const loadTasks = async (notifyFailure = false) => {
  await refresh()
  void loadTaskCounts()
  if (notifyFailure && errorMessage.value.length > 0) {
    showAppWarning("小约定暂时没更新好，请稍后再试。")
  }
  uni.stopPullDownRefresh()
}

const setActiveFilter = (filter: FilterValue) => {
  resetFilterBackfill()
  activeFilter.value = filter
}

const isTaskToggling = (id: string): boolean => togglingById.value[id] === true

const setTaskToggling = (id: string, toggling: boolean) => {
  const nextState = { ...togglingById.value }

  if (toggling) {
    nextState[id] = true
  } else {
    delete nextState[id]
  }

  togglingById.value = nextState
}

const toggleTask = async (task: TaskRecord) => {
  if (isTaskToggling(task.id)) {
    return
  }

  const nextDone = !task.taskDone
  setTaskToggling(task.id, true)

  try {
    const nextTask = await toggleTaskDone(task.id, nextDone)
    replaceItem(nextTask)
    const state = taskCountState.value
    if (state.status === "ready") {
      taskCountState.value = { ...state, done: Math.max(0, state.done + (nextDone ? 1 : -1)) }
    }
    showAppSuccess(nextDone ? "已经轻轻勾上。" : "已经放回清单。")
  } catch {
    showAppWarning("小约定暂时没改好，请稍后再试。")
  } finally {
    setTaskToggling(task.id, false)
  }
}

const goTaskEdit = () => {
  uni.navigateTo({
    url: "/pages/task-edit/task-edit"
  })
}

const openTask = (id: string) => {
  uni.navigateTo({
    url: `/pages/task-edit/task-edit?id=${encodeURIComponent(id)}`
  })
}

const loadMoreTasks = () => {
  if (loading.value || refreshing.value || loadingMore.value || !hasMore.value) {
    return
  }

  void loadMore()
}

const retryLoadMoreTasks = () => {
  void retryLoadMore()
}

const FILTER_BACKFILL_PAGE_LIMIT = 4
const backfillPagesWithoutMatch = shallowRef(0)
const backfillPaused = shallowRef(false)

const resetFilterBackfill = () => {
  backfillPagesWithoutMatch.value = 0
  backfillPaused.value = false
}

const isFilterBackfilling = computed(
  () =>
    loading.value ||
    refreshing.value ||
    revalidating.value ||
    loadingMore.value ||
    (hasMore.value && !backfillPaused.value && !loadMoreError.value)
)

const isFilterBackfillPaused = computed(
  () =>
    hasMore.value &&
    (backfillPaused.value || loadMoreError.value) &&
    !loading.value &&
    !refreshing.value &&
    !revalidating.value &&
    !loadingMore.value
)

const continueFilterBackfill = () => {
  resetFilterBackfill()
  if (loadMoreError.value) {
    void retryLoadMore()
  }
}

// Auto-backfill pages while the active filter has no matching items yet, up to
// FILTER_BACKFILL_PAGE_LIMIT consecutive pages; the user can then continue manually.
watch(
  [filteredTasks, hasMore, loadingMore, loading, refreshing, revalidating, loadMoreError, backfillPaused],
  () => {
    if (filteredTasks.value.length > 0) {
      resetFilterBackfill()
      return
    }

    if (!hasMore.value || backfillPaused.value || loadMoreError.value) {
      return
    }

    if (loadingMore.value || loading.value || refreshing.value || revalidating.value) {
      return
    }

    if (backfillPagesWithoutMatch.value >= FILTER_BACKFILL_PAGE_LIMIT) {
      backfillPaused.value = true
      return
    }

    backfillPagesWithoutMatch.value += 1
    void loadMore()
  }
)

void loadTaskCounts()

onShow(() => {
  consumeRouteFeedback(tasksRoute)
  if (consumeTimelineNeedsRefresh(tasksRoute)) {
    void syncFromCache()
    void loadTaskCounts()
  }
})

onPullDownRefresh(() => {
  void loadTasks(true)
})

onReachBottom(() => {
  loadMoreTasks()
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.tasks-intro {
  @include panel;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  margin-bottom: var(--app-form-gap);
  padding: var(--app-card-padding);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.tasks-intro__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.tasks-intro__body {
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.tasks-status {
  @include panel;
  padding: var(--app-empty-padding-y) var(--app-empty-padding-x);
  color: var(--app-text-soft);
  font: var(--app-font-body);
  text-align: center;
}

.tasks-content,
.task-list {
  display: flex;
  flex-direction: column;
}

.tasks-content {
  gap: var(--app-form-gap);
}

.tasks-filter-bar {
  @include sticky-section;
  padding: var(--app-space-4) var(--app-space-0);
}

.tasks-progress {
  @include panel;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-8);
  padding: var(--app-card-padding);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-accent-soft));
}

.tasks-progress__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.tasks-progress__copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--app-space-3);
}

.tasks-progress__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.tasks-progress__body,
.tasks-progress__note {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.tasks-progress__note {
  flex-shrink: 0;
}

.tasks-progress__track {
  overflow: hidden;
  height: var(--app-space-3);
  border-radius: var(--app-radius-pill);
  background: var(--app-field);
}

.tasks-progress__bar {
  height: 100%;
  border-radius: inherit;
  background: var(--app-accent);
  transition: width var(--app-transition-normal);
}

.task-list {
  gap: var(--app-list-gap);
}

.tasks-list-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-4);
  margin-top: var(--app-list-gap);
  padding: var(--app-space-6) var(--app-space-0);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.tasks-list-footer--loading {
  color: var(--app-text-muted);
}

.tasks-list-footer--retry {
  @include pressable;
  color: var(--app-accent);
}

.task-card {
  @include panel;
  @include pressable;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-8);
  padding: var(--app-card-padding);
  overflow: hidden;
  transition: transform var(--app-duration-normal) var(--app-ease-bounce), opacity var(--app-transition-fast), background-color var(--app-transition-normal), border-color var(--app-transition-normal), box-shadow var(--app-transition-normal);
}

.task-card::before {
  position: absolute;
  top: var(--app-space-8);
  left: var(--app-card-padding);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  background: var(--app-color-blue-person);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-4deg);
}

.task-card--done {
  background: var(--app-surface-strong);
}

.task-card--pressed {
  opacity: var(--app-press-opacity);
  box-shadow: var(--app-shadow-image);
  transform: scale(var(--app-press-scale-strong)) rotate(-0.6deg);
}

.task-card__paper-corner {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-28);
  height: var(--app-space-28);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-bottom-left-radius: var(--app-radius-lg);
  background: var(--app-field);
  opacity: var(--app-muted-opacity);
}

.task-card__head {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.task-card__title-group {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--app-space-5);
}

.task-card__status,
.task-card__stamp,
.task-card__meta-item {
  align-self: flex-start;
  padding: var(--app-space-2) var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-badge);
  background: var(--app-field);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-none);
}

.task-card__status--undone {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.task-card__status--done,
.task-card__meta-item--done {
  border-color: var(--app-success);
  background: var(--app-success-soft);
  color: var(--app-success);
}

.task-card__title {
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.task-card--done .task-card__title,
.task-card--done .task-card__content {
  color: var(--app-text-soft);
}

.task-card__stamp {
  flex-shrink: 0;
  border-color: var(--app-border-strong);
  color: var(--app-accent);
  transform: rotate(4deg);
}

.task-card__content {
  position: relative;
  display: -webkit-box;
  overflow: hidden;
  color: var(--app-text-soft);
  font: var(--app-font-body);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.task-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-5);
}

.task-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-5);
}

:deep(.task-card__action) {
  min-height: var(--app-control-scale-xs);
  border-radius: var(--app-radius-badge);
  box-shadow: var(--app-shadow-none);
  font: var(--app-font-caption);
}

:deep(.tasks-state__button) {
  margin-top: var(--app-card-padding);
}
</style>
