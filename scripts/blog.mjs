/**
 * Блог: статьи из content/blog/*.md → статичные страницы dist/blog/<slug>/ и список dist/blog/.
 *
 * Страницы собираются без React и без JS: Яндекс и превью в мессенджерах видят готовый текст сразу.
 * Шрифты, цвета и капсулы те же, что на главной (стили — content/blog.css). Запуск после vite build:
 *   node scripts/blog.mjs                 — с адресом сайта из SITE_URL (canonical, og, sitemap)
 *
 * Формат статьи: frontmatter (title, description, h1, lead, date, по желанию updated, cta_who, cta_example) и markdown.
 * Свои блоки: «::: stats» (строки «число | подпись | сравнение») и «::: cta» (поле генератора первого экрана).
 * Раздел «## Частые вопросы» с подзаголовками ### становится разметкой FAQPage.
 */
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('../', import.meta.url).pathname
const dist = join(root, 'dist')
const src = join(root, 'content/blog')
const SITE = (process.env.SITE_URL ?? '').replace(/\/$/, '')
const METRIKA = 113207519
const TG = 'MirWeba'
const PHONE = '+79334170016'
const PHONE_LABEL = '+7 933 417-00-16'
const AUTHOR = 'Андрей Миронов'

if (!existsSync(join(dist, 'index.html'))) throw new Error('blog: сначала сборка (нет dist/index.html)')

// ── Типографика и разметка строк ─────────────────────────────────────────────────

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Как nb() в src/lib/typo.tsx: короткие слова не висят в конце строки, тире не начинает строку */
const SHORT = 'в|во|на|с|со|за|и|а|но|от|по|к|ко|у|о|об|до|для|без|не|ни|из|при|под'
const nb = (s) =>
  s
    .replace(new RegExp(`(?<=^|[\\s«(„"])(${SHORT}) `, 'giu'), '$1 ')
    .replace(/ —/g, ' —')
    .replace(/(\d) (?=[\p{L}%₽])/gu, '$1 ')
    // Разряды числа не разрываются переносом: «12 000», «1 106»
    .replace(/(\d) (?=\d{3}(?!\d))/g, '$1 ')

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const ruDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' }
const anchor = (s) =>
  s
    .toLowerCase()
    .split('')
    .map((c) => TR[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

/** Строка markdown → HTML: жирный, курсив, ссылки. Сначала экранируем, потом размечаем */
function inline(md) {
  const links = []
  let s = md.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
    links.push({ text, url })
    return `\uE000${links.length - 1}\uE000`
  })
  s = esc(nb(s))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
  return s.replace(/\uE000(\d+)\uE000/g, (_, i) => {
    const { text, url } = links[i]
    const out = /^https?:\/\//.test(url) && !(SITE && url.startsWith(SITE))
    return `<a href="${esc(url)}"${out ? ' target="_blank" rel="noopener"' : ''}>${esc(nb(text))}</a>`
  })
}
const plain = (md) => md.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*?/g, '')

// ── Markdown статьи → HTML ───────────────────────────────────────────────────────

function frontmatter(raw, file) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) throw new Error(`blog: нет frontmatter в ${file}`)
  const meta = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  for (const k of ['title', 'description', 'h1', 'lead', 'date']) if (!meta[k]) throw new Error(`blog: в ${file} нет поля ${k}`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`blog: дата в ${file} не в формате ГГГГ-ММ-ДД`)
  return { meta, body: raw.slice(m[0].length) }
}

function render(body, ctx) {
  const lines = body.split('\n')
  const out = []
  const toc = []
  const faq = []
  const stats = []
  let section = ''
  let i = 0
  const para = []
  const flush = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`)
    para.length = 0
  }
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (!t) {
      flush()
      i++
      continue
    }
    if (t.startsWith(':::')) {
      flush()
      const kind = t.slice(3).trim()
      const inner = []
      i++
      while (i < lines.length && lines[i].trim() !== ':::') inner.push(lines[i++])
      i++
      if (kind === 'stats') {
        const cards = inner
          .filter((l) => l.trim())
          .map((l) => {
            const [num, label, cmp] = l.split('|').map((x) => x.trim())
            stats.push({ num, label: plain(label) })
            return `<div class="stat"><b>${esc(nb(num))}</b><span>${inline(label)}</span>${cmp ? `<small>${inline(cmp)}</small>` : ''}</div>`
          })
        out.push(`<div class="stats">${cards.join('')}</div>`)
      } else if (kind === 'cta') {
        out.push(cta(ctx))
      } else throw new Error(`blog: неизвестный блок «::: ${kind}»`)
      continue
    }
    const h = t.match(/^(#{2,3}) (.+)$/)
    if (h) {
      flush()
      const text = h[2]
      const id = anchor(plain(text))
      if (h[1] === '##') {
        section = text
        toc.push({ id, text })
        out.push(`<h2 id="${id}">${inline(text)}</h2>`)
      } else {
        out.push(`<h3 id="${id}">${inline(text)}</h3>`)
        if (/частые вопросы/i.test(section)) faq.push({ q: plain(text), a: [] })
      }
      i++
      continue
    }
    if (/^([-*]|\d+\.) /.test(t)) {
      flush()
      const ordered = /^\d+\./.test(t)
      const items = []
      while (i < lines.length && /^([-*]|\d+\.) /.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^([-*]|\d+\.) /, ''))
      const tag = ordered ? 'ol' : 'ul'
      out.push(`<${tag}>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</${tag}>`)
      if (faq.length && /частые вопросы/i.test(section)) faq.at(-1).a.push(items.map(plain).join('; '))
      continue
    }
    if (t.startsWith('|')) {
      flush()
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++].trim())
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      const [head, , ...rest] = rows
      out.push(
        `<div class="table" role="region" aria-label="Таблица" tabindex="0"><table><thead><tr>${cells(head)
          .map((c) => `<th>${inline(c)}</th>`)
          .join('')}</tr></thead><tbody>${rest.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
      )
      continue
    }
    if (t.startsWith('> ')) {
      flush()
      const q = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) q.push(lines[i++].trim().slice(2))
      out.push(`<blockquote><p>${inline(q.join(' '))}</p></blockquote>`)
      continue
    }
    para.push(t)
    if (faq.length && /частые вопросы/i.test(section)) faq.at(-1).a.push(plain(t))
    i++
  }
  flush()
  return { html: out.join('\n'), toc, stats, faq: faq.map((f) => ({ q: f.q, a: f.a.join(' ') })) }
}

// ── Куски страницы ───────────────────────────────────────────────────────────────

const LOGO = `<svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M10.4 21.5V10.8h2.5l3.1 5.2 3.1-5.2h2.5v10.7h-2.6v-6.2l-2.9 4.8h-.3l-2.9-4.8v6.2Z" fill="currentColor"/></svg>`
const tg = (text) => `https://t.me/${TG}?text=${encodeURIComponent(text)}`
const goal = (name) => `onclick="window.ym&&ym(${METRIKA},'reachGoal','${name}')"`

function cta(ctx) {
  return `<section class="cta" aria-labelledby="cta-${ctx.n}">
  <h2 id="cta-${ctx.n}">${esc(nb(`Посмотрите, каким может быть сайт ${ctx.ctaWho}`))}</h2>
  <p>${esc(nb('Впишите название, и мы сразу соберём первый экран. Бесплатно, без звонка и регистрации'))}</p>
  <form action="/" method="get" onsubmit="window.ym&&ym(${METRIKA},'reachGoal','blog_cta')">
    <label class="sr" for="cta-input-${ctx.n}">Название ${ctx.ctaWho}</label>
    <input id="cta-input-${ctx.n}" name="b" required maxlength="80" placeholder="${esc(ctx.ctaExample)}" autocomplete="organization" />
    <input type="hidden" name="p" value="blog" />
    <button type="submit">Собрать</button>
  </form>
  <p class="alt">${esc(nb('Или напишите нам в'))} <a href="${esc(tg(`Здравствуйте! Я со статьи «${ctx.h1}», хочу обсудить сайт`))}" target="_blank" rel="noopener" ${goal('tg_click')}>Telegram</a></p>
</section>`
}

const metrika = `<script>
      if (location.hostname === 'mirwebstudio.ru') {
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${METRIKA}', 'ym');
        ym(${METRIKA}, 'init', {ssr:true, webvisor:true, clickmap:true, referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
      }
    </script>`

function head({ title, description, path, type, ld, image = '/og.jpg' }) {
  const url = SITE ? `${SITE}${path}` : ''
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="theme-color" content="#ffffff" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preload" href="/blog/assets/rs-cyrillic.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/blog/assets/onest-cyrillic.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/blog/assets/blog.css" />${url ? `\n    <link rel="canonical" href="${url}" />` : ''}
    <meta property="og:type" content="${type}" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:site_name" content="МирВеб" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />${
      url
        ? `\n    <meta property="og:url" content="${url}" />\n    <meta property="og:image" content="${SITE}${image}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />`
        : ''
    }
    <meta name="twitter:card" content="summary_large_image" />
${ld.map((x) => `    <script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n')}
    ${metrika}
  </head>`
}

function top(current) {
  return `<header class="top">
      <div class="top-in">
        <a class="logo glass" href="/" aria-label="МирВеб, на главную">${LOGO}<span>МирВеб</span></a>
        <nav class="links glass" aria-label="Разделы">
          <a href="/#works">Работы</a><a href="/#process">Как работаем</a><a href="/#price">Цена</a><a href="/blog/"${current ? ' aria-current="page"' : ''}>Статьи</a>
        </nav>
        <a class="order" href="${esc(tg('Здравствуйте! Хочу обсудить сайт'))}" target="_blank" rel="noopener" ${goal('tg_click')}>Обсудить сайт</a>
      </div>
    </header>`
}

function foot() {
  const year = new Date().getFullYear()
  return `<footer class="foot">
      <div class="foot-in">
        <div class="foot-grid">
          <div>
            <p style="display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:18px">${LOGO}МирВеб</p>
            <p class="about">${esc(nb('Продающие сайты для малого бизнеса'))}</p>
            <p class="small">© ${year} МирВеб, ${AUTHOR}<br /><a href="/privacy.html">Политика обработки персональных данных</a></p>
          </div>
          <nav aria-label="Разделы сайта">
            <p class="muted">Разделы</p>
            <a href="/#works">Работы</a><a href="/#process">Как работаем</a><a href="/#price">Цена</a><a href="/blog/">Статьи</a>
          </nav>
          <nav aria-label="Связаться">
            <p class="muted">Связаться</p>
            <a class="nw" href="tel:${PHONE}" ${goal('phone_click')}>${PHONE_LABEL}</a>
            <a href="${esc(tg('Здравствуйте! '))}" target="_blank" rel="noopener" ${goal('tg_click')}>Telegram @${TG}</a>
          </nav>
        </div>
      </div>
    </footer>`
}

const ORG = SITE ? { '@type': 'Organization', name: 'МирВеб', url: `${SITE}/`, logo: `${SITE}/img/logo-256.png` } : { '@type': 'Organization', name: 'МирВеб' }
const PERSON = { '@type': 'Person', name: AUTHOR, ...(SITE ? { url: `${SITE}/` } : {}) }

// ── Сборка ───────────────────────────────────────────────────────────────────────

const files = (await readdir(src)).filter((f) => f.endsWith('.md')).sort()
const posts = []
for (const [n, f] of files.entries()) {
  const slug = f.replace(/\.md$/, '')
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) throw new Error(`blog: имя файла ${f} — только латиница, цифры и дефис`)
  const { meta, body } = frontmatter(await readFile(join(src, f), 'utf8'), f)
  // Кому адресована кнопка внизу статьи: «сайт вашей студии», «сайт вашего сервиса»; пример названия в поле
  const ctx = { n, h1: meta.h1, ctaWho: meta.cta_who || 'вашей студии', ctaExample: meta.cta_example || 'Детейлинг «Глянец»' }
  const { html, toc, faq, stats } = render(body, ctx)
  const words = plain(body).split(/\s+/).filter(Boolean).length
  posts.push({ slug, meta, html, toc, faq, stats, minutes: Math.max(1, Math.round(words / 180)) })
}
posts.sort((a, b) => b.meta.date.localeCompare(a.meta.date))

await mkdir(join(dist, 'blog/assets'), { recursive: true })
await copyFile(join(root, 'content/blog.css'), join(dist, 'blog/assets/blog.css'))
await copyFile(join(root, 'src/fonts/rs-cyrillic.woff2'), join(dist, 'blog/assets/rs-cyrillic.woff2'))
await copyFile(join(root, 'src/fonts/rs-latin.woff2'), join(dist, 'blog/assets/rs-latin.woff2'))
const onest = join(root, 'node_modules/@fontsource-variable/onest/files')
await copyFile(join(onest, 'onest-cyrillic-wght-normal.woff2'), join(dist, 'blog/assets/onest-cyrillic.woff2'))
await copyFile(join(onest, 'onest-latin-wght-normal.woff2'), join(dist, 'blog/assets/onest-latin.woff2'))

for (const p of posts) {
  const path = `/blog/${p.slug}/`
  const updated = p.meta.updated || p.meta.date
  const crumbs = [
    { name: 'Главная', path: '/' },
    { name: 'Статьи', path: '/blog/' },
    { name: p.meta.h1, path },
  ]
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: p.meta.h1,
      description: p.meta.description,
      datePublished: p.meta.date,
      dateModified: updated,
      inLanguage: 'ru',
      author: PERSON,
      publisher: ORG,
      ...(SITE ? { mainEntityOfPage: `${SITE}${path}`, image: `${SITE}${path}og.jpg` } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, ...(SITE ? { item: `${SITE}${c.path}` } : {}) })),
    },
    ...(p.faq.length
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          },
        ]
      : []),
  ]
  const others = posts.filter((x) => x !== p).slice(0, 3)
  const page = `${head({ title: `${p.meta.title} — МирВеб`, description: p.meta.description, path, type: 'article', ld, image: `${path}og.jpg` })}
  <body>
    ${top(false)}
    <main class="wrap">
      <ol class="crumbs"><li><a href="/">Главная</a></li><li><a href="/blog/">Статьи</a></li></ol>
      <article>
        <h1>${esc(nb(p.meta.h1))}</h1>
        <p class="lead">${esc(nb(p.meta.lead))}</p>
        <div class="meta"><img src="/img/andrey-avatar.webp" alt="" width="40" height="40" /><div><b>${AUTHOR}, МирВеб</b><time datetime="${p.meta.date}">${ruDate(p.meta.date)}</time> · ${p.minutes}&nbsp;мин чтения</div></div>
        ${p.toc.length > 3 ? `<nav class="toc" aria-label="Содержание"><p>Содержание</p><ol>${p.toc.map((t) => `<li><a href="#${t.id}">${inline(t.text)}</a></li>`).join('')}</ol></nav>` : ''}
        <div class="body">
${p.html}
        </div>
        <div class="author"><img src="/img/andrey-avatar.webp" alt="${AUTHOR}" width="56" height="56" /><div><b>${AUTHOR}, МирВеб</b><p>${esc(nb('Делаем сайты для автобизнеса и малого бизнеса: дизайн, тексты, SEO под Яндекс. Вопрос по статье можно задать в'))} <a href="${esc(tg(`Здравствуйте! Вопрос по статье «${p.meta.h1}»: `))}" target="_blank" rel="noopener" ${goal('tg_click')}>Telegram</a></p></div></div>
        ${updated !== p.meta.date ? `<p class="updated">Обновлено ${ruDate(updated)}</p>` : ''}
      </article>
      ${others.length ? `<section style="margin-top:56px"><h2 style="font:400 32px/1.1 var(--display);margin:0">Ещё статьи</h2><div class="cards">${others.map(card).join('')}</div></section>` : ''}
    </main>
    ${foot()}
  </body>
</html>
`
  await mkdir(join(dist, 'blog', p.slug), { recursive: true })
  await writeFile(join(dist, 'blog', p.slug, 'index.html'), page)
}

function card(p) {
  return `<a class="card" href="/blog/${p.slug}/"><h2>${esc(nb(p.meta.h1))}</h2><p>${esc(nb(p.meta.description))}</p><small>${ruDate(p.meta.date)} · ${p.minutes}&nbsp;мин чтения</small></a>`
}

const indexLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Статьи МирВеба',
    inLanguage: 'ru',
    publisher: ORG,
    ...(SITE ? { url: `${SITE}/blog/` } : {}),
    blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.meta.h1, datePublished: p.meta.date, ...(SITE ? { url: `${SITE}/blog/${p.slug}/` } : {}) })),
  },
]
await writeFile(
  join(dist, 'blog/index.html'),
  `${head({ title: 'Статьи о сайтах и клиентах для автобизнеса — МирВеб', description: 'Разборы и инструкции для владельцев детейлингов, автосервисов и студий тонировки: откуда приходят клиенты, что нужно в карточке на Картах и на сайте', path: '/blog/', type: 'website', ld: indexLd })}
  <body>
    ${top(true)}
    <main class="wrap">
      <ol class="crumbs"><li><a href="/">Главная</a></li></ol>
      <h1>Статьи</h1>
      <p class="lead">${esc(nb('Разборы для владельцев автобизнеса: откуда приходят клиенты, что должно быть в карточке на Картах и на сайте. Считаем на реальных данных'))}</p>
      <div class="cards">${posts.map(card).join('')}</div>
    </main>
    ${foot()}
  </body>
</html>
`,
)

// ── Картинка превью статьи: 1200×630, заголовок и цифры статьи, снимок Playwright ───────────
// Как scripts/og.mjs для главной. Без Playwright статья берёт общую /og.jpg
async function ogImages() {
  let chromium
  try {
    ;({ chromium } = await import('/Users/andrew/.local/lib/node_modules/playwright/index.mjs'))
  } catch {
    console.log('blog: Playwright не найден, превью статей — общая картинка сайта')
    for (const p of posts) await copyFile(join(dist, 'og.jpg'), join(dist, 'blog', p.slug, 'og.jpg'))
    return
  }
  const fonts = `file://${join(dist, 'blog/assets')}/`
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  for (const p of posts) {
    const tmp = join(dist, 'blog', p.slug, 'og.html')
    const len = p.meta.h1.length
    const size = len > 90 ? 58 : len > 60 ? 66 : 76
    await writeFile(
      tmp,
      `<!doctype html><html lang="ru"><head><meta charset="UTF-8" /><style>
@font-face { font-family: 'Display'; src: url('${fonts}rs-cyrillic.woff2') format('woff2'); font-weight: 300 600; unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Display'; src: url('${fonts}rs-latin.woff2') format('woff2'); font-weight: 300 600; unicode-range: U+0000-00FF, U+2000-206F, U+20BD; }
@font-face { font-family: 'Onest'; src: url('${fonts}onest-cyrillic.woff2') format('woff2'); font-weight: 100 900; unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Onest'; src: url('${fonts}onest-latin.woff2') format('woff2'); font-weight: 100 900; unicode-range: U+0000-00FF, U+2000-206F, U+20BD; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; background: #fff; color: #2b2a29; font-family: 'Onest', sans-serif; -webkit-font-smoothing: antialiased; }
.top { position: absolute; left: 64px; right: 64px; top: 48px; display: flex; align-items: center; justify-content: space-between; }
.logo { display: flex; align-items: center; gap: 12px; font-size: 28px; font-weight: 600; letter-spacing: -0.01em; }
.tag { font-size: 22px; color: #5f5d5a; }
h1 { position: absolute; left: 64px; right: 64px; top: 128px; font: 400 ${size}px/1.02 'Display', serif; letter-spacing: -0.012em; text-wrap: balance; }
.stats { position: absolute; left: 64px; right: 64px; bottom: 52px; display: flex; gap: 14px; }
.stat { flex: 1; padding: 20px 22px; border-radius: 22px; background: #f2f2f1; }
.stat b { display: block; font: 400 48px/1 'Display', serif; }
.stat span { display: block; margin-top: 8px; font-size: 19px; line-height: 1.3; color: #5f5d5a; }
</style></head><body>
<div class="top"><div class="logo">${LOGO.replace('width="22" height="22"', 'width="34" height="34"')}МирВеб</div><div class="tag">Статьи · mirwebstudio.ru</div></div>
<h1>${esc(nb(p.meta.h1))}</h1>
${p.stats.length ? `<div class="stats">${p.stats.slice(0, 3).map((s) => `<div class="stat"><b>${esc(nb(s.num))}</b><span>${esc(nb(s.label))}</span></div>`).join('')}</div>` : ''}
</body></html>`,
    )
    await page.goto(`file://${tmp}`, { waitUntil: 'load' })
    const missing = await page.evaluate(async () => {
      await document.fonts.ready
      return ['400 76px Display', '600 28px Onest'].filter((f) => !document.fonts.check(f, 'Сайт'))
    })
    if (missing.length) throw new Error(`blog: в превью ${p.slug} не загрузились шрифты: ${missing.join(', ')}`)
    // Заголовок не должен залезать на цифры
    const overlap = await page.evaluate(() => {
      const h = document.querySelector('h1').getBoundingClientRect()
      const s = document.querySelector('.stats')?.getBoundingClientRect()
      return s ? h.bottom > s.top - 16 : h.bottom > 600
    })
    if (overlap) throw new Error(`blog: в превью ${p.slug} заголовок не помещается — сократите h1`)
    await page.screenshot({ path: join(dist, 'blog', p.slug, 'og.jpg'), type: 'jpeg', quality: 85 })
    await unlink(tmp)
  }
  await browser.close()
}
await ogImages()

// Карта сайта: дописываем раздел к той, что собрал vite.config.ts
const sitemap = join(dist, 'sitemap.xml')
if (SITE && existsSync(sitemap)) {
  const urls = [
    `  <url><loc>${SITE}/blog/</loc><lastmod>${posts[0]?.meta.updated || posts[0]?.meta.date}</lastmod></url>`,
    ...posts.map((p) => `  <url><loc>${SITE}/blog/${p.slug}/</loc><lastmod>${p.meta.updated || p.meta.date}</lastmod></url>`),
  ].join('\n')
  // Повторный запуск не дублирует строки: старые адреса раздела сначала убираем
  const xml = (await readFile(sitemap, 'utf8')).split('\n').filter((l) => !l.includes(`${SITE}/blog/`)).join('\n')
  await writeFile(sitemap, xml.replace('</urlset>', `${urls}\n</urlset>`))
}
console.log(`blog: статей ${posts.length}${SITE ? ', карта сайта дополнена' : ' (без SITE_URL: без canonical и карты сайта)'}`)
