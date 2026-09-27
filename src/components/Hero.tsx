import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { trust } from '../data/content'
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

/**
 * Первый экран: заголовок, поле генератора и сразу под ним сцена с живым превью.
 * Ритм плотный, чтобы верх сцены (браузер с сайтом ниши) был виден без прокрутки:
 * первый экран показывает продукт, а не обещает его
 */
export function Hero() {
  const setHeroVisible = useGen().setHeroVisible
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
    <section id="top" ref={ref} className="px-4 pb-6 pt-[84px] sm:px-6 sm:pt-[108px] lg:pt-[100px] short:pt-[84px]">
      {/* На телефоне обе строки по одной: кегль от ширины экрана, «за 5 дней, от 30 000 ₽» не рвётся */}
      <h1 className="display mx-auto max-w-[1000px] text-center text-[length:min(44px,calc((100vw_-_32px)/9.4))] text-ink sm:text-[56px] md:text-[68px] lg:text-[84px] short:text-[68px]">
        <motion.span className="block" {...up(0.05)}>
          Сайт для бизнеса
        </motion.span>{' '}
        <motion.span className="block" {...up(0.15)}>
          <span className="accent-word">за 5 дней,</span> от 30 000 ₽
        </motion.span>
      </h1>
      <motion.p
        {...up(0.3)}
        className="mx-auto mt-4 max-w-[440px] text-center text-[14px] leading-[1.55] text-ink-soft min-[360px]:text-[15px] sm:mt-5 sm:max-w-[680px] sm:text-[17px] short:mt-4 short:text-[16px]"
      >
        Делаем лендинги для малого бизнеса: дизайн, тексты, анимации и SEO под Яндекс. Впишите свой бизнес ниже и посмотрите, каким может быть ваш сайт
      </motion.p>

      <motion.div {...up(0.45)} className="mt-6 sm:mt-7 short:mt-5">
        <GeneratorBox id="gen-hero" compact />
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] text-ink-soft sm:gap-x-5 sm:text-[14px]">
          {trust.map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Check size={15} strokeWidth={2.6} className="text-go" />
              {t}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div {...up(0.6)} className="mt-6 sm:mt-8 short:mt-5">
        <Stage />
      </motion.div>
    </section>
  )
}
