/**
 * 纯日历日期工具。
 *
 * 所有日期差计算都基于解析后的公历日期和 UTC 日序号，
 * 避免使用本地时间戳减法或在页面代码里直接除以毫秒。
 */

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PER_DAY = 86400000

export interface CalendarDate {
  year: number
  month: number
  day: number
}

export const isLeapYear = (year: number): boolean =>
  year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)

export const daysInMonth = (year: number, month: number): number => {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export const isValidCalendarDate = (value: string): boolean => {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  const match = CALENDAR_DATE_PATTERN.exec(trimmed)
  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (year <= 0 || month < 1 || month > 12 || day < 1) {
    return false
  }

  return day <= daysInMonth(year, month)
}

export const parseCalendarDate = (value: string): CalendarDate | null => {
  const trimmed = value.trim()
  if (!isValidCalendarDate(trimmed)) {
    return null
  }

  const match = CALENDAR_DATE_PATTERN.exec(trimmed) as RegExpExecArray
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  }
}

export const formatCalendarDate = ({ year, month, day }: CalendarDate): string =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

export const formatChineseDate = (value: string): string => {
  const parsed = parseCalendarDate(value)
  if (!parsed) {
    return ""
  }

  return `${parsed.year}年${parsed.month}月${parsed.day}日`
}

/**
 * 把公历日期转为 UTC 日序号（自 1970-01-01 起的天数，可为负）。
 */
export const calendarDateToUtcOrdinal = (date: CalendarDate): number =>
  Math.floor(Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY)

/**
 * 把 UTC 日序号转回公历日期。
 */
export const utcOrdinalToCalendarDate = (ordinal: number): CalendarDate => {
  const date = new Date(ordinal * MS_PER_DAY)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  }
}

/**
 * 计算两个日历日期之间的天数差：`left - right`。
 * 非法日期返回 `null`。
 */
export const calendarDayDiff = (left: string, right: string): number | null => {
  const leftDate = parseCalendarDate(left)
  const rightDate = parseCalendarDate(right)
  if (!leftDate || !rightDate) {
    return null
  }

  return calendarDateToUtcOrdinal(leftDate) - calendarDateToUtcOrdinal(rightDate)
}

export const compareCalendarDates = (left: string, right: string): number => {
  const diff = calendarDayDiff(left, right)
  if (diff === null) {
    return 0
  }

  return diff
}

/**
 * 在指定年份上增加整年，保持月日不变（2月29日按闰年规则处理）。
 */
export const addCalendarYears = (date: CalendarDate, years: number): CalendarDate => {
  const targetYear = date.year + years
  const targetDay = date.month === 2 && date.day === 29 && !isLeapYear(targetYear) ? 28 : date.day

  return {
    year: targetYear,
    month: date.month,
    day: targetDay
  }
}

export interface CalendarDuration {
  years: number
  months: number
  days: number
}

const addCalendarMonths = (date: CalendarDate, months: number): CalendarDate => {
  const totalMonths = date.month - 1 + months
  const year = date.year + Math.floor(totalMonths / 12)
  const month = (totalMonths % 12) + 1
  const day = Math.min(date.day, daysInMonth(year, month))

  return { year, month, day }
}

/**
 * 计算两个日历日期之间的公历年/月/日持续时长。
 *
 * 固定锚点最大单位语义：
 * 1. 从原始起点取最大整年数（周年始终按原始月日计算，2月29日在平年归一到2月28日，
 *    回到闰年恢复2月29日）；
 * 2. 在取完整年后得到的同一个锚点上取最大整月数——每个月候选都直接由该锚点加 N 个月
 *    得到，月末截断只影响当前候选，不会被带入下一个月候选（避免逐月累加并把截断日
 *    继续向前携带造成的月末漂移，例如 1月31日 + 2 个月必须得到 3月31日）；
 * 3. 剩余部分为真实日历天数。
 *
 * 不使用近似月长，也不使用毫秒差。当 `end < start` 时返回 `{0,0,0}`。
 * 逆运算见 `applyCalendarDuration`。
 */
export const calendarDurationBetween = (start: string, end: string): CalendarDuration | null => {
  const startDate = parseCalendarDate(start)
  const endDate = parseCalendarDate(end)
  if (!startDate || !endDate) {
    return null
  }

  if (compareCalendarDates(end, start) < 0) {
    return { years: 0, months: 0, days: 0 }
  }

  const isLeapDaySource = startDate.month === 2 && startDate.day === 29

  const anniversaryForYear = (year: number): CalendarDate => {
    if (!isLeapDaySource) {
      return { year, month: startDate.month, day: startDate.day }
    }

    return { year, month: 2, day: isLeapYear(year) ? 29 : 28 }
  }

  let years = 0
  while (compareCalendarDates(formatCalendarDate(anniversaryForYear(startDate.year + years + 1)), end) <= 0) {
    years += 1
  }
  const yearAnchor = anniversaryForYear(startDate.year + years)

  let months = 0
  while (compareCalendarDates(formatCalendarDate(addCalendarMonths(yearAnchor, months + 1)), end) <= 0) {
    months += 1
  }
  const monthAnchor = addCalendarMonths(yearAnchor, months)

  const days = calendarDayDiff(end, formatCalendarDate(monthAnchor)) ?? 0

  return { years, months, days }
}

/**
 * 在日历日期上增加指定天数，按 UTC 日序号进位，结果为真实公历日期。
 */
export const addCalendarDays = (date: CalendarDate, days: number): CalendarDate =>
  utcOrdinalToCalendarDate(calendarDateToUtcOrdinal(date) + days)

/**
 * `calendarDurationBetween` 的逆运算：按同一套固定锚点规则把持续时长应用回起点。
 *
 * 先加整年（2月29日在平年归一到2月28日），再从该单一锚点加整月（月末截断，
 * 与求解时的候选计算使用同一个 `addCalendarMonths`），最后加剩余日历天数。
 * 对任意 `start <= end`：
 * `applyCalendarDuration(start, calendarDurationBetween(start, end)) === end`。
 */
export const applyCalendarDuration = (start: string, duration: CalendarDuration): string | null => {
  const startDate = parseCalendarDate(start)
  if (!startDate) {
    return null
  }

  const yearApplied = addCalendarYears(startDate, duration.years)
  const monthApplied = addCalendarMonths(yearApplied, duration.months)
  return formatCalendarDate(addCalendarDays(monthApplied, duration.days))
}

/**
 * 两个日期之间的整年数，按公历周年计算（已过当年纪念日才计入）。
 */
export const wholeYearsBetween = (start: string, end: string): number | null => {
  const startDate = parseCalendarDate(start)
  const endDate = parseCalendarDate(end)
  if (!startDate || !endDate) {
    return null
  }

  let years = endDate.year - startDate.year
  if (
    endDate.month < startDate.month ||
    (endDate.month === startDate.month && endDate.day < startDate.day)
  ) {
    years -= 1
  }

  return years
}

export const todayCalendarDate = (): string => {
  const now = new Date()
  return formatCalendarDate({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate()
  })
}
