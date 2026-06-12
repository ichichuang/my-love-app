<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell :title="pageTitle" :eyebrow="pageEyebrow">
    <empty-state
      title="这里会收好想唱给她的歌"
      body="先把曲目位置留出来，歌名、备注和唱过的标记会在后续一起补上。"
    >
      <wd-button custom-class="song-edit-empty__button" @click="backToSongs">返回点歌清单</wd-button>
    </empty-state>
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"

const theme = useNativeChromeSync()
const hasSongId = shallowRef(false)

const pageTitle = computed(() => (hasSongId.value ? "编辑曲目" : "加一首歌"))
const pageEyebrow = computed(() => (hasSongId.value ? "小小歌单" : "新的点歌"))

const backToSongs = () => {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }

  uni.navigateTo({
    url: "/pages/songs/songs"
  })
}

onLoad((query) => {
  hasSongId.value = typeof query?.id === "string" && query.id.trim().length > 0
})
</script>

<style lang="scss" scoped>
:deep(.song-edit-empty__button) {
  margin-top: var(--app-card-padding);
}
</style>
