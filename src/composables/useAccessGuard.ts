// 访问控制运行时已在体验版构建中冻结。本文件保留源代码与历史，但当前不再执行启动拦截。
import { useAccessStore } from "@/stores/access"

const ACCESS_PAGE_URL = "/pages/access/access"
const DEFAULT_AUTHORIZED_URL = "/pages/index/index"

const currentPageUrl = (): string => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  return currentPage?.route ? `/${currentPage.route}` : ""
}

const isAccessPage = (): boolean => currentPageUrl() === ACCESS_PAGE_URL

const redirectToAccessPage = () => {
  if (isAccessPage()) {
    return
  }

  uni.redirectTo({
    url: ACCESS_PAGE_URL
  })
}

const redirectToAuthorizedPage = () => {
  if (currentPageUrl() === DEFAULT_AUTHORIZED_URL) {
    return
  }

  uni.redirectTo({
    url: DEFAULT_AUTHORIZED_URL
  })
}

export const useAccessGuard = () => {
  const access = useAccessStore()

  const requireAccess = async (options: { force?: boolean; redirect?: boolean } = {}): Promise<boolean> => {
    await access.checkAccess({
      force: options.force
    })

    if (access.authorized) {
      return true
    }

    if (options.redirect !== false) {
      redirectToAccessPage()
    }

    return false
  }

  return {
    access,
    requireAccess,
    redirectToAccessPage,
    redirectToAuthorizedPage,
    isAccessPage
  }
}
