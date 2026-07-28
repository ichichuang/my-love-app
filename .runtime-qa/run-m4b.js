/* M4B moment management loop runtime QA: list → detail → edit → save → card; pin/unpin → reorder; delete cancel. */
const automator = require("miniprogram-automator")
const fs = require("fs")

const SHOTS = `${__dirname}/shots`
const LOG = `${__dirname}/results-m4b.jsonl`
const LIST_ROUTE = "/pages/moments/moments"
const LIST_PATH = "pages/moments/moments"
const DETAIL_PATH = "pages/moment-detail/moment-detail"
const EDIT_PATH = "pages/moment-edit/moment-edit"

const record = (name, pass, detail) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "M4B", name, pass: Boolean(pass), detail })}\n`)
  console.log(`${pass ? "PASS" : "FAIL"} | ${name} | ${detail}`)
}

const mark = (step) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "M4B", mark: step })}\n`)
  console.log(`.... | ${step}`)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let miniProgramRef = null
const shot = async (name) => {
  const result = await Promise.race([
    miniProgramRef.screenshot({ path: `${SHOTS}/${name}` }).then(() => "ok"),
    sleep(25000).then(() => "timeout")
  ])
  if (result === "timeout") {
    mark(`screenshot ${name} timed out after 25s; continuing`)
  }
}

const main = async () => {
  const miniProgram = await automator.connect({ wsEndpoint: "ws://localhost:9420" })
  miniProgramRef = miniProgram
  const sysInfo = await miniProgram.systemInfo()
  record("device info", true, `${sysInfo.model} window=${sysInfo.windowWidth}x${sysInfo.windowHeight}`)

  let page
  const textOf = async (selector) => {
    const el = await page.$(selector)
    return el ? ((await el.text()) || "") : ""
  }
  const waitFor = async (selector, timeout = 15000) => {
    try {
      await page.waitFor(selector, { timeout })
      return true
    } catch {
      return false
    }
  }
  const cardsInfo = async () => {
    const cards = await page.$$(".moment-card")
    const info = []
    for (const card of cards) {
      const titleEl = await card.$(".moment-card__title")
      const title = titleEl ? ((await titleEl.text()) || "") : ""
      const className = (await card.attribute("class")) || ""
      info.push({ title, pinned: className.includes("moment-card--pinned"), className })
    }
    return info
  }
  const openDetailByTitle = async (title) => {
    const cards = await page.$$(".moment-card")
    for (const card of cards) {
      const titleEl = await card.$(".moment-card__title")
      const text = titleEl ? ((await titleEl.text()) || "") : ""
      if (text === title) {
        await card.tap()
        await sleep(1200)
        page = await miniProgram.currentPage()
        await waitFor(".moment-ticket__title")
        page = await miniProgram.currentPage()
        return page.path === DETAIL_PATH
      }
    }
    return false
  }
  const openEditFromDetail = async () => {
    const navButton = await page.$(".app-custom-nav__trailing .wd-button")
    if (!navButton) {
      return false
    }
    await navButton.tap()
    await sleep(1200)
    page = await miniProgram.currentPage()
    await waitFor("#moment-title-field input")
    page = await miniProgram.currentPage()
    return page.path === EDIT_PATH
  }
  const navBackToList = async () => {
    const back = await page.$(".app-custom-nav__icon-button--back")
    await back.tap()
    await sleep(1500)
    page = await miniProgram.currentPage()
  }
  const waitForPath = async (targetPath, timeout = 15000) => {
    const deadline = Date.now() + timeout
    let current = await miniProgram.currentPage()
    while (current.path !== targetPath && Date.now() < deadline) {
      await sleep(500)
      current = await miniProgram.currentPage()
    }
    page = current
    return current
  }

  // ---------- 1. list ----------
  let onList = false
  for (let attempt = 0; attempt < 3 && !onList; attempt += 1) {
    await miniProgram.reLaunch(LIST_ROUTE)
    await sleep(4000)
    page = await miniProgram.currentPage()
    onList = page.path === LIST_PATH
    if (!onList) {
      mark(`reLaunch attempt ${attempt + 1} landed on ${page.path}; retrying`)
    }
  }
  await waitFor(".moment-card", 20000)
  await sleep(1000)
  page = await miniProgram.currentPage()
  record("list route open", page.path === LIST_PATH, page.path)

  const initialCards = await cardsInfo()
  record("list has real records", initialCards.length > 0, `${initialCards.length} card(s)`)
  if (initialCards.length === 0) {
    await shot("m4b-01-list-empty.png")
    await miniProgram.disconnect()
    mark("no real records to validate against; aborting")
    return
  }
  await shot("m4b-01-list.png")

  const targetIndex = initialCards.findIndex((card) => !card.pinned)
  const target = initialCards[targetIndex >= 0 ? targetIndex : 0]
  const foundTitle = target.title
  // 幂等恢复口径：上一轮若中断留下「·改」后缀，本轮恢复时写回去掉后缀的原名。
  const baseTitle = foundTitle.replace(/·改+$/, "")
  const editedTitle = `${baseTitle}·改`
  mark(`target record: 「${foundTitle}」 restore-to: 「${baseTitle}」 pinned=${target.pinned} index=${targetIndex}`)

  // ---------- 2. list → detail ----------
  const cards = await page.$$(".moment-card")
  await cards[targetIndex >= 0 ? targetIndex : 0].tap()
  await sleep(1200)
  page = await miniProgram.currentPage()
  await waitFor(".moment-ticket__title")
  page = await miniProgram.currentPage()
  record("card opens detail page", page.path === DETAIL_PATH, page.path)

  const detailTitle = await textOf(".moment-ticket__title")
  const heroText = (await textOf(".moment-ticket__value")) || (await textOf(".moment-ticket__today"))
  const infoRows = await page.$$(".moment-info__row")
  record("detail shows tapped record title", detailTitle === foundTitle, detailTitle)
  record("detail hero renders projection", heroText.length > 0, heroText || "empty hero")
  record("detail info rows present", infoRows.length >= 5, `${infoRows.length} rows`)
  await shot("m4b-02-detail.png")

  // ---------- 3. detail → edit (hydration) ----------
  const editNavButton = await page.$(".app-custom-nav__trailing .wd-button")
  const editNavLabel = editNavButton ? ((await editNavButton.text()) || "") : ""
  record("nav action is 改一改", editNavLabel.includes("改一改"), editNavLabel)
  const editOpened = await openEditFromDetail()
  record("改一改 opens edit page", editOpened, page.path)

  const eyebrow = await textOf(".app-custom-nav__eyebrow")
  const titleInput = await page.$("#moment-title-field input")
  const hydratedTitle = titleInput ? ((await titleInput.attribute("value")) || "") : ""
  const hydratedDate = await textOf(".app-date-field__text")
  const saveText = await textOf(".moment-edit-actions .wd-button")
  record("edit eyebrow is 改一个小日子", eyebrow.includes("改一个小日子"), eyebrow)
  record("edit hydrates record title", hydratedTitle === foundTitle, hydratedTitle)
  record("edit hydrates record date", /\d{4}年\d{1,2}月\d{1,2}日/.test(hydratedDate), hydratedDate)
  record("edit save copy is 收好这张票根", saveText.includes("收好这张票根"), saveText)
  await shot("m4b-03-edit-hydrated.png")

  // ---------- 4. edit → save → detail + card updated ----------
  await titleInput.input(editedTitle)
  await sleep(500)
  const saveButton = await page.$(".moment-edit-actions .wd-button")
  await saveButton.tap()
  await sleep(3500)
  page = await miniProgram.currentPage()
  await waitFor(".moment-ticket__title")
  const detailTitleAfterSave = await textOf(".moment-ticket__title")
  record(
    "save returns to detail with new title",
    page.path === DETAIL_PATH && detailTitleAfterSave === editedTitle,
    `page=${page.path} title=${detailTitleAfterSave}`
  )
  await shot("m4b-04-detail-after-save.png")

  await navBackToList()
  await sleep(800)
  const toastAfterSave = await textOf(".wd-toast")
  const cardsAfterSave = await cardsInfo()
  record("list route feedback after edit", toastAfterSave.includes("改好了"), toastAfterSave || "no toast")
  record(
    "card updated without restart",
    cardsAfterSave.some((card) => card.title === editedTitle),
    cardsAfterSave.map((card) => card.title).join(" | ")
  )
  await shot("m4b-05-list-after-save.png")

  // ---------- 5. restore original title ----------
  mark("restore original title")
  await openDetailByTitle(editedTitle)
  await openEditFromDetail()
  const titleInput2 = await page.$("#moment-title-field input")
  if (!titleInput2) {
    record("restore editor reachable", false, `page=${page.path}`)
    throw new Error("restore editor input missing")
  }
  await titleInput2.input(baseTitle)
  await sleep(500)
  const saveButton2 = await page.$(".moment-edit-actions .wd-button")
  await saveButton2.tap()
  await sleep(3500)
  page = await miniProgram.currentPage()
  await waitFor(".moment-ticket__title")
  const restoredTitle = await textOf(".moment-ticket__title")
  record("title restored on detail", page.path === DETAIL_PATH && restoredTitle === baseTitle, restoredTitle)
  await navBackToList()
  await sleep(500)

  // ---------- 6. detail → pin → reordered list ----------
  mark("pin flow")
  const detailForPin = await openDetailByTitle(baseTitle)
  record("detail reopened for pin", detailForPin, page.path)
  const pinButton = await page.$(".moment-detail-actions .wd-button")
  const pinLabel = pinButton ? ((await pinButton.text()) || "") : ""
  record("pin action shows 贴到上面", pinLabel.includes("贴到上面"), pinLabel)
  await pinButton.tap()
  page = await waitForPath(LIST_PATH)
  await sleep(600)
  const toastAfterPin = await textOf(".wd-toast")
  record("pin returns to list", page.path === LIST_PATH, page.path)
  record("pin route feedback", toastAfterPin.includes("贴到上面"), toastAfterPin || "no toast")

  const cardsAfterPin = await cardsInfo()
  const pinnedIndex = cardsAfterPin.findIndex((card) => card.title === baseTitle && card.pinned)
  const firstUnpinnedIndex = cardsAfterPin.findIndex((card) => !card.pinned)
  record(
    "pinned card carries 常看 stamp and sits before unpinned cards",
    pinnedIndex >= 0 && (firstUnpinnedIndex === -1 || pinnedIndex < firstUnpinnedIndex),
    `pinnedIndex=${pinnedIndex} firstUnpinnedIndex=${firstUnpinnedIndex}`
  )
  await shot("m4b-06-list-after-pin.png")

  // ---------- 7. detail → unpin ----------
  mark("unpin flow")
  await openDetailByTitle(baseTitle)
  const unpinButton = await page.$(".moment-detail-actions .wd-button")
  const unpinLabel = unpinButton ? ((await unpinButton.text()) || "") : ""
  record("unpin action shows 放回纸堆", unpinLabel.includes("放回纸堆"), unpinLabel)
  await unpinButton.tap()
  page = await waitForPath(LIST_PATH)
  await sleep(600)
  const cardsAfterUnpin = await cardsInfo()
  const stillPinned = cardsAfterUnpin.some((card) => card.title === baseTitle && card.pinned)
  record("unpin returns to list with stamp removed", page.path === LIST_PATH && !stillPinned, `path=${page.path} stillPinned=${stillPinned}`)
  await shot("m4b-07-list-after-unpin.png")

  // ---------- 8. delete confirmation cancel (no real deletion) ----------
  mark("delete cancel flow")
  await openDetailByTitle(baseTitle)
  const deleteButton = await page.$(".moment-danger .wd-button")
  const deleteLabel = deleteButton ? ((await deleteButton.text()) || "") : ""
  record("danger action shows 删除这个日子", deleteLabel.includes("删除这个日子"), deleteLabel)
  await deleteButton.tap()
  await sleep(1200)
  const messageBox = await page.$(".wd-message-box")
  record("delete confirmation shown", Boolean(messageBox), messageBox ? "dialog visible" : "dialog missing")
  await shot("m4b-08-delete-confirm.png")

  const dialogButtons = await page.$$(".wd-message-box .wd-button")
  let cancelLabel = ""
  if (dialogButtons.length > 0) {
    cancelLabel = (await dialogButtons[0].text()) || ""
    await dialogButtons[0].tap()
  }
  await sleep(1000)
  page = await miniProgram.currentPage()
  const titleAfterCancel = await textOf(".moment-ticket__title")
  record(
    "cancel keeps record on detail",
    cancelLabel.includes("取消") && page.path === DETAIL_PATH && titleAfterCancel === baseTitle,
    `cancel=${cancelLabel} page=${page.path} title=${titleAfterCancel}`
  )
  await shot("m4b-09-detail-after-cancel.png")

  await miniProgram.disconnect()
  mark("M4B runtime QA done (no real deletion performed)")
}

main().catch((error) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "M4B", fatal: String(error && error.stack ? error.stack : error) })}\n`)
  console.error("AUTOMATION ERROR:", error)
  process.exitCode = 2
})
