import { makeDraft, NICHES, tplOf } from './data/niches'
import { DESKTOP, MOBILE, SitePreview } from './components/preview/SitePreview'
import { Anim } from './components/preview/anim'
import { useTemplate } from './components/preview/templates'

/**
 * Стенд для проверки шаблонов черновиков (только для разработки), открывается по ?harness:
 *   ?harness&tpl=auto            — первый пример ниши этой сферы
 *   &text=Детейлинг «Глянец»     — свой текст
 *   &mobile=1                    — телефонная версия 390×800
 *   &still=1                     — без анимаций, всё сразу
 *   &section=2                   — показать вторую секцию (без прокрутки-демо)
 *   &noscroll=1                  — анимации есть, но без прокрутки-демо
 * Рендер в натуральную величину: 1280×760 или 390×800, левый верхний угол страницы
 */
export function Harness() {
  const q = new URLSearchParams(location.search)
  const tpl = q.get('tpl') ?? 'auto'
  const sample = NICHES.find((n) => tplOf(n) === tpl)?.sample ?? 'Компания «Вектор»'
  const d = makeDraft(q.get('text') ?? sample, null)
  const mobile = q.get('mobile') === '1'
  const still = q.get('still') === '1'
  const size = mobile ? MOBILE : DESKTOP
  const T = useTemplate(tplOf(d.niche))
  const section = q.get('section') === '2'
  const noscroll = q.get('noscroll') === '1' || section

  return (
    <div id="harness" style={{ width: size.w, height: size.h, overflow: 'hidden', position: 'relative', background: '#000' }}>
      {T && noscroll ? (
        <Anim.Provider value={!still}>
          <div style={{ transform: section ? `translateY(-${size.h}px)` : undefined }}>{mobile ? <T.Mobile d={d} /> : <T.Desktop d={d} />}</div>
        </Anim.Provider>
      ) : (
        <SitePreview draft={d} mobile={mobile} animated={!still} />
      )}
      {!T && <p style={{ position: 'absolute', top: 8, left: 8, color: 'red', font: '14px monospace' }}>нет шаблона {tpl}</p>}
    </div>
  )
}
