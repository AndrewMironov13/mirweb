/**
 * Картинка для превью ссылки в мессенджерах и соцсетях: scripts/og.html → public/og.jpg, 1200×630.
 * Запуск вручную после правки заголовка или сцены: node scripts/og.mjs.
 * После деплоя превью в Telegram обновляет @WebpageBot, во ВКонтакте — vk.com/dev/pages.clearCache
 */
import { chromium } from '/Users/andrew/.local/lib/node_modules/playwright/index.mjs'

const src = new URL('./og.html', import.meta.url)
const out = new URL('../public/og.jpg', import.meta.url).pathname

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.goto(src.href, { waitUntil: 'load' })
// Снимаем, только когда пришли шрифты и картинки: иначе в превью попадёт запасной шрифт или пустая рамка
const missing = await page.evaluate(async () => {
  await document.fonts.ready
  const fonts = ['400 96px Display', '600 30px Onest'].filter((f) => !document.fonts.check(f, 'Сайт 5 ₽'))
  const imgs = [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src)
  return [...fonts, ...imgs]
})
if (missing.length) throw new Error(`og: не загрузилось: ${missing.join(', ')}`)
await page.screenshot({ path: out, type: 'jpeg', quality: 85 })
await browser.close()
console.log(`og: ${out}`)
