<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell
    nav-title="小日子票根"
    :nav-eyebrow="pageEyebrow"
    nav-show-back
    nav-variant="page"
    :nav-auto-back="false"
    @back="handleBackNavigation"
  >
    <view v-if="loading" class="moment-edit-status app-anim-breath">
      <text>正在翻这张小票根…</text>
    </view>

    <empty-state
      v-else-if="hasLoadError && !editingMoment"
      title="这个小日子暂时没翻到"
      body="可能是网络慢了一点，稍后再试一次。"
    >
      <view class="moment-edit-error__actions">
        <wd-button block :loading="loading" @click="loadMoment">再试一次</wd-button>
        <wd-button block plain @click="handleBackNavigation">返回小日子</wd-button>
      </view>
    </empty-state>

    <view v-else class="moment-edit">
      <view class="moment-ticket app-reveal-1 app-ticket-stump">
        <view class="app-ticket-stump__punch app-ticket-stump__punch--left" />
        <view class="app-ticket-stump__punch app-ticket-stump__punch--right" />
        <view class="moment-ticket__perforation" />
        <view class="moment-ticket__head">
          <view class="moment-ticket__intro">
            <text class="moment-ticket__kicker">小日子票根</text>
            <text class="moment-ticket__question">想记住哪个日子？</text>
            <text class="moment-ticket__body">写下来，它会替你们一直数着。</text>
          </view>
          <text class="moment-ticket__stamp">小票根</text>
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">这是一个什么样的日子？</text>
          <app-option-group :columns="2">
            <app-option-button
              v-for="preset in categoryPresets"
              :key="preset.value"
              :active="category === preset.value"
              :disabled="formDisabled"
              @click="applyCategoryPreset(preset.value)"
            >
              <view class="moment-preset">
                <text class="moment-preset__title">{{ preset.label }}</text>
                <text class="moment-preset__description">{{ preset.description }}</text>
              </view>
            </app-option-button>
          </app-option-group>
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">给它起个名字</text>
          <view id="moment-title-field" class="moment-field__input-hitarea">
            <wd-input
              v-model="title"
              no-border
              :adjust-position="false"
              :disabled="formDisabled"
              placeholder="比如：第一次一起看的海"
              :placeholder-style="placeholderStyle"
              :maxlength="48"
              custom-class="moment-field__input-root"
              custom-input-class="moment-field__input-inner"
              @focus="focusField('#moment-title-field')"
              @keyboardheightchange="syncKeyboardHeight"
            />
          </view>
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">是哪一个日子？</text>
          <app-date-field
            v-model="sourceDate"
            placeholder="挑一个日子"
            title="挑个日子"
            min-date="1900-01-01"
            max-date="2100-12-31"
            :disabled="formDisabled"
          />
          <text class="moment-behavior-summary">{{ behaviorSummary }}</text>
        </view>

        <view class="moment-field">
          <text class="moment-field__prompt">先看看它的样子</text>
          <moment-card v-if="previewReady" :moment="previewRecord" :projection="previewProjection" />
          <view v-else class="moment-preview-placeholder">
            <text class="moment-field__hint">挑好日子后，这里会先演一遍它的样子。</text>
          </view>
        </view>

        <view class="moment-advanced-toggle-row">
          <wd-button
            size="small"
            plain
            :icon="advancedExpanded ? 'arrow-up' : 'arrow-down'"
            :disabled="formDisabled"
            custom-class="moment-advanced-toggle"
            @click="toggleAdvanced"
          >
            {{ advancedToggleText }}
          </wd-button>
        </view>

        <app-collapse-section :expanded="advancedExpanded">
          <view class="moment-advanced">
            <view class="moment-field">
              <text class="moment-field__prompt">想怎么数它？</text>
              <view class="moment-mode-stack">
                <app-option-button
                  v-for="option in modeOptions"
                  :key="option.value"
                  :active="mode === option.value"
                  :disabled="formDisabled"
                  @click="mode = option.value"
                >
                  <view class="moment-mode-option">
                    <text class="moment-mode-option__title">{{ option.label }}</text>
                    <text class="moment-mode-option__description">{{ option.description }}</text>
                  </view>
                </app-option-button>
              </view>
            </view>

            <view class="moment-field">
              <text class="moment-field__prompt">这一天会每年再过一次吗？</text>
              <app-option-group :columns="2" responsive="auto">
                <app-option-button
                  v-for="option in recurrenceOptions"
                  :key="option.value"
                  :active="recurrence === option.value"
                  :disabled="formDisabled"
                  @click="recurrence = option.value"
                >
                  <text class="moment-choice__label">{{ option.label }}</text>
                </app-option-button>
              </app-option-group>
            </view>

            <view v-if="showLeapDayPolicy" class="moment-field">
              <text class="moment-field__prompt">平年怎么记</text>
              <text class="moment-field__hint">这一天是 2月29日，平年没有这一天，想怎么安排它？</text>
              <app-option-group :columns="3" responsive="auto">
                <app-option-button
                  v-for="option in leapDayPolicyOptions"
                  :key="option.value"
                  :active="leapDayPolicy === option.value"
                  :disabled="formDisabled"
                  @click="leapDayPolicy = option.value"
                >
                  <text class="moment-choice__label">{{ option.label }}</text>
                </app-option-button>
              </app-option-group>
            </view>

            <view class="moment-field">
              <text class="moment-field__prompt">当天算第几天？</text>
              <app-option-group :columns="2" responsive="auto">
                <app-option-button
                  v-for="option in countingOptions"
                  :key="option.value"
                  :active="counting === option.value"
                  :disabled="formDisabled"
                  @click="counting = option.value"
                >
                  <text class="moment-choice__label">{{ option.label }}</text>
                </app-option-button>
              </app-option-group>
            </view>

            <view class="moment-field">
              <text class="moment-field__prompt">想看到什么样的数字？</text>
              <app-option-group :columns="2" responsive="auto">
                <app-option-button
                  v-for="option in displayOptions"
                  :key="option.value"
                  :active="display === option.value"
                  :disabled="formDisabled"
                  @click="display = option.value"
                >
                  <text class="moment-choice__label">{{ option.label }}</text>
                </app-option-button>
              </app-option-group>
            </view>

            <view class="moment-field">
              <text class="moment-field__prompt">想让它怎么说</text>
              <app-option-group :columns="2" responsive="auto">
                <app-option-button
                  v-for="option in templateModeOptions"
                  :key="option.value"
                  :active="templateMode === option.value"
                  :disabled="formDisabled"
                  @click="applyTemplateMode(option.value)"
                >
                  <view class="moment-mode-option">
                    <text class="moment-mode-option__title">{{ option.label }}</text>
                    <text class="moment-mode-option__description">{{ option.description }}</text>
                  </view>
                </app-option-button>
              </app-option-group>
              <template v-if="templateMode === 'custom'">
                <view id="moment-template-field" class="moment-field__textarea-hitarea">
                  <wd-textarea
                    v-model="customTemplate"
                    no-border
                    :adjust-position="false"
                    :disabled="formDisabled"
                    placeholder="自己写一句，比如：{标题}已经{天数}{单位}啦"
                    :placeholder-style="placeholderStyle"
                    :maxlength="MOMENT_TEMPLATE_MAX_LENGTH"
                    custom-class="moment-field__textarea-root"
                    custom-textarea-container-class="moment-field__textarea-box"
                    custom-textarea-class="moment-field__textarea-inner"
                    @focus="focusField('#moment-template-field')"
                    @keyboardheightchange="syncKeyboardHeight"
                  />
                </view>
                <text class="moment-field__hint">
                  可以用 {标题} {天数} {单位} {日期} {下次日期} {周年} {分类} {备注} 拼句子，最多 120 字。
                </text>
              </template>
            </view>

            <view class="moment-field">
              <text class="moment-field__prompt">小里程碑</text>
              <text class="moment-field__hint">想被好好记住的第几天，点一下加上，再点一下摘掉。</text>
              <app-option-group :columns="3" responsive="auto">
                <app-option-button
                  v-for="value in milestonePresetValues"
                  :key="value"
                  :active="milestoneValues.includes(value)"
                  :disabled="formDisabled"
                  @click="toggleMilestonePreset(value)"
                >
                  <text class="moment-choice__label">第 {{ value }} 天</text>
                </app-option-button>
              </app-option-group>
              <view v-if="sortedMilestoneValues.length > 0" class="moment-milestone-tags">
                <wd-tag
                  v-for="value in sortedMilestoneValues"
                  :key="value"
                  type="primary"
                  plain
                  round
                  closable
                  @close="removeMilestone(value)"
                >
                  第 {{ value }} 天
                </wd-tag>
              </view>
              <view class="moment-milestone-input">
                <view id="moment-milestone-field" class="moment-field__input-hitarea moment-milestone-input__field">
                  <wd-input
                    v-model="customMilestone"
                    type="digit"
                    no-border
                    :adjust-position="false"
                    :disabled="formDisabled"
                    placeholder="自己填一个天数"
                    :placeholder-style="placeholderStyle"
                    :maxlength="7"
                    custom-class="moment-field__input-root"
                    custom-input-class="moment-field__input-inner"
                    @focus="focusField('#moment-milestone-field')"
                    @keyboardheightchange="syncKeyboardHeight"
                    @confirm="addCustomMilestone"
                  />
                </view>
                <wd-button size="small" plain :disabled="formDisabled" @click="addCustomMilestone">加上这一天</wd-button>
              </view>
            </view>
          </view>
        </app-collapse-section>

        <view class="moment-field">
          <text class="moment-field__prompt">想留一句悄悄话吗？</text>
          <text class="moment-field__hint">空着也没关系。</text>
          <view id="moment-note-field" class="moment-field__textarea-hitarea">
            <wd-textarea
              v-model="content"
              no-border
              :adjust-position="false"
              :disabled="formDisabled"
              placeholder="留一句悄悄话"
              :placeholder-style="placeholderStyle"
              :maxlength="240"
              custom-class="moment-field__textarea-root"
              custom-textarea-container-class="moment-field__textarea-box"
              custom-textarea-class="moment-field__textarea-inner"
              @focus="focusField('#moment-note-field')"
              @keyboardheightchange="syncKeyboardHeight"
            />
          </view>
        </view>

        <view class="moment-edit-actions">
          <wd-button block size="large" :loading="saving" :disabled="formDisabled" @click="saveMoment">
            {{ saveButtonText }}
          </wd-button>
        </view>
        <view class="keyboard-spacer" :style="keyboardSpacerStyle" aria-hidden="true" />
      </view>
    </view>

    <wd-message-box :root-portal="true" />
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue"
import { onBackPress, onLoad } from "@dcloudio/uni-app"
import { useMessage } from "wot-design-uni/components/wd-message-box"
import { showAppError, showAppWarning } from "@/composables/useAppToast"
import { useCachedRecord } from "@/composables/useCachedRecord"
import { useKeyboardAvoidance } from "@/composables/useKeyboardAvoidance"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { setRouteSuccessFeedback } from "@/composables/useRouteFeedback"
import {
  isDefaultMomentTemplate,
  isSafeMomentTemplateText,
  isValidCalendarDate,
  MOMENT_MILESTONE_MAX_VALUE,
  MOMENT_TEMPLATE_MAX_LENGTH,
  MOMENT_TEMPLATE_PRESETS,
  normalizeMilestoneValues,
  parseCalendarDate,
  projectMoment,
  resolveMomentTemplateKey,
  todayCalendarDate,
  type MomentCategory,
  type MomentCounting,
  type MomentDisplay,
  type MomentDisplayMode,
  type MomentDraft,
  type MomentLeapDayPolicy,
  type MomentRecord,
  type MomentRecurrence,
  type MomentTemplatePresetKey
} from "@/domain/moments"
import { getFriendlyErrorMessage } from "@/services/cloudbase"
import { dataCacheKeys } from "@/services/data-cache"
import {
  createMoment,
  getMoment,
  isMomentUnavailableError,
  updateMoment
} from "@/services/repositories/moments"
import { normalizeCalendarDate } from "@/utils/date"

const momentsRoute = "/pages/moments/moments"
const momentDetailRoute = "/pages/moment-detail/moment-detail"
const placeholderStyle = "color: var(--app-text-muted)"
const theme = useNativeChromeSync()
const message = useMessage()
const { keyboardSpacerStyle, syncKeyboardHeight, focusField } = useKeyboardAvoidance()

const saving = shallowRef(false)
const saved = shallowRef(false)
const draftDirty = shallowRef(false)
const isLeaveConfirming = shallowRef(false)
const advancedExpanded = shallowRef(false)
const momentId = shallowRef("")
const hasLoadError = shallowRef(false)
const hydratingDraft = shallowRef(false)
const {
  record: editingMoment,
  loading,
  reload: reloadMoment
} = useCachedRecord<MomentRecord>({
  cacheKey: () => dataCacheKeys.momentDetail(momentId.value),
  isUnavailableError: isMomentUnavailableError,
  loader: () => getMoment(momentId.value)
})

const isEditMode = computed(() => momentId.value.length > 0)

interface MomentBehaviorPreset {
  mode: MomentDisplayMode
  recurrence: MomentRecurrence
  counting: MomentCounting
  display: MomentDisplay
}

/**
 * 每种票根自带的默认数法：选中预设即整套套用，仍可在「再调一调」里细改。
 * 「自己设置」与其他预设同默认值，但会自动展开高级设置。
 */
const momentBehaviorPresets: Record<MomentCategory, MomentBehaviorPreset> = {
  anniversary: { mode: "countup", recurrence: "yearly", counting: "ordinal", display: "days" },
  birthday: { mode: "countdown", recurrence: "yearly", counting: "elapsed", display: "days" },
  first: { mode: "countup", recurrence: "none", counting: "ordinal", display: "days" },
  travel: { mode: "auto", recurrence: "none", counting: "elapsed", display: "days" },
  daily: { mode: "auto", recurrence: "none", counting: "elapsed", display: "days" },
  custom: { mode: "auto", recurrence: "none", counting: "elapsed", display: "days" }
}

const initialBehavior = momentBehaviorPresets.anniversary

const category = shallowRef<MomentCategory>("anniversary")
const title = shallowRef("")
const sourceDate = shallowRef("")
const mode = shallowRef<MomentDisplayMode>(initialBehavior.mode)
const recurrence = shallowRef<MomentRecurrence>(initialBehavior.recurrence)
const counting = shallowRef<MomentCounting>(initialBehavior.counting)
const display = shallowRef<MomentDisplay>(initialBehavior.display)
const content = shallowRef("")
const templateMode = shallowRef<MomentTemplateMode>("default")
const customTemplate = shallowRef("")
const milestoneValues = shallowRef<number[]>([])
const customMilestone = shallowRef("")
const leapDayPolicy = shallowRef<MomentLeapDayPolicy>("feb28")

const categoryPresets: Array<{
  value: MomentCategory
  label: string
  description: string
}> = [
  { value: "anniversary", label: "纪念日", description: "在一起、领证的大日子" },
  { value: "birthday", label: "生日", description: "她的、你的，一年一次" },
  { value: "first", label: "第一次", description: "第一次牵手、第一次看海" },
  { value: "travel", label: "旅行或计划", description: "想去的远方，想做的事" },
  { value: "daily", label: "普通日子", description: "平平常常，也想记住" },
  { value: "custom", label: "自己设置", description: "数数和重复都自己挑" }
]

const modeOptions: Array<{
  label: string
  value: MomentDisplayMode
  description: string
}> = [
  {
    label: "让它自己判断",
    value: "auto",
    description: "过去了看走了多久，还没到看还要等多久"
  },
  {
    label: "看已经走过多久",
    value: "countup",
    description: "从这一天起，一直往后数"
  },
  {
    label: "看还有多久到来",
    value: "countdown",
    description: "盯着这一天，慢慢倒数等它"
  }
]

const recurrenceOptions: Array<{
  label: string
  value: MomentRecurrence
}> = [
  {
    label: "只记这一次",
    value: "none"
  },
  {
    label: "每年都记得",
    value: "yearly"
  }
]

const countingOptions: Array<{
  label: string
  value: MomentCounting
}> = [
  {
    label: "从0天开始",
    value: "elapsed"
  },
  {
    label: "当天是第1天",
    value: "ordinal"
  }
]

const displayOptions: Array<{
  label: string
  value: MomentDisplay
}> = [
  {
    label: "只看总天数",
    value: "days"
  },
  {
    label: "几年几个月几天",
    value: "calendar"
  }
]

/** 「想让它怎么说」的句式模式：预设模式出自 MOMENT_TEMPLATE_PRESETS，其余内容是「自己写一句」。 */
type MomentTemplateMode = MomentTemplatePresetKey | "custom"

const templateModeOptions: Array<{
  label: string
  value: MomentTemplateMode
  description: string
}> = [
  {
    label: "系统默认",
    value: "default",
    description: "不额外加句子"
  },
  {
    label: "已经走过",
    value: "elapsed",
    description: "例：看海已经 100 天啦"
  },
  {
    label: "今天是第几天",
    value: "ordinal",
    description: "例：今天是看海的第 100 天"
  },
  {
    label: "距离还有多久",
    value: "countdown",
    description: "例：距离看海还有 100 天"
  },
  {
    label: "自己写一句",
    value: "custom",
    description: "用占位符拼一句自己的话"
  }
]

/** 小里程碑预设天数：点一下加上、再点一下摘掉，落库前统一走 normalizeMilestoneValues。 */
const milestonePresetValues = [100, 365, 520, 1000, 1314]

const leapDayPolicyOptions: Array<{
  label: string
  value: MomentLeapDayPolicy
}> = [
  {
    label: "记在2月28日",
    value: "feb28"
  },
  {
    label: "记在3月1日",
    value: "mar1"
  },
  {
    label: "只在闰年出现",
    value: "skip"
  }
]

const formDisabled = computed(() => saving.value || saved.value)
const hasUnsavedDraft = computed(() => draftDirty.value && !saving.value && !saved.value)
const pageEyebrow = computed(() => (isEditMode.value ? "改一个小日子" : "记一个日子"))
const saveButtonText = computed(() => {
  if (saving.value) {
    return "正在轻轻收好"
  }

  if (saved.value) {
    return "已经轻轻收好"
  }

  return isEditMode.value ? "收好这张票根" : "收进小日子"
})
const discardDraftConfirmOptions = {
  title: "这张票根还没收好",
  msg: "离开后，这次没保存的内容不会留下。",
  cancelButtonText: "继续写",
  confirmButtonText: "不保存离开",
  confirmButtonProps: {
    plain: true,
    type: "error" as const
  },
  cancelButtonProps: {
    plain: true,
    type: "info" as const
  }
}

/** 落库模板只来自预设句式表或「自己写一句」的文本；保存校验已拒绝空文本与不安全写法。 */
const resolveTemplateForDraft = (): string => {
  if (templateMode.value === "custom") {
    return customTemplate.value.trim()
  }

  return MOMENT_TEMPLATE_PRESETS[templateMode.value]
}

/**
 * 新建时仍未暴露的字段（提醒/文件/置顶）固定走安全默认值；
 * 编辑时这些隐藏字段必须沿用已加载记录的原值，绝不能被重置。
 * 模板句式、小里程碑与平年记法由「再调一调」里的表单项给出；
 * 平年记法选项隐藏时保留当前已水合的值，不会被重置。
 * 展示派生值永远只由 projectMoment 现场计算。
 */
const buildDraft = (): MomentDraft => {
  const existing = isEditMode.value ? editingMoment.value : null

  return {
    category: category.value,
    title: title.value.trim(),
    content: content.value.trim(),
    sourceDate: sourceDate.value,
    pinned: existing?.pinned ?? false,
    files: existing?.files ?? [],
    template: resolveTemplateForDraft(),
    reminderOffsets: existing?.reminderOffsets ?? [],
    milestoneValues: normalizeMilestoneValues(milestoneValues.value),
    mode: mode.value,
    recurrence: recurrence.value,
    counting: counting.value,
    display: display.value,
    leapDayPolicy: leapDayPolicy.value
  }
}

const previewReady = computed(() => isValidCalendarDate(normalizeCalendarDate(sourceDate.value)))

/**
 * 预览记录只是本地草稿的临时投影载体：`id`/`createdAt`/`updatedAt` 为占位值，
 * 从不写入 CloudBase；只有用户点保存时才走 createMoment。
 */
const previewRecord = computed<MomentRecord>(() => ({
  ...buildDraft(),
  title: title.value.trim() || "未命名小日子",
  id: "moment-edit-preview",
  kind: "moment",
  createdAt: 0,
  updatedAt: 0
}))

const previewProjection = computed(() => projectMoment(previewRecord.value, todayCalendarDate()))

const modeSummaryCopy: Record<MomentDisplayMode, string> = {
  auto: "它自己会判断：过去了看走了多久，还没到看还要等多久",
  countup: "从这一天开始往后数，看已经走了多久",
  countdown: "一直倒数，看还有多久到这一天"
}

/**
 * 行为摘要只按当前配置组合拼出口径说明，不做任何日期运算；
 * 具体数值永远由上方 projectMoment 的实时预览展示。
 * counting 与 display 只影响正计时方向，纯倒计时下不出现。
 */
const behaviorSummary = computed(() => {
  const parts = [modeSummaryCopy[mode.value]]
  parts.push(recurrence.value === "yearly" ? "每年都会再过一次" : "只记这一次")

  if (mode.value !== "countdown") {
    parts.push(counting.value === "ordinal" ? "当天算第 1 天" : "从 0 天开始数")
    parts.push(display.value === "calendar" ? "按几年几个月几天给你看" : "只看总天数")
  }

  return `${parts.join("，")}。`
})

const advancedToggleText = computed(() => (advancedExpanded.value ? "先收起来" : "再调一调"))

const applyCategoryPreset = (value: MomentCategory) => {
  category.value = value
  const preset = momentBehaviorPresets[value]
  mode.value = preset.mode
  recurrence.value = preset.recurrence
  counting.value = preset.counting
  display.value = preset.display

  if (value === "custom") {
    advancedExpanded.value = true
  }
}

const toggleAdvanced = () => {
  advancedExpanded.value = !advancedExpanded.value
}

/**
 * 用户主动点选句式预设时，把数法口径顺带对齐到与句式一致的语义：
 * 「已经走过」看正计时已过天数，「今天是第几天」看正计时序数日，
 * 「距离还有多久」看倒计时；「系统默认」和「自己写一句」不动数法。
 * 这套对齐只发生在这一个点击入口——编辑水合、缓存刷新与已保存模板反推
 * 都不会触发它，未触碰句式的记录在打开再保存后保持原样。
 * 行为摘要与实时预览仍只通过同一组 mode/counting 引用响应，不做额外日期运算。
 */
const applyTemplateMode = (value: MomentTemplateMode) => {
  templateMode.value = value

  if (value === "elapsed") {
    mode.value = "countup"
    counting.value = "elapsed"
    return
  }

  if (value === "ordinal") {
    mode.value = "countup"
    counting.value = "ordinal"
    return
  }

  if (value === "countdown") {
    mode.value = "countdown"
  }
}

/** 小里程碑始终升序展示；预设点选与自定义输入都先过 normalizeMilestoneValues。 */
const sortedMilestoneValues = computed(() => normalizeMilestoneValues(milestoneValues.value))

const toggleMilestonePreset = (value: number) => {
  if (milestoneValues.value.includes(value)) {
    milestoneValues.value = milestoneValues.value.filter((item) => item !== value)
    return
  }

  milestoneValues.value = normalizeMilestoneValues([...milestoneValues.value, value])
}

const removeMilestone = (value: number) => {
  if (formDisabled.value) {
    return
  }

  milestoneValues.value = milestoneValues.value.filter((item) => item !== value)
}

/**
 * 自定义里程碑的输入级校验只负责给出具体提示，上界复用领域常量；
 * 真正的归一权威始终是 normalizeMilestoneValues——重复、零、负数、小数、
 * 非数字和超限值即使在旧数据里也会在入列/落库时被剔除。
 */
const addCustomMilestone = () => {
  if (formDisabled.value) {
    return
  }

  const raw = customMilestone.value.trim()
  if (!/^\d+$/.test(raw)) {
    showAppWarning("小里程碑要填一个整数天数")
    return
  }

  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value <= 0 || value > MOMENT_MILESTONE_MAX_VALUE) {
    showAppWarning("小里程碑要在 1 到 1000000 之间")
    return
  }

  if (milestoneValues.value.includes(value)) {
    showAppWarning("这一天已经在小里程碑里了")
    return
  }

  milestoneValues.value = normalizeMilestoneValues([...milestoneValues.value, value])
  customMilestone.value = ""
}

const isLeapDaySourceDate = (value: string): boolean => {
  const parsed = parseCalendarDate(normalizeCalendarDate(value))
  return parsed !== null && parsed.month === 2 && parsed.day === 29
}

/** 只有「每年重复 + 源日期是 2月29日」才展示平年记法；隐藏时保留当前值，不重置已保存策略。 */
const showLeapDayPolicy = computed(() => recurrence.value === "yearly" && isLeapDaySourceDate(sourceDate.value))

const decodeQueryId = (value: unknown): string => {
  if (typeof value !== "string") {
    return ""
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  try {
    return decodeURIComponent(trimmed)
  } catch {
    return trimmed
  }
}

const updateDraftWithoutTracking = (update: () => void) => {
  hydratingDraft.value = true
  update()
  hydratingDraft.value = false
  draftDirty.value = false
}

/**
 * 记录的数法组合、句式、小里程碑或平年记法与默认不一致时自动展开「再调一调」，
 * 让已保存的自定义配置可见。
 */
const shouldExpandAdvanced = (moment: MomentRecord): boolean => {
  const preset = momentBehaviorPresets[moment.category]
  return (
    moment.mode !== preset.mode ||
    moment.recurrence !== preset.recurrence ||
    moment.counting !== preset.counting ||
    moment.display !== preset.display ||
    !isDefaultMomentTemplate(moment.template) ||
    normalizeMilestoneValues(moment.milestoneValues).length > 0 ||
    (moment.recurrence === "yearly" && isLeapDaySourceDate(moment.sourceDate) && moment.leapDayPolicy !== "feb28")
  )
}

/** 编辑模式水合：逐字段写入记录原值，绝不套用分类预设，也不触碰提醒/文件/置顶等隐藏字段。 */
const hydrateMoment = (moment: MomentRecord) => {
  updateDraftWithoutTracking(() => {
    category.value = moment.category
    title.value = moment.title
    sourceDate.value = moment.sourceDate
    mode.value = moment.mode
    recurrence.value = moment.recurrence
    counting.value = moment.counting
    display.value = moment.display
    content.value = moment.content
    const templateKey = resolveMomentTemplateKey(moment.template)
    templateMode.value = templateKey
    customTemplate.value = templateKey === "custom" ? moment.template : ""
    milestoneValues.value = normalizeMilestoneValues(moment.milestoneValues)
    leapDayPolicy.value = moment.leapDayPolicy
    advancedExpanded.value = shouldExpandAdvanced(moment)
    saved.value = false
  })
}

const loadMoment = async () => {
  if (!momentId.value) {
    hasLoadError.value = false
    return
  }

  hasLoadError.value = false

  try {
    await reloadMoment({
      applyCached: hydrateMoment,
      applyFresh: hydrateMoment,
      // 缓存或新鲜数据到达时，用户若已经开始改动，绝不覆盖未保存输入。
      canApplyFresh: () => !draftDirty.value && !formDisabled.value
    })
  } catch {
    hasLoadError.value = true
  }
}

watch(
  [
    category,
    title,
    sourceDate,
    mode,
    recurrence,
    counting,
    display,
    content,
    templateMode,
    customTemplate,
    milestoneValues,
    leapDayPolicy
  ],
  () => {
    if (!hydratingDraft.value && !formDisabled.value) {
      draftDirty.value = true
    }
  },
  {
    flush: "sync"
  }
)

const backToMoments = () => {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }

  uni.redirectTo({
    url: momentsRoute
  })
}

const confirmDiscardDraft = async (): Promise<boolean> => {
  if (isLeaveConfirming.value) {
    return false
  }

  isLeaveConfirming.value = true
  try {
    await message.confirm(discardDraftConfirmOptions)
    return true
  } catch {
    return false
  } finally {
    isLeaveConfirming.value = false
  }
}

const handleBackNavigation = async () => {
  if (saving.value) {
    showAppWarning("正在轻轻收好，请稍等")
    return
  }

  if (!hasUnsavedDraft.value) {
    backToMoments()
    return
  }

  if (await confirmDiscardDraft()) {
    backToMoments()
  }
}

const saveMoment = async () => {
  if (saving.value) {
    return
  }

  if (!title.value.trim()) {
    showAppWarning("先给这个小日子起个名字")
    return
  }

  const trimmedDate = normalizeCalendarDate(sourceDate.value)
  if (!isValidCalendarDate(trimmedDate)) {
    showAppWarning("先挑好这个日子的日期")
    return
  }

  if (templateMode.value === "custom") {
    const customText = customTemplate.value.trim()
    if (!customText) {
      showAppWarning("先写一句想让它说的话")
      return
    }

    if (!isSafeMomentTemplateText(customText)) {
      showAppWarning("这句话里有不能用的写法，换一句试试")
      return
    }

    // 数据级不变量：即使历史记录或程序化水合带入了超长文本，不缩短就不允许落库。
    if (customText.length > MOMENT_TEMPLATE_MAX_LENGTH) {
      showAppWarning("这句话最多 120 字，先精简一点")
      return
    }
  }

  saving.value = true
  saved.value = false
  sourceDate.value = trimmedDate

  try {
    if (isEditMode.value) {
      await updateMoment(momentId.value, buildDraft())
    } else {
      await createMoment(buildDraft())
    }

    saving.value = false
    saved.value = true
    // 编辑保存后返回详情页并立即给出反馈；新建仍回到列表页反馈。
    setRouteSuccessFeedback(
      isEditMode.value ? momentDetailRoute : momentsRoute,
      isEditMode.value ? "这个小日子已经改好了" : "这个小日子已经悄悄收好"
    )
    backToMoments()
  } catch (error) {
    showAppError(getFriendlyErrorMessage(error))
  } finally {
    if (!saved.value) {
      saving.value = false
    }
  }
}

onLoad((query) => {
  momentId.value = decodeQueryId(query?.id)
  void loadMoment()
})

onBackPress((options) => {
  if (options.from === "navigateBack" || !hasUnsavedDraft.value) {
    return false
  }

  void handleBackNavigation()
  return true
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.moment-edit,
.moment-ticket,
.moment-ticket__intro,
.moment-field,
.moment-edit-actions {
  display: flex;
  flex-direction: column;
}

.moment-edit {
  gap: var(--app-form-gap);
  padding-bottom: var(--app-card-padding);
}

.moment-edit-status {
  @include panel;
  padding: var(--app-empty-padding-y) var(--app-empty-padding-x);
  color: var(--app-text-soft);
  font: var(--app-font-body);
  text-align: center;
}

.moment-edit-error__actions {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--app-space-6);
  margin-top: var(--app-card-padding);
}

.moment-ticket {
  @include panel;
  position: relative;
  gap: var(--app-card-gap);
  padding: var(--app-card-padding);
  overflow: hidden;
}

.moment-ticket::before {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-28);
  height: var(--app-space-28);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-bottom-left-radius: var(--app-radius-lg);
  background: var(--app-field);
  content: "";
  opacity: var(--app-muted-opacity);
  pointer-events: none;
}

.moment-ticket::after {
  position: absolute;
  top: var(--app-card-padding);
  left: var(--app-card-padding);
  width: var(--app-space-32);
  height: var(--app-border-width-focus);
  background: var(--app-color-blue-person);
  content: "";
  opacity: var(--app-decor-opacity);
  transform: rotate(-3deg);
  pointer-events: none;
}

.moment-ticket__perforation {
  position: absolute;
  top: var(--app-space-24);
  right: var(--app-space-14);
  bottom: var(--app-space-24);
  border-left: var(--app-panel-border-width) dashed var(--app-border);
  opacity: var(--app-decor-opacity);
  pointer-events: none;
}

.moment-ticket__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.moment-ticket__intro {
  min-width: 0;
  gap: var(--app-space-3);
  padding-top: var(--app-space-8);
}

.moment-ticket__kicker {
  @include label;
  display: block;
  color: var(--app-accent);
}

.moment-ticket__question,
.moment-field__prompt {
  display: block;
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.moment-ticket__body,
.moment-field__hint {
  display: block;
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.moment-ticket__stamp {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: var(--app-space-3) var(--app-space-7);
  border: var(--app-panel-border-width) solid var(--app-accent);
  border-radius: var(--app-radius-badge);
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font: var(--app-font-caption);
  transform: rotate(3deg);
}

.moment-field {
  position: relative;
  z-index: 1;
  gap: var(--app-space-5);
}

.moment-field__input-hitarea,
.moment-field__textarea-hitarea {
  display: block;
  width: 100%;
}

:deep(.moment-field__input-root) {
  @include wot-paper-input-root;
}

:deep(.moment-field__textarea-root) {
  @include wot-paper-textarea-root;
}

:deep(.moment-field__input-root .wd-input__body),
:deep(.moment-field__input-root .wd-input__value) {
  @include wot-paper-control-value;
}

:deep(.moment-field__textarea-root .wd-textarea__value) {
  @include wot-paper-textarea-value;
}

:deep(.moment-field__input-inner) {
  @include wot-paper-input-inner;
}

:deep(.moment-field__textarea-box),
:deep(.moment-field__textarea-inner) {
  min-height: var(--app-textarea-min-height);
}

:deep(.moment-field__textarea-inner) {
  @include wot-paper-textarea-inner;
}

:deep(.moment-field__input-root.is-disabled),
:deep(.moment-field__textarea-root.is-disabled) {
  @include wot-paper-control-disabled;
}

.moment-choice__label {
  display: block;
  width: 100%;
}

.moment-preset,
.moment-mode-option {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-2);
  white-space: normal;
}

.moment-preset__description,
.moment-mode-option__description {
  color: var(--app-text-muted);
  font: var(--app-font-caption);
  line-height: var(--app-line-height-normal);
}

.moment-behavior-summary {
  display: block;
  padding: var(--app-space-4) var(--app-field-padding-x);
  border: var(--app-panel-border-width) dashed var(--app-divider);
  border-radius: var(--app-radius-input);
  background: var(--app-field);
  color: var(--app-text-soft);
  font: var(--app-font-caption);
  line-height: var(--app-line-height-relaxed);
}

.moment-mode-stack {
  display: flex;
  flex-direction: column;
  gap: var(--app-option-group-gap);
}

.moment-milestone-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-3);
}

.moment-milestone-input {
  display: flex;
  align-items: center;
  gap: var(--app-space-4);
}

.moment-milestone-input__field {
  min-width: 0;
  flex: 1;
}

.moment-advanced-toggle-row {
  position: relative;
  z-index: 1;
  display: flex;
}

:deep(.moment-advanced-toggle) {
  color: var(--app-accent);
  box-shadow: var(--app-shadow-none);
  transition:
    transform var(--app-transition-fast),
    opacity var(--app-transition-fast);
}

:deep(.moment-advanced-toggle:active) {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale-strong));
}

.moment-advanced {
  display: flex;
  flex-direction: column;
  gap: var(--app-card-gap);
  padding-top: var(--app-space-5);
}

.moment-preview-placeholder {
  padding: var(--app-space-6) var(--app-field-padding-x);
  border: var(--app-panel-border-width) dashed var(--app-divider);
  border-radius: var(--app-radius-input);
  background: var(--app-field);
}

.moment-edit-actions {
  gap: var(--app-space-6);
  padding-top: var(--app-space-3);
}

.keyboard-spacer {
  flex-shrink: 0;
}
</style>
