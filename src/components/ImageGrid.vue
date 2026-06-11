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
        <text>私密图片</text>
      </view>
      <view v-if="file.tempFileURL" class="image-grid__veil">
        <text>{{ index + 1 }}</text>
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
  gap: var(--app-image-grid-gap);
}

.image-grid__item {
  position: relative;
  min-width: 0;
  aspect-ratio: 1;
  overflow: hidden;
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-image);
  background: var(--app-surface-strong);
  box-shadow: var(--app-shadow-image);
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
  font-size: var(--app-font-size-md);
}

.image-grid__veil {
  position: absolute;
  top: var(--app-space-2);
  left: var(--app-space-2);
  min-width: var(--app-image-badge-size);
  height: var(--app-image-badge-size);
  border: var(--app-panel-border-width) solid var(--app-color-photo-badge-border);
  border-radius: var(--app-radius-pill);
  background: var(--app-color-overlay-soft);
  color: var(--app-color-on-overlay);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-image-badge-size);
  text-align: center;
}

.image-grid__remove {
  position: absolute;
  right: var(--app-space-2);
  bottom: var(--app-space-2);
  min-width: 0;
  height: var(--app-image-remove-height);
  padding: var(--app-space-0) var(--app-image-remove-padding-x);
  border: 0;
  border-radius: var(--app-radius-pill);
  background: var(--app-color-overlay-strong);
  color: var(--app-color-on-overlay);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-image-remove-height);
}

.image-grid__remove--active {
  opacity: var(--app-muted-opacity);
}
</style>
