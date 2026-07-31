<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="她的小档案" nav-eyebrow="小线索本" nav-show-back nav-variant="page">
    <template #nav-actions>
      <wd-button size="small" plain @click="goMemoEdit">记一条</wd-button>
    </template>

    <view class="memos-page">
      <view class="memos-intro app-reveal-1">
        <view class="memos-intro__paper-corner" />
        <view class="memos-intro__head">
          <view class="memos-intro__copy">
            <text class="memos-intro__kicker">她的小档案</text>
            <text class="memos-intro__title">喜欢什么、怕踩雷什么，都悄悄收在这里。</text>
            <text class="memos-intro__body">有旧纸条就先翻旧纸条，新的那几张会在背后慢慢补上。</text>
          </view>
          <text class="memos-intro__stamp">小线索本</text>
        </view>

        <view class="memos-intro__foot">
          <text class="memos-intro__note">{{ introNote }}</text>
        </view>
      </view>

      <view v-if="loading" class="memos-status app-anim-breath">
        <text>正在翻她的小线索…</text>
      </view>

      <empty-state
        v-else-if="hasError"
        title="小线索暂时没翻到"
        body="可能是网络慢了一点，稍后再试一次。"
      >
        <wd-button custom-class="memos-state__button" @click="loadMemos()">再试一次</wd-button>
      </empty-state>

      <view v-else class="memos-content">

        <view v-if="memos.length > 0" class="memos-filter-strip" :style="stickySectionStyle">
          <app-option-group :columns="3" responsive="auto">
            <app-option-button
              v-for="option in filterOptions"
              :key="option.value"
              class="memos-filter-button"
              :active="activeFilter === option.value"
              @click="setActiveFilter(option.value)"
            >
              <text>{{ option.label }}</text>
            </app-option-button>
          </app-option-group>
        </view>

        <empty-state
          v-if="memos.length === 0"
          title="先记下第一条小线索"
          body="比如她喜欢什么花、什么饮料，或者是什么星座。"
        >
          <wd-button custom-class="memos-state__button" @click="goMemoEdit">记一条小线索</wd-button>
        </empty-state>

        <app-animated-swap :value="activeFilter" v-slot="{ displayValue: currentFilter, phase }">
          <view class="memos-swap-container">
            <template v-if="getFilteredMemos(currentFilter).length === 0">
              <view v-if="isFilterBackfilling" class="memos-status app-anim-breath">
                <text>正在翻这个标签里的内容……</text>
              </view>

              <empty-state
                v-else-if="isFilterBackfillPaused"
                title="后面可能还有这个分类的内容"
                body="刚自动翻了几页都没翻到，可以再往后找找。"
              >
                <wd-button custom-class="memos-state__button" @click="continueFilterBackfill">继续翻找</wd-button>
              </empty-state>

              <empty-state
                v-else
                title="这个小标签还空着"
                body="换个标签看看，或者先记下一条新的小线索。"
              >
                <wd-button custom-class="memos-state__button" @click="goMemoEdit">记一条小线索</wd-button>
              </empty-state>
            </template>

            <view v-else class="memo-list">
              <view
                v-for="(memo, index) in getFilteredMemos(currentFilter)"
                :key="`${currentFilter}-${memo.id}`"
                class="memo-card app-rise-stagger"
                :class="{
                  'memo-card--pinned': memo.memoPinned,
                  'app-card-exit': phase === 'leaving'
                }"
                :style="{ animationDelay: phase === 'leaving' ? '0s' : `calc(var(--app-stagger-reveal) * ${index})` }"
                hover-class="memo-card--pressed"
                @click="openMemo(memo.id)"
              >
                <view class="memo-card__paper-corner" />
                <view class="memo-card__head">
                  <view class="memo-card__title-group">
                    <text class="memo-card__category">{{ memo.categoryLabel }}</text>
                    <text class="memo-card__title">{{ memo.title }}</text>
                  </view>
                  <text class="memo-card__stamp" :class="{ 'memo-card__stamp--pinned': memo.memoPinned }">
                    {{ memo.stampText }}
                  </text>
                </view>

                <text v-if="memo.content" class="memo-card__content">{{ memo.content }}</text>

                <view class="memo-card__foot">
                  <text v-if="memo.dateLabel" class="memo-card__date">{{ memo.dateLabel }}</text>

                  <view class="memo-card__actions" @click.stop>
                    <wd-button
                      size="small"
                      plain
                      :type="memo.memoPinned ? 'primary' : 'default'"
                      :loading="isMemoPinUpdating(memo.id)"
                      :disabled="isMemoPinUpdating(memo.id)"
                      custom-class="memo-card__action"
                      @click.stop="changeMemoPinned(memo)"
                    >
                      {{ memo.actionLabel }}
                    </wd-button>
                  </view>
                </view>
                <view class="app-drawer-handle" aria-hidden="true" />
              </view>
            </view>
          </view>
        </app-animated-swap>

        <template v-if="memos.length > 0">
          <view v-if="loadingMore" class="memos-list-footer memos-list-footer--loading">
            <wd-loading size="20" />
            <text>正在翻后面的小线索…</text>
          </view>

          <view
            v-else-if="loadMoreError"
            class="memos-list-footer memos-list-footer--retry"
            @click="retryLoadMoreMemos"
          >
            <text>后面的小线索暂时没拿到，请再试一次。</text>
          </view>

          <view v-else-if="!hasMore" class="memos-list-footer">
            <text>没有更多啦~</text>
          </view>
        </template>
      </view>
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
import { dataCacheKeys } from "@/services/data-cache"
import {
  compareMemos,
  listMemosPage,
  MEMO_PAGINATION_CACHE_VERSION,
  memoCategoryLabels,
  toggleMemoPinned,
  type MemoCategory,
  type MemoListCursor,
  type MemoRecord
} from "@/services/repositories/memos"

const theme = useNativeChromeSync()
const { stickySectionStyle } = useStickySectionOffset()
const memosRoute = "/pages/memos/memos"

type FilterValue = "all" | MemoCategory

interface MemoListItem extends MemoRecord {
  actionLabel: string
  categoryLabel: string
  dateLabel: string
  stampText: string
}

const {
  items: memos,
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
} = usePaginatedList<MemoRecord, MemoListCursor>({
  loadPage: listMemosPage,
  getItemId: (item) => item.id,
  compareItems: compareMemos,
  compareCursors: (left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id),
  revalidateOnCacheRestore: true,
  cacheKey: dataCacheKeys.memoPagination,
  cacheVersion: MEMO_PAGINATION_CACHE_VERSION,
  fallbackMessages: {
    initial: "小线索暂时没翻到，请稍后再试。",
    refresh: "小线索暂时没更新好，请稍后再试。",
    loadMore: "后面的小线索暂时没拿到，请稍后再试。"
  },
  debugTag: "memos"
})
const activeFilter = shallowRef<FilterValue>("all")
const pinUpdatingById = shallowRef<Partial<Record<string, boolean>>>({})

const filterOptions: Array<{
  label: string
  value: FilterValue
}> = [
  {
    label: "全部",
    value: "all"
  },
  {
    label: memoCategoryLabels.favorite,
    value: "favorite"
  },
  {
    label: memoCategoryLabels.profile,
    value: "profile"
  },
  {
    label: memoCategoryLabels.avoid,
    value: "avoid"
  },
  {
    label: memoCategoryLabels.gift,
    value: "gift"
  },
  {
    label: memoCategoryLabels.date,
    value: "date"
  },
  {
    label: memoCategoryLabels.note,
    value: "note"
  }
]

const formatDateText = (timestamp: number): string => {
  if (timestamp <= 0) {
    return ""
  }

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const formatOccurredAtText = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return ""
  }

  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`
}

const resolveMemoDateLabel = (memo: MemoRecord): string => {
  const updatedAtText = formatDateText(memo.updatedAt)
  const createdAtText = formatDateText(memo.createdAt) || formatOccurredAtText(memo.occurredAt)

  if (updatedAtText && memo.updatedAt > memo.createdAt) {
    return `更新于 ${updatedAtText}`
  }

  return createdAtText ? `记于 ${createdAtText}` : ""
}

const decoratedMemos = computed<MemoListItem[]>(() =>
  memos.value.map((memo) => ({
    ...memo,
    actionLabel: memo.memoPinned ? "放回纸堆" : "贴到上面",
    categoryLabel: memoCategoryLabels[memo.memoCategory],
    dateLabel: resolveMemoDateLabel(memo),
    stampText: memo.memoPinned ? "常看" : "小纸条"
  }))
)

const filteredMemos = computed(() => {
  if (activeFilter.value === "all") {
    return decoratedMemos.value
  }

  return decoratedMemos.value.filter((memo) => memo.memoCategory === activeFilter.value)
})

const getFilteredMemos = (filterVal: FilterValue) => {
  if (filterVal === "all") {
    return decoratedMemos.value
  }
  return decoratedMemos.value.filter((memo) => memo.memoCategory === filterVal)
}

const hasError = computed(() => errorMessage.value.length > 0 && memos.value.length === 0)

const introNote = computed(() => {
  if (refreshing.value && memos.value.length > 0) {
    return "旧纸条先给你翻着，新的那几张在悄悄补。"
  }

  if (memos.value.length > 0) {
    return hasMore.value
      ? `已加载 ${memos.value.length} 张小线索，后面还在继续翻。`
      : `已经收着 ${memos.value.length} 张小线索。`
  }

  return "先把第一张小线索夹进来，之后慢慢翻。"
})

const loadMemos = async (notifyFailure = false) => {
  await refresh()
  if (notifyFailure && errorMessage.value.length > 0) {
    showAppWarning("小线索暂时没更新好，请稍后再试。")
  }
  uni.stopPullDownRefresh()
}

const setActiveFilter = (filter: FilterValue) => {
  resetFilterBackfill()
  activeFilter.value = filter
}

const isMemoPinUpdating = (id: string): boolean => pinUpdatingById.value[id] === true

const setMemoPinUpdating = (id: string, updating: boolean) => {
  const nextState = { ...pinUpdatingById.value }

  if (updating) {
    nextState[id] = true
  } else {
    delete nextState[id]
  }

  pinUpdatingById.value = nextState
}

const changeMemoPinned = async (memo: MemoRecord) => {
  if (isMemoPinUpdating(memo.id)) {
    return
  }

  const nextPinned = !memo.memoPinned
  setMemoPinUpdating(memo.id, true)

  try {
    const nextMemo = await toggleMemoPinned(memo.id, nextPinned)
    replaceItem(nextMemo)
    showAppSuccess(nextPinned ? "已经贴到上面。" : "已经放回纸堆。")
  } catch {
    showAppWarning("这张小线索暂时没贴好，请稍后再试。")
  } finally {
    setMemoPinUpdating(memo.id, false)
  }
}

const goMemoEdit = () => {
  uni.navigateTo({
    url: "/pages/memo-edit/memo-edit"
  })
}

const openMemo = (id: string) => {
  uni.navigateTo({
    url: `/pages/memo-edit/memo-edit?id=${encodeURIComponent(id)}`
  })
}

const loadMoreMemos = () => {
  if (loading.value || refreshing.value || loadingMore.value || !hasMore.value) {
    return
  }

  void loadMore()
}

const retryLoadMoreMemos = () => {
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
  [filteredMemos, hasMore, loadingMore, loading, refreshing, revalidating, loadMoreError, backfillPaused],
  () => {
    if (filteredMemos.value.length > 0) {
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

onShow(() => {
  consumeRouteFeedback(memosRoute)
  if (consumeTimelineNeedsRefresh(memosRoute)) {
    void syncFromCache()
  }
})

onPullDownRefresh(() => {
  void loadMemos(true)
})

onReachBottom(() => {
  loadMoreMemos()
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.memos-page,
.memos-intro,
.memos-intro__copy,
.memos-intro__foot,
.memos-content,
.memos-filters,
.memos-filters__head,
.memo-list,
.memo-card,
.memo-card__title-group {
  display: flex;
  flex-direction: column;
}

.memos-page {
  gap: var(--app-form-gap);
  padding-bottom: var(--app-card-padding);
}

.memos-intro,
.memos-status,
.memos-filter-strip,
.memo-card {
  @include panel;
}

.memos-intro {
  position: relative;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
  overflow: hidden;
}

.memos-intro {
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.memos-intro::before,
.memo-card::before {
  position: absolute;
  left: var(--app-card-padding);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-4deg);
}

.memos-intro::before {
  top: var(--app-card-padding);
  background: var(--app-color-blue-person);
}

.memos-intro__paper-corner,
.memo-card__paper-corner {
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

.memos-intro__head,
.memo-card__head,
.memo-card__foot {
  position: relative;
  display: flex;
  gap: var(--app-space-8);
}

.memos-intro__head,
.memo-card__head {
  z-index: 1;
  align-items: flex-start;
  justify-content: space-between;
}

.memos-intro__copy {
  min-width: 0;
  gap: var(--app-space-3);
  padding-top: var(--app-space-8);
}

.memos-intro__kicker {
  @include label;
  display: block;
  color: var(--app-accent);
}

.memos-intro__title,
.memos-filters__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.memos-intro__body,
.memos-filters__body {
  display: block;
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.memos-intro__stamp,
.memo-card__stamp {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-border-strong);
  border-radius: var(--app-radius-badge);
  background: var(--app-field);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  transform: rotate(4deg);
}

.memos-intro__stamp {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.memos-intro__foot {
  position: relative;
  z-index: 1;
  gap: var(--app-space-4);
  padding: var(--app-space-6) var(--app-field-padding-x);
  border: var(--app-panel-border-width) dashed var(--app-divider);
  border-radius: var(--app-radius-input);
  background: var(--app-field);
}

.memos-intro__note {
  display: block;
  color: var(--app-accent);
  font: var(--app-font-caption);
}

.memos-status {
  padding: var(--app-empty-padding-y) var(--app-empty-padding-x);
  color: var(--app-text-soft);
  font: var(--app-font-body);
  text-align: center;
}

.memos-content {
  gap: var(--app-form-gap);
}

.memos-filter-strip {
  @include sticky-section;
  padding: var(--app-space-5);
  background: var(--app-surface);
}



.memos-filter-button {
  min-height: var(--app-control-height-sm);
}

.memo-list {
  gap: var(--app-list-gap);
}

.memos-list-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-4);
  margin-top: var(--app-list-gap);
  padding: var(--app-space-6) var(--app-space-0);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.memos-list-footer--loading {
  color: var(--app-text-muted);
}

.memos-list-footer--retry {
  @include pressable;
  color: var(--app-accent);
}

.memo-card {
  @include pressable;
  position: relative;
  gap: var(--app-space-7);
  padding: var(--app-card-padding);
  overflow: hidden;
  background:
    linear-gradient(180deg, var(--app-surface), var(--app-surface-strong));
  transition: transform var(--app-duration-normal) var(--app-ease-bounce), opacity var(--app-transition-fast), background-color var(--app-transition-normal), border-color var(--app-transition-normal), box-shadow var(--app-transition-normal);
}

.memo-card::before {
  top: var(--app-space-8);
  background: var(--app-color-blue-person);
}

.memo-card--pinned {
  background:
    linear-gradient(180deg, var(--app-surface), var(--app-primary-soft));
}

.memo-card--pinned::before {
  background: var(--app-primary);
}

.memo-card--pressed {
  opacity: var(--app-press-opacity);
  box-shadow: var(--app-shadow-image);
  transform: scale(var(--app-press-scale-strong)) rotate(-0.6deg);
}

.memo-card__title-group {
  min-width: 0;
  flex: 1;
  gap: var(--app-space-5);
}

.memo-card__category,
.memo-card__date {
  align-self: flex-start;
  padding: var(--app-space-2) var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-badge);
  background: var(--app-field);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-none);
}

.memo-card__category {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.memo-card__stamp--pinned {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.memo-card__title {
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.memo-card__content {
  display: -webkit-box;
  overflow: hidden;
  color: var(--app-text-soft);
  font: var(--app-font-body);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.memo-card__foot {
  align-items: center;
  justify-content: space-between;
}

.memo-card__date {
  background: var(--app-surface-strong);
}

.memo-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-5);
  margin-left: auto;
}

:deep(.memo-card__action) {
  min-height: var(--app-control-scale-xs);
  border-radius: var(--app-radius-badge);
  box-shadow: var(--app-shadow-none);
  font: var(--app-font-caption);
}

:deep(.memos-state__button) {
  margin-top: var(--app-card-padding);
}
</style>
