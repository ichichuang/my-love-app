<template>
  <view class="memory-timeline">
    <view
      v-for="(group, groupIndex) in groups"
      :key="group.key"
      class="memory-timeline__group"
    >
      <view class="memory-timeline__rail" aria-hidden="true">
        <text
          v-if="group.showYear"
          class="memory-timeline__year"
          :class="{ 'memory-timeline__year--undated': group.isUndated }"
        >
          {{ group.yearLabel }}
        </text>
        <view class="memory-timeline__axis">
          <view
            class="memory-timeline__node"
            :class="{
              'memory-timeline__node--latest': groupIndex === 0,
              'memory-timeline__node--undated': group.isUndated
            }"
          />
          <view
            class="memory-timeline__line"
            :class="{ 'memory-timeline__line--last': groupIndex === groups.length - 1 }"
          />
        </view>
        <text
          class="memory-timeline__month"
          :class="{ 'memory-timeline__month--latest': groupIndex === 0, 'memory-timeline__month--undated': group.isUndated }"
        >
          {{ group.monthLabel }}
        </text>
      </view>

      <view class="memory-timeline__cards">
        <entry-card
          v-for="(entry, entryIndex) in group.entries"
          :key="entry.id"
          class="app-rise-stagger"
          :style="{ animationDelay: `calc(var(--app-stagger-reveal) * ${groupIndex + entryIndex})` }"
          date-display="day"
          :entry="entry"
          :reaction-state="reactionStates.get(entry.id)"
          @cover-error="(entryId, fileID) => emit('cover-error', entryId, fileID)"
          @open="(id) => emit('open', id)"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue"
import EntryCard from "@/components/EntryCard.vue"
import { type EntryRecord } from "@/services/repositories/entries"
import type { HeartReactionState } from "@/types/heart-reaction"
import { buildMemoryTimelineMonthGroups as buildMonthGroups } from "@/utils/memory-timeline"

const props = defineProps<{
  entries: EntryRecord[]
  reactionStates: Map<string, HeartReactionState>
}>()

const emit = defineEmits<{
  open: [id: string]
  "cover-error": [entryId: string, fileID: string]
}>()

const groups = computed(() => {
  const currentEntries = props.entries
  return buildMonthGroups<EntryRecord>(currentEntries)
})
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.memory-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--app-list-gap);
}

.memory-timeline__group {
  display: grid;
  grid-template-columns: var(--app-timeline-rail-width) minmax(0, 1fr);
  gap: var(--app-timeline-axis-gap);
  align-items: start;
}

.memory-timeline__rail {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: var(--app-card-padding);
}

.memory-timeline__year {
  margin-bottom: var(--app-space-3);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  opacity: var(--app-decor-opacity);
  transform: rotate(-3deg);
}

.memory-timeline__year--undated {
  color: var(--app-text-muted);
}

.memory-timeline__axis {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: var(--app-timeline-node-size);
}

.memory-timeline__node {
  flex-shrink: 0;
  width: var(--app-timeline-node-size);
  height: var(--app-timeline-node-size);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-round);
  background: var(--app-surface-strong);
}

.memory-timeline__node--latest {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
}

.memory-timeline__node--undated {
  border-style: dashed;
  background: var(--app-field);
}

.memory-timeline__line {
  width: var(--app-timeline-line-width);
  flex: 1;
  min-height: var(--app-space-16);
  background: var(--app-border);
}

.memory-timeline__line--last {
  background: linear-gradient(180deg, var(--app-border), transparent);
}

.memory-timeline__month {
  margin-top: var(--app-space-3);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.memory-timeline__month--latest {
  color: var(--app-primary);
}

.memory-timeline__month--undated {
  color: var(--app-text-muted);
  writing-mode: horizontal-tb;
}

.memory-timeline__cards {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-list-gap);
}
</style>
