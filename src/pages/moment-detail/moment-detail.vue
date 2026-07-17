<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="小日子票根" nav-eyebrow="收好的那一天" nav-show-back nav-variant="page">
    <template #nav-actions>
      <wd-button v-if="momentRecord" size="small" plain :disabled="pinning || deleting" @click="goEditMoment">
        改一改
      </wd-button>
    </template>

    <view v-if="loading" class="moment-detail-status app-anim-breath">
      <text>正在翻这个小日子…</text>
    </view>

    <empty-state v-else-if="!momentRecord" :title="emptyTitle" :body="emptyBody">
      <view class="moment-detail-state__actions">
        <wd-button block :loading="retrying" @click="retryLoad">再试一次</wd-button>
        <wd-button block plain @click="backToMoments">返回小日子</wd-button>
      </view>
    </empty-state>

    <view v-else-if="projection" class="moment-detail">
      <view class="moment-ticket app-reveal-1 app-ticket-stump" :class="{ 'moment-ticket--pinned': momentRecord.pinned }">
        <view class="app-ticket-stump__punch app-ticket-stump__punch--left" />
        <view class="app-ticket-stump__punch app-ticket-stump__punch--right" />
        <view class="moment-ticket__perforation" />
        <view class="moment-ticket__head">
          <view class="moment-ticket__intro">
            <text class="moment-ticket__kicker">{{ categoryLabel }}</text>
            <text class="moment-ticket__title">{{ momentRecord.title }}</text>
          </view>
          <text v-if="momentRecord.pinned" class="app-stamp-mark app-stamp-mark--primary">常看</text>
        </view>

        <view class="moment-ticket__hero">
          <template v-if="projection.isToday">
            <text class="moment-ticket__today">{{ projection.leadCopy }}</text>
          </template>
          <template v-else>
            <text class="moment-ticket__lead">{{ projection.leadCopy }}</text>
            <text class="moment-ticket__value">{{ projection.primaryValue }}</text>
            <text class="moment-ticket__unit">{{ projection.primaryUnit }}</text>
          </template>
        </view>

        <text v-if="calendarDurationLabel" class="moment-ticket__duration">{{ calendarDurationLabel }}</text>
        <text v-if="projection.secondaryCopy" class="moment-ticket__secondary">{{ projection.secondaryCopy }}</text>
      </view>

      <view class="moment-info app-reveal-2">
        <view class="moment-info__head">
          <text class="moment-info__title">这张票根的小记号</text>
        </view>
        <view class="moment-info__rows">
          <view v-for="row in infoRows" :key="row.key" class="moment-info__row">
            <text class="moment-info__label">{{ row.label }}</text>
            <text class="moment-info__value">{{ row.value }}</text>
          </view>
        </view>
      </view>

      <view class="moment-detail-actions app-reveal-3">
        <wd-button block plain size="large" :loading="pinning" :disabled="deleting" @click="togglePinned">
          {{ momentRecord.pinned ? "放回纸堆" : "贴到上面" }}
        </wd-button>
      </view>

      <view class="moment-danger app-reveal-4">
        <view>
          <text class="moment-danger__title">删除这个日子</text>
          <text class="moment-danger__body">这会删除这个小日子，删掉后找不回来。</text>
        </view>
        <wd-button plain block type="error" :loading="deleting" :disabled="pinning" @click="confirmDelete">
          删除这个日子
        </wd-button>
      </view>
    </view>

    <wd-message-box :root-portal="true" />
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue"
import { onLoad, onShow } from "@dcloudio/uni-app"
import { useMessage } from "wot-design-uni/components/wd-message-box"
import { showAppError } from "@/composables/useAppToast"
import { useCachedRecord } from "@/composables/useCachedRecord"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { setRouteSuccessFeedback } from "@/composables/useRouteFeedback"
import {
  momentCategoryLabels,
  projectMoment,
  todayCalendarDate,
  type MomentCounting,
  type MomentDisplay,
  type MomentProjection,
  type MomentRecord,
  type MomentRecurrence
} from "@/domain/moments"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { dataCacheKeys } from "@/services/data-cache"
import {
  deleteMoment,
  getMoment,
  isMomentUnavailableError,
  updateMoment
} from "@/services/repositories/moments"
import { formatChineseDate } from "@/utils/date"

const momentsRoute = "/pages/moments/moments"
const momentEditRoute = "/pages/moment-edit/moment-edit"

const theme = useNativeChromeSync()
const message = useMessage()

const momentId = shallowRef("")
const pinning = shallowRef(false)
const deleting = shallowRef(false)
const retrying = shallowRef(false)
const loadUnavailable = shallowRef(false)
const {
  record: momentRecord,
  loading,
  reload: reloadMoment
} = useCachedRecord<MomentRecord>({
  cacheKey: () => dataCacheKeys.momentDetail(momentId.value),
  isUnavailableError: isMomentUnavailableError,
  loader: () => getMoment(momentId.value)
})

/** 「今天」在每次 onShow 重新锚定；所有派生值仍只由 projectMoment(record, today) 现场计算。 */
const today = shallowRef(todayCalendarDate())

const projection = computed<MomentProjection | null>(() =>
  momentRecord.value ? projectMoment(momentRecord.value, today.value) : null
)

const categoryLabel = computed(() =>
  momentRecord.value ? momentCategoryLabels[momentRecord.value.category] : ""
)

/** 正计时的日历模式：把 `calendarDuration` 拼成「1 年 2 个月 3 天」，不重复日期运算。 */
const calendarDurationLabel = computed(() => {
  const record = momentRecord.value
  const currentProjection = projection.value
  if (!record || !currentProjection) {
    return ""
  }

  if (currentProjection.direction !== "countup" || record.display !== "calendar") {
    return ""
  }

  const { years, months, days } = currentProjection.calendarDuration
  const parts: string[] = []

  if (years > 0) {
    parts.push(`${years} 年`)
  }

  if (months > 0) {
    parts.push(`${months} 个月`)
  }

  if (days > 0 || parts.length === 0) {
    parts.push(`${days} 天`)
  }

  return parts.join(" ")
})

/** 信息行口径与编辑器选项文案保持一致；纪念序号、下一次发生日、里程碑由 projection 现场给出。 */
const recurrenceCopy: Record<MomentRecurrence, string> = {
  none: "只记这一次",
  yearly: "每年都记得"
}

const countingCopy: Record<MomentCounting, string> = {
  elapsed: "从 0 天开始数",
  ordinal: "当天算第 1 天"
}

const displayCopy: Record<MomentDisplay, string> = {
  days: "只看总天数",
  calendar: "几年几个月几天"
}

interface MomentInfoRow {
  key: string
  label: string
  value: string
}

const infoRows = computed<MomentInfoRow[]>(() => {
  const record = momentRecord.value
  const currentProjection = projection.value
  if (!record || !currentProjection) {
    return []
  }

  const rows: MomentInfoRow[] = [
    { key: "sourceDate", label: "那一天", value: currentProjection.sourceDateLabel },
    { key: "category", label: "分类", value: categoryLabel.value },
    { key: "recurrence", label: "重复", value: recurrenceCopy[record.recurrence] },
    { key: "counting", label: "数法", value: countingCopy[record.counting] },
    { key: "display", label: "展示", value: displayCopy[record.display] }
  ]

  const note = record.content.trim()
  if (note) {
    rows.push({ key: "note", label: "悄悄话", value: note })
  }

  if (currentProjection.nextOccurrence) {
    rows.push({
      key: "nextOccurrence",
      label: "下一次",
      value: formatChineseDate(currentProjection.nextOccurrence)
    })
  }

  if (currentProjection.anniversaryCount > 0) {
    rows.push({
      key: "anniversary",
      label: "周年",
      value: `第 ${currentProjection.anniversaryCount} 个${categoryLabel.value}`
    })
  }

  if (typeof currentProjection.nextMilestone === "number") {
    rows.push({
      key: "milestone",
      label: "里程碑",
      value: `下一颗小里程碑 · 第 ${currentProjection.nextMilestone} 天`
    })
  }

  return rows
})

const emptyTitle = computed(() => (loadUnavailable.value ? "这个小日子暂时打不开" : "小日子暂时没翻到"))
const emptyBody = computed(() =>
  loadUnavailable.value ? "请稍后再试一次。" : "可能是网络慢了一点，稍后再试一次。"
)

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

const loadMoment = async () => {
  if (!momentId.value) {
    loadUnavailable.value = true
    return
  }

  loadUnavailable.value = false

  try {
    await reloadMoment()
  } catch (error) {
    loadUnavailable.value = isMomentUnavailableError(error)
  }
}

const retryLoad = async () => {
  if (retrying.value) {
    return
  }

  retrying.value = true
  try {
    await loadMoment()
  } finally {
    retrying.value = false
  }
}

const backToMoments = () => {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }

  uni.redirectTo({
    url: momentsRoute
  })
}

const goEditMoment = () => {
  const record = momentRecord.value
  if (!record) {
    return
  }

  uni.navigateTo({
    url: `${momentEditRoute}?id=${encodeURIComponent(record.id)}`
  })
}

const togglePinned = async () => {
  const record = momentRecord.value
  if (!record || pinning.value || deleting.value) {
    return
  }

  const nextPinned = !record.pinned
  pinning.value = true
  try {
    // 未改动的记录草稿：只切换置顶，其余字段原样写回，隐藏字段保持不动。
    const savedMoment = await updateMoment(record.id, {
      ...record,
      pinned: nextPinned
    })
    momentRecord.value = savedMoment
    setRouteSuccessFeedback(momentsRoute, nextPinned ? "已经贴到上面啦" : "已经放回纸堆里啦")
    backToMoments()
  } catch (error) {
    showAppError(getFriendlyErrorMessage(error))
  } finally {
    pinning.value = false
  }
}

const deleteCurrentMoment = async () => {
  const record = momentRecord.value
  if (!record) {
    return
  }

  deleting.value = true
  try {
    await deleteMoment(record.id)
    setRouteSuccessFeedback(momentsRoute, "这个小日子已经删掉了")
    backToMoments()
  } catch (error) {
    showAppError(getFriendlyErrorMessage(error))
  } finally {
    deleting.value = false
  }
}

const confirmDelete = async () => {
  if (!momentRecord.value || deleting.value || pinning.value) {
    return
  }

  try {
    await message.confirm({
      title: "删除这个日子",
      msg: "这会删除这个小日子，删掉后找不回来。",
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
    await deleteCurrentMoment()
  } catch {
    return
  }
}

onLoad((query) => {
  momentId.value = decodeQueryId(query?.id)
})

onShow(() => {
  today.value = todayCalendarDate()
  void loadMoment()
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.moment-detail,
.moment-ticket,
.moment-ticket__intro,
.moment-info,
.moment-info__head,
.moment-info__rows,
.moment-detail-actions,
.moment-danger {
  display: flex;
  flex-direction: column;
}

.moment-detail {
  gap: var(--app-form-gap);
  padding-bottom: var(--app-card-padding);
}

.moment-detail-status {
  @include panel;
  padding: var(--app-empty-padding-y) var(--app-empty-padding-x);
  color: var(--app-text-soft);
  font: var(--app-font-body);
  text-align: center;
}

.moment-detail-state__actions {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--app-space-6);
  margin-top: var(--app-card-padding);
}

.moment-ticket {
  @include panel;
  position: relative;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
  overflow: hidden;
  background:
    linear-gradient(180deg, var(--app-surface), var(--app-surface-strong));
}

.moment-ticket--pinned {
  background:
    linear-gradient(180deg, var(--app-surface), var(--app-primary-soft));
}

.moment-ticket::before {
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

.moment-ticket--pinned::before {
  background: var(--app-primary);
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
  gap: var(--app-space-5);
  padding-top: var(--app-space-8);
}

.moment-ticket__kicker {
  align-self: flex-start;
  padding: var(--app-space-2) var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--app-accent);
  border-radius: var(--app-radius-badge);
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-none);
}

.moment-ticket__title {
  color: var(--app-text);
  font: var(--app-font-detail-title);
}

.moment-ticket__hero {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: var(--app-space-3);
}

.moment-ticket__lead,
.moment-ticket__unit {
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.moment-ticket__value {
  color: var(--app-primary);
  font-size: var(--app-font-size-6xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-none);
}

.moment-ticket__today {
  color: var(--app-primary);
  font-size: var(--app-font-size-5xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
}

.moment-ticket__duration,
.moment-ticket__secondary {
  position: relative;
  z-index: 1;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.moment-info {
  @include panel;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
}

.moment-info__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.moment-info__rows {
  gap: var(--app-space-6);
}

.moment-info__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--app-space-8);
  padding-bottom: var(--app-space-6);
  border-bottom: var(--app-panel-border-width) dashed var(--app-divider);
}

.moment-info__row:last-child {
  padding-bottom: var(--app-space-0);
  border-bottom: none;
}

.moment-info__label {
  flex-shrink: 0;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.moment-info__value {
  min-width: 0;
  color: var(--app-text);
  font: var(--app-font-body);
  text-align: right;
  word-break: break-all;
}

.moment-detail-actions {
  gap: var(--app-space-6);
}

.moment-danger {
  @include panel;
  gap: var(--app-space-8);
  padding: var(--app-card-padding);
  border-color: var(--app-color-danger-border);
  box-shadow: var(--app-shadow-none);
}

.moment-danger__title {
  display: block;
  color: var(--app-text);
  font-size: var(--app-font-size-lg);
  font-weight: var(--app-font-weight-semibold);
}

.moment-danger__body {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}
</style>
