<template>
  <button
    class="app-option-button"
    :class="[
      `app-option-button--${variant}`,
      {
        'app-option-button--active': active,
        'app-option-button--disabled': disabled
      }
    ]"
    :disabled="disabled"
    hover-class="app-option-button--pressed"
    @click="handleClick"
  >
    <slot />
    <view v-if="active && variant === 'default'" class="app-option-button__indicator" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    active?: boolean
    disabled?: boolean
    variant?: "default" | "swatch"
  }>(),
  {
    active: false,
    disabled: false,
    variant: "default"
  }
)

const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  if (!props.disabled) {
    emit("click")
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.app-option-button {
  @include pressable;
  position: relative;
  box-sizing: border-box;
  display: flex;
  min-width: 0;
  width: 100%;
  min-height: var(--app-option-min-height);
  align-items: center;
  justify-content: center;
  padding: var(--app-option-padding-y) var(--app-option-padding-x);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-button);
  background: var(--app-field);
  color: var(--app-text);
  font: var(--app-font-button);
  line-height: var(--app-line-height-normal);
  box-shadow: var(--app-shadow-none);
  text-align: center;
  transition:
    background-color var(--app-transition-normal),
    border-color var(--app-transition-normal),
    color var(--app-transition-normal),
    opacity var(--app-transition-fast),
    box-shadow var(--app-transition-normal),
    transform var(--app-transition-fast);
}

.app-option-button__indicator {
  position: absolute;
  top: var(--app-space-1);
  right: var(--app-space-1);
  width: var(--app-space-3);
  height: var(--app-space-3);
  border-radius: var(--app-radius-round);
  background: var(--app-primary);
  box-shadow: var(--app-shadow-none);
  animation: app-pop-in var(--app-duration-fast) var(--app-ease-bounce) both;
}

.app-option-button--active {
  border-color: var(--app-primary);
  background: var(--app-surface-strong);
  color: var(--app-primary);
  box-shadow: var(--app-shadow-focus-inset);
  // 选中像盖一下小印章：轻轻弹一下再落定（无 fill，按压仍然生效）
  animation: app-tap-pop var(--app-duration-normal) var(--app-ease-bounce);
}

.app-option-button--pressed {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale-strong));
}

.app-option-button--disabled {
  color: var(--app-text-disabled);
  opacity: var(--app-disabled-opacity);
}

.app-option-button--swatch {
  min-height: var(--app-swatch-height);
  height: var(--app-swatch-height);
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  padding: var(--app-space-7);
  border-color: var(--app-color-swatch-border);
  border-radius: var(--app-radius-card);
  background:
    radial-gradient(circle at 18% 20%, var(--app-option-swatch-glow), transparent var(--app-swatch-gradient-size)),
    linear-gradient(135deg, var(--app-option-swatch-primary), var(--app-option-swatch-accent));
  color: var(--app-option-swatch-foreground);
  line-height: var(--app-line-height-none);
  text-align: left;
}

.app-option-button--swatch.app-option-button--active {
  border-color: var(--app-color-swatch-active-border);
  background:
    radial-gradient(circle at 18% 20%, var(--app-option-swatch-glow), transparent var(--app-swatch-gradient-size)),
    linear-gradient(135deg, var(--app-option-swatch-primary), var(--app-option-swatch-accent));
  color: var(--app-option-swatch-foreground);
}
</style>
