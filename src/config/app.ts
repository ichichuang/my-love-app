export const appConfig = {
  name: "珊瑚行动",
  subtitle: "只给我们两个人的记忆花园",
  cloudbaseEnvId: import.meta.env.VITE_CLOUDBASE_ENV_ID ?? "",
  wechatAppId: import.meta.env.VITE_WECHAT_APPID ?? "",
  entriesCollection: "love_entries",
  storageBasePath: "private/love-entries",
  maxUploadCount: 9,
  maxUploadSizeMb: 12
} as const

export const isCloudConfigured = () => appConfig.cloudbaseEnvId.trim().length > 0
