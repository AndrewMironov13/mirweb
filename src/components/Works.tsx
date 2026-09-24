import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { ArrowUpRight, Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { included, works } from '../data/content'
import { BrowserFrame, PhoneFrame } from './preview/Frames'
import { Reveal } from './Reveal'

const shot = (id: string, m = false) => `${import.meta.env.BASE_URL}img/works/${id}${m ? '-m' : ''}.webp`

function Shot({ id, host, className }: { id: string; host: string; className?: string }) {
  return (
    <BrowserFrame domain={host} className={className}>
      <img src={shot(id)} alt="" loading="lazy" className="block aspect-[16/10] w-full object-cover object-top" />
    </BrowserFrame>
  )
}

/** Большая серая панель: наклонный коллаж из живых сайтов и список того, что входит в работу */
function Showcase() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [70, -70])
  const [open, setOpen] = useState(0)
  const byId = Object.fromEntries(works.map((w) => [w.id, w]))

  return (
    <div ref={ref} className="relative overflow-hidden rounded-[24px] bg-cloud lg:h-[700px]">
      {/* Коллаж. На телефоне ужимаем его целиком, раскладка та же */}
      <div className="relative h-[330px] sm:h-[480px] lg:absolute lg:inset-0 lg:h-auto">
        <motion.div style={{ y }} className="absolute left-1/2 top-1/2 h-[760px] w-[1100px] -translate-x-1/2 -translate-y-1/2 scale-[.42] sm:scale-[.62] lg:left-[50%] lg:scale-100">
          <div className="absolute inset-0 rotate-[-14deg]">
            <Shot id="intellect" host={byId.intellect.host} className="absolute left-[80px] top-[30px] w-[560px]" />
            <Shot id="caspol" host={byId.caspol.host} className="absolute left-[420px] top-[330px] w-[620px]" />
            <PhoneFrame className="absolute left-[660px] top-[-40px] w-[200px]">
              <img src={shot('veridis', true)} alt="" loading="lazy" className="block aspect-[390/844] w-full object-cover" />
            </PhoneFrame>
          </div>
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cloud to-transparent lg:hidden" />
      </div>

      {/* Что входит — белые плашки справа, как у референса */}
      <div className="relative px-4 pb-4 sm:px-6 lg:absolute lg:right-4 lg:top-4 lg:w-[300px] lg:p-0">
        <ul className="space-y-2">
          {included.map((it, i) => {
            const on = open === i
            return (
              <li key={it.title} className="rounded-[18px] bg-white shadow-[0_1px_0_rgba(0,0,0,.03)]">
                <button type="button" onClick={() => setOpen(on ? -1 : i)} aria-expanded={on} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors ${on ? 'bg-cloud-2 text-ink' : 'bg-cloud text-ink-soft'}`}>
                    {on ? <X size={14} /> : <Plus size={14} />}
                  </span>
                  <span className="text-[15px] font-medium text-ink">{it.title}</span>
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-[14px] leading-[1.55] text-ink-soft">{it.text}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="relative px-6 pb-8 pt-4 sm:px-8 lg:absolute lg:bottom-10 lg:left-10 lg:max-w-[380px] lg:p-0">
        <h2 className="text-[18px] font-semibold text-ink">Наши работы: сайты, которые уже работают</h2>
        <p className="mt-1.5 text-[16px] leading-[1.55] text-ink-soft">
          Детейлинг, производство клеёв, премиальный автоцентр. Все живые — откройте и проверьте сами
        </p>
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
            <img src={shot(id, true)} alt={`Мобильная версия сайта ${w.name}`} loading="lazy" className="block aspect-[390/844] w-full object-cover" />
          </PhoneFrame>
        ) : (
          <img
            src={shot(id)}
            alt={`Сайт ${w.name}: первый экран`}
            loading="lazy"
            className="block aspect-[16/10] w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="flex items-end justify-between gap-4 px-3 pb-2 pt-4">
        <div>
          <p className="text-[17px] font-semibold text-ink">{w.name}</p>
          <p className="mt-0.5 text-[15px] text-ink-soft">
            {w.niche} · {w.city}
          </p>
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
    <section id="works" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 pt-24 sm:px-6 lg:px-0 lg:pt-32">
      <Reveal>
        <Showcase />
      </Reveal>
      <Reveal className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkCard id="intellect" />
        </div>
        <div className="flex flex-col lg:row-span-2">
          <WorkCard id="veridis" tall />
        </div>
        <WorkCard id="caspol" />
        <WorkCard id="expert" />
      </Reveal>
    </section>
  )
}
