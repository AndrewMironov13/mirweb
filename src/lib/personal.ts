/**
 * Персональная ссылка. Страница /p/<код>/ (её собирает scripts/personal.mjs) отдаёт мессенджеру превью
 * с названием бизнеса и сразу ведёт сюда: /?b=<название>&p=<код>. Посетитель видит свой первый экран
 * без автодемо и чужих примеров
 */
export interface Personal {
  /** Код лида: по нему в Метрике видно, кто открыл ссылку */
  code: string
  /** То, что вписали бы в поле сами: «Детейлинг «Глянец»» */
  text: string
}

function read(): Personal | null {
  const q = new URLSearchParams(location.search)
  const text = q.get('b')?.trim().slice(0, 80)
  if (!text) return null
  return { text, code: (q.get('p') ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 40) }
}

export const PERSONAL = read()
