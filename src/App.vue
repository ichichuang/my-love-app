<script setup lang="ts">
import { watch } from "vue"
import { onLaunch, onShow } from "@dcloudio/uni-app"
import { scheduleNativeChromeTheme } from "@/design-system/nav-theme"
import { useThemeStore } from "@/stores/theme"

const theme = useThemeStore()

const scheduleCurrentNativeChromeTheme = () => {
  scheduleNativeChromeTheme(theme.nativeChromeTheme)
}

watch(
  () =>
    [
      theme.nativeChromeTheme.frontColor,
      theme.nativeChromeTheme.navigationBarBackgroundColor,
      theme.nativeChromeTheme.backgroundColor,
      theme.nativeChromeTheme.backgroundColorTop,
      theme.nativeChromeTheme.backgroundColorBottom,
      theme.nativeChromeTheme.backgroundTextStyle,
      theme.nativeChromeTheme.pageStyle
    ] as const,
  scheduleCurrentNativeChromeTheme
)

onLaunch(() => {
  theme.initTheme()
  scheduleCurrentNativeChromeTheme()
})

onShow(() => {
  theme.bindSystemThemeListener()
  scheduleCurrentNativeChromeTheme()
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
