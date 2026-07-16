import type { CloudFile } from "@/services/cloudbase"

// 时间线封面统一选图规则：第一条类型为图片且 fileID 非空的文件。
// EntryCard 封面与首页图片水合必须共用这一份规则，避免各自假设 files[0]。
export const selectFirstImageFile = (files: CloudFile[]): CloudFile | undefined =>
  files.find((file) => file.type === "image" && file.fileID.length > 0)
