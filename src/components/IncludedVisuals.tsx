/**
 * Живые мини-картинки для плитки «Что входит», как ячейки у durable: веер черновиков, текст с маркером,
 * телефон, сниппет с графиком, въезжающие блоки, стопка заявок. Акцент на авто: сквозной пример — выдуманный
 * детейлинг «Глянец» (его черновик снят с нашего генератора), в анимациях — тонировка.
 * Движение: transform и opacity, клип-маска только на разовом «рисовании» графика
 */
import { AnimatePresence, motion } from 'motion/react'
import { Mail, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { nicheById } from '../data/niches'
import { MaxBadge, TgIcon } from './Messengers'
import { DEMO_DOMAIN, autoDraft } from './ProcessVisuals'
import { enter, useLive } from './useLive'

const EASE = [0.22, 1, 0.36, 1] as const
const fan = (id: string) => `${import.meta.env.BASE_URL}img/fan/${id}.webp`
const detailing = nicheById('detailing')
const tint = nicheById('tint')

/* ─────────────── Дизайн: веер черновиков разных ниш ─────────────── */

/** Детейлинг: настоящий первый экран с нашего генератора, он впереди веера */
function MiniDetailing() {
  return <img src={autoDraft('desktop')} alt="" loading="lazy" width={1280} height={760} className="block aspect-[1280/760] h-auto w-full" />
}

/** Маникюр: светлый экран пополам с фото, антиква */
function MiniNails() {
  return (
    <div className="@container relative grid aspect-[1280/760] grid-cols-[54%_46%] overflow-hidden bg-[#fbf6f2]">
      <div className="flex flex-col justify-center px-[6cqw] text-[#2a1f22]">
        <p className="font-display text-[8.4cqw] leading-[0.95] tracking-[-0.02em]">
          Маникюр.
          <br />
          <i className="text-[#db2777]">Педикюр.</i>
          <br />
          Брови.
        </p>
        <span className="mt-[4cqw] w-fit rounded-full bg-[#db2777] px-[3.4cqw] py-[1.6cqw] text-[3cqw] font-medium text-white">Записаться</span>
      </div>
      <img src={fan('beauty')} alt="" loading="lazy" width={480} height={320} className="h-full w-full object-cover" />
    </div>
  )
}

/** Кофейня: фото во весь экран, заголовок по центру, антиква */
function MiniCoffee() {
  return (
    <div className="@container relative aspect-[1280/760] overflow-hidden bg-[#1a120c]">
      <img src={fan('cafe')} alt="" loading="lazy" width={480} height={320} className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(20,12,6,.55),rgba(20,12,6,.2))]" />
      <div className="relative flex h-full flex-col items-center justify-center text-center text-white">
        <p className="font-display text-[9.5cqw] leading-[0.95] tracking-[-0.02em]">
          Кофе. <i className="text-[#f5b453]">Завтраки.</i>
          <br />
          Десерты.
        </p>
        <span className="mt-[4.5cqw] rounded-full bg-[#d97706] px-[3.8cqw] py-[1.7cqw] text-[3cqw] font-medium">Заказать с собой</span>
      </div>
    </div>
  )
}

/** Впереди — детейлинг, наш главный клиент. За ним маникюр, кофейня в самом конце: показывает, что берём и другие ниши */
const FAN = [
  { C: MiniCoffee, to: 'translate(-38%, 10%) rotate(-9deg) scale(.9)', z: 1 },
  { C: MiniNails, to: 'translate(40%, 8%) rotate(8deg) scale(.94)', z: 2 },
  { C: MiniDetailing, to: 'translate(0%, -4%) rotate(0deg) scale(1.08)', z: 3 },
]

export function DesignFan() {
  const { ref, seen, still } = useLive()
  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center" aria-hidden>
      {FAN.map(({ C, to, z }, i) => (
        <motion.div
          key={i}
          className="absolute w-[54%] max-w-[380px] overflow-hidden rounded-[10px] bg-white shadow-[0_24px_50px_-22px_rgba(28,27,26,.55),0_0_0_1px_rgba(28,27,26,.08)]"
          style={{ zIndex: z }}
          {...(still
            ? { initial: { opacity: 0, transform: to }, animate: seen ? { opacity: 1, transform: to } : undefined }
            : { initial: { opacity: 0, transform: 'translate(0%, 16%) rotate(0deg)' }, animate: seen ? { opacity: 1, transform: to } : undefined })}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.95, ease: EASE }}
        >
          <C />
        </motion.div>
      ))}
    </div>
  )
}

/* ─────────────── Тексты: крупно — что делаете, ниже — какую проблему решаете ─────────────── */

/** Пометка редактора на полях: подпись и изогнутая стрелка к строке */
function Note({ children, flip }: { children: string; flip?: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 text-[12.5px] font-medium text-rust ${flip ? 'flex-row-reverse self-end' : ''}`}>
      {children}
      <svg width="26" height="18" viewBox="0 0 26 18" fill="none" aria-hidden className={flip ? 'rotate-180' : ''}>
        <path d="M2 3c7 0 14 3 19 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16.5 13.5 21 14l.8-4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function CopyMarker() {
  const { ref, seen, still } = useLive()
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col justify-center gap-2 px-6 sm:px-8" aria-hidden>
      <Note>что делаете</Note>
      <p className="display text-[30px] text-ink sm:text-[38px]">{detailing.services.join(' ')}</p>
      <p className="relative w-fit text-[15.5px] text-ink">
        <motion.span
          className="absolute -inset-x-1.5 inset-y-0 origin-left rounded-[4px] bg-[#f6c9ad]"
          {...(still
            ? { initial: { opacity: 0 }, animate: seen ? { opacity: 1 } : undefined }
            : { initial: { transform: 'scaleX(0)' }, animate: seen ? { transform: 'scaleX(1)' } : undefined })}
          transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
        />
        <span className="relative">{detailing.pain.split(':')[0]}</span>
      </p>
      <Note flip>какую проблему решаете</Note>
    </div>
  )
}

/* ─────────────── Мобильная версия: телефон с черновиком ─────────────── */

export function PhoneMock() {
  const { ref, live, seen, still } = useLive()
  return (
    <div ref={ref} className="absolute inset-0 flex items-start justify-center pt-7 lg:items-center lg:pt-0" aria-hidden>
      <motion.div
        {...enter(seen, still, 'translateY(48px)', 'translateY(0px)')}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative w-[52%] max-w-[270px] shrink-0 rounded-[30px] bg-[#161616] p-[6px] shadow-[0_30px_60px_-24px_rgba(28,27,26,.6),0_0_0_1px_rgba(28,27,26,.12)] lg:w-[64%] lg:max-w-[250px]"
      >
        <div className="relative overflow-hidden rounded-[24px] bg-black">
          <div className="absolute left-1/2 top-[6px] z-10 h-[14px] w-[30%] -translate-x-1/2 rounded-full bg-black" />
          <img src={autoDraft('mobile')} alt="" loading="lazy" width={390} height={800} className="block h-auto w-full" />
          {/* Касание кнопки «Записаться на осмотр»: круг расходится и гаснет, пока телефон на экране */}
          <motion.span
            className="absolute left-1/2 top-[77%] -ml-[18px] -mt-[18px] h-9 w-9 rounded-full bg-white/70"
            initial={{ opacity: 0, transform: 'scale(.4)' }}
            animate={live ? { opacity: [0, 0.8, 0], transform: ['scale(.4)', 'scale(.7)', 'scale(1.8)'] } : { opacity: 0, transform: 'scale(.4)' }}
            transition={live ? { duration: 1.4, times: [0, 0.2, 1], repeat: Infinity, repeatDelay: 1.6, ease: 'easeOut' } : { duration: 0.2 }}
          />
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────── SEO: сниппет в поиске и растущий график ─────────────── */

/** Линия заканчивается не у края, чтобы точка и подпись над ней были видны целиком */
const CHART = 'M0 118 C 30 112, 44 96, 70 98 S 110 84, 130 88 S 168 66, 196 70 S 236 44, 256 40 S 280 16, 292 8'

export function SeoSnippet() {
  const { ref, seen, still } = useLive()
  return (
    <div ref={ref} className="absolute inset-0" aria-hidden>
      {/* График рисуется слева направо один раз: маска открывает линию вместе с заливкой */}
      <motion.svg
        viewBox="0 0 320 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[58%] w-full"
        {...(still
          ? { initial: { opacity: 0 }, animate: seen ? { opacity: 1 } : undefined }
          : { initial: { clipPath: 'inset(0 100% 0 0)' }, animate: seen ? { clipPath: 'inset(0 0% 0 0)' } : undefined })}
        transition={{ delay: 0.3, duration: 1.6, ease: [0.45, 0, 0.2, 1] }}
      >
        <defs>
          <linearGradient id="seo-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#0b7a50" stopOpacity=".2" />
            <stop offset="1" stopColor="#0b7a50" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${CHART} L292 120 L0 120 Z`} fill="url(#seo-fill)" />
        <path d={CHART} fill="none" stroke="#0b7a50" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </motion.svg>
      {/* Точка на конце линии и подпись над ней, как у durable, только без выдуманных цифр */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={seen ? { opacity: 1 } : undefined}
        transition={{ delay: still ? 0 : 1.7, duration: 0.5 }}
      >
        {/* Конец линии: x = 292/320, y = верх графика (42%) + 8/120 его высоты */}
        <span className="absolute left-[91.25%] top-[45.9%] -ml-[6px] -mt-[6px] h-3 w-3 rounded-full border-2 border-go bg-white" />
        <span className="absolute bottom-[calc(54.1%+12px)] right-[3%] whitespace-nowrap rounded-[8px] bg-ink px-2.5 py-1.5 text-[11px] leading-none text-white">
          Показы
        </span>
      </motion.div>

      <motion.div
        {...enter(seen, still, 'translateY(14px)', 'translateY(0px)')}
        transition={{ delay: 0.15, duration: 0.7, ease: EASE }}
        className="relative ml-5 mt-5 w-[72%] max-w-[300px] overflow-hidden rounded-[14px] bg-white shadow-[0_14px_34px_-18px_rgba(28,27,26,.4)] sm:ml-6"
      >
        <div className="flex items-center gap-2 border-b border-line px-3.5 py-2 text-[12.5px] text-ink">
          <Search size={13} className="shrink-0 text-muted" />
          детейлинг рядом
        </div>
        <div className="px-3.5 pb-3.5 pt-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0b0b0c] text-[11px] font-bold text-white">Г</span>
            <div className="min-w-0 leading-tight">
              <p className="text-[12px] text-ink">{detailing.sample}</p>
              <p className="text-[11px] text-muted">{DEMO_DOMAIN}</p>
            </div>
          </div>
          <p className="mt-2 text-[14px] font-medium leading-snug text-[#2a55c9]">Полировка, керамика и химчистка — запись онлайн</p>
          <p className="mt-1 text-[12px] leading-[1.45] text-ink-soft">{detailing.pain}</p>
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────── Анимации: блоки страницы мягко въезжают ─────────────── */

export function MotionDemo() {
  const { ref, live, seen, still } = useLive()
  const [cycle, setCycle] = useState(0)
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => setCycle((c) => c + 1), 4400)
    return () => clearInterval(t)
  }, [live])

  /** Появление, как на сайтах, которые делаем: слово за словом из-под маски, следом кнопка и фото */
  const rise = (i: number, from = 'translateY(105%)') => ({
    initial: still ? { opacity: 0 } : { opacity: 0, transform: from },
    animate: seen ? (still ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0%)' }) : undefined,
    transition: { delay: 0.15 + i * 0.11, duration: 0.75, ease: EASE },
  })
  const words = tint.services

  return (
    <div ref={ref} className="absolute inset-0 flex justify-center" aria-hidden>
      {/* Мини-страница тонировки: тёмная, как сайты авто-ниши. key={cycle} перезапускает появление, пока ячейка на экране */}
      <div key={cycle} className="absolute top-7 w-[76%] max-w-[310px] rounded-t-[14px] bg-[#0f1215] px-4 pb-8 pt-3.5 shadow-[0_20px_44px_-22px_rgba(28,27,26,.55),0_0_0_1px_rgba(28,27,26,.1)]">
        <motion.div className="flex items-center gap-1.5" {...rise(0, 'translateY(-8px)')}>
          <span className="h-3 w-3 rounded-full bg-[#2dd4bf]" />
          <span className="ml-auto h-[4px] w-6 rounded-full bg-white/25" />
          <span className="h-[4px] w-6 rounded-full bg-white/25" />
        </motion.div>
        <p className="mt-3.5 text-[21px] font-extrabold leading-[1.02] tracking-[-0.02em] text-white">
          {words.map((w, i) => (
            <span key={w} className="mr-[0.22em] inline-block overflow-hidden pb-[0.06em] align-bottom">
              <motion.span className={`inline-block ${i === 1 ? 'text-[#2dd4bf]' : ''}`} {...rise(1 + i)}>
                {w}
              </motion.span>
            </span>
          ))}
        </p>
        <motion.span className="mt-3 inline-block rounded-[6px] bg-[#2dd4bf] px-3 py-1.5 text-[10.5px] font-semibold text-[#06201c]" {...rise(4, 'translateY(10px)')}>
          {tint.cta}
        </motion.span>
        <div className="mt-3.5 grid grid-cols-3 gap-1.5">
          {/* Одно фото, разрезанное на три плитки: каждая показывает свою треть */}
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="relative h-[56px] overflow-hidden rounded-[6px]" {...rise(5 + i, 'translateY(18px)')}>
              <img
                src={fan('auto')}
                alt=""
                loading="lazy"
                width={480}
                height={320}
                className="absolute top-0 h-full w-[300%] max-w-none object-cover"
                style={{ left: `${-i * 100}%` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Заявки: стопка уведомлений из мессенджеров и почты ─────────────── */

const LEADS = [
  { ch: 'tg', from: 'Telegram', text: 'Полировка и керамика, суббота' },
  { ch: 'max', from: 'Max', text: 'Химчистка салона, завтра' },
  { ch: 'mail', from: 'Почта', text: 'Оклейка зон риска, пятница' },
  { ch: 'tg', from: 'Telegram', text: 'Мойка и полировка, сегодня после 18' },
] as const

function ChannelIcon({ ch }: { ch: (typeof LEADS)[number]['ch'] }) {
  if (ch === 'tg')
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[#2aabee] text-white">
        <TgIcon size={15} />
      </span>
    )
  if (ch === 'max')
    return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-ink text-white">{<MaxBadge />}</span>
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[#e9e6e1] text-ink">
      <Mail size={15} />
    </span>
  )
}

export function LeadsStack() {
  const { ref, live, still } = useLive()
  const [k, setK] = useState(3)
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => setK((x) => x + 1), 2600)
    return () => clearInterval(t)
  }, [live])
  const shown = [k, k - 1, k - 2, k - 3]

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex justify-center overflow-hidden px-5 pt-6 [mask-image:linear-gradient(180deg,#000_62%,transparent_96%)]"
      aria-hidden
    >
      <div className="flex w-full max-w-[340px] flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((n, i) => {
            const l = LEADS[n % LEADS.length]
            return (
              <motion.div
                key={n}
                layout={!still}
                initial={still ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.96 }}
                animate={{ opacity: i === 3 ? 0.55 : 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', bounce: 0.2, visualDuration: 0.5 }}
              >
                <div
                  className="flex items-center gap-3 rounded-[14px] bg-white p-2.5 pr-3.5 shadow-[0_10px_26px_-16px_rgba(28,27,26,.45),0_0_0_1px_rgba(28,27,26,.05)]"
                  style={{ rotate: `${n % 2 ? -1.2 : 1}deg` }}
                >
                  <ChannelIcon ch={l.ch} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="flex items-baseline justify-between gap-2 text-[13px] font-medium text-ink">
                      Новая заявка <span className="shrink-0 text-[11px] font-normal text-muted">{l.from}</span>
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-soft">{l.text}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
