<!-- 访问控制运行时已在体验版构建中冻结。本文件保留源代码与历史，但当前不再执行启动拦截。 -->
<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="小珊的树洞" nav-eyebrow="私密入口" :nav-variant="'home'">
    <view class="access-page">
      <view class="access-note app-reveal-1">
        <text class="access-note__kicker">先确认这张小纸条给谁看</text>
        <text class="access-note__title">{{ statusTitle }}</text>
        <text class="access-note__body">{{ statusBody }}</text>

        <view class="access-note__status">
          <wd-loading v-if="access.checking" />
          <text v-else class="access-note__stamp">{{ statusStamp }}</text>
        </view>

        <wd-button
          v-if="canRetry"
          block
          size="large"
          :loading="access.checking"
          @click="retryAccessCheck"
        >
          再试一次
        </wd-button>
      </view>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { onShow } from "@dcloudio/uni-app"
import { useAccessGuard } from "@/composables/useAccessGuard"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"

const theme = useNativeChromeSync()
const { access, redirectToAuthorizedPage } = useAccessGuard()

const statusTitle = computed(() => {
  if (access.checking) {
    return "正在翻访问名单"
  }

  if (access.authorized) {
    return "已经认出你啦"
  }

  if (access.pairingRequired) {
    return "还差一段小暗号"
  }

  if (access.error) {
    return "云端小仓库暂时没回话"
  }

  if (access.configurationRequired) {
    return "访问名单还没收好"
  }

  if (access.revoked || access.disabled) {
    return "这台微信暂时不能进入"
  }

  if (access.notWhitelisted || access.denied) {
    return "这本小本本只给被允许的人看"
  }

  return "先轻轻核对一下"
})

const statusBody = computed(() => {
  if (access.checking) {
    return "正在悄悄确认这台微信能不能进来。"
  }

  if (access.authorized) {
    return "马上带你回到小树洞里。"
  }

  if (access.pairingRequired) {
    return "暗号入口还没打开，这一版先只显示状态。"
  }

  if (access.error) {
    return access.error
  }

  if (access.configurationRequired) {
    return "如果这是该进来的人，需要先在云开发里把访问名单配置好。"
  }

  if (access.revoked || access.disabled) {
    return "如果需要恢复访问，需要在云开发的私有配置里重新放行。"
  }

  if (access.notWhitelisted || access.denied) {
    return "这台微信不在私密访问名单里。"
  }

  return "不会在这里输入密码，也不会保存任何秘密。"
})

const statusStamp = computed(() => {
  if (access.authorized) {
    return "可进入"
  }

  if (access.pairingRequired) {
    return "待暗号"
  }

  if (access.error) {
    return "待重试"
  }

  if (access.configurationRequired) {
    return "未配置"
  }

  if (access.revoked) {
    return "已撤销"
  }

  if (access.disabled) {
    return "已停用"
  }

  if (access.notWhitelisted || access.denied) {
    return "未放行"
  }

  return "待确认"
})

const canRetry = computed(() => !access.authorized && !access.checking)

const refreshAccess = async (force = false) => {
  await access.checkAccess({ force })
  if (access.authorized) {
    redirectToAuthorizedPage()
  }
}

const retryAccessCheck = () => {
  void refreshAccess(true)
}

onShow(() => {
  void refreshAccess()
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.access-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - var(--app-space-48));
  justify-content: center;
}

.access-note {
  @include panel;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
  overflow: hidden;
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.access-note::before {
  position: absolute;
  top: var(--app-card-padding);
  right: var(--app-card-padding);
  width: var(--app-space-24);
  height: var(--app-space-14);
  border-top: var(--app-panel-border-width) dashed var(--app-divider);
  border-bottom: var(--app-panel-border-width) dashed var(--app-divider);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(8deg);
}

.access-note__kicker,
.access-note__body {
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.access-note__kicker {
  color: var(--app-accent);
  font: var(--app-font-caption);
}

.access-note__title {
  color: var(--app-text);
  font: var(--app-font-page-title);
}

.access-note__status {
  display: flex;
  min-height: var(--app-control-height-md);
  align-items: center;
}

.access-note__stamp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--app-control-height-md);
  padding: var(--app-space-2) var(--app-space-8);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-pill);
  color: var(--app-primary);
  font: var(--app-font-caption);
}
</style>
