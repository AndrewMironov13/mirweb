import { useEffect, useRef, useState } from 'react'
import { process } from '../data/content'
import { SNAPSHOT } from '../lib/snapshot'
import { T } from '../lib/typo'
import { CallVisual, DraftVisual, LaunchVisual, SiteVisual } from './ProcessVisuals'
import { Reveal } from './Reveal'

const VISUALS = [CallVisual, DraftVisual, SiteVisual, LaunchVisual]

/**
 * Карточка дня: сверху живая картинка, снизу день, что делаем и зачем — как ячейки плитки у durable.
 * Картинка — иллюстрация, скринридеру её содержимое (таймер, печать адреса) не читаем: всё сказано текстом карточки
 */
function Step({ i }: { i: number }) {
  const s = process.steps[i]
  const Visual = VISUALS[i]
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#34322f_0%,#2c2b29_100%)] ring-1 ring-white/[0.07]">
      <div aria-hidden className="relative h-[210px] overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,rgba(240,163,122,.16),transparent_70%)] lg:h-[236px]">
        {/* В снимок пререндера живые картинки не идут: там был бы случайный кадр (полпечатанного адреса, середина таймера) */}
        {!SNAPSHOT && <Visual />}
      </div>
      <div className="flex flex-1 flex-col px-5 pb-6 pt-4 sm:px-6">
        <p className="text-[13px] font-medium text-[#f0a37a]">{s.day}</p>
        <h3 className="mt-1.5 text-[18px] font-medium leading-snug">
          <T>{s.title}</T>
        </h3>
        <p className="mt-1.5 text-[15px] leading-[1.55] text-white/65">
          <T>{s.text}</T>
        </p>
      </div>
    </article>
  )
}

/**
 * На телефоне дни листаются вбок: блок занимает один экран, а не четыре.
 * Точки под лентой показывают, на каком дне остановились. Пересчёт — только на прокрутке ленты, раз в кадр
 */
function useRail() {
  const ref = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const card = el.firstElementChild as HTMLElement | null
        if (!card) return
        const step = card.offsetWidth + 12
        // В конце ленты последняя карточка может не доехать до левого края: засчитываем её по упору
        const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
        setAt(end ? process.steps.length - 1 : Math.round(el.scrollLeft / step))
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return { ref, at }
}

export function Process() {
  const { ref, at } = useRail()
  return (
    // Тёмный лист со скруглённым верхом выезжает из белых «Наших работ»; снизу на него наезжает светлый лист «Цены»
    <section id="process" data-dark className="on-dark mt-20 scroll-mt-16 rounded-t-[28px] bg-night pb-24 pt-16 text-white sm:rounded-t-[40px] lg:mt-28 lg:pb-36 lg:pt-28">
      <div className="mx-auto max-w-[1248px] px-4 sm:px-6">
        <Reveal className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#f0a37a]">Как работаем</p>
            <h2 className="display mt-4 max-w-[640px] text-[40px] sm:text-[56px]">
              <T>{process.title}</T>
            </h2>
          </div>
          <p className="max-w-[400px] text-[16px] leading-[1.6] text-white/65 lg:pb-2">
            <T>{process.lead}</T>
          </p>
        </Reveal>

        <Reveal delay={0.05} className="mt-8 lg:mt-12">
          {/* Лента на телефоне выходит под края экрана, чтобы следующая карточка выглядывала и было видно, что листается */}
          <div
            ref={ref}
            className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 lg:gap-4 [&::-webkit-scrollbar]:hidden"
          >
            {process.steps.map((s, i) => (
              <div key={s.title} className="w-[82%] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none">
                <Step i={i} />
              </div>
            ))}
          </div>
          <div aria-hidden className="mt-5 flex justify-center gap-1.5 sm:hidden">
            {process.steps.map((s, i) => (
              <span key={s.title} className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${i === at ? 'w-5 bg-[#f0a37a]' : 'w-1.5 bg-white/25'}`} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
