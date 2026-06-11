<template>
  <view class="app-option-group" :style="groupStyle">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
  defineProps<{
    columns?: 2 | 3
  }>(),
  {
    columns: 2
  }
)

const groupStyle = computed(() => `--app-option-group-columns: ${props.columns}`)
</script>

<style lang="scss" scoped>
.app-option-group {
  display: grid;
  grid-template-columns: repeat(var(--app-option-group-columns), minmax(0, 1fr));
  gap: var(--app-option-group-gap);
}
</style>
