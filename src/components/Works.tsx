import { useInView, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { works, worksLead } from '../data/content'
import { SNAPSHOT } from '../lib/snapshot'
import { T } from '../lib/typo'
import { PhoneFrame } from './preview/Frames'
import { Reveal } from './Reveal'

const shot = (id: string, m = false) => `${import.meta.env.BASE_URL}img/works/${id}${m ? '-m' : ''}.webp`
const clip = (id: string, ext: 'mp4' | 'webp') => `${import.meta.env.BASE_URL}video/works/${id}.${ext}`
/** Для каких работ записан живой ролик первого экрана (фары, пролив, скролл-видео) */
const LIVE: Record<string, boolean> = { veridis: true, 'veridis-m': true, caspol: true, expert: true }
/** «Оклейка, тонировка» → «оклейка, тонировка»: ниша идёт в подпись после названия */
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/**
 * Живая запись первого экрана сайта клиента: без звука, по кругу, играет только на экране.
 * Если посетитель просил убрать анимации, ролик не запускаем: остаётся постер
 */
function LiveClip({ id, alt, className }: { id: string; alt: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const seen = useInView(ref, { margin: '200px' })
  const still = useReducedMotion()
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (seen && !still) v.play().catch(() => {})
    else v.pause()
  }, [seen, still])
  return (
    <video
      ref={ref}
      src={clip(id, 'mp4')}
      poster={clip(id, 'webp')}
      muted
      loop
      playsInline
      // Ролик качается, только когда блок подъехал к экрану (play() ниже): на старте страницы он не нужен
      preload="none"
      aria-label={alt}
      className={className}
    />
  )
}

/**
 * load — секция подъехала к экрану. До этого вместо картинок и роликов пустые рамки той же высоты:
 * постеры не качаются на старте, а пререндер не запекает их адреса в разметку
 */
function WorkCard({ id, tall, load }: { id: string; tall?: boolean; load: boolean }) {
  const w = works.find((x) => x.id === id)!
  const niche = lower(w.niche)
  const zoom = 'transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]'
  return (
    <a
      href={w.url}
      target="_blank"
      rel="noopener"
      className={`group relative flex h-full flex-col overflow-hidden rounded-[22px] bg-cloud p-3 transition-colors duration-300 hover:bg-cloud-2 ${tall ? 'lg:row-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden rounded-[14px] bg-night ${tall ? 'flex flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_50%_30%,#3a3a3a,#1b1b1b)] py-10' : ''}`}>
        {tall ? (
          <PhoneFrame className="w-[230px] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-1.5 group-hover:scale-[1.02]">
            {!load ? (
              <div aria-hidden className="aspect-[390/844] w-full" />
            ) : LIVE[`${id}-m`] ? (
              <LiveClip id={`${id}-m`} alt={`Запись мобильной версии сайта ${w.name}, ${niche}`} className="block aspect-[390/844] w-full object-cover" />
            ) : (
              <img src={shot(id, true)} alt={`Мобильная версия сайта ${w.name}, ${niche}`} loading="lazy" className="block aspect-[390/844] w-full object-cover" />
            )}
          </PhoneFrame>
        ) : !load ? (
          <div aria-hidden className="aspect-[16/10] w-full" />
        ) : LIVE[id] ? (
          <LiveClip id={id} alt={`Запись первого экрана сайта ${w.name}, ${niche}`} className={`block aspect-[16/10] w-full object-cover object-top ${zoom}`} />
        ) : (
          <img src={shot(id)} alt={`Первый экран сайта ${w.name}, ${niche}`} loading="lazy" className={`block aspect-[16/10] w-full object-cover object-top ${zoom}`} />
        )}
      </div>
      {/* Подпись тянется до низа карточки, строка «город · ссылка» прижата к низу: в ряду карточек она на одной высоте */}
      <div className={`flex flex-col px-3 pb-2 pt-4 ${tall ? '' : 'flex-1'}`}>
        <h3 className="text-[17px] font-semibold text-ink">{w.name}</h3>
        <p className="mt-0.5 text-balance text-[15px] text-ink-soft">
          <T>{w.niche}</T>
        </p>
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-0.5">
          <p className="text-[14px] text-muted">{w.city}</p>
          <span className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-ink-soft transition-colors group-hover:text-ink">
            {w.host.includes('.') ? w.host : 'Открыть'} <ArrowUpRight size={15} />
          </span>
        </div>
      </div>
    </a>
  )
}

export function Works() {
  const ref = useRef<HTMLElement>(null)
  const near = useInView(ref, { margin: '800px 0px', once: true })
  const load = near && !SNAPSHOT
  return (
    <section ref={ref} id="works" className="mx-auto max-w-[1248px] scroll-mt-20 px-4 pt-24 sm:px-6 lg:pt-32">
      <Reveal>
        <h2 className="display text-[40px] text-ink sm:text-[56px]">Наши работы</h2>
        <p className="mt-3 max-w-[560px] text-[16px] leading-[1.6] text-ink-soft">
          <T>{worksLead}</T>
        </p>
      </Reveal>
      <Reveal className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <WorkCard id="intellect" load={load} />
        </div>
        <div className="flex flex-col md:order-last md:col-span-2 lg:order-none lg:col-span-1 lg:row-span-2">
          <WorkCard id="veridis" tall load={load} />
        </div>
        <WorkCard id="caspol" load={load} />
        <WorkCard id="expert" load={load} />
      </Reveal>
    </section>
  )
}
