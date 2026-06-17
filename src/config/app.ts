const publicEnvValue = (value: string | undefined): string => (typeof value === "string" ? value.trim() : "")
const coupleId = "main"
const storageBasePath = "love-entries"

export const appConfig = {
  name: "小珊的树洞",
  subtitle: "只给我们两个人的小树洞",
  cloudbaseEnvId: publicEnvValue(import.meta.env.VITE_CLOUDBASE_ENV_ID),
  wechatAppId: publicEnvValue(import.meta.env.VITE_WECHAT_APPID),
  coupleId,
  entriesCollection: "love_entries",
  storageBasePath,
  storageEntriesPath: `${storageBasePath}/${coupleId}`,
  maxUploadCount: 9,
  maxUploadSizeMb: 12
} as const

export const isCloudConfigured = () => appConfig.cloudbaseEnvId.length > 0
