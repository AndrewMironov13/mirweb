# МирВеб — сайт студии

Лендинг с генератором первого экрана: посетитель вписывает свой бизнес и видит черновик своего сайта. Без ИИ и серверов — ниши и шаблоны в `src/data/niches.ts`.

- `npm run dev` — разработка (порт 5199)
- `npm run build` — сборка + пререндер разметки для поисковиков (`scripts/prerender.mjs`, нужен Playwright)
- `SITE_URL=https://домен npm run build` — добавить canonical, og:url, og:image

Тексты — `src/data/content.ts`. Новая ниша — одна запись в `NICHES`. Фото ниш — `public/img/niche` (CC0, авторы в `CREDITS.json`).

## Деплой

`npm run deploy` — собрать с адресом https://andrewmironov13.github.io/mirweb и выложить `dist` в ветку `gh-pages` (GitHub Pages берёт сайт оттуда). Сборка идёт локально, потому что пререндеру нужен локальный Playwright.

## Статьи

Раздел `/blog/` — статичные страницы без React, собираются после пререндера (`scripts/blog.mjs`, входит в `npm run build`).

- Статья — один файл `content/blog/<адрес-латиницей>.md`: frontmatter (`title`, `description`, `h1`, `lead`, `date`, по желанию `updated`) и markdown.
- Свои блоки: `::: stats` (строки «число | подпись | сравнение») и `::: cta` (поле генератора: ведёт на `/?b=<название>&p=blog`, цель `blog_open`).
- Раздел `## Частые вопросы` с подзаголовками `###` сам становится разметкой FAQPage.
- Стили — `content/blog.css` (цвета и шрифты главной). Карта сайта дополняется адресами статей.
- Цели Метрики на страницах статей: `blog_cta` (отправили название в форме), `tg_click`, `phone_click`; на главной после перехода — `blog_open`.
- Перед публикацией текст прогоняется проверкой на ИИ-почерк: `python3 ~/.claude/skills/anti-ai-text/check.py --mode article content/blog/<файл>.md`.
- После выкладки новой статьи — `npm run indexnow` (или `npm run indexnow -- /blog/<адрес>/`): адреса уходят в Яндекс по IndexNow. Ключ — `public/<ключ>.txt`, он публичный по протоколу. Ответ 200/202 значит «принято», не «проиндексировано».
