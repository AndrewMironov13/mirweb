/**
 * Снимки шаблона черновика со стенда (?harness). Нужен запущенный dev-сервер на 5199.
 *   node scripts/tpl-shots.mjs <tpl> <outDir> ["свой текст"]
 * Делает: desktop-hero(still), desktop-second(still), desktop-anim-{0.4,1.2,2.2,3.2}s (без прокрутки),
 *         mobile-hero(still), mobile-second(still), mobile-anim-1.6s
 * Печатает ошибки страницы, если есть
 */
import { mkdirSync } from 'node:fs'
import { chromium } from '/Users/andrew/.local/lib/node_modules/playwright/index.mjs'

const [, , tpl = 'auto', out = `/tmp/tpl-${tpl}`, text] = process.argv
mkdirSync(out, { recursive: true })
const base = `http://127.0.0.1:5199/?harness&tpl=${tpl}${text ? `&text=${encodeURIComponent(text)}` : ''}`
const b = await chromium.launch()
const errs = []
async function shot(name, params, w, h, waits = [900]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 })
  p.on('pageerror', (e) => errs.push(`${name}: ${e.message}`))
  p.on('console', (m) => m.type() === 'error' && errs.push(`${name}: ${m.text().slice(0, 200)}`))
  await p.goto(base + params, { waitUntil: 'domcontentloaded' })
  await p.evaluate(() => document.fonts.ready)
  let t = 0
  for (const at of waits) {
    await p.waitForTimeout(Math.max(0, at - t)); t = at
    const el = await p.$('#harness')
    await el.screenshot({ path: `${out}/${name}${waits.length > 1 ? `-${(at / 1000).toFixed(1)}s` : ''}.png` })
  }
  await p.close()
}
await shot('desktop-hero', '&still=1', 1280, 760, [1500])
await shot('desktop-second', '&still=1&section=2', 1280, 760, [1500])
await shot('desktop-anim', '&noscroll=1', 1280, 760, [400, 1200, 2200, 3200])
await shot('mobile-hero', '&still=1&mobile=1', 390, 800, [1500])
await shot('mobile-second', '&still=1&mobile=1&section=2', 390, 800, [1500])
await shot('mobile-anim', '&noscroll=1&mobile=1', 390, 800, [1600])
await b.close()
console.log(errs.length ? errs.join('\n') : 'no page errors', '\nshots in', out)
