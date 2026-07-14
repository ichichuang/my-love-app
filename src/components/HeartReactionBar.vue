<template>
  <view class="heart-reaction-bar" :class="barClass">
    <view class="heart-reaction-bar__content" @click="handleAction">
      <view class="heart-reaction-bar__mark" aria-hidden="true">
        <text class="heart-reaction-bar__heart">♥</text>
      </view>
      <view class="heart-reaction-bar__copy">
        <text class="heart-reaction-bar__status">{{ statusText }}</text>
        <text v-if="hintText" class="heart-reaction-bar__hint">{{ hintText }}</text>
      </view>
    </view>

    <wd-button
      v-if="canUndo"
      size="small"
      plain
      :loading="heart.removing.value"
      custom-class="heart-reaction-bar__undo"
      @click="handleUndo"
    >
      收回
    </wd-button>

    <HeartReactionPersonSheet
      v-model="sheetOpen"
      @select="handlePersonSelected"
      @cancel="handleSheetCancel"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useMessage } from "wot-design-uni/components/wd-message-box"
import HeartReactionPersonSheet from "@/components/HeartReactionPersonSheet.vue"
import { showAppError } from "@/composables/useAppToast"
import { useHeartReaction } from "@/composables/useHeartReaction"
import { useLocalPerson } from "@/composables/useLocalPerson"
import { setTimelineReactionChanged } from "@/composables/useTimelineReactionSignal"

const props = defineProps<{
  entryId: string
}>()

const message = useMessage()
const localPerson = useLocalPerson()
const heart = useHeartReaction({ localPerson })
const sheetOpen = ref(false)
const sendAfterSelect = ref(false)

const hasMyReaction = computed(() => heart.myReaction.value !== null)
const hasAnyReaction = computed(() => heart.reactions.value.length > 0)
const isBusy = computed(() => heart.sending.value || heart.removing.value || heart.loading.value)

const statusText = computed(() => {
  if (hasMyReaction.value) {
    return "已比心"
  }

  if (hasAnyReaction.value) {
    return "小心心已收到"
  }

  return "给这段回忆比个小心心"
})

const hintText = computed(() => {
  if (hasMyReaction.value) {
    return ""
  }

  if (hasAnyReaction.value) {
    return ""
  }

  return localPerson.hasSelectedPerson.value ? "轻轻点一下" : "先选一下是谁的小心意"
})

const canUndo = computed(() => hasMyReaction.value && !heart.removing.value)

const barClass = computed(() => ({
  "heart-reaction-bar--sent": hasMyReaction.value,
  "heart-reaction-bar--received": !hasMyReaction.value && hasAnyReaction.value,
  "heart-reaction-bar--empty": !hasMyReaction.value && !hasAnyReaction.value,
  "heart-reaction-bar--busy": isBusy.value
}))

const loadReactions = () => {
  if (props.entryId) {
    void heart.loadReactions(props.entryId)
  }
}

watch(
  () => props.entryId,
  () => loadReactions(),
  { immediate: true }
)

watch(
  () => localPerson.selectedKey.value,
  () => loadReactions()
)

watch(
  () => heart.errorMessage.value,
  (errorMessage) => {
    if (errorMessage) {
      showAppError(errorMessage)
    }
  }
)

const handleAction = async () => {
  if (!props.entryId || isBusy.value) {
    return
  }

  if (hasMyReaction.value) {
    await handleUndo()
    return
  }

  if (!localPerson.hasSelectedPerson.value) {
    sendAfterSelect.value = true
    sheetOpen.value = true
    return
  }

  await heart.sendHeart(props.entryId)
  setTimelineReactionChanged(props.entryId)
}

const handleUndo = async () => {
  if (!props.entryId || !hasMyReaction.value || heart.removing.value) {
    return
  }

  try {
    await message.confirm({
      title: "收回这颗小心心",
      msg: "确定要收回给这段回忆的小心意吗？",
      cancelButtonText: "先留着",
      confirmButtonText: "收回",
      confirmButtonProps: {
        plain: true,
        type: "error" as const
      },
      cancelButtonProps: {
        plain: true,
        type: "info" as const
      }
    })

    await heart.removeHeart(props.entryId)
    setTimelineReactionChanged(props.entryId)
  } catch {
    // User cancelled; keep the heart.
  }
}

const handlePersonSelected = () => {
  if (sendAfterSelect.value && props.entryId) {
    sendAfterSelect.value = false
    void heart.sendHeart(props.entryId).then(() => {
      setTimelineReactionChanged(props.entryId)
    })
  }
}

const handleSheetCancel = () => {
  sendAfterSelect.value = false
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.heart-reaction-bar {
  @include panel;
  @include pressable;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-6);
  padding: var(--app-space-5) var(--app-card-padding);
  overflow: hidden;
  background:
    linear-gradient(135deg, var(--app-surface-strong), var(--app-field));
  box-shadow: var(--app-shadow-none);
}

.heart-reaction-bar__content {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--app-space-5);
  min-width: 0;
}

.heart-reaction-bar__mark {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--app-space-14);
  height: var(--app-space-14);
  border-radius: var(--app-radius-round);
  background: var(--app-heart-soft);
  color: var(--app-primary);
}

.heart-reaction-bar__heart {
  font-size: var(--app-font-size-lg);
  line-height: var(--app-line-height-none);
}

.heart-reaction-bar__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--app-space-1);
  min-width: 0;
}

.heart-reaction-bar__status {
  color: var(--app-text);
  font: var(--app-font-body);
}

.heart-reaction-bar__hint {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.heart-reaction-bar--sent .heart-reaction-bar__mark {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.heart-reaction-bar--received .heart-reaction-bar__mark {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.heart-reaction-bar--busy {
  opacity: var(--app-disabled-opacity);
  pointer-events: none;
}

:deep(.heart-reaction-bar__undo) {
  flex-shrink: 0;
  box-shadow: var(--app-shadow-none);
}
</style>
