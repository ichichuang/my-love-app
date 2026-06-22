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
