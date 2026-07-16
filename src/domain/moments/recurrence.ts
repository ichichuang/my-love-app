import {
  compareCalendarDates,
  formatCalendarDate,
  isLeapYear,
  parseCalendarDate,
  wholeYearsBetween,
  type CalendarDate
} from "./calendar"
import type { MomentLeapDayPolicy, MomentRecurrence } from "./types"

export interface OccurrencePair {
  /**
   * 今天及之前的最近一个发生日（`<= today`）。
   * 如果今天还早于第一次发生，则为 `null`。
   */
  current: string | null
  /**
   * 今天之后的最近一个发生日（`> today`）。
   */
  next: string | null
}

const findOccurrenceForYear = (
  sourceDate: CalendarDate,
  year: number,
  leapDayPolicy: MomentLeapDayPolicy
): string | null => {
  if (sourceDate.month !== 2 || sourceDate.day !== 29) {
    return formatCalendarDate({ year, month: sourceDate.month, day: sourceDate.day })
  }

  if (isLeapYear(year)) {
    return formatCalendarDate({ year, month: 2, day: 29 })
  }

  switch (leapDayPolicy) {
    case "feb28":
      return formatCalendarDate({ year, month: 2, day: 28 })
    case "mar1":
      return formatCalendarDate({ year, month: 3, day: 1 })
    case "skip":
      return null
  }
}

const resolveNoneRecurrence = (sourceDate: string, today: string): OccurrencePair => {
  const diff = compareCalendarDates(today, sourceDate)
  if (diff < 0) {
    return { current: null, next: sourceDate }
  }

  return { current: sourceDate, next: null }
}

const resolveYearlyRecurrence = (
  sourceDate: string,
  today: string,
  leapDayPolicy: MomentLeapDayPolicy
): OccurrencePair => {
  const parsedSource = parseCalendarDate(sourceDate)
  const parsedToday = parseCalendarDate(today)
  if (!parsedSource || !parsedToday) {
    return { current: null, next: null }
  }

  const currentYear = parsedToday.year
  let current: string | null = null

  for (let year = currentYear; year >= parsedSource.year; year -= 1) {
    const occurrence = findOccurrenceForYear(parsedSource, year, leapDayPolicy)
    if (occurrence && compareCalendarDates(occurrence, today) <= 0) {
      current = occurrence
      break
    }
  }

  let next: string | null = null
  for (let year = currentYear; year <= currentYear + 1000; year += 1) {
    const occurrence = findOccurrenceForYear(parsedSource, year, leapDayPolicy)
    if (occurrence && compareCalendarDates(occurrence, today) > 0) {
      next = occurrence
      break
    }
  }

  return { current, next }
}

/**
 * 根据源日期、重复规则、今天日期和闰日策略，解析出当前发生日和下一次发生日。
 *
 * - `none`：只在源日期当天发生一次。
 * - `yearly`：每年发生一次；2月29日按 `feb28`/`mar1`/`skip` 策略处理。
 */
export const resolveOccurrences = (
  sourceDate: string,
  recurrence: MomentRecurrence,
  today: string,
  leapDayPolicy: MomentLeapDayPolicy
): OccurrencePair => {
  if (!parseCalendarDate(sourceDate) || !parseCalendarDate(today)) {
    return { current: null, next: null }
  }

  if (recurrence === "none") {
    return resolveNoneRecurrence(sourceDate, today)
  }

  return resolveYearlyRecurrence(sourceDate, today, leapDayPolicy)
}

/**
 * 已完成周年数。源日期为 0，之后每到达一次周年纪念日加 1。
 *
 * - 非重复：按源日期到今天的整年数计算。
 * - 每年重复：按已到达的纪念日次数计算；`skip` 策略下只计真实闰日。
 */
export const countCompletedAnniversaries = (
  sourceDate: string,
  recurrence: MomentRecurrence,
  today: string,
  leapDayPolicy: MomentLeapDayPolicy
): number => {
  if (!parseCalendarDate(sourceDate) || !parseCalendarDate(today)) {
    return 0
  }

  if (compareCalendarDates(today, sourceDate) < 0) {
    return 0
  }

  if (recurrence === "none") {
    return Math.max(0, wholeYearsBetween(sourceDate, today) ?? 0)
  }

  const { current } = resolveOccurrences(sourceDate, recurrence, today, leapDayPolicy)
  if (!current) {
    return 0
  }

  const source = parseCalendarDate(sourceDate) as CalendarDate
  const currentParsed = parseCalendarDate(current) as CalendarDate

  if (leapDayPolicy === "skip" && source.month === 2 && source.day === 29) {
    let count = 0
    for (let year = source.year + 1; year <= currentParsed.year; year += 1) {
      if (isLeapYear(year)) {
        count += 1
      }
    }
    return count
  }

  return currentParsed.year - source.year
}
