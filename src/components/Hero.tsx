import { motion } from 'motion/react'
import { CircleCheck, Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { trust } from '../data/content'
import { GeneratorBox, statusText } from './generator/GeneratorBox'
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
  const g = useGen()
  const setHeroVisible = g.setHeroVisible
  /** Посетитель собирает свой черновик (не автодемо) */
  const mine = !g.demo && g.status !== 'idle'
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
    <section id="top" ref={ref} className="overflow-x-clip px-4 pb-6 pt-[84px] sm:px-6 sm:pt-[108px] lg:pt-[100px] short:pt-[104px]">
      {/* На телефоне обе строки по одной: кегль от ширины экрана, «за 5 дней, от 30 000 ₽» не рвётся */}
      <h1 className="display mx-auto max-w-[1000px] text-center text-[length:min(44px,calc((100vw_-_32px)/9.4))] text-ink sm:text-[56px] md:text-[68px] lg:text-[84px] short:text-[60px]">
        {/* Строки не переносятся: пока грузится шрифт, запасной не должен дать третью строку и сдвиг всего экрана */}
        <motion.span className="block whitespace-nowrap" {...up(0.05)}>
          Сайт для бизнеса
        </motion.span>{' '}
        <motion.span className="block whitespace-nowrap" {...up(0.15)}>
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
        <GeneratorBox id="gen-hero" />
        {/* Факты под полем. Пока посетитель собирает свой черновик, на телефоне здесь ход сборки: сцена ниже, её статус под клавиатурой */}
        <div className="relative mt-3">
          <ul className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] sm:gap-x-2.5 text-ink-soft sm:text-[14px] ${mine ? 'max-lg:invisible' : ''}`}>
            {trust.map((t, i) => (
              <li key={t} className="flex items-center gap-2.5">
                {/* Точки-разделители только в одну строку: на телефоне строка переносится, и точка повисала в начале */}
                {i > 0 && <span aria-hidden className="hidden h-1 w-1 rounded-full bg-muted/60 sm:block" />}
                {t}
              </li>
            ))}
          </ul>
          {mine && (
            <p aria-live="polite" className={`absolute inset-x-0 top-0 flex items-center justify-center gap-1.5 text-[13px] lg:hidden ${g.status === 'done' ? 'text-go' : 'text-ink-soft'}`}>
              {g.status === 'done' ? <CircleCheck size={15} /> : <Loader2 size={15} className="animate-spin" />}
              {statusText(g.status, g.draft.niche.noun, g.took)}
            </p>
          )}
        </div>
      </motion.div>

      <motion.div {...up(0.6)} className="mt-6 sm:mt-8 short:mt-5">
        <Stage />
      </motion.div>
    </section>
  )
}
