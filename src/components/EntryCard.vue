<template>
  <view
    class="entry-card"
    :class="{ 'entry-card--with-preview': previewState !== 'none' }"
    @click="emit('open', entry.id)"
  >
    <view class="entry-card__copy">
      <view class="entry-card__head">
        <text class="entry-card__date-chip">{{ dateChipLabel }}</text>
        <text class="entry-card__head-separator" aria-hidden="true">·</text>
        <text class="entry-card__mood">{{ entry.mood || "温柔" }}</text>
      </view>
      <text class="entry-card__title">{{ entry.title }}</text>
      <text
        class="entry-card__excerpt"
        :class="{ 'entry-card__excerpt--roomy': previewState === 'none' }"
      >{{ excerpt }}</text>
      <view class="entry-card__meta">
        <text class="entry-card__media">{{ imageCountLabel }}</text>
        <text v-if="reactionTag" class="entry-card__reaction">{{ reactionTag }}</text>
      </view>
    </view>

    <view v-if="previewState !== 'none'" class="entry-card__preview">
      <image
        v-if="previewState === 'ready'"
        class="entry-card__preview-image"
        :src="coverUrl"
        mode="aspectFill"
        @error="handleCoverError"
      />
      <view
        v-else-if="previewState === 'loading'"
        class="entry-card__preview-state"
        aria-hidden="true"
      >
        <wd-loading size="20" />
      </view>
      <view v-else class="entry-card__preview-state">
        <text class="entry-card__preview-unavailable">暂缺</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue"
import type { EntryRecord } from "@/services/repositories/entries"
import type { HeartReactionState } from "@/types/heart-reaction"
import { selectFirstImageFile } from "@/utils/entry-files"

// 预览列的显式状态机：无图不渲染列；有图但链接未就绪时保持列稳定并展示加载态；
// 定向恢复已穷尽时在同一位置展示安静的不可用占位，而不是收起或留白。
type EntryPreviewState = "none" | "loading" | "ready" | "unavailable"

const props = withDefaults(
  defineProps<{
    entry: EntryRecord
    reactionState?: HeartReactionState
    showImagePreview?: boolean
    previewExhaustedKeys?: Set<string>
  }>(),
  {
    showImagePreview: true,
    previewExhaustedKeys: () =>
      new Set<string>()
  }
)

const emit = defineEmits<{
  open: [id: string]
  "cover-error": [entryId: string, fileID: string, failedUrl: string]
}>()

const failedCoverUrl = shallowRef("")
const coverFile = computed(() => selectFirstImageFile(props.entry.files))
const coverUrl = computed(() => {
  const url = coverFile.value?.resolvedTempURL ?? ""
  return url && url !== failedCoverUrl.value ? url : ""
})
const previewExhausted = computed(() => {
  const file = coverFile.value
  if (!file) {
    return false
  }

  return props.previewExhaustedKeys.has(`${props.entry.id}:${file.fileID}`)
})
const previewState = computed<EntryPreviewState>(() => {
  if (!props.showImagePreview || !coverFile.value) {
    return "none"
  }

  if (previewExhausted.value) {
    return "unavailable"
  }

  return coverUrl.value ? "ready" : "loading"
})

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

const excerpt = computed(() => {
  const text = props.entry.content.trim()
  if (!text) {
    return "这段回忆还没有写下文字。"
  }

  return text.length > 64 ? `${text.slice(0, 64)}...` : text
})

// 月份由外部月份轴负责，卡片头只保留紧凑的“日”小签；非法日期退回占位符。
const dateChipLabel = computed(() => {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(props.entry.occurredAt.trim())
  if (!match) {
    return "--"
  }

  return `${Number(match[2])}日`
})

const handleCoverError = () => {
  const file = coverFile.value
  const url = file?.resolvedTempURL ?? ""
  if (!file?.fileID || !url) {
    return
  }

  failedCoverUrl.value = url
  emit("cover-error", props.entry.id, file.fileID, url)
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.entry-card {
  @include panel;
  @include pressable;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--app-card-gap);
  align-items: center;
  padding: var(--app-card-padding);
  overflow: hidden;

  &:active {
    opacity: var(--app-press-opacity);
    transform: scale(var(--app-press-scale));
  }
}

.entry-card--with-preview {
  grid-template-columns: minmax(0, 1fr) var(--app-entry-preview-width);
}

.entry-card__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-2);
}

.entry-card__head {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--app-space-3);
}

.entry-card__date-chip {
  flex-shrink: 0;
  padding: var(--app-space-1) var(--app-space-3);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-badge);
  background: var(--app-field);
  color: var(--app-primary);
  font-size: var(--app-font-size-xs);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
}

.entry-card__head-separator {
  flex-shrink: 0;
  color: var(--app-text-muted);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-tight);
}

.entry-card__mood {
  min-width: 0;
  overflow: hidden;
  color: var(--app-accent);
  font-size: var(--app-font-size-md);
  line-height: var(--app-line-height-snug);
  text-overflow: ellipsis;
  white-space: nowrap;
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

.entry-card__excerpt--roomy {
  -webkit-line-clamp: 3;
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

.entry-card__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--app-entry-preview-width);
  height: var(--app-entry-preview-height);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-image);
  background: var(--app-field);
  overflow: hidden;
}

.entry-card__preview-image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: var(--app-radius-image);
  background: var(--app-surface-strong);
  // 封面温柔淡入，链接解析回来时不硬切
  animation: app-soft-in var(--app-duration-normal) var(--app-ease-out);
}

.entry-card__preview-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--app-text-muted);
}

.entry-card__preview-unavailable {
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-tight);
}
</style>
