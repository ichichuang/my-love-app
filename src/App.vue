<script setup lang="ts">
import { onLaunch, onShow } from "@dcloudio/uni-app"
import { initCloudBase } from "@/services/cloudbase"
import { useThemeStore } from "@/stores/theme"

onLaunch(() => {
  const theme = useThemeStore()
  theme.initTheme()
  initCloudBase()
})

onShow(() => {
  const theme = useThemeStore()
  theme.bindSystemThemeListener()
  theme.applyNavigationTheme()
})
</script>

<style lang="scss">
@import "./styles/variables.scss";
@import "./styles/mixins.scss";
@import "./styles/transitions.scss";

page {
  min-height: 100%;
  background: var(--app-bg);
  color: var(--app-text);
  transition: background-color 260ms ease, color 260ms ease;
}

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}

button {
  font: inherit;
}
</style>
