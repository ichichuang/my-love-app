/**
 * 里程碑值是纪念序号，例如 100 表示“第 100 天”。
 *
 * 纪念序号永远以原始源日期为锚：源日期是第 1 天，每过一天序号加 1。
 * 年度重复不会把序号重置为上一周年的发生日——“第 1000 天”永远指
 * 距原始源日期的第 1000 天，而不是距最近一次周年的第 1000 天。
 *
 * 归一化会剔除非数字、非有限数、非安全整数、非正数和超过 1000000 的值，
 * 去重并升序排列；不修改入参数组，永远返回新数组。
 *
 * 查询时忽略已经达到或超过的序号，返回最近的未来里程碑。
 */

import { calendarDayDiff } from "./calendar"

/** 单个里程碑允许的最大天数：编辑器、落库与展示都以这一个上界为准。 */
export const MOMENT_MILESTONE_MAX_VALUE = 1000000

/**
 * 里程碑归一化的唯一权威实现：编辑器草稿、Repository 写入、投影计算与详情展示
 * 都必须走这里。保留的值必须同时满足：数字、有限、安全整数、大于 0、不超过
 * `MOMENT_MILESTONE_MAX_VALUE`；返回去重后的升序新数组。
 */
export const normalizeMilestoneValues = (values: unknown): number[] => {
  if (!Array.isArray(values)) {
    return []
  }

  const seen = new Set<number>()
  return values
    .filter(
      (value): value is number =>
        typeof value === "number" &&
        Number.isFinite(value) &&
        Number.isSafeInteger(value) &&
        value > 0 &&
        value <= MOMENT_MILESTONE_MAX_VALUE
    )
    .sort((left, right) => left - right)
    .filter((value) => {
      if (seen.has(value)) {
        return false
      }
      seen.add(value)
      return true
    })
}

/**
 * 当前纪念序号（从 1 开始），永远以原始源日期为锚：
 * 源日期当天是第 1 天，已过去 N 天即第 N+1 天，与重复规则和显示模式无关。
 *
 * 例如源日期 2020-05-10、今天 2026-05-09 时，纪念序号是 2191（原始源日期
 * 已过天数 + 1），而不是距上一周年的 365。
 *
 * 源日期在未来时返回 `undefined`：未来源日期不暴露已达到的纪念序号，
 * 因此也不会暴露任何已达到或将到的日里程碑。
 */
export const resolveCommemorativeDay = (sourceDate: string, today: string): number | undefined => {
  const elapsed = calendarDayDiff(today, sourceDate)
  if (elapsed === null || elapsed < 0) {
    return undefined
  }

  return elapsed + 1
}

/**
 * @param commemorativeDay 当前纪念序号（从 1 开始，源日期锚定，见 `resolveCommemorativeDay`）。
 * @returns 最近的未来里程碑序号；没有未来里程碑时返回 `undefined`
 */
export const findNextMilestone = (commemorativeDay: number, milestoneValues: number[]): number | undefined => {
  const normalized = normalizeMilestoneValues(milestoneValues)
  return normalized.find((value) => value > commemorativeDay)
}
