import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { brand, channels, faq, seo } from './src/data/content.ts'

/** Адрес сайта. Пока домена нет — пусто, и canonical/og:url/sitemap не выводятся */
const SITE_URL = process.env.SITE_URL?.replace(/\/$/, '') ?? ''

/** Структурированные данные собираем из тех же текстов, что на странице: расхождений не будет */
function jsonLd(): Plugin {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: brand.name,
    description: seo.description,
    ...(SITE_URL ? { url: SITE_URL + '/', image: SITE_URL + '/og.jpg' } : {}),
    areaServed: { '@type': 'Country', name: 'Россия' },
    priceRange: brand.priceLabel,
    email: channels.email,
    sameAs: [`https://t.me/${channels.telegram}`],
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
      const head = [
        `<script type="application/ld+json">${JSON.stringify(org)}</script>`,
        `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`,
        ...(SITE_URL
          ? [
              `<link rel="canonical" href="${SITE_URL}/" />`,
              `<meta property="og:url" content="${SITE_URL}/" />`,
              `<meta property="og:image" content="${SITE_URL}/og.jpg" />`,
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
