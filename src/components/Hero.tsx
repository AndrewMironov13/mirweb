import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { trust } from '../data/content'
import { MaxBadge, TgIcon, maxHref, tgHref } from './Messengers'
import { useOrder } from './Order'
import { GeneratorBox } from './generator/GeneratorBox'
import { Stage } from './generator/Stage'
import { useGen } from './generator/store'

const EASE = [0.22, 1, 0.36, 1] as const
/** Флаг ставит main.tsx до первого рендера, поэтому читаем его в момент рендера, а не при импорте */
const pre = () => Boolean((window as unknown as { __PRE__?: boolean }).__PRE__)
const up = (delay: number) => ({
  initial: pre() ? false : { opacity: 0, transform: 'translateY(18px)' },
  animate: { opacity: 1, transform: 'translateY(0px)' },
  transition: { delay, duration: 0.9, ease: EASE },
})

export function Hero() {
  const setHeroVisible = useGen().setHeroVisible
  const order = useOrder()
  const ref = useRef<HTMLElement>(null)

  // Автодемо крутится, только пока первый экран на виду: не жжём батарею ниже по странице
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [setHeroVisible])

  return (
    <section id="top" ref={ref} className="px-4 pb-6 pt-[104px] sm:px-6 sm:pt-[124px] lg:pt-[136px]">
      <h1 className="display mx-auto max-w-[1000px] text-center text-[44px] text-ink sm:text-[72px] lg:text-[100px]">
        <motion.span className="block" {...up(0.05)}>
          Сайт для бизнеса
        </motion.span>{' '}
        <motion.span className="block" {...up(0.15)}>
          <span className="accent-word">за 5 дней,</span> от 30 000 ₽
        </motion.span>
      </h1>
      <motion.p {...up(0.3)} className="mx-auto mt-6 max-w-[520px] text-center text-[17px] leading-[1.6] text-ink-soft sm:text-[18px]">
        Делаем лендинги для малого бизнеса: дизайн, тексты, анимации и SEO под Яндекс. Впишите свой бизнес ниже и посмотрите, каким может быть ваш сайт
      </motion.p>

      <motion.div {...up(0.45)} className="mt-10 sm:mt-12">
        <GeneratorBox id="gen-hero" />
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[14px] text-ink-soft">
          {trust.map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Check size={15} strokeWidth={2.6} className="text-go" />
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[14px] text-ink-soft">
          <span>Не хотите собирать черновик?</span>
          {/* Кнопки держим одной группой: иначе на 320 px одинокий MAX уезжает на третью строку */}
          <span className="inline-flex items-center gap-2">
            <button type="button" onClick={order} className="h-10 rounded-full bg-ink px-4 font-medium text-white transition hover:bg-black active:scale-[0.97]">
              Заказать сайт
            </button>
            <a href={tgHref()} target="_blank" rel="noopener" aria-label="Написать в Telegram" className="grid h-10 w-10 place-items-center rounded-full bg-cloud text-ink transition hover:bg-cloud-2">
              <TgIcon size={16} />
            </a>
            <a href={maxHref} target="_blank" rel="noopener" aria-label="Написать в Max" className="grid h-10 w-10 place-items-center rounded-full bg-cloud text-ink transition hover:bg-cloud-2">
              <MaxBadge />
            </a>
          </span>
        </div>
      </motion.div>

      <motion.div {...up(0.6)} className="mt-12 sm:mt-16">
        <Stage />
      </motion.div>
    </section>
  )
}
