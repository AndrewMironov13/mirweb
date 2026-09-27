type Flags = { __SNAPSHOT__?: boolean; __PRE__?: boolean }

/**
 * Пререндер ставит __SNAPSHOT__ до загрузки скриптов: в разметку уходит спокойный первый кадр —
 * пример «Борода» картинкой, без автодемо и без живых макетов (их текст не нужен поисковикам)
 */
export const SNAPSHOT = Boolean((window as unknown as Flags).__SNAPSHOT__)

/**
 * Разметку уже отдал пререндер (флаг ставит main.tsx прямо перед первым рендером,
 * поэтому читаем в момент рендера, а не при импорте)
 */
export const isPre = () => Boolean((window as unknown as Flags).__PRE__)

/** Картинка готового черновика «Борода»: тот же кадр, что рисует живой макет без анимации */
export const draftPoster = (mobile = false) => `${import.meta.env.BASE_URL}img/draft-${mobile ? 'mobile' : 'desktop'}.webp`
