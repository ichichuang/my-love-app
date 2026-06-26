const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/

const daysInMonth = (year: number, month: number): number => {
  if (month === 2) {
    return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0) ? 29 : 28
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export const isValidCalendarDate = (value: string): boolean => {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  const match = calendarDatePattern.exec(trimmed)
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

export const normalizeCalendarDate = (value: string): string => {
  const trimmed = value.trim()
  return isValidCalendarDate(trimmed) ? trimmed : ""
}

export const formatChineseDate = (value: string): string => {
  const match = calendarDatePattern.exec(value.trim())
  if (!match) {
    return ""
  }

  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`
}

export const calendarDateToTimestamp = (value: string): number => {
  const match = calendarDatePattern.exec(value.trim())
  if (!match) {
    return Number.NaN
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime()
}

export const timestampToCalendarDate = (timestamp: number): string => {
  if (!Number.isFinite(timestamp)) {
    return ""
  }

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const todayCalendarDate = (): string => timestampToCalendarDate(Date.now())
