import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/** Мягкое появление при прокрутке. Один раз, только transform и opacity; если просили меньше движения — только opacity */
export function Reveal({ children, delay = 0, className, y = 24 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const still = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={still ? { opacity: 0 } : { opacity: 0, transform: `translateY(${y}px)` }}
      whileInView={still ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
