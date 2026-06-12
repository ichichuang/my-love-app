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
      title="这里会记下想一起做的小事"
      body="先把事项位置留出来，标题、备注和完成标记会在后续一起补上。"
    >
      <wd-button custom-class="task-edit-empty__button" @click="backToTasks">返回事项清单</wd-button>
    </empty-state>
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"

const theme = useNativeChromeSync()
const hasTaskId = shallowRef(false)

const pageTitle = computed(() => (hasTaskId.value ? "编辑事项" : "加一件事"))
const pageEyebrow = computed(() => (hasTaskId.value ? "我们的清单" : "新的计划"))

const backToTasks = () => {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }

  uni.navigateTo({
    url: "/pages/tasks/tasks"
  })
}

onLoad((query) => {
  hasTaskId.value = typeof query?.id === "string" && query.id.trim().length > 0
})
</script>

<style lang="scss" scoped>
:deep(.task-edit-empty__button) {
  margin-top: var(--app-card-padding);
}
</style>
