<template>
  <view
    class="moment-card"
    :class="{ 'moment-card--pinned': moment.pinned, 'moment-card--interactive': interactive }"
    :role="interactive ? 'button' : undefined"
    :aria-label="interactive ? openAriaLabel : undefined"
    @click="handleOpen"
  >
    <view class="moment-card__paper-corner" />
    <view class="moment-card__head">
      <view class="moment-card__title-group">
        <view class="moment-card__tags">
          <text class="moment-card__category">{{ categoryLabel }}</text>
          <text v-if="moment.recurrence === 'yearly'" class="moment-card__yearly">每年回来</text>
        </view>
        <text class="moment-card__title">{{ moment.title }}</text>
      </view>
      <view v-if="moment.pinned" class="app-stamp-mark app-stamp-mark--primary">常看</view>
    </view>

    <view class="moment-card__hero">
      <template v-if="projection.isToday">
        <text class="moment-card__today">{{ projection.leadCopy }}</text>
      </template>
      <template v-else>
        <text class="moment-card__lead">{{ projection.leadCopy }}</text>
        <text class="moment-card__value">{{ projection.primaryValue }}</text>
        <text class="moment-card__unit">{{ projection.primaryUnit }}</text>
      </template>
    </view>

    <text v-if="calendarDurationLabel" class="moment-card__duration">{{ calendarDurationLabel }}</text>

    <text v-if="metaLabel" class="moment-card__meta">{{ metaLabel }}</text>

    <text v-if="milestoneLabel" class="moment-card__milestone">{{ milestoneLabel }}</text>

    <view v-if="interactive" class="moment-card__open-hint" aria-hidden="true">
      <text class="moment-card__open-hint-text">翻开</text>
      <view class="moment-card__open-hint-arrow" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue"
import {
  momentCategoryLabels,
  type MomentProjection,
  type MomentRecord
} from "@/domain/moments"

const props = withDefaults(
  defineProps<{
    moment: MomentRecord
    projection: MomentProjection
    /** 编辑器预览等场景保持非交互；列表里才打开详情。 */
    interactive?: boolean
  }>(),
  {
    interactive: false
  }
)

const emit = defineEmits<{
  open: [id: string]
}>()

const openAriaLabel = computed(() => `打开「${props.moment.title}」这个小日子`)

const handleOpen = () => {
  if (!props.interactive) {
    return
  }

  emit("open", props.moment.id)
}

const categoryLabel = computed(() => momentCategoryLabels[props.moment.category])

/** 正计时的日历模式：把 `calendarDuration` 拼成「1 年 2 个月 3 天」，不重复日期运算。 */
const calendarDurationLabel = computed(() => {
  if (props.projection.direction !== "countup" || props.moment.display !== "calendar") {
    return ""
  }

  const { years, months, days } = props.projection.calendarDuration
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

const metaLabel = computed(() =>
  [props.projection.sourceDateLabel, props.projection.secondaryCopy]
    .filter((part) => part.length > 0)
    .join(" · ")
)

const milestoneLabel = computed(() =>
  typeof props.projection.nextMilestone === "number" ? `下一颗小里程碑 · 第 ${props.projection.nextMilestone} 天` : ""
)
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.moment-card {
  @include panel;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-7);
  padding: var(--app-card-padding);
  overflow: hidden;
  background:
    linear-gradient(180deg, var(--app-surface), var(--app-surface-strong));
}

.moment-card--pinned {
  background:
    linear-gradient(180deg, var(--app-surface), var(--app-primary-soft));
}

.moment-card--interactive {
  @include pressable;

  &:active {
    opacity: var(--app-press-opacity);
    transform: scale(var(--app-press-scale));
  }
}

.moment-card::before {
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

.moment-card--pinned::before {
  background: var(--app-primary);
}

.moment-card__paper-corner {
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

.moment-card__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.moment-card__title-group {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--app-space-5);
}

.moment-card__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-2);
}

.moment-card__category {
  padding: var(--app-space-2) var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--app-accent);
  border-radius: var(--app-radius-badge);
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-none);
}

.moment-card__yearly {
  padding: var(--app-space-2) var(--app-space-5);
  border: var(--app-panel-border-width) dashed var(--app-border-strong);
  border-radius: var(--app-radius-badge);
  background: var(--app-field);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-none);
}

.moment-card__title {
  display: -webkit-box;
  overflow: hidden;
  color: var(--app-text);
  font: var(--app-font-card-title);
  word-break: break-all;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.moment-card__hero {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--app-space-2) var(--app-space-3);
}

.moment-card__lead,
.moment-card__unit {
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.moment-card__value {
  max-width: 100%;
  color: var(--app-primary);
  font-size: var(--app-font-size-5xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-none);
  word-break: break-all;
}

.moment-card__today {
  color: var(--app-primary);
  font-size: var(--app-font-size-4xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
}

.moment-card__duration,
.moment-card__meta {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.moment-card__milestone {
  align-self: flex-start;
  padding: var(--app-space-2) var(--app-space-5);
  border: var(--app-panel-border-width) dashed var(--app-accent);
  border-radius: var(--app-radius-badge);
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font: var(--app-font-caption);
}

/* 可打开的轻提示：只在 interactive 卡片出现，编辑预览不渲染。 */
.moment-card__open-hint {
  display: flex;
  align-items: center;
  align-self: flex-end;
  gap: var(--app-space-2);
  opacity: var(--app-muted-opacity);
  pointer-events: none;
}

.moment-card__open-hint-text {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  transform: rotate(var(--app-rotate-stamp));
}

.moment-card__open-hint-arrow {
  width: var(--app-space-4);
  height: var(--app-space-4);
  border-top: var(--app-border-width-focus) solid var(--app-text-soft);
  border-right: var(--app-border-width-focus) solid var(--app-text-soft);
  transform: rotate(45deg);
}
</style>
