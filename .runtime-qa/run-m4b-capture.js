/* M4B capture pass on the windowed session (9421): true screenshots + pin-state normalization. */
const automator = require("miniprogram-automator")
const fs = require("fs")

const SHOTS = `${__dirname}/shots`
const LOG = `${__dirname}/results-m4b.jsonl`
const LIST_ROUTE = "/pages/moments/moments"
const LIST_PATH = "pages/moments/moments"
const DETAIL_PATH = "pages/moment-detail/moment-detail"
const EDIT_PATH = "pages/moment-edit/moment-edit"

const record = (name, pass, detail) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "M4B-capture", name, pass: Boolean(pass), detail })}\n`)
  console.log(`${pass ? "PASS" : "FAIL"} | ${name} | ${detail}`)
}
const mark = (step) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "M4B-capture", mark: step })}\n`)
  console.log(`.... | ${step}`)
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let miniProgramRef = null
const shot = async (name) => {
  const result = await Promise.race([
    miniProgramRef.screenshot({ path: `${SHOTS}/${name}` }).then(() => "ok"),
    sleep(30000).then(() => "timeout")
  ])
  mark(`screenshot ${name}: ${result}`)
}

const main = async () => {
  const miniProgram = await automator.connect({ wsEndpoint: "ws://localhost:9421" })
  miniProgramRef = miniProgram

  let page
  const waitPath = async (path, timeout) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      page = await miniProgram.currentPage()
      if (page.path === path) {
        return true
      }
      await sleep(500)
    }
    page = await miniProgram.currentPage()
    return false
  }
  const textOf = async (selector) => {
    const el = await page.$(selector)
    return el ? ((await el.text()) || "") : ""
  }
  const cardsInfo = async () => {
    const cards = await page.$$(".moment-card")
    const info = []
    for (const card of cards) {
      const titleEl = await card.$(".moment-card__title")
      const title = titleEl ? ((await titleEl.text()) || "") : ""
      const className = (await card.attribute("class")) || ""
      info.push({ title, pinned: className.includes("moment-card--pinned") })
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
        return waitPath(DETAIL_PATH, 10000)
      }
    }
    return false
  }

  // ---------- list ----------
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await miniProgram.reLaunch(LIST_ROUTE)
    } catch (error) {
      mark(`reLaunch attempt ${attempt + 1} error: ${error}`)
    }
    if (await waitPath(LIST_PATH, 10000)) {
      break
    }
  }
  await sleep(3000)
  page = await miniProgram.currentPage()
  record("list route open", page.path === LIST_PATH, page.path)

  const before = await cardsInfo()
  const target = before.find((card) => card.title.includes("的生日"))
  record(
    "target record present",
    Boolean(target),
    before.map((card) => `${card.title}${card.pinned ? "(pinned)" : ""}`).join(" | ")
  )
  if (!target) {
    await miniProgram.disconnect()
    return
  }
  mark(`pin state entering capture pass: pinned=${target.pinned}`)
  await sleep(1500)
  await shot("m4b-01-list.png")

  // ---------- detail ----------
  record("open detail", await openDetailByTitle(target.title), page.path)
  await sleep(2500)
  await shot("m4b-02-detail.png")

  // ---------- edit (hydrated, read-only) ----------
  const navButton = await page.$(".app-custom-nav__trailing .wd-button")
  await navButton.tap()
  await waitPath(EDIT_PATH, 10000)
  await sleep(2500)
  page = await miniProgram.currentPage()
  record("edit page open", page.path === EDIT_PATH, page.path)
  await shot("m4b-03-edit-hydrated.png")

  // back to detail without saving (no changes made, so no leave confirmation)
  const backButton = await page.$(".app-custom-nav__icon-button--back")
  await backButton.tap()
  await waitPath(DETAIL_PATH, 10000)
  await sleep(1500)
  page = await miniProgram.currentPage()
  record("back on detail after edit preview", page.path === DETAIL_PATH, page.path)

  // ---------- delete dialog + cancel ----------
  const deleteButton = await page.$(".moment-danger .wd-button")
  await deleteButton.tap()
  await sleep(1500)
  const messageBox = await page.$(".wd-message-box")
  record("delete confirmation shown", Boolean(messageBox), messageBox ? "dialog visible" : "dialog missing")
  await shot("m4b-08-delete-confirm.png")
  const dialogButtons = await page.$$(".wd-message-box .wd-button")
  if (dialogButtons.length > 0) {
    await dialogButtons[0].tap()
  }
  await sleep(1200)
  page = await miniProgram.currentPage()
  const titleAfterCancel = await textOf(".moment-ticket__title")
  record(
    "cancel keeps record on detail",
    page.path === DETAIL_PATH && titleAfterCancel === target.title,
    `page=${page.path} title=${titleAfterCancel}`
  )

  // ---------- normalize pin state to unpinned ----------
  if (target.pinned) {
    mark("record still pinned; unpinning to restore pre-QA state")
    const unpinButton = await page.$(".moment-detail-actions .wd-button")
    const unpinLabel = unpinButton ? ((await unpinButton.text()) || "") : ""
    record("unpin action shows 放回纸堆", unpinLabel.includes("放回纸堆"), unpinLabel)
    await unpinButton.tap()
    const backOnList = await waitPath(LIST_PATH, 20000)
    await sleep(1500)
    page = await miniProgram.currentPage()
    const after = await cardsInfo()
    const stillPinned = after.some((card) => card.title === target.title && card.pinned)
    record(
      "unpin returns to list with stamp removed",
      backOnList && !stillPinned,
      `backOnList=${backOnList} stillPinned=${stillPinned}`
    )
    await shot("m4b-07-list-after-unpin.png")
  } else {
    record("record already unpinned", true, "no normalization needed")
    const back = await page.$(".app-custom-nav__icon-button--back")
    await back.tap()
    await waitPath(LIST_PATH, 10000)
    await sleep(1500)
    await shot("m4b-07-list-after-unpin.png")
  }

  await miniProgram.disconnect()
  mark("capture pass done (no data changed besides restoring unpinned state)")
}

main().catch((error) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "M4B-capture", fatal: String(error && error.stack ? error.stack : error) })}\n`)
  console.error("AUTOMATION ERROR:", error)
  process.exitCode = 2
})
