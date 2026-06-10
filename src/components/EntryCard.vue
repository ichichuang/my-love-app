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
      </view>

      <image
        v-if="coverUrl"
        class="entry-card__cover"
        :src="coverUrl"
        mode="aspectFill"
      />
      <view v-else class="entry-card__placeholder">
        <text class="entry-card__placeholder-mark">忆</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { EntryRecord } from "@/services/repositories/entries"

const props = defineProps<{
  entry: EntryRecord
}>()

const emit = defineEmits<{
  open: [id: string]
}>()

const coverUrl = computed(() => props.entry.files[0]?.tempFileURL ?? "")

const excerpt = computed(() => {
  const text = props.entry.content.trim()
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
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.entry-card {
  @include panel;
  @include pressable;
  display: grid;
  grid-template-columns: 96rpx 1fr;
  gap: 22rpx;
  padding: 24rpx;

  &:active {
    opacity: 0.82;
    transform: scale(0.99);
  }
}

.entry-card__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 154rpx;
  border-radius: 28rpx;
  background: var(--app-surface-strong);
  color: var(--app-primary);
}

.entry-card__month {
  font-size: 20rpx;
  line-height: 1.2;
}

.entry-card__day {
  margin-top: 6rpx;
  font-family: "Songti SC", "STSong", serif;
  font-size: 38rpx;
  font-weight: 600;
  line-height: 1;
}

.entry-card__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 136rpx;
  gap: 20rpx;
  min-width: 0;
}

.entry-card__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.entry-card__mood {
  color: var(--app-accent);
  font-size: 22rpx;
  line-height: 1.3;
}

.entry-card__title {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text);
  font-family: "Songti SC", "STSong", serif;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-card__excerpt {
  display: -webkit-box;
  margin-top: 12rpx;
  color: var(--app-text-soft);
  font-size: 24rpx;
  line-height: 1.45;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.entry-card__cover,
.entry-card__placeholder {
  width: 136rpx;
  height: 154rpx;
  border-radius: 28rpx;
}

.entry-card__cover {
  background: var(--app-surface-strong);
}

.entry-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid var(--app-border);
  background:
    linear-gradient(135deg, var(--app-surface-strong), var(--app-field));
}

.entry-card__placeholder-mark {
  color: var(--app-primary);
  font-family: "Songti SC", "STSong", serif;
  font-size: 42rpx;
}
</style>
