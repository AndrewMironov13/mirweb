import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { about, brand, channels, faq, seo } from './src/data/content.ts'

/** Адрес сайта. Пока домена нет — пусто, и canonical/og:url/sitemap не выводятся */
const SITE_URL = process.env.SITE_URL?.replace(/\/$/, '') ?? ''

/** Картинка для превью ссылки: 1200×630, рисует scripts/og.mjs */
const OG = { width: 1200, height: 630, alt: `${brand.name}: сайт для бизнеса за ${brand.days} дней, ${brand.priceLabel}` }

/** Метка в index.html, на её место встают <title> и description */
const SEO_SLOT = '<!-- seo: title и description из src/data/content.ts, вставляет vite.config.ts -->'

/** Текст в атрибуте и в <title>: кавычки и угловые скобки не ломают разметку */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Структурированные данные собираем из тех же текстов, что на странице: расхождений не будет.
 * Organization, а не ProfessionalService: у студии без адреса и часов работы нет карточки места.
 * priceRange не пишем — цена есть в makesOffer
 */
function jsonLd(): Plugin {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    description: seo.description,
    areaServed: { '@type': 'Country', name: 'Россия' },
    email: channels.email,
    telephone: channels.phoneLabel,
    sameAs: [`https://t.me/${channels.telegram}`, ...(SITE_URL ? [channels.max] : [])],
    // Логотип, основатель и Max — только когда у сайта есть свой адрес
    ...(SITE_URL
      ? {
          url: SITE_URL + '/',
          logo: SITE_URL + '/img/logo-256.png',
          image: SITE_URL + '/og.jpg',
          founder: { '@type': 'Person', name: about.name },
        }
      : {}),
    makesOffer: {
      '@type': 'Offer',
      name: 'Лендинг для бизнеса под ключ',
      priceSpecification: { '@type': 'PriceSpecification', minPrice: brand.price, priceCurrency: 'RUB' },
    },
  }
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return {
    name: 'mirweb-seo',
    /** robots.txt всегда, sitemap.xml — только когда известен адрес сайта */
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /', ...(SITE_URL ? ['', `Sitemap: ${SITE_URL}/sitemap.xml`] : [])].join('\n') + '\n'
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      if (SITE_URL) {
        const urls = ['/', '/privacy.html'].map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        })
      }
    },
    transformIndexHtml(html) {
      // Заголовок и описание страницы — из content.ts, как и JSON-LD: правятся в одном месте
      const meta = [`<title>${esc(seo.title)}</title>`, `<meta name="description" content="${esc(seo.description)}" />`].join('\n    ')
      if (!html.includes(SEO_SLOT)) throw new Error(`mirweb-seo: в index.html нет метки ${SEO_SLOT}, некуда вставить <title>`)
      // Функцией, а не строкой: «$&» или «$1» в тексте не развернутся как шаблон замены
      html = html.replace(SEO_SLOT, () => meta)
      const head = [
        `<script type="application/ld+json">${JSON.stringify(org)}</script>`,
        `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`,
        ...(SITE_URL
          ? [
              `<link rel="canonical" href="${SITE_URL}/" />`,
              `<meta property="og:url" content="${SITE_URL}/" />`,
              `<meta property="og:image" content="${SITE_URL}/og.jpg" />`,
              `<meta property="og:image:width" content="${OG.width}" />`,
              `<meta property="og:image:height" content="${OG.height}" />`,
              `<meta property="og:image:alt" content="${esc(OG.alt)}" />`,
              `<meta name="twitter:card" content="summary_large_image" />`,
            ]
          : []),
      ].join('\n    ')
      return html.replace('</head>', `    ${head}\n  </head>`)
    },
  }
}

/**
 * Шрифты первого экрана грузим сразу вместе с разметкой, а не после разбора CSS:
 * иначе на медленном мобильном заголовок перерисовывается шрифтом через несколько секунд
 */
function preloadFonts(): Plugin {
  const FIRST_SCREEN = [/^rs-cyrillic-/, /^onest-cyrillic-wght-normal-/]
  return {
    name: 'mirweb-preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((f) => FIRST_SCREEN.some((re) => re.test(f.split('/').pop() ?? '')))
        const links = files.map((f) => `<link rel="preload" href="./${f}" as="font" type="font/woff2" crossorigin />`).join('\n    ')
        return links ? html.replace('<link rel="stylesheet"', `${links}\n    <link rel="stylesheet"`) : html
      },
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), jsonLd(), preloadFonts()],
  server: { port: 5199 },
})
