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
  text-align: center;
}

.app-option-button--active {
  border-color: var(--app-primary);
  background: var(--app-surface-strong);
  color: var(--app-primary);
  box-shadow: var(--app-shadow-focus);
}

.app-option-button--pressed {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale));
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
