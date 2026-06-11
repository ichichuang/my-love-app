<script setup lang="ts">
import { watch } from "vue"
import { onLaunch, onShow } from "@dcloudio/uni-app"
import { scheduleNavigationTheme } from "@/design-system/nav-theme"
import { initCloudBase } from "@/services/cloudbase"
import { useThemeStore } from "@/stores/theme"

const theme = useThemeStore()

const scheduleCurrentNavigationTheme = () => {
  scheduleNavigationTheme(theme.navigationTheme)
}

watch(
  () => [theme.navigationTheme.frontColor, theme.navigationTheme.backgroundColor] as const,
  scheduleCurrentNavigationTheme
)

onLaunch(() => {
  theme.initTheme()
  scheduleCurrentNavigationTheme()
  initCloudBase()
})

onShow(() => {
  theme.bindSystemThemeListener()
  scheduleCurrentNavigationTheme()
})
</script>

<style lang="scss">
@import "./styles/index.scss";
@import "./styles/transitions.scss";

page {
  min-height: 100%;
  background: var(--app-color-bg-page);
  color: var(--app-color-text-primary);
  transition: background-color var(--app-transition-normal), color var(--app-transition-normal);
}

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}

button {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: inherit;
  text-align: inherit;
}

button::after,
button:after {
  border: 0;
}
</style>
