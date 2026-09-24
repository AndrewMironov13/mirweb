import { AnimatePresence, motion, useInView } from 'motion/react'
import { ArrowUpRight, Check, Loader2, Send } from 'lucide-react'
import { useRef, useState } from 'react'
import { brand, tgLink } from '../../data/content'
import { LeadForm } from '../LeadForm'
import { BrowserFrame, PhoneFrame } from '../preview/Frames'
import { Scaled } from '../preview/Scaled'
import { DESKTOP, MOBILE, SitePreview } from '../preview/SitePreview'
import { useGen, type Status } from './store'
import { useMedia } from '../../lib/useMedia'

const img = (name: string) => `${import.meta.env.BASE_URL}img/niche/${name}.webp`
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Сцена под полем ввода: браузер и телефон с «собранным» сайтом на размытом фоне ниши */
export function Stage() {
  const g = useGen()
  const d = g.draft
  const done = g.status === 'done'
  const [formFor, setFormFor] = useState<number | null>(null)
  const formOpen = formFor === g.buildKey
  const stage = useRef<HTMLDivElement>(null)
  const visible = useInView(stage)
  const sm = useMedia('(min-width: 640px)')
  const lg = useMedia('(min-width: 1024px)')

  return (
    <div id="stage" className="relative mx-auto w-full max-w-[1200px] scroll-mt-24">
      <div ref={stage} className={`relative overflow-hidden rounded-[24px] bg-night lg:h-[640px] ${visible ? '' : 'paused'}`}>
        {/* Фон: фото ниши, сильно размытое. Даёт цвет и настроение, не спорит с превью */}
        <AnimatePresence initial={false}>
          <motion.img
            key={d.niche.photo}
            src={img(d.niche.photo)}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-[.5] saturate-[1.3]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(20,19,18,.72)_0%,rgba(20,19,18,.35)_40%,rgba(20,19,18,.1)_100%)]" />

        <div className="relative flex flex-col gap-8 p-4 sm:p-8 lg:block lg:h-full lg:p-0">
          {/* Превью: браузер (от планшета) и телефон */}
          <div className="lg:absolute lg:right-[88px] lg:top-12 lg:w-[720px]">
            {sm && (
              <BrowserFrame domain={d.domain}>
                <Scaled width={DESKTOP.w} height={DESKTOP.h}>
                  <SitePreview key={g.buildKey} draft={d} />
                </Scaled>
              </BrowserFrame>
            )}
          </div>
          {(!sm || lg) && (
            <div className="mx-auto w-[244px] lg:absolute lg:bottom-6 lg:right-6 lg:mx-0 lg:w-[190px]">
              <PhoneFrame>
                <Scaled width={MOBILE.w} height={MOBILE.h}>
                  <SitePreview key={g.buildKey} draft={d} mobile />
                </Scaled>
              </PhoneFrame>
            </div>
          )}

          {/* Подпись и заявка */}
          <div className="text-white lg:absolute lg:bottom-12 lg:left-12 lg:top-12 lg:flex lg:w-[292px] lg:flex-col">
            <div className="inline-flex h-7 items-center gap-2 rounded-full bg-white/12 px-3 text-[12px] text-white/80 ring-1 ring-white/10">
              <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-[#34d399]' : 'animate-pulse bg-[#fbbf24]'}`} />
              {done ? 'Черновик первого экрана' : 'Собираю черновик…'}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={g.buildKey}
                initial={{ opacity: 0, transform: 'translateY(12px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                exit={{ opacity: 0, transform: 'translateY(-8px)' }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mt-5 text-[14px] text-white/60">{cap(d.niche.noun)}</p>
                <p className="display mt-1 text-[44px] leading-[1.02] [overflow-wrap:anywhere] sm:text-[52px]">{d.quoted ? `«${d.name}»` : d.name}</p>
              </motion.div>
            </AnimatePresence>
            <p className="mt-4 text-[15px] leading-[1.55] text-white/75">
              Настоящий сайт с вашими фото, ценами и отзывами соберём за {brand.days} дней. Этот черновик — бесплатно
            </p>

            <BuildLog />

            <div className="mt-6 lg:mt-auto">
              <AnimatePresence mode="wait" initial={false}>
                {formOpen ? (
                  <motion.div key="form" initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} exit={{ opacity: 0 }}>
                    <LeadForm dark stacked autoFocus business={d.name} niche={d.niche.noun} source="Генератор на первом экране" />
                  </motion.div>
                ) : (
                  <motion.div key="btns" className="flex flex-col gap-2 sm:flex-row lg:flex-col" exit={{ opacity: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        g.stopDemo()
                        setFormFor(g.buildKey)
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-white px-5 text-[15px] font-medium text-ink transition hover:bg-white/90 active:scale-[0.98]"
                    >
                      Хочу такой сайт <ArrowUpRight size={17} />
                    </button>
                    <a
                      href={tgLink(`Здравствуйте! Хочу сайт для «${d.name}» (${d.niche.noun}). `)}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] px-5 text-[15px] font-medium text-white ring-1 ring-white/25 transition hover:bg-white/10 active:scale-[0.98]"
                    >
                      <Send size={16} /> Обсудить в Telegram
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[12px] text-muted">
        Фото и тексты в черновике — примеры. В вашем сайте будут ваши
      </p>
    </div>
  )
}

const ORDER: Status[] = ['style', 'headline', 'mobile', 'done']

/** Журнал сборки: пункты закрываются галочками по ходу. Только на широком экране, там есть место */
function BuildLog() {
  const g = useGen()
  const at = ORDER.indexOf(g.status)
  const rows = [
    `Стиль и фото под ${g.draft.niche.noun}`,
    'Заголовок: услуги крупно, боль строкой ниже',
    'Кнопки записи и мессенджеры',
    'Мобильная версия',
  ]
  return (
    <ul className="mt-8 hidden space-y-2.5 text-[13.5px] lg:block">
      {rows.map((r, i) => {
        const done = at > i || g.status === 'done'
        const active = at === i && g.status !== 'done'
        return (
          <li key={i} className={`flex items-center gap-2.5 transition-colors duration-300 ${done ? 'text-white/85' : active ? 'text-white/85' : 'text-white/35'}`}>
            <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full transition-colors duration-300 ${done ? 'bg-[#34d399] text-[#0b0b0c]' : 'bg-white/10'}`}>
              {done ? <Check size={11} strokeWidth={3.2} /> : active ? <Loader2 size={11} className="animate-spin" /> : null}
            </span>
            <span className="truncate">{r}</span>
          </li>
        )
      })}
    </ul>
  )
}
