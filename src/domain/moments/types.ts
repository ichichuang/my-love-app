/**
 * 我们的小日子 —— 纪念日/倒数日领域类型。
 *
 * 这些类型只描述持久化记录与显示配置，不包含任何派生值
 * （如已过天数、剩余天数、周年数、下次发生日、下一个里程碑）。
 *
 * 本模块不导入任何 Vue、UniApp、Pinia、CloudBase、repository、page 或 component
 * 运行时；文件元数据使用自有的 `MomentFile` 纯类型。
 */

export type MomentCategory =
  | "anniversary"
  | "birthday"
  | "first"
  | "travel"
  | "daily"
  | "custom"

export type MomentDisplayMode = "auto" | "countup" | "countdown"
export type MomentRecurrence = "none" | "yearly"
export type MomentCounting = "elapsed" | "ordinal"
export type MomentDisplay = "days" | "calendar"
export type MomentLeapDayPolicy = "feb28" | "mar1" | "skip"

/**
 * 小程序端持久化文件的最小纯类型。
 * 不包含运行时临时 URL（如 `resolvedTempURL`），避免与 CloudBase 服务层耦合。
 */
export interface MomentFile {
  fileID: string
  cloudPath: string
  name: string
  type: "image" | "file"
  size?: number
  uploadedAt?: number
}

/**
 * 全端统一的用户可见分类文案：创建预设、列表卡片、详情票根、模板占位符
 * 与落库 `mood` 字段都从这里取同一份标签。已有历史文档无需迁移。
 */
export const momentCategoryLabels: Record<MomentCategory, string> = {
  anniversary: "纪念日",
  birthday: "生日",
  first: "第一次",
  travel: "旅行或计划",
  daily: "普通日子",
  custom: "自己设置"
}

export const momentDisplayModeLabels: Record<MomentDisplayMode, string> = {
  auto: "自动",
  countup: "正计时",
  countdown: "倒计时"
}

export const momentRecurrenceLabels: Record<MomentRecurrence, string> = {
  none: "不重复",
  yearly: "每年"
}

export const momentCountingLabels: Record<MomentCounting, string> = {
  elapsed: "已过",
  ordinal: "第几天"
}

export const momentDisplayLabels: Record<MomentDisplay, string> = {
  days: "天数",
  calendar: "日历"
}

export const momentLeapDayPolicyLabels: Record<MomentLeapDayPolicy, string> = {
  feb28: "2月28日",
  mar1: "3月1日",
  skip: "跳过平年"
}

export interface MomentDraft {
  category: MomentCategory
  title: string
  content: string
  sourceDate: string
  pinned: boolean
  files: MomentFile[]
  template: string
  reminderOffsets: number[]
  milestoneValues: number[]
  mode: MomentDisplayMode
  recurrence: MomentRecurrence
  counting: MomentCounting
  display: MomentDisplay
  leapDayPolicy: MomentLeapDayPolicy
}

export interface MomentRecord extends MomentDraft {
  id: string
  kind: "moment"
  createdAt: number
  updatedAt: number
}

export const createDefaultMomentDraft = (): MomentDraft => ({
  category: "custom",
  title: "",
  content: "",
  sourceDate: "",
  pinned: false,
  files: [],
  template: "{title}",
  reminderOffsets: [],
  milestoneValues: [],
  mode: "auto",
  recurrence: "none",
  counting: "elapsed",
  display: "days",
  leapDayPolicy: "feb28"
})
