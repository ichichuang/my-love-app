import {
  calendarDayDiff,
  calendarDurationBetween,
  formatChineseDate,
  parseCalendarDate,
  todayCalendarDate,
  type CalendarDuration
} from "./calendar"
import { findNextMilestone, resolveCommemorativeDay } from "./milestones"
import { countCompletedAnniversaries, resolveOccurrences } from "./recurrence"
import {
  momentCategoryLabels,
  type MomentCategory,
  type MomentCounting,
  type MomentDisplayMode,
  type MomentRecurrence,
  type MomentRecord
} from "./types"

export type MomentDirection = "countup" | "countdown" | "today"

/**
 * 展示投影派生值的锚定约定：
 *
 * - 源日期锚定（永不随年度重复重置）：`elapsedDays`、`calendarDuration`、`nextMilestone`。
 * - 发生日锚定（重复规则派生）：`nextOccurrence`、`remainingDays`、`anniversaryCount`，
 *   以及 `direction` / `primaryValue` 的倒计时部分。
 * - `counting`（elapsed|ordinal）只影响 countup 方向的引导文案与 `primaryValue`
 *   展示值，不影响周年计数与里程碑状态。
 */
export interface MomentProjection {
  direction: MomentDirection
  /**
   * 主显示数值：countdown 为距下一发生日的剩余天数；countup 为自原始源日期起的
   * 已过天数（ordinal 时 +1，即“第几天”）；today 为 0（ordinal 时为 1）。
   */
  primaryValue: number
  primaryUnit: string
  leadCopy: string
  secondaryCopy: string
  sourceDateLabel: string
  /** 发生日锚定：今天之后最近的一次发生日；无下一发生日时为 `null`。 */
  nextOccurrence: string | null
  /**
   * 源日期锚定：`today - sourceDate` 的日历天数；源日期在未来时为 0。
   * 与重复规则、显示模式无关，年度重复不会把它重置为距上一周年的天数。
   */
  elapsedDays: number
  /** 发生日锚定：`direction === "countdown"` 时距目标发生日的剩余天数；其余方向为 0。 */
  remainingDays: number
  /** 重复规则派生元数据：已完成的周年次数。 */
  anniversaryCount: number
  isToday: boolean
  /**
   * 源日期锚定：最近的未来日里程碑序号（如第 100/520/1000 天，永远指距原始源日期的
   * 序数日）；没有未来里程碑或源日期在未来时为 `undefined`。
   */
  nextMilestone: number | undefined
  /** 源日期锚定：`sourceDate → today` 的固定锚点公历年/月/日时长；源日期在未来时为 `{0,0,0}`。 */
  calendarDuration: CalendarDuration
  renderedTemplate: string
}

/**
 * 模板支持的占位符。只替换这里列出的键，不存在表达式求值路径。
 */
export const MOMENT_TEMPLATE_PLACEHOLDERS = [
  "title",
  "sourceDate",
  "sourceDateChinese",
  "days",
  "unit",
  "nextOccurrence",
  "nextOccurrenceChinese",
  "anniversary",
  "category",
  "content"
] as const

export type MomentTemplatePlaceholder = (typeof MOMENT_TEMPLATE_PLACEHOLDERS)[number]

/**
 * 中文占位符与英文占位符共用同一份取值，只登记这张表里的键；
 * 未登记的中英文占位符一律原样保留，不存在表达式求值路径。
 */
export const MOMENT_TEMPLATE_PLACEHOLDER_ALIASES: Record<string, MomentTemplatePlaceholder> = {
  标题: "title",
  天数: "days",
  单位: "unit",
  日期: "sourceDateChinese",
  下次日期: "nextOccurrenceChinese",
  周年: "anniversary",
  分类: "category",
  备注: "content"
}

const isValidPlaceholder = (key: string): key is MomentTemplatePlaceholder =>
  MOMENT_TEMPLATE_PLACEHOLDERS.includes(key as MomentTemplatePlaceholder)

export const renderMomentTemplate = (
  template: string,
  record: Pick<MomentRecord, "title" | "sourceDate" | "category" | "content">,
  projection: Pick<MomentProjection, "primaryValue" | "primaryUnit" | "nextOccurrence" | "anniversaryCount">
): string => {
  const source = template.trim() || "{title}"
  const tokens: Record<MomentTemplatePlaceholder, string> = {
    title: record.title,
    sourceDate: record.sourceDate,
    sourceDateChinese: formatChineseDate(record.sourceDate),
    days: String(projection.primaryValue),
    unit: projection.primaryUnit,
    nextOccurrence: projection.nextOccurrence ?? "",
    nextOccurrenceChinese: projection.nextOccurrence ? formatChineseDate(projection.nextOccurrence) : "",
    anniversary: String(projection.anniversaryCount),
    category: momentCategoryLabels[record.category] ?? record.category,
    content: record.content
  }

  return source.replace(/\{([a-zA-Z\u4e00-\u9fff]+)\}/g, (match, key: string) => {
    const canonicalKey = isValidPlaceholder(key) ? key : MOMENT_TEMPLATE_PLACEHOLDER_ALIASES[key]

    if (canonicalKey) {
      return tokens[canonicalKey]
    }

    return match
  })
}

/**
 * 「想让它怎么说」的预设句式：除「自己写一句」外，可保存的模板都出自这张表，
 * 句式本身只使用已登记的中英文占位符。
 */
export const MOMENT_TEMPLATE_PRESETS = {
  default: "{title}",
  elapsed: "{标题}已经{天数}{单位}啦",
  ordinal: "今天是{标题}的第{天数}{单位}",
  countdown: "距离{标题}还有{天数}{单位}"
} as const

export type MomentTemplatePresetKey = keyof typeof MOMENT_TEMPLATE_PRESETS

/** 默认句式（空模板与 `{title}` 等价）：卡片与详情不额外渲染补充句。 */
export const isDefaultMomentTemplate = (template: string): boolean => {
  const trimmed = template.trim()
  return trimmed === "" || trimmed === MOMENT_TEMPLATE_PRESETS.default
}

/** 由已保存模板反推编辑器句式模式；不在预设表里的内容一律视为「自己写一句」。 */
export const resolveMomentTemplateKey = (template: string): MomentTemplatePresetKey | "custom" => {
  const trimmed = template.trim()
  if (trimmed === "") {
    return "default"
  }

  const matched = (Object.keys(MOMENT_TEMPLATE_PRESETS) as MomentTemplatePresetKey[]).find(
    (key) => MOMENT_TEMPLATE_PRESETS[key] === trimmed
  )
  return matched ?? "custom"
}

/**
 * 自定义句式的安全闸（大小写不敏感，先转小写再做子串匹配），显式覆盖：
 * - `${`（模板字符串注入起点）
 * - script/embed 类标签：`<script`、`</script`、`<iframe`、`<object`、`<embed`、`<img`
 * - 协议写法：`javascript:`、`vbscript:`
 * - 执行入口：`eval(`、`Function(`（由 `function(` 覆盖）、`new Function(`（由 `new function` 覆盖）、
 *   `setTimeout(`（由 `settimeout(` 覆盖）、`setInterval(`（由 `setinterval(` 覆盖）
 * 渲染侧永远只做纯文本插值与固定占位符替换——没有 `eval`、`Function`、
 * 动态表达式或 HTML 渲染路径，这道闸只是让落库内容提前远离这些写法。
 */
const UNSAFE_TEMPLATE_PATTERNS = [
  "${",
  "<script",
  "</script",
  "<iframe",
  "<object",
  "<embed",
  "<img",
  "javascript:",
  "vbscript:",
  "eval(",
  "function(",
  "new function",
  "settimeout(",
  "setinterval("
]

export const isSafeMomentTemplateText = (text: string): boolean => {
  const lowered = text.toLowerCase()
  return !UNSAFE_TEMPLATE_PATTERNS.some((pattern) => lowered.includes(pattern))
}

/**
 * 冻结的投影方向矩阵：
 *
 * - `none` + `auto`：源日期在未来 → countdown；源日期在过去 → countup；当天 → today。
 * - `yearly` + `auto` / `countdown`：主数值倒计时到下一周年发生日；发生日当天 → today。
 * - `none` / `yearly` + `countup`：countup，主数值自原始源日期起算，
 *   重复规则只提供下一发生日与已完成周年数等元数据。
 * - `none` + `countdown`：固定 countdown；没有下一发生日时剩余天数为 0。
 */
const resolveDirection = (
  mode: MomentDisplayMode,
  recurrence: MomentRecurrence,
  currentOccurrence: string | null,
  nextOccurrence: string | null,
  today: string
): MomentDirection => {
  if (mode === "countup") {
    return "countup"
  }

  const isOccurrenceToday = currentOccurrence !== null && currentOccurrence === today

  if (mode === "countdown") {
    return recurrence === "yearly" && isOccurrenceToday ? "today" : "countdown"
  }

  if (isOccurrenceToday) {
    return "today"
  }

  if (nextOccurrence && compareDate(today, nextOccurrence) < 0) {
    return "countdown"
  }

  return "countup"
}

const compareDate = (left: string, right: string): number => {
  const diff = calendarDayDiff(left, right)
  return diff === null ? 0 : diff
}

const buildSecondaryCopy = (
  direction: MomentDirection,
  category: MomentCategory,
  anniversaryCount: number,
  nextOccurrence: string | null
): string => {
  const categoryLabel = momentCategoryLabels[category] ?? ""

  if (direction === "today") {
    return anniversaryCount > 0 ? `第 ${anniversaryCount} 个${categoryLabel}` : categoryLabel
  }

  if (direction === "countdown" && nextOccurrence) {
    return `到 ${formatChineseDate(nextOccurrence)}`
  }

  return categoryLabel
}

const fallbackProjection = (record: MomentRecord): MomentProjection => {
  const emptyProjection: Pick<MomentProjection, "primaryValue" | "primaryUnit" | "nextOccurrence" | "anniversaryCount"> = {
    primaryValue: 0,
    primaryUnit: "天",
    nextOccurrence: null,
    anniversaryCount: 0
  }

  return {
    direction: "today",
    primaryValue: 0,
    primaryUnit: "天",
    leadCopy: "日期未设置",
    secondaryCopy: "",
    sourceDateLabel: "",
    nextOccurrence: null,
    elapsedDays: 0,
    remainingDays: 0,
    anniversaryCount: 0,
    isToday: false,
    nextMilestone: undefined,
    calendarDuration: { years: 0, months: 0, days: 0 },
    renderedTemplate: renderMomentTemplate("{title}", record, emptyProjection)
  }
}

/**
 * `counting`（elapsed|ordinal）只影响 countup 方向的展示值：
 * countdown 永远展示剩余天数；today 展示 0（ordinal 为 1，即“第 1 天”）。
 */
const computePrimaryValue = (
  direction: MomentDirection,
  elapsedDays: number,
  remainingDays: number,
  counting: MomentCounting
): number => {
  if (direction === "countdown") {
    return remainingDays
  }

  const base = direction === "today" ? 0 : elapsedDays
  return counting === "ordinal" ? base + 1 : base
}

/**
 * 根据记录和今天日期生成确定性展示投影。
 *
 * 锚定拆分（发生日相对值与源日期相对值不混用）：
 * - 已过天数、纪念序号、日里程碑、公历年/月/日时长永远自原始 `sourceDate` 起算，
 *   年度重复不会把它们重置到上一周年发生日；
 * - 倒计时剩余天数、`nextOccurrence`、`anniversaryCount` 由重复规则派生；
 * - `counting` 只影响 countup 方向的引导文案与主数值展示，不影响周年计数与里程碑状态。
 *
 * 不会把任何派生值持久化到记录里。
 */
export const projectMoment = (record: MomentRecord, today: string = todayCalendarDate()): MomentProjection => {
  if (!parseCalendarDate(record.sourceDate) || !parseCalendarDate(today)) {
    return fallbackProjection(record)
  }

  const { current: currentOccurrence, next: nextOccurrence } = resolveOccurrences(
    record.sourceDate,
    record.recurrence,
    today,
    record.leapDayPolicy
  )

  const direction = resolveDirection(record.mode, record.recurrence, currentOccurrence, nextOccurrence, today)

  // —— 源日期锚定：与重复规则、显示模式无关，永不随周年重置 ——
  const elapsedDays = Math.max(0, calendarDayDiff(today, record.sourceDate) ?? 0)
  const commemorativeDay = resolveCommemorativeDay(record.sourceDate, today)
  const nextMilestone =
    typeof commemorativeDay === "number" ? findNextMilestone(commemorativeDay, record.milestoneValues) : undefined
  const calendarDuration = calendarDurationBetween(record.sourceDate, today) ?? { years: 0, months: 0, days: 0 }

  // —— 发生日锚定：重复规则派生的倒计时目标与周年元数据 ——
  const remainingDays =
    direction === "countdown" && nextOccurrence ? Math.max(0, calendarDayDiff(nextOccurrence, today) ?? 0) : 0
  const anniversaryCount = countCompletedAnniversaries(
    record.sourceDate,
    record.recurrence,
    today,
    record.leapDayPolicy
  )

  const primaryValue = computePrimaryValue(direction, elapsedDays, remainingDays, record.counting)
  const primaryUnit = "天"

  const leadCopy: Record<MomentDirection, string> = {
    countup: record.counting === "ordinal" ? "今天是第" : "已经",
    countdown: "还有",
    today: "就是今天"
  }

  const projection: MomentProjection = {
    direction,
    primaryValue,
    primaryUnit,
    leadCopy: leadCopy[direction],
    secondaryCopy: buildSecondaryCopy(direction, record.category, anniversaryCount, nextOccurrence),
    sourceDateLabel: formatChineseDate(record.sourceDate),
    nextOccurrence,
    elapsedDays,
    remainingDays,
    anniversaryCount,
    isToday: direction === "today",
    nextMilestone,
    calendarDuration,
    renderedTemplate: ""
  }

  projection.renderedTemplate = renderMomentTemplate(record.template, record, projection)

  return projection
}
