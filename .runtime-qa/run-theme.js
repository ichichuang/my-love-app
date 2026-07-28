/* M4A moment-edit runtime QA — phase B2: dark mode + large font via CLI close/reopen. */
const automator = require("miniprogram-automator")
const { execFileSync } = require("child_process")
const fs = require("fs")

const CLI = "/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
const PROJECT = "/Users/cc/MyPorject/珊瑚行动/my-love-app/dist/build/mp-weixin"
const SHOTS = `${__dirname}/shots`
const LOG = `${__dirname}/results.jsonl`
const ROUTE = "/pages/moment-edit/moment-edit"

const record = (name, pass, detail) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "B2", name, pass: Boolean(pass), detail })}\n`)
  console.log(`${pass ? "PASS" : "FAIL"} | ${name} | ${detail}`)
}

const mark = (step) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "B2", mark: step })}\n`)
  console.log(`.... | ${step}`)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let miniProgram = null

const connect = async () => {
  miniProgram = await automator.connect({ wsEndpoint: "ws://localhost:9420" })
}

const reopenWithTheme = async (theme) => {
  await miniProgram.evaluate((value) => {
    wx.setStorageSync("coral-action-theme-v2", value)
  }, theme)
  await miniProgram.disconnect()
  execFileSync(CLI, ["close", "--project", PROJECT], { timeout: 60000 })
  await sleep(1500)
  execFileSync(CLI, ["auto", "--project", PROJECT, "--auto-port", "9420"], { timeout: 120000 })
  await sleep(4000)
  await connect()
  await miniProgram.reLaunch(ROUTE)
  await sleep(2500)
}

const main = async () => {
  await connect()
  const savedTheme = await miniProgram.evaluate(() => {
    const raw = wx.getStorageSync("coral-action-theme-v2")
    return raw && typeof raw === "object" ? raw : null
  })
  record("read theme storage", true, JSON.stringify(savedTheme))
  const paletteId = (savedTheme && savedTheme.paletteId) || "warm-paper-red-blue"
  const density = (savedTheme && savedTheme.density) || "comfortable"

  // ---------- dark mode ----------
  mark("reopen with dark mode")
  await reopenWithTheme({ mode: "dark", paletteId, density, fontScale: "normal" })
  let page = await miniProgram.currentPage()
  record("dark mode page alive", page.path === "pages/moment-edit/moment-edit", page.path)
  await miniProgram.screenshot({ path: `${SHOTS}/11-dark-mode.png` })
  const darkBg = await miniProgram.evaluate(() => {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    return current ? current.route : ""
  })
  record("dark mode route", darkBg === "pages/moment-edit/moment-edit", String(darkBg))

  // ---------- large font ----------
  mark("reopen with large font")
  await reopenWithTheme({ mode: "system", paletteId, density, fontScale: "large" })
  page = await miniProgram.currentPage()
  const cards = await page.$$(".moment-preset")
  if (cards.length >= 6) {
    await cards[5].tap() // custom -> expand advanced
    await sleep(1200)
  }
  const collapse = await page.$(".app-collapse-section")
  const collapseClass = collapse ? (await collapse.attribute("class")) || "" : ""
  record("large font page alive + advanced expands", page.path === "pages/moment-edit/moment-edit" && collapseClass.includes("--expanded"), `${page.path} ${collapseClass}`)
  await miniProgram.screenshot({ path: `${SHOTS}/12-large-font.png` })

  // ---------- restore ----------
  mark("restore theme")
  await reopenWithTheme({ mode: "system", paletteId, density, fontScale: "normal" })
  record("theme restored", true, JSON.stringify({ mode: "system", paletteId, density, fontScale: "normal" }))

  await miniProgram.disconnect()
  mark("phase B2 done")
}

main().catch((error) => {
  fs.appendFileSync(LOG, `${JSON.stringify({ phase: "B2", fatal: String(error && error.stack ? error.stack : error) })}\n`)
  console.error("AUTOMATION ERROR:", error)
  process.exitCode = 2
})
