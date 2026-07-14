import { isValidCalendarDate } from "./date"

export interface ParsedMemoryDate {
  year: number
  month: number
  day: number
  key: string
  isValid: boolean
}

export interface MemoryTimelineMonthGroup<T extends EntryLike = EntryLike> {
  key: string
  year: number | null
  month: number | null
  yearLabel: string
  monthLabel: string
  showYear: boolean
  isUndated: boolean
  entries: T[]
}

export interface EntryLike {
  id: string
  occurredAt: string
  createdAt: number
}

const UNDATED_GROUP_KEY = "undated"

export const parseMemoryDate = (occurredAt: string): ParsedMemoryDate => {
  if (!isValidCalendarDate(occurredAt)) {
    return {
      year: 0,
      month: 0,
      day: 0,
      key: UNDATED_GROUP_KEY,
      isValid: false
    }
  }

  const [yearString, monthString, dayString] = occurredAt.split("-")
  const year = Number(yearString)
  const month = Number(monthString)
  const day = Number(dayString)

  return {
    year,
    month,
    day,
    key: `${year}-${String(month).padStart(2, "0")}`,
    isValid: true
  }
}

const compareEntries = (left: EntryLike, right: EntryLike): number => {
  const leftDate = parseMemoryDate(left.occurredAt)
  const rightDate = parseMemoryDate(right.occurredAt)

  // Primary: occurredAt descending for valid dates; invalid dates sink to bottom.
  if (leftDate.isValid && rightDate.isValid) {
    if (leftDate.year !== rightDate.year) {
      return rightDate.year - leftDate.year
    }

    if (leftDate.month !== rightDate.month) {
      return rightDate.month - leftDate.month
    }

    if (leftDate.day !== rightDate.day) {
      return rightDate.day - leftDate.day
    }
  } else if (leftDate.isValid && !rightDate.isValid) {
    return -1
  } else if (!leftDate.isValid && rightDate.isValid) {
    return 1
  }

  // Secondary: createdAt descending.
  if (left.createdAt !== right.createdAt) {
    return right.createdAt - left.createdAt
  }

  // Final deterministic tie-breaker.
  return left.id.localeCompare(right.id)
}

export const sortMemoryEntries = <T extends EntryLike>(entries: readonly T[]): T[] => {
  return [...entries].sort(compareEntries)
}

export const buildMemoryTimelineMonthGroups = <T extends EntryLike>(entries: readonly T[]): MemoryTimelineMonthGroup<T>[] => {
  const sorted = sortMemoryEntries(entries)
  const groups = new Map<string, MemoryTimelineMonthGroup<T>>()
  let previousYear: number | null = null

  for (const entry of sorted) {
    const date = parseMemoryDate(entry.occurredAt)
    const key = date.key
    const group = groups.get(key)

    if (group) {
      group.entries.push(entry)
      continue
    }

    const year = date.isValid ? date.year : null
    const month = date.isValid ? date.month : null
    const showYear = year !== null && year !== previousYear

    if (year !== null) {
      previousYear = year
    }

    groups.set(key, {
      key,
      year,
      month,
      yearLabel: year !== null ? `${year}` : "",
      monthLabel: month !== null ? `${month}月` : "日期待整理",
      showYear,
      isUndated: !date.isValid,
      entries: [entry]
    })
  }

  return Array.from(groups.values())
}
