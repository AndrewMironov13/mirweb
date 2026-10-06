/**
 * Персональные ссылки: /p/<код>/ для каждого бизнеса из списка.
 *
 * Страница крошечная: мессенджер берёт из неё превью («Сайт для «Глянец»» и картинку черновика с этим
 * названием), а человека она сразу ведёт на главную с ?b=<название>&p=<код> — там генератор собирает
 * его первый экран. В поиск страницы не идут (noindex), в sitemap их нет.
 *
 * Запуск после сборки, перед выкладкой:
 *   node scripts/personal.mjs            — страницы для всех из списка, картинки берём из кеша
 *   node scripts/personal.mjs --shots    — доснять картинки, которых в кеше нет
 *   node scripts/personal.mjs --shots --only=bs152,glyanec
 *
 * Список — personal/leads.json: [{ "code": "bs152", "text": "Детейлинг «Блэкстайл152»" }].
 * Папка personal/ в git не идёт: в ней чужие названия и кеш картинок.
 */
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const root = new URL('../', import.meta.url).pathname
const dist = join(root, 'dist')
const cache = join(root, 'personal/og')
const SITE = (process.env.SITE_URL ?? 'https://mirwebstudio.ru').replace(/\/$/, '')
const shots = process.argv.includes('--shots')
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',')

const listFile = join(root, 'personal/leads.json')
if (!existsSync(listFile)) {
  console.log('personal: списка personal/leads.json нет, страницы не собираю')
  process.exit(0)
}
if (!existsSync(join(dist, 'index.html'))) throw new Error('personal: сначала сборка (нет dist/index.html)')

const all = JSON.parse(await readFile(listFile, 'utf8'))
const bad = all.filter((l) => !/^[a-z0-9-]{2,40}$/.test(l.code ?? '') || !l.text?.trim())
if (bad.length) throw new Error(`personal: кривые записи: ${JSON.stringify(bad.slice(0, 3))}`)
const dup = all.map((l) => l.code).filter((c, i, a) => a.indexOf(c) !== i)
if (dup.length) throw new Error(`personal: повторяются коды: ${[...new Set(dup)].join(', ')}`)
const leads = only ? all.filter((l) => only.includes(l.code)) : all

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Название для заголовка превью: то, что в кавычках, иначе весь текст */
const nameOf = (text) => text.match(/«([^»]+)»/)?.[1] ?? text
const target = (l) => `/?b=${encodeURIComponent(l.text)}&p=${l.code}`

await mkdir(cache, { recursive: true })

if (shots) {
  const todo = leads.filter((l) => !existsSync(join(cache, `${l.code}.jpg`)))
  if (todo.length) {
    const { chromium } = await import('/Users/andrew/.local/lib/node_modules/playwright/index.mjs')
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp4': 'video/mp4' }
    const server = createServer(async (req, res) => {
      const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      try {
        const body = await readFile(join(dist, path.endsWith('/') ? path + 'index.html' : path))
        res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'text/html' }).end(body)
      } catch {
        res.writeHead(404).end()
      }
    }).listen(0)
    const port = server.address().port
    const browser = await chromium.launch()
    // Сцена на широком экране — 1200×640: почти ровно формат превью ссылки
    // «Меньше движения»: черновик стоит первым экраном, без сборки по строкам и без прокрутки-демо
    const page = await browser.newPage({ viewport: { width: 1264, height: 760 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    await page.addInitScript(() => localStorage.setItem('mw-cookies-ok', '1'))
    for (const l of todo) {
      await page.goto(`http://127.0.0.1:${port}${target(l)}`, { waitUntil: 'networkidle' })
      await page.getByText('Черновик готов').first().waitFor({ timeout: 15000 })
      await page.evaluate(() => document.getElementById('stage').scrollIntoView({ block: 'start', behavior: 'instant' }))
      // Шрифты черновика и кадр фона ниши
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(1500)
      const box = await page.locator('#stage > div').first().boundingBox()
      await page.screenshot({ path: join(cache, `${l.code}.jpg`), type: 'jpeg', quality: 84, clip: box })
      console.log(`personal: снята картинка ${l.code}`)
    }
    await browser.close()
    server.close()
  }
}

let made = 0
let noImage = 0
for (const l of leads) {
  const dir = join(dist, 'p', l.code)
  await mkdir(dir, { recursive: true })
  const img = join(cache, `${l.code}.jpg`)
  const hasImg = existsSync(img)
  if (hasImg) await copyFile(img, join(dir, 'og.jpg'))
  else noImage++
  const name = nameOf(l.text)
  const title = `Сайт для «${name}»: первый экран`
  const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${esc(title)}</title>
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:site_name" content="МирВеб" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="Набросали, каким может быть ваш сайт. Откройте и посмотрите" />
    <meta property="og:url" content="${SITE}/p/${l.code}/" />
    <meta property="og:image" content="${SITE}/${hasImg ? `p/${l.code}/og.jpg` : 'og.jpg'}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="${hasImg ? 640 : 630}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script>location.replace(${JSON.stringify(target(l))})</script>
    <noscript><meta http-equiv="refresh" content="0;url=/" /></noscript>
  </head>
  <body></body>
</html>
`
  await writeFile(join(dir, 'index.html'), html)
  made++
}
console.log(`personal: страниц ${made}${noImage ? `, без своей картинки ${noImage} (запусти с --shots)` : ''}`)
