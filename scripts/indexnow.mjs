/**
 * IndexNow: сразу сообщить Яндексу о новых и изменённых страницах, не дожидаясь обхода робота
 * и без кнопки «Переобход» в Вебмастере.
 *
 * Запуск ПОСЛЕ npm run deploy, когда GitHub Pages уже отдаёт новую версию:
 *   npm run indexnow                        — все адреса из dist/sitemap.xml
 *   npm run indexnow -- /blog/<адрес>/      — только перечисленные адреса
 *
 * Ключ — файл public/<32 hex>.txt с тем же ключом внутри. Он публичный по протоколу: Яндекс
 * скачивает его с нашего домена и так убеждается, что адреса шлёт владелец сайта.
 * Ответ 200/202 значит «принято», а не «проиндексировано».
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('../', import.meta.url).pathname
const SITE = 'https://mirwebstudio.ru'
const HOST = new URL(SITE).host
const ENDPOINT = 'https://yandex.com/indexnow'

const keyFile = (await readdir(join(root, 'public'))).find((f) => /^[a-f0-9]{32}\.txt$/.test(f))
if (!keyFile) throw new Error('indexnow: нет файла ключа public/<32 hex>.txt')
const key = keyFile.replace(/\.txt$/, '')
const keyLocation = `${SITE}/${keyFile}`

// Ключ уже должен открываться на боевом домене, иначе Яндекс отклонит отправку
const live = await fetch(keyLocation, { cache: 'no-store' }).catch(() => null)
const liveKey = live?.ok ? (await live.text()).trim() : ''
if (liveKey !== key) {
  console.error(`indexnow: ${keyLocation} не отдаёт ключ (${live ? live.status : 'нет ответа'}). Сначала npm run deploy и подождать минуту`)
  process.exit(1)
}

const args = process.argv.slice(2)
let urls
if (args.length) {
  urls = args.map((a) => new URL(a, SITE).href)
} else {
  const xml = await readFile(join(root, 'dist/sitemap.xml'), 'utf8')
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}
urls = [...new Set(urls)].filter((u) => new URL(u).host === HOST)

// Отправляем только то, что реально открывается: 404 в списке Яндексу ни к чему
const ok = []
for (const u of urls) {
  const r = await fetch(u, { method: 'HEAD', cache: 'no-store' }).catch(() => null)
  if (r?.ok) ok.push(u)
  else console.log(`indexnow: пропускаю ${u} — ${r ? r.status : 'нет ответа'}`)
}
if (!ok.length) {
  console.error('indexnow: отправлять нечего')
  process.exit(1)
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation, urlList: ok }),
})
const MEANING = {
  200: 'принято',
  202: 'принято, ключ ещё проверяется',
  400: 'неверный запрос',
  403: 'ключ не подошёл',
  422: 'адреса не с этого домена или ключ не совпал',
  429: 'слишком часто, повторить позже',
}
console.log(`indexnow: Яндекс ответил ${res.status} (${MEANING[res.status] ?? (await res.text()).slice(0, 200)}) на ${ok.length} адр.:`)
for (const u of ok) console.log(`  ${u}`)
if (res.status >= 300) process.exit(1)
