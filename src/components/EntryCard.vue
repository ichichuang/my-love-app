<template>
  <view class="entry-card" @click="emit('open', entry.id)">
    <view class="entry-card__date">
      <text class="entry-card__month">{{ dateParts.month }}</text>
      <text class="entry-card__day">{{ dateParts.day }}</text>
    </view>

    <view class="entry-card__body">
      <view class="entry-card__copy">
        <text class="entry-card__mood">{{ entry.mood }}</text>
        <text class="entry-card__title">{{ entry.title }}</text>
        <text class="entry-card__excerpt">{{ excerpt }}</text>
        <view class="entry-card__meta">
          <text>{{ imageCountLabel }}</text>
        </view>
      </view>

      <image
        v-if="coverUrl"
        class="entry-card__cover"
        :src="coverUrl"
        mode="aspectFill"
        @error="handleCoverError"
      />
      <view v-else class="entry-card__placeholder">
        <text class="entry-card__placeholder-mark">忆</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue"
import type { EntryRecord } from "@/services/repositories/entries"

const props = defineProps<{
  entry: EntryRecord
}>()

const emit = defineEmits<{
  open: [id: string]
  "cover-error": [entryId: string, fileID: string]
}>()

const failedCoverUrl = shallowRef("")
const coverFile = computed(() => props.entry.files[0])
const coverUrl = computed(() => {
  const url = coverFile.value?.resolvedTempURL ?? ""
  return url && url !== failedCoverUrl.value ? url : ""
})

const imageCountLabel = computed(() => {
  const count = props.entry.files.length
  return count > 0 ? `${count} 张照片` : "文字回忆"
})

const excerpt = computed(() => {
  const text = props.entry.content.trim()
  if (!text) {
    return "这段回忆还没有写下文字。"
  }

  return text.length > 48 ? `${text.slice(0, 48)}...` : text
})

const dateParts = computed(() => {
  const date = new Date(props.entry.occurredAt)
  if (Number.isNaN(date.getTime())) {
    return {
      month: "忆",
      day: "--"
    }
  }

  return {
    month: `${date.getMonth() + 1}月`,
    day: String(date.getDate()).padStart(2, "0")
  }
})

const handleCoverError = () => {
  const file = coverFile.value
  const url = file?.resolvedTempURL ?? ""
  if (!file?.fileID || !url) {
    return
  }

  failedCoverUrl.value = url
  emit("cover-error", props.entry.id, file.fileID)
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.entry-card {
  @include panel;
  @include pressable;
  display: grid;
  grid-template-columns: var(--app-entry-date-width) minmax(0, 1fr);
  gap: var(--app-card-gap);
  padding: var(--app-space-9);
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
  min-height: var(--app-entry-card-min-height);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-card);
  background:
    linear-gradient(180deg, var(--app-surface-strong), var(--app-field));
  color: var(--app-primary);
}

.entry-card__month {
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-tight);
}

.entry-card__day {
  margin-top: var(--app-space-1);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-5xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-none);
}

.entry-card__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--app-entry-cover-width);
  gap: var(--app-space-8);
  min-width: 0;
}

.entry-card__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.entry-card__mood {
  color: var(--app-accent);
  font-size: var(--app-font-size-md);
  line-height: var(--app-line-height-snug);
}

.entry-card__title {
  display: block;
  margin-top: var(--app-space-2);
  color: var(--app-text);
  font: var(--app-font-card-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-card__excerpt {
  display: -webkit-box;
  margin-top: var(--app-space-4);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.entry-card__meta {
  display: inline-flex;
  align-self: flex-start;
  margin-top: auto;
  padding: var(--app-entry-meta-padding-y) var(--app-entry-meta-padding-x);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-badge);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-none);
}

.entry-card__cover,
.entry-card__placeholder {
  width: var(--app-entry-cover-width);
  height: var(--app-entry-cover-height);
  border-radius: var(--app-radius-image);
}

.entry-card__cover {
  background: var(--app-surface-strong);
}

.entry-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--app-panel-border-width) solid var(--app-border);
  background:
    linear-gradient(135deg, var(--app-surface-strong), var(--app-field));
}

.entry-card__placeholder-mark {
  color: var(--app-primary);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-6xl);
}
</style>
