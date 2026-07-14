<template>
  <view class="entry-card" @click="emit('open', entry.id)">
    <view class="entry-card__date" :class="{ 'entry-card__date--day-only': props.dateDisplay === 'day' }">
      <text v-if="props.dateDisplay === 'month-day'" class="entry-card__month">{{ dateParts.month }}</text>
      <text class="entry-card__day">{{ dateParts.day }}</text>
    </view>

    <view class="entry-card__copy">
      <text class="entry-card__mood">{{ entry.mood || "温柔" }}</text>
      <text class="entry-card__title">{{ entry.title }}</text>
      <text class="entry-card__excerpt">{{ excerpt }}</text>
      <view class="entry-card__meta">
        <text class="entry-card__media">{{ imageCountLabel }}</text>
        <text v-if="reactionTag" class="entry-card__reaction">{{ reactionTag }}</text>
      </view>
    </view>

    <image
      v-if="showHeartCorner"
      class="entry-card__heart"
      src="/static/heart-hand-drawn.png"
      mode="aspectFit"
      aria-hidden="true"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { EntryRecord } from "@/services/repositories/entries"
import type { HeartReactionState } from "@/types/heart-reaction"

const props = withDefaults(
  defineProps<{
    entry: EntryRecord
    reactionState?: HeartReactionState
    dateDisplay?: "month-day" | "day"
  }>(),
  {
    dateDisplay: "month-day"
  }
)

const emit = defineEmits<{
  open: [id: string]
}>()

const imageCountLabel = computed(() => {
  const count = props.entry.files.length
  return count > 0 ? `${count} 张照片` : "文字回忆"
})

const reactionTag = computed(() => {
  if (!props.reactionState) {
    return ""
  }

  if (props.reactionState.hasReacted) {
    return "已比心"
  }

  if (props.reactionState.hasReceived) {
    return "小心心已收到"
  }

  return ""
})

const showHeartCorner = computed(() => {
  if (!props.reactionState) {
    return false
  }

  return props.reactionState.hasReacted || props.reactionState.hasReceived
})

const excerpt = computed(() => {
  const text = props.entry.content.trim()
  if (!text) {
    return "这段回忆还没有写下文字。"
  }

  return text.length > 64 ? `${text.slice(0, 64)}...` : text
})

const dateParts = computed(() => {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(props.entry.occurredAt.trim())
  if (!match) {
    return {
      month: "忆",
      day: "--"
    }
  }

  return {
    month: `${Number(match[1])}月`,
    day: String(Number(match[2])).padStart(2, "0")
  }
})
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.entry-card {
  @include panel;
  @include pressable;
  position: relative;
  display: grid;
  grid-template-columns: var(--app-entry-date-width) minmax(0, 1fr);
  gap: var(--app-card-gap);
  align-items: stretch;
  padding: var(--app-card-padding);
  border-radius: var(--app-radius-xl);
  overflow: hidden;

  &:active {
    opacity: var(--app-press-opacity);
    transform: scale(var(--app-press-scale));
  }
}

.entry-card__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-5) var(--app-space-3);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-field);
  color: var(--app-primary);
}

.entry-card__date--day-only {
  min-width: var(--app-entry-day-width);
  width: var(--app-entry-day-width);
}

.entry-card__month {
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-tight);
}

.entry-card__day {
  margin-top: var(--app-space-1);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-4xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-none);
}

.entry-card__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-2);
}

.entry-card__mood {
  color: var(--app-accent);
  font-size: var(--app-font-size-md);
  line-height: var(--app-line-height-snug);
}

.entry-card__title {
  display: block;
  color: var(--app-text);
  font: var(--app-font-card-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-card__excerpt {
  display: -webkit-box;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.entry-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-4);
  margin-top: auto;
  padding-top: var(--app-space-5);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-tight);
}

.entry-card__media {
  flex-shrink: 0;
}

.entry-card__reaction {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-2);
  padding: var(--app-space-1) var(--app-space-5);
  border-radius: var(--app-radius-badge);
  background: var(--app-heart-soft);
  color: var(--app-primary);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-tight);
  transform: rotate(-1deg);
}

.entry-card__reaction::before {
  content: "♥";
  font-size: var(--app-font-size-xs);
}

.entry-card__heart {
  position: absolute;
  top: var(--app-space-4);
  right: var(--app-space-4);
  width: var(--app-space-18);
  height: var(--app-space-18);
  transform: rotate(calc(var(--app-rotate-stamp) * -2));
  pointer-events: none;
}
</style>
