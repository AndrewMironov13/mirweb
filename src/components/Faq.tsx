import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { faq } from '../data/content'
import { Reveal } from './Reveal'

export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 pt-24 sm:px-6 lg:px-0 lg:pt-32">
      <Reveal>
        <h2 className="display text-[34px] text-ink sm:text-[40px]">Вопросы</h2>
      </Reveal>
      <div className="mt-8 border-t border-line">
        {faq.map((f, i) => {
          const on = open === i
          return (
            <div key={f.q} className="border-b border-line">
              <button type="button" onClick={() => setOpen(on ? -1 : i)} aria-expanded={on} className="flex w-full items-center justify-between gap-6 py-6 text-left">
                <span className="text-[18px] font-medium text-ink sm:text-[20px]">{f.q}</span>
                <motion.span animate={{ transform: on ? 'rotate(45deg)' : 'rotate(0deg)' }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="shrink-0 text-ink-soft">
                  <Plus size={20} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[760px] pb-7 text-[16px] leading-[1.65] text-ink-soft">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}
