import { motion, useInView, useScroll, useTransform } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { works } from '../data/content'
import { BrowserFrame, PhoneFrame } from './preview/Frames'
import { Reveal } from './Reveal'

const shot = (id: string, m = false) => `${import.meta.env.BASE_URL}img/works/${id}${m ? '-m' : ''}.webp`
const clip = (id: string, ext: 'mp4' | 'webp') => `${import.meta.env.BASE_URL}video/works/${id}.${ext}`
/** Для каких работ записан живой ролик первого экрана (фары, пролив, скролл-видео) */
const LIVE: Record<string, boolean> = { veridis: true, 'veridis-m': true, caspol: true, expert: true }

/** Живая запись первого экрана сайта клиента: без звука, по кругу, играет только на экране */
function LiveClip({ id, alt, className }: { id: string; alt: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const seen = useInView(ref, { margin: '200px' })
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (seen) v.play().catch(() => {})
    else v.pause()
  }, [seen])
  return (
    <video
      ref={ref}
      src={clip(id, 'mp4')}
      poster={clip(id, 'webp')}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
      className={className}
    />
  )
}

function Shot({ id, host, name, className }: { id: string; host: string; name: string; className?: string }) {
  return (
    <BrowserFrame domain={host} className={className}>
      <img src={shot(id)} alt={`Сайт ${name}`} loading="lazy" className="block aspect-[16/10] w-full object-cover object-top" />
    </BrowserFrame>
  )
}

/** Большая серая панель: наклонный коллаж из живых сайтов */
function Showcase() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [70, -70])
  const byId = Object.fromEntries(works.map((w) => [w.id, w]))

  return (
    <div ref={ref} className="relative overflow-hidden rounded-[24px] bg-cloud lg:h-[700px]">
      {/* Коллаж. На телефоне ужимаем его целиком, раскладка та же */}
      <div className="relative h-[330px] sm:h-[480px] lg:absolute lg:inset-0 lg:h-auto">
        <motion.div style={{ y }} className="absolute left-1/2 top-1/2 h-[760px] w-[1100px] -translate-x-1/2 -translate-y-1/2 scale-[.42] sm:scale-[.62] lg:left-[50%] lg:scale-100">
          <div className="absolute inset-0 rotate-[-14deg]">
            <Shot id="intellect" host={byId.intellect.host} name={byId.intellect.name} className="absolute left-[80px] top-[30px] w-[560px]" />
            <Shot id="caspol" host={byId.caspol.host} name={byId.caspol.name} className="absolute left-[420px] top-[330px] w-[620px]" />
            <PhoneFrame className="absolute left-[690px] top-[40px] w-[190px]">
              <LiveClip id="veridis-m" alt="Мобильная версия сайта VERIDIS" className="block aspect-[390/844] w-full object-cover" />
            </PhoneFrame>
          </div>
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cloud to-transparent lg:hidden" />
      </div>
    </div>
  )
}

function WorkCard({ id, tall }: { id: string; tall?: boolean }) {
  const w = works.find((x) => x.id === id)!
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
            {LIVE[`${id}-m`] ? (
              <LiveClip id={`${id}-m`} alt={`Мобильная версия сайта ${w.name}`} className="block aspect-[390/844] w-full object-cover" />
            ) : (
              <img src={shot(id, true)} alt={`Мобильная версия сайта ${w.name}`} loading="lazy" className="block aspect-[390/844] w-full object-cover" />
            )}
          </PhoneFrame>
        ) : (
          LIVE[id] ? (
            <LiveClip
              id={id}
              alt={`Сайт ${w.name}: первый экран с анимацией`}
              className="block aspect-[16/10] w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
            />
          ) : (
            <img
              src={shot(id)}
              alt={`Сайт ${w.name}: первый экран`}
              loading="lazy"
              className="block aspect-[16/10] w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
            />
          )
        )}
      </div>
      <div className="flex flex-col gap-3 px-3 pb-2 pt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold text-ink">{w.name}</h3>
          <p className="mt-0.5 text-[15px] text-ink-soft">{w.niche}</p>
          <p className="text-[14px] text-muted">{w.city}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-ink-soft transition-colors group-hover:text-ink">
          {w.host.includes('.') ? w.host : 'Открыть'} <ArrowUpRight size={15} />
        </span>
      </div>
    </a>
  )
}

export function Works() {
  return (
    <section id="works" className="mx-auto max-w-[1248px] scroll-mt-20 px-4 pt-24 sm:px-6 lg:pt-32">
      <Reveal>
        <h2 className="display text-[34px] text-ink sm:text-[40px]">Наши работы</h2>
        <p className="mt-3 max-w-[560px] text-[16px] leading-[1.6] text-ink-soft">
          Детейлинг, автоцентр, производство клеёв. Делаем для любого бизнеса, а эти сайты уже работают: откройте и проверьте сами
        </p>
      </Reveal>
      <Reveal className="mt-8">
        <Showcase />
      </Reveal>
      <Reveal className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <WorkCard id="intellect" />
        </div>
        <div className="flex flex-col md:order-last md:col-span-2 lg:order-none lg:col-span-1 lg:row-span-2">
          <WorkCard id="veridis" tall />
        </div>
        <WorkCard id="caspol" />
        <WorkCard id="expert" />
      </Reveal>
    </section>
  )
}
