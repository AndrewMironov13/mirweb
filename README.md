# МирВеб — сайт студии

Лендинг с генератором первого экрана: посетитель вписывает свой бизнес и видит черновик своего сайта. Без ИИ и серверов — ниши и шаблоны в `src/data/niches.ts`.

- `npm run dev` — разработка (порт 5199)
- `npm run build` — сборка + пререндер разметки для поисковиков (`scripts/prerender.mjs`, нужен Playwright)
- `SITE_URL=https://домен npm run build` — добавить canonical, og:url, og:image

Тексты — `src/data/content.ts`. Новая ниша — одна запись в `NICHES`. Фото ниш — `public/img/niche` (CC0, авторы в `CREDITS.json`).

## Деплой

`npm run deploy` — собрать с адресом https://andrewmironov13.github.io/mirweb и выложить `dist` в ветку `gh-pages` (GitHub Pages берёт сайт оттуда). Сборка идёт локально, потому что пререндеру нужен локальный Playwright.
