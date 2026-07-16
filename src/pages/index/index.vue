<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="小珊的树洞" nav-eyebrow="悄悄停靠处" :nav-show-back="false" nav-variant="home">

    <view class="home-hero app-reveal-1 app-paper-stack">
      <view class="home-hero__top">
        <image class="home-hero__icon" src="/static/logo-couple.png" mode="aspectFit" />
        <view class="home-hero__copy">
          <text class="home-hero__kicker">{{ todayGreeting }}</text>
          <text class="home-hero__title">把今天值得记住的小事收好</text>
        </view>
      </view>

      <text class="home-hero__body">照片、悄悄话、想听的歌和以后要做的事，都安静停靠在这里。</text>

      <view class="home-hero__stamps">
        <text class="home-hero__stamp home-hero__stamp--memory">{{ memoryCountText }}</text>
        <text class="home-hero__stamp">私密</text>
      </view>

      <wd-button block size="large" custom-class="home-hero__button" @click="goCreate">写下此刻</wd-button>
    </view>

    <view class="home-dock">
      <view class="home-dock__head app-reveal-2">
        <text class="home-dock__title">夹在回忆本里的小纸签</text>
        <text class="home-dock__body">点一首，勾一件，慢慢收着。</text>
      </view>

      <view class="home-note-stack">
        <view class="home-note home-note--song app-reveal-soft-3" hover-class="home-note--pressed" @click="goSongs">
          <view class="app-paper-tape app-paper-tape--top-right app-paper-tape--accent" />
          <view class="home-note__mark home-note__mark--song">
            <text>歌</text>
          </view>
          <view class="home-note__copy">
            <text class="home-note__title">小歌单</text>
            <text class="home-note__body">她想听的歌先收着</text>
          </view>
          <wd-button
            size="small"
            plain
            custom-class="home-note__button"
            @click.stop="goSongs"
          >
            去小歌单
          </wd-button>
        </view>

        <view class="home-note home-note--task app-reveal-soft-4" hover-class="home-note--pressed" @click="goTasks">
          <view class="app-paper-tape app-paper-tape--top-left" />
          <view class="home-note__mark home-note__mark--task">
            <text>约</text>
          </view>
          <view class="home-note__copy">
            <text class="home-note__title">小约定</text>
            <text class="home-note__body">想一起做的事慢慢勾</text>
          </view>
          <wd-button
            size="small"
            plain
            custom-class="home-note__button"
            @click.stop="goTasks"
          >
            去小约定
          </wd-button>
        </view>

        <view class="home-note home-note--memo app-reveal-soft-5" hover-class="home-note--pressed" @click="goMemos">
          <view class="app-paper-tape app-paper-tape--top-right app-paper-tape--accent" />
          <view class="home-note__mark home-note__mark--memo">
            <text>档</text>
          </view>
          <view class="home-note__copy">
            <text class="home-note__title">小档案</text>
            <text class="home-note__body">她的小线索先记着</text>
          </view>
          <wd-button
            size="small"
            plain
            custom-class="home-note__button"
            @click.stop="goMemos"
          >
            去小档案
          </wd-button>
        </view>
      </view>
    </view>

    <view class="home-section">
      <view id="home-timeline-head" class="home-section__head" :style="stickySectionStyle">
        <text class="home-section__title">{{ timelineTitleText }}</text>
        <text class="home-section__count">{{ timelineCountText }}</text>
      </view>

      <view class="home-section__body">
        <view v-if="initialLoading" class="home-loading app-anim-breath">
          <text>正在慢慢读取…</text>
        </view>

        <empty-state
          v-else-if="errorMessage && items.length === 0"
          image-src="/static/logo-couple.png"
          title="小纸条暂时没加载好"
          :body="errorMessage"
        >
          <wd-button custom-class="home-empty__button" @click="refreshTimeline()">再试一次</wd-button>
        </empty-state>

        <empty-state
          v-else-if="items.length === 0"
          image-src="/static/logo-couple.png"
          title="先放进第一颗小记忆"
          body="可以先写一句话、放一张照片，或者记下一个不想忘记的日子。"
        >
          <wd-button custom-class="home-empty__button" @click="goCreate">记录第一个瞬间</wd-button>
        </empty-state>

        <template v-else>
          <view class="home-list">
            <memory-timeline
              ref="memoryTimelineRef"
              :entries="items"
              :marker-sticky-top="markerStickyTop"
              :preview-exhausted-keys="previewExhaustedFileKeys"
              :reaction-states="reactionStates"
              @cover-error="recoverCover"
              @open="openEntry"
            />
          </view>

          <view v-if="loadingMore" class="home-list-footer home-list-footer--loading">
            <view class="home-list-footer__rail" aria-hidden="true" />
            <view class="home-list-footer__content">
              <wd-loading size="20" />
              <text>正在翻后面的回忆…</text>
            </view>
          </view>

          <view
            v-else-if="loadMoreError"
            class="home-list-footer home-list-footer--retry"
            @click="loadMoreEntries"
          >
            <view class="home-list-footer__rail" aria-hidden="true" />
            <view class="home-list-footer__content">
              <text>后面的回忆暂时没拿到，请再试一次。</text>
            </view>
          </view>

          <view v-else-if="!hasMore" class="home-list-footer">
            <view class="home-list-footer__rail" aria-hidden="true" />
            <view class="home-list-footer__content">
              <text>没有更多啦~</text>
            </view>
          </view>

          <view class="home-section__tail" aria-hidden="true" />
        </template>
      </view>
    </view>

    <app-pet-navigator />
  </app-shell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from "vue"
import { onPageScroll, onPullDownRefresh, onReachBottom, onShow } from "@dcloudio/uni-app"
import AppPetNavigator from "@/components/AppPetNavigator.vue"
import MemoryTimeline from "@/components/MemoryTimeline.vue"
import { showAppError } from "@/composables/useAppToast"
import { useCustomNavMetrics } from "@/composables/useCustomNavMetrics"
import { useHeartReaction } from "@/composables/useHeartReaction"
import { useLocalPerson } from "@/composables/useLocalPerson"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { usePaginatedTimeline } from "@/composables/usePaginatedTimeline"
import { consumeRouteFeedback } from "@/composables/useRouteFeedback"
import { consumeTimelineReactionChanged } from "@/composables/useTimelineReactionSignal"
import { consumeTimelineNeedsRefresh } from "@/composables/useTimelineRefreshSignal"
import { useStickySectionOffset } from "@/composables/useStickySectionOffset"
import { useTimelineActiveMonth } from "@/composables/useTimelineActiveMonth"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { useThemeStore } from "@/stores/theme"
import { type EntryRecord } from "@/services/repositories/entries"
import type { HeartReactionState } from "@/types/heart-reaction"
import { selectFirstImageFile } from "@/utils/entry-files"
import { useTimelinePreviewHydration } from "@/composables/useTimelinePreviewHydration"

const theme = useNativeChromeSync()
const themeStore = useThemeStore()
const { stickySectionStyle } = useStickySectionOffset()
const { metrics } = useCustomNavMetrics()
const activeMonth = useTimelineActiveMonth()
const memoryTimelineRef = ref<InstanceType<typeof MemoryTimeline> | null>(null)
const markerStickyTop = ref(0)
const indexRoute = "/pages/index/index"
const timeline = usePaginatedTimeline()
const {
  items,
  initialLoading,
  refreshing,
  loadingMore,
  hasMore,
  loadMoreError,
  errorMessage
} = timeline
const localPerson = useLocalPerson()
const heartReaction = useHeartReaction({ localPerson })
const reactionStates = shallowRef(new Map<string, HeartReactionState>())
const hour = new Date().getHours()
const todayGreeting = hour < 12 ? "早安，今天也慢慢收藏" : hour < 18 ? "午后，把小事轻轻放好" : "晚上好，给今天留一盏小灯"
const memoryCountText = computed(() => {
  if (items.value.length === 0) {
    return "等第一颗小记忆"
  }

  return hasMore.value ? `已载入 ${items.value.length} 条` : `已收好 ${items.value.length} 条回忆`
})
const timelineCountText = computed(() => {
  if (items.value.length === 0) {
    return ""
  }

  return hasMore.value ? `已载入 ${items.value.length} 条` : `${items.value.length} 条回忆`
})
const timelineTitleText = computed(() => {
  if (!activeMonth.activeLabel.value) {
    return "回忆时间线"
  }

  return `回忆时间线 · ${activeMonth.activeLabel.value}`
})

const preview = useTimelinePreviewHydration({ items })

const previewExhaustedFileKeys = preview.exhaustedKeys
const recoverCover = preview.recover

const measureHeaderGeometry = (): void => {
  const query = uni.createSelectorQuery()
  query.select("#home-timeline-head").boundingClientRect()
  query.exec((results) => {
    const rect = results[0] as UniApp.NodeInfo | null | undefined
    if (!rect || typeof rect.height !== "number") {
      return
    }

    const offset = metrics.value.customNavHeight + rect.height
    markerStickyTop.value = offset
    activeMonth.setBoundaryOffset(offset)
  })
}

watch(activeMonth.activeLabel, () => {
  void nextTick().then(measureHeaderGeometry)
})

const yieldToRenderer = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0)
  })

let anchorRevision = 0

const remeasureMonthAnchors = async (): Promise<void> => {
  const currentRevision = ++anchorRevision
  await nextTick()
  await yieldToRenderer()

  if (currentRevision !== anchorRevision) {
    return
  }

  const anchors = await memoryTimelineRef.value?.measureMonthAnchors()
  if (currentRevision !== anchorRevision || !anchors) {
    return
  }

  activeMonth.updateAnchors(anchors)
}

const refreshTimeline = async () => {
  let succeeded = false
  try {
    await timeline.refresh()
    succeeded = !errorMessage.value
  } catch (error) {
    showAppError(getFriendlyErrorMessage(error))
  }

  if (succeeded) {
    void preview.retryUnavailable(items.value)
    void loadReactionStates(items.value)
  }

  await nextTick()
  measureHeaderGeometry()
  uni.stopPullDownRefresh()
}

const loadMoreEntries = async () => {
  const result = await timeline.loadMore()
  if (result.appendedItems.length > 0) {
    void loadReactionStates(result.appendedItems)
  }
}

const refreshReactionStateForEntry = async (entryId: string) => {
  const entry = items.value.find((item) => item.id === entryId)
  if (!entry) {
    return
  }

  try {
    const states = await heartReaction.batchLoadStates([entryId])
    const nextStates = new Map(reactionStates.value)
    const state = states.get(entryId)
    if (state) {
      nextStates.set(entryId, state)
    } else {
      nextStates.delete(entryId)
    }
    reactionStates.value = nextStates
  } catch (error) {
    if (import.meta.env.DEV) {
      console.info(`[小珊的树洞] 单条小心心状态刷新失败：${getFriendlyErrorMessage(error)}`)
    }
  }
}

const refreshReactionsOnShow = () => {
  const changedEntryId = consumeTimelineReactionChanged()
  if (changedEntryId) {
    void refreshReactionStateForEntry(changedEntryId)
  }
}

const goCreate = () => {
  uni.navigateTo({
    url: "/pages/create/create"
  })
}

const goSongs = () => {
  uni.navigateTo({
    url: "/pages/songs/songs"
  })
}

const goTasks = () => {
  uni.navigateTo({
    url: "/pages/tasks/tasks"
  })
}

const goMemos = () => {
  uni.navigateTo({
    url: "/pages/memos/memos"
  })
}

const openEntry = (id: string) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${encodeURIComponent(id)}`
  })
}

const loadReactionStates = async (entries: EntryRecord[]) => {
  const targetIds = entries.map((entry) => entry.id)
  if (targetIds.length === 0) {
    reactionStates.value = new Map()
    return
  }

  try {
    const states = await heartReaction.batchLoadStates(targetIds)
    const nextStates = new Map(reactionStates.value)
    for (const [targetId, state] of states) {
      nextStates.set(targetId, state)
    }
    reactionStates.value = nextStates
  } catch (error) {
    if (import.meta.env.DEV) {
      console.info(`[小珊的树洞] 时间线小心心状态读取失败：${getFriendlyErrorMessage(error)}`)
    }
  }
}

const entryBusinessSignature = computed(() => items.value.map((entry) => entry.id).join("|"))
const previousEntryIds = ref(new Set<string>())

watch(
  entryBusinessSignature,
  () => {
    const currentIds = new Set(items.value.map((entry) => entry.id))
    const previousIds = previousEntryIds.value

    // 只在“替换/删除/重排”时全量加载；纯追加由 loadMoreEntries 单独加载新增项，
    // 避免分页时重复请求全部 Heart Reaction 状态。
    const isAppend =
      previousIds.size > 0 &&
      Array.from(previousIds).every((id) => currentIds.has(id)) &&
      currentIds.size > previousIds.size

    if (!isAppend) {
      void loadReactionStates(items.value)
    }

    previousEntryIds.value = currentIds
  },
  { immediate: true }
)

const timelineGeometrySignature = computed(() => {
  const entriesPart = items.value
    .map((entry) => {
      const file = selectFirstImageFile(entry.files)
      return [
        entry.id,
        entry.occurredAt,
        entry.title,
        entry.content,
        entry.mood,
        file ? "1" : "0"
      ].join("\x1f")
    })
    .join("\x1e")

  const reactionsPart = Array.from(reactionStates.value.entries())
    .map(([id, state]) => `${id}:${state.hasReacted ? "1" : "0"}:${state.hasReceived ? "1" : "0"}`)
    .join("\x1e")

  return `${entriesPart}||${reactionsPart}`
})

watch(
  timelineGeometrySignature,
  () => {
    void remeasureMonthAnchors()
  },
  { immediate: true }
)

watch(
  items,
  (nextItems) => {
    void preview.hydrate(nextItems)
  },
  { immediate: true }
)

watch(
  () => localPerson.selectedKey.value,
  () => {
    if (items.value.length > 0) {
      void loadReactionStates(items.value)
    }
  }
)

watch(
  () => [themeStore.density, themeStore.fontScale] as const,
  () => {
    measureHeaderGeometry()
    void remeasureMonthAnchors()
  }
)

onMounted(() => {
  measureHeaderGeometry()
  void remeasureMonthAnchors()
})

onPageScroll((event) => {
  activeMonth.updateActiveMonth(event.scrollTop)
})

onShow(() => {
  consumeRouteFeedback(indexRoute)
  if (consumeTimelineNeedsRefresh(indexRoute)) {
    void refreshTimeline()
    return
  }

  refreshReactionsOnShow()
  void preview.hydrateAll()
  measureHeaderGeometry()
  void remeasureMonthAnchors()
})

onPullDownRefresh(() => {
  void refreshTimeline()
})

onReachBottom(() => {
  if (initialLoading.value || refreshing.value || loadingMore.value) {
    return
  }

  if (!hasMore.value) {
    return
  }

  void loadMoreEntries()
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.home-hero {
  @include panel;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
  overflow: hidden;
}

.home-hero::before {
  position: absolute;
  top: var(--app-card-padding);
  right: var(--app-card-padding);
  width: var(--app-space-28);
  height: var(--app-space-20);
  border-top: var(--app-panel-border-width) dashed var(--app-divider);
  border-bottom: var(--app-panel-border-width) dashed var(--app-divider);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(8deg);
}

.home-hero::after {
  position: absolute;
  right: var(--app-card-padding);
  bottom: var(--app-home-decor-bottom);
  width: var(--app-home-decor-width);
  height: var(--app-home-decor-height);
  border-right: var(--app-border-width-focus) solid var(--app-border);
  border-bottom: var(--app-border-width-focus) solid var(--app-border);
  border-radius: var(--app-space-0) var(--app-space-0) var(--app-radius-2xl) var(--app-space-0);
  content: "";
  opacity: var(--app-decor-opacity);
}

.home-hero__top {
  display: grid;
  grid-template-columns: var(--app-home-logo-size) minmax(0, 1fr);
  gap: var(--app-space-9);
  align-items: center;
}

.home-hero__top,
.home-hero__body,
.home-hero__stamps {
  position: relative;
  z-index: 1;
}

.home-hero__icon {
  width: var(--app-home-logo-size);
  height: var(--app-home-logo-size);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-surface-strong);
  box-shadow: var(--app-shadow-logo);
}

.home-hero__copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.home-hero__kicker {
  color: var(--app-accent);
  font-size: var(--app-font-size-base);
}

.home-hero__title {
  margin-top: var(--app-space-5);
  color: var(--app-text);
  font: var(--app-font-hero-title);
}

.home-hero__body {
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.home-hero__stamps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-5);
}

.home-hero__stamp {
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-badge);
  background: var(--app-field);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  transform: rotate(-2deg);
}

.home-hero__stamp--memory {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  color: var(--app-primary);
  transform: rotate(2deg);
}

.home-dock {
  position: relative;
  margin-top: var(--app-section-gap);
}

.home-dock__head {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-7);
}

.home-dock__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.home-dock__body {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.home-note-stack {
  display: flex;
  flex-direction: column;
  gap: var(--app-list-gap);
}

.home-note {
  @include panel;
  @include pressable;
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--app-space-8);
  align-items: center;
  padding: var(--app-card-padding);
  overflow: hidden;
  background: var(--app-field);
}

.home-note::before {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-24);
  height: var(--app-space-24);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-bottom-left-radius: var(--app-radius-lg);
  background: var(--app-surface);
  content: "";
  opacity: var(--app-muted-opacity);
}

.home-note::after {
  position: absolute;
  left: var(--app-card-padding);
  bottom: var(--app-space-5);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-3deg);
}

.home-note--song::after {
  background: var(--app-color-red-person);
}

.home-note--task::after {
  background: var(--app-color-blue-person);
}

.home-note--memo::after {
  background: var(--app-primary-muted);
}

.home-note--pressed {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale));
}

.home-note__mark {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--app-space-36);
  height: var(--app-space-32);
  border: var(--app-panel-border-width) solid currentColor;
  border-radius: var(--app-radius-lg) var(--app-radius-2xl) var(--app-radius-lg) var(--app-radius-sm);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-4xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-none);
  transform: rotate(-4deg);
}

.home-note__mark--song {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.home-note__mark--task {
  background: var(--app-accent-soft);
  color: var(--app-accent);
  transform: rotate(4deg);
}

.home-note__mark--memo {
  background: var(--app-surface-strong);
  color: var(--app-primary);
  transform: rotate(-2deg);
}

.home-note__copy {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-2);
}

.home-note__title {
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.home-note__body {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

:deep(.home-note__button) {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  min-height: var(--app-control-scale-xs);
  border-radius: var(--app-radius-badge);
  box-shadow: var(--app-shadow-none);
  font: var(--app-font-caption);
}

.home-section {
  margin-top: var(--app-section-gap);
}

.home-section__head {
  @include sticky-section;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--app-space-8);
  margin-bottom: var(--app-list-gap);
  padding: var(--app-timeline-header-padding-y) var(--app-timeline-header-padding-x);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-surface-strong);
}

.home-section__title {
  min-width: 0;
  overflow: hidden;
  color: var(--app-text);
  font: var(--app-font-section-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-section__count {
  flex-shrink: 0;
  color: var(--app-text-soft);
  font-size: var(--app-font-size-base);
}

.home-loading {
  padding: var(--app-space-16) var(--app-space-0);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-base);
  text-align: center;
}

.home-list-footer {
  display: grid;
  grid-template-columns: var(--app-timeline-rail-width) minmax(0, 1fr);
  gap: var(--app-timeline-axis-gap);
  align-items: center;
  margin-top: var(--app-list-gap);
  padding: var(--app-space-6) var(--app-space-0);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.home-list-footer__rail {
  width: 100%;
}

.home-list-footer__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-4);
  grid-column: 2;
}

.home-list-footer--loading {
  color: var(--app-text-muted);
}

.home-list-footer--retry {
  @include pressable;
  color: var(--app-accent);
}

.home-section__tail {
  height: var(--app-safe-action-bottom-gap);
}

:deep(.home-empty__button) {
  margin-top: var(--app-card-padding);
}

:deep(.home-hero__button) {
  position: relative;
  z-index: 1;
}
</style>
