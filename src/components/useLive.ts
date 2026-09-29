import { useInView, useReducedMotion, type UseInViewOptions } from 'motion/react'
import { useRef } from 'react'

/**
 * Живые картинки блоков «Как работаем» и «Цена»: бесконечное движение идёт, только пока картинка на экране
 * и посетитель не просил меньше движения. seen — картинка хоть раз была на экране (для появления один раз)
 */
export function useLive<T extends Element = HTMLDivElement>(margin: UseInViewOptions['margin'] = '0px 0px -10% 0px') {
  const ref = useRef<T>(null)
  const inView = useInView(ref, { margin })
  const seen = useInView(ref, { once: true, margin })
  const still = Boolean(useReducedMotion())
  return { ref, live: inView && !still, seen, still }
}

/**
 * Появление один раз, когда картинка показалась: сдвиг и проявление,
 * а если просили меньше движения — только проявление, как в Reveal
 */
export function enter(seen: boolean, still: boolean, from: string, to: string) {
  return still
    ? { initial: { opacity: 0 }, animate: seen ? { opacity: 1 } : undefined }
    : { initial: { opacity: 0, transform: from }, animate: seen ? { opacity: 1, transform: to } : undefined }
}
