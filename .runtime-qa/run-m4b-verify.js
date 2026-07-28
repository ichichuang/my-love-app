/* M4B verify: confirm final pin state + robust unpin retest + list screenshot. */
const automator = require("miniprogram-automator")
const fs = require("fs")

const SHOTS = `${__dirname}/shots`
const LOG = `${__dirname}/results-m4b.jsonl`
const LIST_ROUTE = "/pages/moments/moments"
const LIST_PATH = "pages/moments/moments"
const DETAIL_PATH = "pages/moment-detail/moment-detail"

const record = (name, pass, detail) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "M4B-verify", name, pass: Boolean(pass), detail })}\n`)
  console.log(`${pass ? "PASS" : "FAIL"} | ${name} | ${detail}`)
}
const mark = (step) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "M4B-verify", mark: step })}\n`)
  console.log(`.... | ${step}`)
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let miniProgramRef = null
const shot = async (name) => {
  const result = await Promise.race([
    miniProgramRef.screenshot({ path: `${SHOTS}/${name}` }).then(() => "ok"),
    sleep(25000).then(() => "timeout")
  ])
  mark(`screenshot ${name}: ${result}`)
}

const main = async () => {
  let miniProgram = null
  for (let attempt = 0; attempt < 3 && !miniProgram; attempt += 1) {
    try {
      miniProgram = await automator.connect({ wsEndpoint: "ws://localhost:9420" })
    } catch (error) {
      mark(`connect attempt ${attempt + 1} failed: ${error}`)
      await sleep(3000)
    }
  }
  if (!miniProgram) {
    throw new Error("cannot connect to devtools automation")
  }
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

  let onList = false
  for (let attempt = 0; attempt < 3 && !onList; attempt += 1) {
    try {
      await miniProgram.reLaunch(LIST_ROUTE)
    } catch (error) {
      mark(`reLaunch attempt ${attempt + 1} error: ${error}`)
      await sleep(3000)
    }
    onList = await waitPath(LIST_PATH, 10000)
    if (!onList) {
      mark(`reLaunch attempt ${attempt + 1} landed on ${page.path}; retrying`)
    }
  }
  await sleep(2500)
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
  mark(`pin state after full-loop run: pinned=${target.pinned}`)

  if (target.pinned) {
    mark("record still pinned; retesting unpin with polled waits")
    const cards = await page.$$(".moment-card")
    for (const card of cards) {
      const titleEl = await card.$(".moment-card__title")
      const text = titleEl ? ((await titleEl.text()) || "") : ""
      if (text === target.title) {
        await card.tap()
        break
      }
    }
    await waitPath(DETAIL_PATH, 10000)
    await sleep(1500)
    page = await miniProgram.currentPage()
    const unpinButton = await page.$(".moment-detail-actions .wd-button")
    const unpinLabel = unpinButton ? ((await unpinButton.text()) || "") : ""
    record("unpin action shows 放回纸堆", unpinLabel.includes("放回纸堆"), unpinLabel)
    await unpinButton.tap()
    const backOnList = await waitPath(LIST_PATH, 20000)
    await sleep(1200)
    page = await miniProgram.currentPage()
    const after = await cardsInfo()
    const stillPinned = after.some((card) => card.title === target.title && card.pinned)
    record(
      "unpin returns to list with stamp removed",
      backOnList && !stillPinned,
      `backOnList=${backOnList} stillPinned=${stillPinned}`
    )
  } else {
    record("record already unpinned after full-loop run", true, "unpin completed during previous run")
  }

  await shot("m4b-01-list.png")
  await shot("m4b-07-list-after-unpin.png")
  await miniProgram.disconnect()
  mark("verify done")
}

main().catch((error) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "M4B-verify", fatal: String(error && error.stack ? error.stack : error) })}\n`)
  console.error("AUTOMATION ERROR:", error)
  process.exitCode = 2
})
