<template>
  <view class="memory-timeline">
    <view
      v-for="(group, groupIndex) in groups"
      :id="`memory-month-${group.key}`"
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

        <view class="memory-timeline__track">
          <view
            class="memory-timeline__line"
            :class="{ 'memory-timeline__line--last': groupIndex === groups.length - 1 }"
          />

          <view
            class="memory-timeline__marker"
            :style="markerStickyStyle"
          >
            <view
              class="memory-timeline__marker-capsule"
              :class="{
                'memory-timeline__marker-capsule--latest': groupIndex === 0,
                'memory-timeline__marker-capsule--undated': group.isUndated
              }"
            >
              <view
                class="memory-timeline__node"
                :class="{
                  'memory-timeline__node--latest': groupIndex === 0,
                  'memory-timeline__node--undated': group.isUndated
                }"
              />

              <view
                class="memory-timeline__month"
                :class="{
                  'memory-timeline__month--latest': groupIndex === 0,
                  'memory-timeline__month--undated': group.isUndated
                }"
              >
                <template v-if="group.isUndated">
                  <text class="memory-timeline__month-undated">{{ group.monthLabel }}</text>
                </template>
                <template v-else>
                  <text class="memory-timeline__month-number">{{ group.month }}</text>
                  <text class="memory-timeline__month-unit">月</text>
                </template>
              </view>
            </view>
          </view>
        </view>
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
import { computed, getCurrentInstance } from "vue"
import EntryCard from "@/components/EntryCard.vue"
import { type EntryRecord } from "@/services/repositories/entries"
import type { HeartReactionState } from "@/types/heart-reaction"
import { buildMemoryTimelineMonthGroups as buildMonthGroups, type MemoryTimelineMonthGroup } from "@/utils/memory-timeline"
import type { TimelineAnchorSnapshot } from "@/composables/useTimelineActiveMonth"

const props = withDefaults(
  defineProps<{
    entries: EntryRecord[]
    reactionStates: Map<string, HeartReactionState>
    markerStickyTop?: number
  }>(),
  {
    markerStickyTop: 0
  }
)

const emit = defineEmits<{
  open: [id: string]
  "cover-error": [entryId: string, fileID: string]
}>()

const instance = getCurrentInstance()

const groups = computed(() => {
  const currentEntries = props.entries
  return buildMonthGroups<EntryRecord>(currentEntries)
})

const markerStickyStyle = computed(() => {
  if (props.markerStickyTop <= 0) {
    return {}
  }

  return {
    top: `${props.markerStickyTop}px`
  }
})

const makeAnchorLabel = (group: MemoryTimelineMonthGroup<EntryRecord>): string => {
  if (group.isUndated) {
    return group.monthLabel
  }

  if (group.yearLabel) {
    return `${group.yearLabel}年${group.monthLabel}`
  }

  return group.monthLabel
}

const measureMonthAnchors = async (): Promise<TimelineAnchorSnapshot[]> => {
  const currentGroups = groups.value
  if (currentGroups.length === 0) {
    return []
  }

  return new Promise((resolve) => {
    const query = uni.createSelectorQuery().in(instance?.proxy)
    for (const group of currentGroups) {
      query.select(`#memory-month-${group.key}`).boundingClientRect()
    }

    query.selectViewport().scrollOffset(() => {})
    query.exec((results) => {
      const scrollResult = results[currentGroups.length] as { scrollTop?: number } | null | undefined
      const scrollTop = scrollResult?.scrollTop ?? 0
      const snapshots: TimelineAnchorSnapshot[] = []

      for (let index = 0; index < currentGroups.length; index += 1) {
        const rect = results[index] as UniApp.NodeInfo | null | undefined
        const group = currentGroups[index]
        if (!rect || !group || typeof rect.top !== "number") {
          continue
        }

        snapshots.push({
          key: group.key,
          label: makeAnchorLabel(group),
          top: rect.top + scrollTop
        })
      }

      resolve(snapshots)
    })
  })
}

defineExpose({
  measureMonthAnchors
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
  align-items: stretch;
}

.memory-timeline__rail {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 0;
}

.memory-timeline__year {
  position: absolute;
  top: calc(var(--app-space-3) * -1);
  left: 0;
  width: 100%;
  padding: var(--app-space-2) var(--app-space-3);
  border-radius: var(--app-radius-md);
  background: var(--app-surface);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  text-align: center;
  opacity: var(--app-decor-opacity);
  transform: rotate(-2deg);
}

.memory-timeline__year--undated {
  color: var(--app-text-muted);
}

.memory-timeline__track {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 0;
}

.memory-timeline__line {
  position: absolute;
  top: 0;
  left: calc(50% - var(--app-timeline-line-width) / 2);
  width: var(--app-timeline-line-width);
  height: calc(100% + var(--app-list-gap));
  background: var(--app-border-strong);
}

.memory-timeline__line--last {
  height: 100%;
  background: linear-gradient(180deg, var(--app-border-strong) 0%, var(--app-border-strong) 70%, transparent 100%);
}

.memory-timeline__marker {
  position: sticky;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: var(--app-space-4) var(--app-space-0);
  background: var(--app-field);
}

.memory-timeline__marker-capsule {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--app-timeline-marker-padding);
  border-radius: var(--app-timeline-marker-radius);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.memory-timeline__marker-capsule--latest {
  background: var(--app-primary-soft);
}

.memory-timeline__marker-capsule--undated {
  background: var(--app-surface-strong);
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

.memory-timeline__month {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  margin-top: var(--app-space-2);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.memory-timeline__month--latest {
  color: var(--app-primary);
}

.memory-timeline__month--undated {
  color: var(--app-text-muted);
}

.memory-timeline__month-number {
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-tight);
}

.memory-timeline__month-unit {
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-tight);
}

.memory-timeline__month-undated {
  max-width: 100%;
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-snug);
  text-align: center;
  word-break: break-all;
}

.memory-timeline__cards {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-list-gap);
}
</style>
