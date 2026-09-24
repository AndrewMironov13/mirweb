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

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), jsonLd()],
  server: { port: 5199 },
})
