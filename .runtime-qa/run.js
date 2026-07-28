/* M4A moment-edit runtime QA — phase A3: fully DOM-driven assertions. */
const automator = require("miniprogram-automator")
const fs = require("fs")

const SHOTS = `${__dirname}/shots`
const LOG = `${__dirname}/results.jsonl`
const ROUTE = "/pages/moment-edit/moment-edit"

const record = (name, pass, detail) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "A3", name, pass: Boolean(pass), detail })}\n`)
  console.log(`${pass ? "PASS" : "FAIL"} | ${name} | ${detail}`)
}

const mark = (step) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "A3", mark: step })}\n`)
  console.log(`.... | ${step}`)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const SUMMARY_BY_PRESET = {
  anniversary: ["从这一天开始往后数", "每年都会再过一次", "当天算第 1 天", "只看总天数"],
  birthday: ["一直倒数", "看还有多久到这一天", "每年都会再过一次。"],
  first: ["从这一天开始往后数", "只记这一次", "当天算第 1 天", "只看总天数"],
  travel: ["它自己会判断", "只记这一次", "从 0 天开始数", "只看总天数"],
  daily: ["它自己会判断", "只记这一次", "从 0 天开始数", "只看总天数"],
  custom: ["它自己会判断", "只记这一次", "从 0 天开始数", "只看总天数"]
}

const main = async () => {
  const miniProgram = await automator.connect({ wsEndpoint: "ws://localhost:9420" })
  const sysInfo = await miniProgram.systemInfo()
  record("device info", true, `${sysInfo.model} window=${sysInfo.windowWidth}x${sysInfo.windowHeight}`)

  await miniProgram.reLaunch(ROUTE)
  await sleep(2000)
  let page = await miniProgram.currentPage()
  record("route open", page.path === "pages/moment-edit/moment-edit", page.path)

  const textOf = async (selector) => {
    const el = await page.$(selector)
    return el ? ((await el.text()) || "") : ""
  }
  const summaryNow = () => textOf(".moment-behavior-summary")

  // ---------- 1. initial state ----------
  const initialSummary = await summaryNow()
  record(
    "initial summary = anniversary behavior",
    SUMMARY_BY_PRESET.anniversary.every((part) => initialSummary.includes(part)),
    initialSummary
  )
  const initialCollapse = await page.$(".app-collapse-section")
  const initialCollapseClass = initialCollapse ? (await initialCollapse.attribute("class")) || "" : ""
  record("advanced collapsed on entry", initialCollapseClass.includes("--collapsed") || !initialCollapseClass.includes("--expanded"), initialCollapseClass || "no collapse el")
  await miniProgram.screenshot({ path: `${SHOTS}/01-initial-light.png` })

  // ---------- 2. preset matrix (summary copy per preset) ----------
  const presetOrder = ["anniversary", "birthday", "first", "travel", "daily", "custom"]
  for (let index = 1; index < presetOrder.length; index += 1) {
    const value = presetOrder[index]
    mark(`tap preset ${value}`)
    const cards = await page.$$(".moment-preset")
    await cards[index].tap()
    await sleep(500)
    const summary = await summaryNow()
    record(
      `preset ${value} applies documented behavior`,
      SUMMARY_BY_PRESET[value].every((part) => summary.includes(part)),
      summary
    )

    if (value === "birthday") {
      const buttons = await page.$$(".app-option-button")
      const activeClass = (await buttons[index].attribute("class")) || ""
      record("preset birthday card active", activeClass.includes("app-option-button--active"), activeClass)
      await miniProgram.screenshot({ path: `${SHOTS}/02-preset-birthday.png` })
    }
  }

  // custom expanded
  const collapse = await page.$(".app-collapse-section")
  const collapseClass = collapse ? (await collapse.attribute("class")) || "" : ""
  const modeStack = await page.$(".moment-mode-stack")
  record(
    "custom expands advanced settings",
    collapseClass.includes("--expanded") && Boolean(modeStack),
    collapseClass
  )
  await miniProgram.screenshot({ path: `${SHOTS}/03-custom-advanced-expanded.png` })

  // ---------- 3. advanced controls update helper copy immediately ----------
  const modeButtons = await page.$$(".moment-mode-option")
  await modeButtons[2].tap() // countdown
  await sleep(400)
  let summary = await summaryNow()
  record("mode countdown copy", summary.includes("一直倒数") && !summary.includes("第 1 天"), summary)
  await modeButtons[0].tap() // back to auto
  await sleep(400)

  // choice label order: recurrence none/yearly, counting elapsed/ordinal, display days/calendar
  const choiceLabels = await page.$$(".moment-choice__label")
  await choiceLabels[1].tap() // 每年都记得
  await sleep(400)
  summary = await summaryNow()
  record("recurrence yearly copy", summary.includes("每年都会再过一次"), summary)

  await choiceLabels[3].tap() // 当天是第1天
  await sleep(400)
  summary = await summaryNow()
  record("counting ordinal copy", summary.includes("当天算第 1 天"), summary)

  await choiceLabels[5].tap() // 几年几个月几天
  await sleep(400)
  summary = await summaryNow()
  record("display calendar copy", summary.includes("几年几个月几天给你看"), summary)
  await miniProgram.screenshot({ path: `${SHOTS}/03b-advanced-tweaked.png` })

  // ---------- 4. keyboard: type title before any date ----------
  mark("keyboard title input")
  const titleInput = await page.$("#moment-title-field input")
  record("title input exists", Boolean(titleInput), titleInput ? "found" : "missing")
  await titleInput.tap()
  await sleep(700)
  await miniProgram.screenshot({ path: `${SHOTS}/09-keyboard-title.png` })
  await titleInput.input("自动化小测试")
  await sleep(600)

  // save with title but no date -> date gating toast (proves title accepted, no cloud write)
  const saveButton = await page.$(".moment-edit-actions .wd-button")
  await saveButton.tap()
  await sleep(700)
  let toastText = await textOf(".wd-toast")
  record("save blocked without date", toastText.includes("挑好这个日子"), toastText || "no toast")
  await miniProgram.screenshot({ path: `${SHOTS}/08-save-gating-toast.png` })
  await sleep(2400)

  // ---------- 5. date picker range + confirm roundtrip ----------
  mark("open date picker")
  const dateField = await page.$(".app-date-field")
  await dateField.tap()
  await sleep(1200)
  await miniProgram.screenshot({ path: `${SHOTS}/04-date-picker-range.png` })

  const columns = await page.$$(".wd-picker-view-column")
  let yearFirst = ""
  let yearLast = ""
  let yearCount = 0
  if (columns.length > 0) {
    const yearItems = await columns[0].$$(".wd-picker-view-column__item")
    yearCount = yearItems.length
    if (yearItems.length > 0) {
      yearFirst = (await yearItems[0].text()) || ""
      yearLast = (await yearItems[yearItems.length - 1].text()) || ""
    }
  }
  record(
    "picker year range 1900-2100",
    yearFirst === "1900年" && yearLast === "2100年" && yearCount === 201,
    `first=${yearFirst} last=${yearLast} count=${yearCount}`
  )

  const confirmButtons = await page.$$(".app-date-field__toolbar-action")
  await confirmButtons[1].tap() // 就这天
  await sleep(700)

  const dateText = await textOf(".app-date-field__text")
  record("picker confirm writes date", /\d{4}年\d{1,2}月\d{1,2}日/.test(dateText), dateText)

  // preview card renders a real projection
  const previewReady = Boolean(await page.$(".moment-card"))
  const previewMeta = await textOf(".moment-card__meta")
  const previewHero = (await textOf(".moment-card__today")) || (await textOf(".moment-card__lead"))
  record(
    "preview updates immediately after date",
    previewReady && previewHero.length > 0 && previewMeta.length > 0,
    `hero=${previewHero} meta=${previewMeta}`
  )
  await miniProgram.screenshot({ path: `${SHOTS}/06-preview-confirmed.png` })

  // save button enabled with title + date (live cloud save intentionally not executed)
  const saveClass = (await saveButton.attribute("class")) || ""
  record("save button enabled with valid form", !saveClass.includes("is-disabled"), saveClass)

  // ---------- 6. leave confirmation ----------
  mark("leave confirmation")
  const backButton = await page.$(".app-custom-nav__icon-button--back")
  await backButton.tap()
  await sleep(900)
  const messageBox = await page.$(".wd-message-box")
  record("leave confirmation shown", Boolean(messageBox), messageBox ? "dialog visible" : "dialog missing")
  await miniProgram.screenshot({ path: `${SHOTS}/10-leave-confirm.png` })
  const dialogButtons = await page.$$(".wd-message-box .wd-button")
  let cancelLabel = ""
  if (dialogButtons.length > 0) {
    cancelLabel = (await dialogButtons[0].text()) || ""
    await dialogButtons[0].tap() // 继续写
  }
  await sleep(700)
  page = await miniProgram.currentPage()
  record(
    "stay after cancel",
    cancelLabel.includes("继续写") && page.path === "pages/moment-edit/moment-edit",
    `cancel=${cancelLabel} page=${page.path}`
  )

  await miniProgram.disconnect()
  mark("phase A3 done")
}

main().catch((error) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "A3", fatal: String(error && error.stack ? error.stack : error) })}\n`)
  console.error("AUTOMATION ERROR:", error)
  process.exitCode = 2
})
