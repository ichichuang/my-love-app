<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="我们的小日子" nav-eyebrow="悄悄记住" nav-show-back nav-variant="page">
    <template #nav-actions>
      <wd-button size="small" plain @click="goCreateMoment">记一个</wd-button>
    </template>

    <view class="moments-page">
      <view class="moments-intro app-reveal-1">
        <view class="moments-intro__paper-corner" />
        <view class="moments-intro__head">
          <view class="moments-intro__copy">
            <text class="moments-intro__kicker">我们的小日子</text>
            <text class="moments-intro__title">一起走过的日子，都悄悄记在这里。</text>
            <text class="moments-intro__body">今天的、每年回来的、快要到的，都会在这页慢慢翻。</text>
          </view>
          <text class="moments-intro__stamp">悄悄记住</text>
        </view>

        <view class="moments-intro__foot">
          <text class="moments-intro__note">{{ introNote }}</text>
        </view>
      </view>

      <view v-if="loading" class="moments-status app-anim-breath">
        <text>正在翻我们的小日子…</text>
      </view>

      <empty-state
        v-else-if="hasError"
        title="小日子暂时没翻到"
        body="可能是网络慢了一点，稍后再试一次。"
      >
        <wd-button custom-class="moments-state__button" @click="loadMoments()">再试一次</wd-button>
      </empty-state>

      <view v-else class="moments-content">
        <empty-state
          v-if="moments.length === 0"
          title="这页还空着"
          body="等第一个小日子被悄悄记下，它会先来到这页。"
        >
          <wd-button custom-class="moments-state__button" @click="goCreateMoment">记下第一个小日子</wd-button>
        </empty-state>

        <view v-else class="moments-groups">
          <view v-for="group in momentGroups" :key="group.key" class="moment-group">
            <view class="moment-group__header">
              <text class="moment-group__title">{{ group.title }}</text>
              <text class="moment-group__count">{{ group.items.length }} 个</text>
            </view>

            <view class="moment-group__list">
              <moment-card
                v-for="(entry, index) in group.items"
                :key="entry.moment.id"
                class="app-rise-stagger"
                :style="{ animationDelay: `calc(var(--app-stagger-reveal) * ${index})` }"
                :moment="entry.moment"
                :projection="entry.projection"
              />
            </view>
          </view>
        </view>
      </view>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue"
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app"
import { showAppWarning } from "@/composables/useAppToast"
import { useCachedList } from "@/composables/useCachedList"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { consumeRouteFeedback } from "@/composables/useRouteFeedback"
import {
  projectMoment,
  todayCalendarDate,
  type MomentProjection,
  type MomentRecord
} from "@/domain/moments"
import { dataCacheKeys } from "@/services/data-cache"
import { listMoments } from "@/services/repositories/moments"

const theme = useNativeChromeSync()
const momentsRoute = "/pages/moments/moments"
const momentEditRoute = "/pages/moment-edit/moment-edit"

const { items: moments, loading, refreshing, errorMessage, reload } = useCachedList<MomentRecord>({
  cacheKey: dataCacheKeys.momentList,
  loader: listMoments
})

/** 「今天」在每次 onShow 重新锚定；所有派生值仍只由 projectMoment(moment, today) 现场计算。 */
const today = shallowRef(todayCalendarDate())

type MomentGroupKey = "today" | "countup" | "yearly" | "countdown"

interface MomentListEntry {
  moment: MomentRecord
  projection: MomentProjection
}

interface MomentGroup {
  key: MomentGroupKey
  title: string
  items: MomentListEntry[]
}

const momentGroupOrder: Array<{
  key: MomentGroupKey
  title: string
}> = [
  {
    key: "today",
    title: "就是今天"
  },
  {
    key: "countup",
    title: "正在累计"
  },
  {
    key: "yearly",
    title: "每年回来"
  },
  {
    key: "countdown",
    title: "快要到了"
  }
]

const momentEntries = computed<MomentListEntry[]>(() =>
  moments.value.map((moment) => ({
    moment,
    projection: projectMoment(moment, today.value)
  }))
)

/**
 * 每条记录按顺序只落进一个分组，组内保持仓储返回顺序：
 * 1. 就是今天（projection.isToday）；2. 正在累计（非今天的正计时）；
 * 3. 每年回来（其余非今天的每年重复记录）；4. 快要到了（其余倒计时记录）。
 */
const resolveMomentGroupKey = (entry: MomentListEntry): MomentGroupKey => {
  if (entry.projection.isToday) {
    return "today"
  }

  if (entry.projection.direction === "countup") {
    return "countup"
  }

  if (entry.moment.recurrence === "yearly") {
    return "yearly"
  }

  return "countdown"
}

const momentGroups = computed<MomentGroup[]>(() => {
  const grouped: Record<MomentGroupKey, MomentListEntry[]> = {
    today: [],
    countup: [],
    yearly: [],
    countdown: []
  }

  momentEntries.value.forEach((entry) => {
    grouped[resolveMomentGroupKey(entry)].push(entry)
  })

  return momentGroupOrder
    .map((group) => ({ ...group, items: grouped[group.key] }))
    .filter((group) => group.items.length > 0)
})

const hasError = computed(() => errorMessage.value.length > 0 && moments.value.length === 0)

const introNote = computed(() => {
  if (refreshing.value && moments.value.length > 0) {
    return "先翻着旧纸条，新的那几张在悄悄补。"
  }

  if (moments.value.length > 0) {
    return `已经悄悄记住 ${moments.value.length} 个小日子。`
  }

  return "这页还空着，等第一个小日子住进来。"
})

const goCreateMoment = () => {
  uni.navigateTo({
    url: momentEditRoute
  })
}

const loadMoments = async (notifyCachedFailure = false) => {
  try {
    const result = await reload()
    if (notifyCachedFailure && result.fromCache && !result.refreshed) {
      showAppWarning("小日子暂时没更新好，请稍后再试。")
    }
  } catch {
    return
  } finally {
    uni.stopPullDownRefresh()
  }
}

onShow(() => {
  today.value = todayCalendarDate()
  consumeRouteFeedback(momentsRoute)
  void loadMoments()
})

onPullDownRefresh(() => {
  void loadMoments(true)
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.moments-page,
.moments-intro,
.moments-intro__copy,
.moments-intro__foot,
.moments-content,
.moments-groups,
.moment-group,
.moment-group__list {
  display: flex;
  flex-direction: column;
}

.moments-page {
  gap: var(--app-form-gap);
  padding-bottom: var(--app-card-padding);
}

.moments-intro,
.moments-status {
  @include panel;
}

.moments-intro {
  position: relative;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
  overflow: hidden;
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.moments-intro::before {
  position: absolute;
  top: var(--app-card-padding);
  left: var(--app-card-padding);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  background: var(--app-color-blue-person);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-4deg);
}

.moments-intro__paper-corner {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-28);
  height: var(--app-space-28);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom-left-radius: var(--app-radius-lg);
  background: var(--app-field);
  opacity: var(--app-muted-opacity);
}

.moments-intro__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.moments-intro__copy {
  min-width: 0;
  gap: var(--app-space-3);
  padding-top: var(--app-space-8);
}

.moments-intro__kicker {
  @include label;
  display: block;
  color: var(--app-accent);
}

.moments-intro__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.moments-intro__body {
  display: block;
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.moments-intro__stamp {
  position: relative;
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-primary);
  border-radius: var(--app-radius-badge);
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font: var(--app-font-caption);
  transform: rotate(4deg);
}

.moments-intro__foot {
  position: relative;
  z-index: 1;
  gap: var(--app-space-4);
  padding: var(--app-space-6) var(--app-field-padding-x);
  border: var(--app-panel-border-width) dashed var(--app-divider);
  border-radius: var(--app-radius-input);
  background: var(--app-field);
}

.moments-intro__note {
  display: block;
  color: var(--app-accent);
  font: var(--app-font-caption);
}

.moments-status {
  padding: var(--app-empty-padding-y) var(--app-empty-padding-x);
  color: var(--app-text-soft);
  font: var(--app-font-body);
  text-align: center;
}

.moments-content,
.moments-groups {
  gap: var(--app-form-gap);
}

.moment-group {
  gap: var(--app-space-6);
}

.moment-group__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--app-space-8);
  padding: var(--app-space-0) var(--app-space-2);
}

.moment-group__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.moment-group__count {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.moment-group__list {
  gap: var(--app-list-gap);
}

:deep(.moments-state__button) {
  margin-top: var(--app-card-padding);
}
</style>
