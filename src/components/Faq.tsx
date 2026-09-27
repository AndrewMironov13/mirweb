import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { faq } from '../data/content'
import { T } from '../lib/typo'
import { Reveal } from './Reveal'

const EASE = [0.22, 1, 0.36, 1] as const

export function Faq() {
  const [open, setOpen] = useState(0)
  const uid = useId()
  return (
    <section id="faq" className="mx-auto max-w-[1248px] scroll-mt-20 px-4 pt-24 sm:px-6 lg:pt-32">
      <Reveal>
        <h2 className="display text-[40px] text-ink sm:text-[56px]">Вопросы</h2>
      </Reveal>
      <div className="mt-8 border-t border-line">
        {faq.map((f, i) => {
          const on = open === i
          const id = `${uid}-a${i}`
          return (
            <div key={f.q} className="border-b border-line">
              <h3>
              <button type="button" onClick={() => setOpen(on ? -1 : i)} aria-expanded={on} aria-controls={id} className="flex w-full items-center justify-between gap-6 py-6 text-left">
                <span className="text-[18px] font-medium text-ink sm:text-[20px]">
                  <T>{f.q}</T>
                </span>
                <motion.span animate={{ transform: on ? 'rotate(45deg)' : 'rotate(0deg)' }} transition={{ duration: 0.3, ease: EASE }} className="shrink-0 text-ink-soft">
                  <Plus size={20} />
                </motion.span>
              </button>
              </h3>
              {/* Ответы в разметке всегда, закрытые просто свёрнуты: поисковик видит все шесть, как в разметке FAQPage */}
              <motion.div
                id={id}
                inert={!on}
                initial={false}
                animate={on ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="overflow-hidden"
              >
                <p className="max-w-[760px] pb-7 text-[16px] leading-[1.65] text-ink-soft">
                  <T>{f.a}</T>
                </p>
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
