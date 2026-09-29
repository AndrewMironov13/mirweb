/**
 * Живые картинки к дням в «Как работаем»: созвон, первый экран, весь сайт, запуск.
 * Всё нарисовано кодом поверх двух готовых кадров черновика «Борода». Двигаются только transform и opacity;
 * бесконечное движение идёт, пока карточка на экране (useLive)
 */
import { AnimatePresence, motion } from 'motion/react'
import { Lock, MapPin, Mic, PhoneOff, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { nicheById } from '../data/niches'
import { draftPoster } from '../lib/snapshot'
import { TgIcon } from './Messengers'
import { enter, useLive } from './useLive'

const EASE = [0.22, 1, 0.36, 1] as const
const avatar = `${import.meta.env.BASE_URL}img/andrey-avatar.webp`
const barber = nicheById('barber')
/** Адрес-заглушка: пример «Бороды» выдуманный, настоящий домен не показываем */
export const DEMO_DOMAIN = 'ваш-сайт.рф'

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/** Таймер звонка отдельно: раз в секунду перерисовывается только он, а не эквалайзер рядом */
function CallTimer({ live }: { live: boolean }) {
  const [sec, setSec] = useState(7)
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => setSec((s) => (s >= 899 ? 7 : s + 1)), 1000)
    return () => clearInterval(t)
  }, [live])
  return <>{mmss(sec)}</>
}

/** День 1. Звонок идёт, пока карточка на экране: таймер тикает, эквалайзер дышит */
export function CallVisual() {
  const { ref, live, seen, still } = useLive()

  return (
    <div ref={ref} className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5">
      <motion.div
        {...enter(seen, still, 'translateY(16px)', 'translateY(0px)')}
        transition={{ duration: 0.7, ease: EASE }}
        className="w-full max-w-[270px] rounded-[18px] bg-[#f7f5f2] p-3.5 text-ink shadow-[0_24px_50px_-20px_rgba(0,0,0,.7)]"
      >
        <div className="flex items-center gap-3">
          <img src={avatar} alt="" loading="lazy" width={80} height={80} className="h-10 w-10 shrink-0 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="text-[14px] font-medium leading-tight">Андрей, МирВеб</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] tabular-nums text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-go" />
              <CallTimer live={live} /> <span className="text-muted">из 15:00</span>
            </p>
          </div>
        </div>
        <div className="mt-3 flex h-7 items-center justify-center gap-[3px]" aria-hidden>
          {[0.5, 0.9, 0.4, 1, 0.65, 0.35, 0.8, 0.55, 0.95, 0.45, 0.7, 0.4, 0.85, 0.5].map((h, i) => (
            <motion.span
              key={i}
              className="h-full w-[3px] origin-center rounded-full bg-ink/70"
              initial={{ transform: `scaleY(${h * 0.6})` }}
              animate={live ? { transform: [`scaleY(${h * 0.35})`, `scaleY(${h})`, `scaleY(${h * 0.5})`] } : { transform: `scaleY(${h * 0.6})` }}
              transition={live ? { duration: 0.9 + (i % 4) * 0.18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } : { duration: 0.3 }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2" aria-hidden>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/[0.07]">
            <Mic size={15} />
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/[0.07]">
            <Video size={15} />
          </span>
          <span className="ml-auto grid h-8 w-12 place-items-center rounded-full bg-[#e5484d] text-white">
            <PhoneOff size={15} />
          </span>
        </div>
      </motion.div>
      {/* Что присылает клиент в первый день: ссылку на Карты */}
      <motion.div
        {...enter(seen, still, 'translateY(12px)', 'translateY(0px)')}
        transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
        className="flex max-w-[270px] items-center gap-2 self-center rounded-[14px] rounded-br-[5px] bg-[#e9e6e1] px-3 py-2 text-[12.5px] text-ink"
      >
        <MapPin size={14} className="shrink-0 text-rust" />
        Ссылка на Яндекс Карты
      </motion.div>
    </div>
  )
}

/** Мини-окно браузера: три точки и полоска адреса */
function Chrome({ light = false, domain }: { light?: boolean; domain?: string }) {
  return (
    <div className={`flex h-[22px] items-center gap-1 px-2.5 ${light ? 'bg-[#ecebe9]' : 'bg-[#1d1d1f]'}`}>
      <span className="h-[6px] w-[6px] rounded-full bg-[#ff5f57]" />
      <span className="h-[6px] w-[6px] rounded-full bg-[#febc2e]" />
      <span className="h-[6px] w-[6px] rounded-full bg-[#28c840]" />
      {domain && <span className={`mx-auto truncate rounded px-2 text-[8.5px] ${light ? 'bg-white text-ink-soft' : 'bg-white/10 text-white/60'}`}>{domain}</span>}
    </div>
  )
}

/**
 * День 2. Первый экран «Бороды» в наклонённом окне, как макеты у durable. Пока карточка на экране,
 * шторка с наброском уезжает и открывает готовый экран: из пустой схемы — настоящий сайт
 */
export function DraftVisual() {
  const { ref, live, seen, still } = useLive()
  return (
    <div ref={ref} className="absolute inset-0">
      <motion.div
        {...(still
          ? { initial: { opacity: 0, transform: 'rotate(-6deg)' }, animate: seen ? { opacity: 1, transform: 'rotate(-6deg)' } : undefined }
          : enter(seen, still, 'translate(14px, 36px) rotate(-2deg)', 'translate(0px, 0px) rotate(-6deg)'))}
        transition={{ duration: 0.9, ease: EASE }}
        className="absolute left-[9%] top-[17%] w-[104%] overflow-hidden rounded-[10px] shadow-[0_30px_60px_-20px_rgba(0,0,0,.8),0_0_0_1px_rgba(255,255,255,.1)]"
      >
        <Chrome domain="черновик" />
        <div className="relative overflow-hidden">
          <img src={draftPoster()} alt="Черновик первого экрана барбершопа «Борода»" loading="lazy" width={1280} height={760} className="block h-auto w-full" />
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[#1f1e1d]"
            initial={{ transform: 'translateX(101%)', opacity: 1 }}
            // Шторка уезжает вправо и открывает экран; за краем гаснет, возвращается невидимой и снова проявляется набросок
            animate={
              live
                ? {
                    transform: ['translateX(0%)', 'translateX(0%)', 'translateX(101%)', 'translateX(101%)', 'translateX(101%)', 'translateX(0%)', 'translateX(0%)', 'translateX(0%)'],
                    opacity: [1, 1, 1, 1, 0, 0, 1, 1],
                  }
                : { transform: 'translateX(101%)', opacity: 1 }
            }
            transition={live ? { duration: 7.5, times: [0, 0.14, 0.42, 0.8, 0.81, 0.82, 0.95, 1], ease: 'easeInOut', repeat: Infinity } : { duration: 0 }}
          >
            <Sketch />
            <span className="absolute inset-y-0 left-0 w-[2px] bg-[#f0a37a] shadow-[0_0_14px_2px_rgba(240,163,122,.55)]" />
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        {...enter(seen, still, 'translateY(10px) scale(.96)', 'translateY(0px) scale(1)')}
        transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
        className="absolute left-4 top-4 rounded-full bg-[#f0a37a] px-3 py-1 text-[12px] font-medium text-[#2b1a10]"
      >
        0 ₽ до оплаты
      </motion.div>
    </div>
  )
}

/** Набросок того же экрана: меню, три строки заголовка, подпись и две кнопки — серыми плашками */
function Sketch() {
  return (
    <div className="flex h-full flex-col px-[5%] pt-[3.5%]">
      <div className="flex items-center gap-[2%]">
        <span className="h-[5px] w-[9%] rounded-full bg-white/25" />
        <span className="ml-auto h-[4px] w-[6%] rounded-full bg-white/15" />
        <span className="h-[4px] w-[6%] rounded-full bg-white/15" />
        <span className="h-[4px] w-[6%] rounded-full bg-white/15" />
        <span className="h-[9px] w-[8%] rounded-[3px] bg-white/20" />
      </div>
      <div className="mt-[9%] flex flex-col items-center gap-[7px]">
        <span className="h-[14px] w-[44%] rounded-[4px] bg-white/20" />
        <span className="h-[14px] w-[36%] rounded-[4px] bg-white/20" />
        <span className="h-[14px] w-[34%] rounded-[4px] bg-white/20" />
        <span className="mt-1 h-[4px] w-[30%] rounded-full bg-white/10" />
        <div className="mt-1.5 flex w-[34%] gap-[6%]">
          <span className="h-[12px] flex-1 rounded-[3px] bg-white/20" />
          <span className="h-[12px] flex-1 rounded-[3px] ring-1 ring-white/20" />
        </div>
      </div>
    </div>
  )
}

/** Дни 3–4. Весь сайт: длинная страница «Бороды» медленно едет в окне, как при просмотре по ссылке */
export function SiteVisual() {
  const { ref, live, seen, still } = useLive()
  return (
    <div ref={ref} className="absolute inset-x-0 bottom-0 top-5 flex justify-center">
      <motion.div
        {...enter(seen, still, 'translateY(30px)', 'translateY(0px)')}
        transition={{ duration: 0.8, ease: EASE }}
        className="flex h-full w-[62%] max-w-[230px] flex-col overflow-hidden rounded-t-[10px] bg-[#141414] shadow-[0_30px_60px_-20px_rgba(0,0,0,.8),0_0_0_1px_rgba(255,255,255,.1)]"
      >
        <Chrome domain={DEMO_DOMAIN} />
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <motion.div
            initial={{ transform: 'translateY(0px)' }}
            animate={live ? { transform: ['translateY(0%)', 'translateY(0%)', 'translateY(-64%)', 'translateY(-64%)', 'translateY(0%)'] } : { transform: 'translateY(0%)' }}
            transition={live ? { duration: 11, times: [0, 0.12, 0.55, 0.7, 1], ease: 'easeInOut', repeat: Infinity } : { duration: 0.6 }}
            aria-hidden
          >
            <LongPage />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

/** Длинная страница целиком, в масштабе окна: первый экран, услуги с ценами, работы, отзывы, запись */
function LongPage() {
  return (
    <div className="bg-[#141414] text-white">
      <div className="relative h-[190px] overflow-hidden">
        <img src={draftPoster(true)} alt="" loading="lazy" width={390} height={800} className="absolute inset-x-0 top-0 h-auto w-full" />
      </div>
      <div className="bg-[#f6f3ee] px-3 pb-4 pt-3.5 text-ink">
        <p className="font-display text-[15px] leading-none">Услуги и цены</p>
        <div className="mt-2.5 divide-y divide-ink/10">
          {barber.list.map(([name, price]) => (
            <div key={name} className="flex items-baseline justify-between gap-2 py-1.5 text-[9.5px]">
              <span>{name}</span>
              <span className="shrink-0 text-ink-soft">{price}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 pb-4 pt-3.5">
        <p className="font-display text-[15px] leading-none">Работы</p>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {['#3a2c22', '#5a4031', '#2b2522', '#4a3426', '#2f2a27', '#634532'].map((c) => (
            <span key={c} className="aspect-square rounded-[4px]" style={{ background: `linear-gradient(160deg, ${c}, #151210)` }} />
          ))}
        </div>
      </div>
      <div className="bg-[#f6f3ee] px-3 pb-4 pt-3.5 text-ink">
        <p className="font-display text-[15px] leading-none">Отзывы</p>
        {[0, 1].map((i) => (
          <div key={i} className="mt-2 rounded-[6px] bg-white p-2">
            <span className="block h-[4px] w-[90%] rounded-full bg-ink/15" />
            <span className="mt-1 block h-[4px] w-[70%] rounded-full bg-ink/15" />
            <span className="mt-1.5 block h-[4px] w-[30%] rounded-full bg-ink/30" />
          </div>
        ))}
      </div>
      <div className="px-3 pb-5 pt-3.5">
        <p className="font-display text-[15px] leading-none">Запись</p>
        <span className="mt-2.5 block h-[18px] rounded-[4px] bg-white/10" />
        <span className="mt-1.5 block h-[18px] rounded-[4px] bg-white/10" />
        <span className="mt-2 grid h-[20px] place-items-center rounded-[4px] bg-[#f97316] text-[8.5px] font-medium">Записаться</span>
      </div>
    </div>
  )
}

/** День 5. Адрес печатается в строке браузера, следом приходит первая заявка */
export function LaunchVisual() {
  const { ref, live, seen, still } = useLive()
  const [typed, setN] = useState(0)
  const [round, setRound] = useState(0)
  // Если движение просили убрать — адрес сразу целиком, без печати
  const n = still ? (seen ? DEMO_DOMAIN.length : 0) : typed
  const done = n >= DEMO_DOMAIN.length

  // Печать по букве, пока карточка на экране
  useEffect(() => {
    if (!live || done) return
    const t = setTimeout(() => setN((x) => x + 1), n === 0 ? 500 : 85)
    return () => clearTimeout(t)
  }, [live, done, n])

  // Пока карточка на экране, раз в несколько секунд всё повторяется: адрес стирается и печатается снова
  useEffect(() => {
    if (!live || !done) return
    const t = setTimeout(() => {
      setN(0)
      setRound((r) => r + 1)
    }, 5200)
    return () => clearTimeout(t)
  }, [live, done])

  return (
    <div ref={ref} className="absolute inset-0 flex flex-col justify-center gap-4 px-5">
      <div className="flex h-12 items-center gap-2 rounded-full bg-[#f7f5f2] px-4 text-[15px] text-ink shadow-[0_24px_50px_-20px_rgba(0,0,0,.7)]">
        <Lock size={14} strokeWidth={2.5} className={`shrink-0 transition-colors duration-300 ${done ? 'text-go' : 'text-muted'}`} />
        <span className="whitespace-nowrap">{DEMO_DOMAIN.slice(0, n)}</span>
        <motion.span
          className="-ml-1.5 h-4 w-[1.5px] bg-ink"
          animate={live && !done ? { opacity: [1, 0] } : { opacity: 0 }}
          transition={live && !done ? { duration: 0.5, repeat: Infinity, repeatType: 'reverse' } : { duration: 0.2 }}
        />
        <span className={`ml-auto shrink-0 text-[11.5px] font-medium transition-opacity duration-300 ${done ? 'text-go opacity-100' : 'opacity-0'}`}>Опубликован</span>
      </div>
      {/* Уведомление приходит поверх стопки, как на экране блокировки: под ним край второго */}
      <div className="relative h-[84px]">
        <AnimatePresence>
          {done && (
            <motion.div
              key={round}
              initial={still ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-14px) scale(.96)' }}
              animate={still ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px) scale(1)' }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ delay: 0.45, type: 'spring', bounce: 0.3, visualDuration: 0.5 }}
              className="absolute inset-x-0 top-0"
            >
              <span className="absolute inset-x-4 -bottom-2.5 h-10 rounded-[14px] bg-white/45" />
              <div className="relative flex items-center gap-3 rounded-[16px] bg-white p-3 text-ink shadow-[0_20px_40px_-18px_rgba(0,0,0,.8)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-[#2aabee] text-white">
                  <TgIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline justify-between gap-2 text-[13.5px] font-medium leading-tight">
                    Новая заявка <span className="shrink-0 text-[11px] font-normal text-muted">сейчас</span>
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">Стрижка и борода, суббота</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
