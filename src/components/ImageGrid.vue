<template>
  <view v-if="files.length > 0" class="image-grid">
    <view v-for="(file, index) in files" :key="file.fileID" class="image-grid__item">
      <image
        v-if="file.tempFileURL"
        class="image-grid__image"
        :src="file.tempFileURL"
        mode="aspectFill"
        @click="preview(index)"
      />
      <view v-else class="image-grid__fallback">
        <text>私密</text>
      </view>
      <button
        v-if="editable"
        class="image-grid__remove"
        hover-class="image-grid__remove--active"
        @click.stop="emit('remove', index)"
      >
        移除
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { CloudFile } from "@/services/cloudbase"

const props = defineProps<{
  files: CloudFile[]
  editable?: boolean
}>()

const emit = defineEmits<{
  remove: [index: number]
}>()

const preview = (index: number) => {
  const urls = props.files.map((file) => file.tempFileURL).filter((url): url is string => Boolean(url))
  const current = props.files[index]?.tempFileURL
  if (!current || urls.length === 0) {
    return
  }

  uni.previewImage({
    urls,
    current
  })
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.image-grid__item {
  position: relative;
  min-width: 0;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
  background: var(--app-surface-strong);
}

.image-grid__image,
.image-grid__fallback {
  width: 100%;
  height: 100%;
}

.image-grid__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-soft);
  font-size: 22rpx;
}

.image-grid__remove {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  min-width: 0;
  height: 42rpx;
  padding: 0 14rpx;
  border: 0;
  border-radius: 999rpx;
  background: var(--app-primary);
  color: var(--app-surface);
  font-size: 20rpx;
  line-height: 42rpx;
}

.image-grid__remove--active {
  opacity: 0.75;
}
</style>
