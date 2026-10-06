/** Номер счётчика Яндекс Метрики mirwebstudio.ru. Сам счётчик ставит index.html, и только на боевом домене */
export const METRIKA_ID = 113207519

type Ym = (id: number, method: 'reachGoal' | 'params', target: string | Record<string, string>) => void

/**
 * Цель в Метрике. Без счётчика (локально, в снимке пререндера, с блокировщиком) — тихо ничего не делает.
 * Идентификаторы целей заведены в Метрике как «JavaScript-событие» с тем же именем
 */
export function goal(target: 'lead_sent' | 'order_open' | 'draft_built' | 'tg_click' | 'max_click' | 'phone_click' | 'personal_open') {
  const ym = (window as unknown as { ym?: Ym }).ym
  if (typeof ym === 'function') ym(METRIKA_ID, 'reachGoal', target)
}

/** Параметры визита: по ним в отчёте «Параметры визитов» видно, чья персональная ссылка открыта */
export function visitParams(params: Record<string, string>) {
  const ym = (window as unknown as { ym?: Ym }).ym
  if (typeof ym === 'function') ym(METRIKA_ID, 'params', params)
}
