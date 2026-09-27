import { Fragment } from 'react'

/** Короткие слова, которые не должны висеть в конце строки. «вы» не связываем: это не предлог */
const SHORT = 'в|во|на|с|со|за|и|а|но|от|по|к|ко|у|о|об|до|для|без|не|ни|из|при|под'
const AFTER_SHORT = new RegExp(`(?<=^|[\\s«(„"])(${SHORT}) `, 'giu')

/** Неразрывный пробел после предлогов и союзов и перед тире. Только для видимого текста, не для <head> и JSON-LD */
export const nb = (s: string) => s.replace(AFTER_SHORT, '$1 ').replace(/ —/g, ' —')

/**
 * Типографика строки при рендере: nb() плюс слова через дефис («что-то», «одну-три») не рвутся по дефису.
 * U+2011 не используем: этого знака нет ни в Onest, ни в заголовочном шрифте
 */
export function T({ children }: { children: string }) {
  const parts = nb(children).split(/([\p{L}\d]+(?:-[\p{L}\d]+)+)/u)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} className="whitespace-nowrap">
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}
