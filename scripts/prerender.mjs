/**
 * Пререндер: открываем собранный сайт в Chromium, пролистываем до конца (чтобы все блоки
 * проявились) и кладём готовую разметку в dist/index.html. Яндекс и превью в мессенджерах
 * видят текст без выполнения JS. React потом рисует страницу поверх.
 */
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { chromium } from '/Users/andrew/.local/lib/node_modules/playwright/index.mjs'

const dist = new URL('../dist/', import.meta.url).pathname
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' }
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
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
const H = await page.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < H; y += 500) {
  await page.mouse.wheel(0, 500)
  await page.waitForTimeout(90)
}
await page.waitForTimeout(1200)
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(400)
const markup = await page.evaluate(() => document.getElementById('root').innerHTML)
await browser.close()
server.close()

const file = join(dist, 'index.html')
const html = await readFile(file, 'utf8')
if (!html.includes('<div id="root"></div>')) throw new Error('В dist/index.html не нашёлся пустой #root')
await writeFile(file, html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`))
console.log(`prerender: ${Math.round(markup.length / 1024)} КБ разметки в dist/index.html`)
