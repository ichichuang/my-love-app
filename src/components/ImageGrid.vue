<template>
  <view v-if="files.length > 0" class="image-grid">
    <view v-for="(file, index) in files" :key="file.fileID" class="image-grid__item">
      <image
        v-if="isImageUsable(file)"
        class="image-grid__image"
        :src="file.resolvedTempURL || ''"
        mode="aspectFill"
        @click="preview(index)"
        @error="handleImageError(index)"
      />
      <view v-else class="image-grid__fallback">
        <text>私密图片</text>
      </view>
      <view v-if="isImageUsable(file)" class="image-grid__veil">
        <text>{{ index + 1 }}</text>
      </view>
      <wd-button
        v-if="editable"
        size="small"
        type="info"
        custom-class="image-grid__remove"
        hover-stop-propagation
        @click.stop="emit('remove', index)"
      >
        移除
      </wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { shallowRef } from "vue"
import type { CloudFile } from "@/services/cloudbase"

const props = defineProps<{
  files: CloudFile[]
  editable?: boolean
}>()

const emit = defineEmits<{
  remove: [index: number]
  "image-error": [fileID: string]
}>()

const failedImageUrls = shallowRef<ReadonlySet<string>>(new Set())

const isImageUsable = (file: CloudFile): boolean =>
  Boolean(file.resolvedTempURL && !failedImageUrls.value.has(file.resolvedTempURL))

const preview = (index: number) => {
  const urls = props.files.map((file) => file.resolvedTempURL).filter((url): url is string => {
    return Boolean(url && !failedImageUrls.value.has(url))
  })
  const current = props.files[index]?.resolvedTempURL
  if (!current || failedImageUrls.value.has(current) || urls.length === 0) {
    return
  }

  uni.previewImage({
    urls,
    current
  })
}

const handleImageError = (index: number) => {
  const file = props.files[index]
  const url = file?.resolvedTempURL
  if (!file?.fileID || !url) {
    return
  }

  const nextFailedImageUrls = new Set(failedImageUrls.value)
  nextFailedImageUrls.add(url)
  failedImageUrls.value = nextFailedImageUrls
  emit("image-error", file.fileID)
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

:deep(.image-grid__remove.wd-button.is-small) {
  position: absolute;
  right: var(--app-space-0);
  bottom: var(--app-space-0);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  width: var(--app-image-remove-touch-size);
  min-width: var(--app-image-remove-touch-size);
  height: var(--app-image-remove-touch-size);
  min-height: var(--app-image-remove-touch-size);
  padding: var(--app-space-2);
  border: 0;
  border-radius: var(--app-radius-image);
  background: transparent;
  box-shadow: var(--app-shadow-none);
  color: var(--app-color-on-overlay);
  font-family: var(--app-font-family-body);
  font-size: var(--app-font-size-sm);
  font-weight: var(--app-font-weight-medium);
  line-height: var(--app-line-height-none);
}

:deep(.image-grid__remove.wd-button.is-small::before) {
  display: none;
}

:deep(.image-grid__remove .wd-button__content) {
  height: var(--app-image-remove-height);
  padding: var(--app-space-0) var(--app-image-remove-padding-x);
  border-radius: var(--app-radius-pill);
  background: var(--app-color-overlay-strong);
  color: var(--app-color-on-overlay);
  line-height: var(--app-image-remove-height);
}

:deep(.image-grid__remove .wd-button__text) {
  color: inherit;
  line-height: var(--app-line-height-none);
}

:deep(.image-grid__remove.wd-button.is-small.wd-button--active .wd-button__content) {
  opacity: var(--app-muted-opacity);
}
</style>
