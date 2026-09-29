type Flags = { __SNAPSHOT__?: boolean; __PRE__?: boolean }

/**
 * Пререндер ставит __SNAPSHOT__ до загрузки скриптов: в разметку уходит спокойный первый кадр —
 * пример «Глянец» (детейлинг) картинкой, без автодемо и без живых макетов (их текст не нужен поисковикам)
 */
export const SNAPSHOT = Boolean((window as unknown as Flags).__SNAPSHOT__)

/**
 * Разметку уже отдал пререндер (флаг ставит main.tsx прямо перед первым рендером,
 * поэтому читаем в момент рендера, а не при импорте)
 */
export const isPre = () => Boolean((window as unknown as Flags).__PRE__)

/** Картинка готового черновика «Глянец»: тот же кадр, что рисует живой макет без анимации. Снимать со стенда ?harness&tpl=auto&still=1 */
export const draftPoster = (mobile = false) => `${import.meta.env.BASE_URL}img/draft-${mobile ? 'mobile' : 'desktop'}.webp`

/** Второй экран того же черновика на телефоне (подбор услуги и работы): длинная страница в «Как работаем» */
export const draftSecond = () => `${import.meta.env.BASE_URL}img/draft-mobile-2.webp`

/** Адрес-заглушка в иллюстрациях: пример выдуманный, настоящий домен не показываем */
export const DEMO_DOMAIN = 'ваш-сайт.рф'
