import { motion } from 'motion/react'
import { process } from '../data/content'
import { makeDraft } from '../data/niches'
import { Scaled } from './preview/Scaled'
import { DESKTOP, SitePreview } from './preview/SitePreview'
import { Reveal } from './Reveal'

const EASE = [0.22, 1, 0.36, 1] as const
const sample = makeDraft('Барбершоп «Борода»', null)

/** Переписка появляется по сообщению, как в настоящем чате */
function Chat() {
  return (
    <motion.div
      className="mx-auto flex max-w-[560px] flex-col gap-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -20% 0px' }}
      variants={{ show: { transition: { staggerChildren: 0.55 } } }}
    >
      {process.chat.map((m, i) => {
        const us = m.from === 'us'
        return (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, transform: 'translateY(14px) scale(.97)' },
              show: { opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: 0.5, ease: EASE } },
            }}
            className={`max-w-[86%] ${us ? 'self-start' : 'self-end'}`}
            style={{ transformOrigin: us ? 'left bottom' : 'right bottom' }}
          >
            <div className={`rounded-[18px] px-4 py-3 text-[15px] leading-[1.5] ${us ? 'rounded-bl-[6px] bg-night-2 text-white/85 ring-1 ring-white/[0.06]' : 'rounded-br-[6px] bg-[#e9e6e1] text-ink'}`}>
              {m.text}
              {m.preview && (
                <div className="mt-3 w-[260px] max-w-full overflow-hidden rounded-[10px] ring-1 ring-white/10">
                  <Scaled width={DESKTOP.w} height={DESKTOP.h}>
                    <SitePreview draft={sample} animated={false} />
                  </Scaled>
                </div>
              )}
            </div>
            <p className={`mt-1.5 px-1 text-[12px] text-white/35 ${us ? '' : 'text-right'}`}>{us ? 'МирВеб' : 'Клиент'}</p>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

export function Process() {
  return (
    <section id="process" className="mt-24 scroll-mt-16 bg-night py-24 text-white lg:mt-32 lg:py-32">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-0">
        <Reveal className="text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#f0a37a]">Как работаем</p>
          <h2 className="display mx-auto mt-4 max-w-[900px] text-[40px] sm:text-[56px]">Первый экран вы видите до оплаты</h2>
        </Reveal>

        <div className="mt-14">
          <Chat />
        </div>

        <Reveal className="mt-16">
          <div className="grid overflow-hidden rounded-[22px] ring-1 ring-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {process.steps.map((s, i) => (
              <div
                key={s.title}
                className={`p-7 ${i > 0 ? 'border-t border-white/10 sm:border-t-0' : ''} ${i % 2 === 1 ? 'sm:border-l sm:border-white/10' : ''} ${i >= 2 ? 'sm:border-t sm:border-white/10 lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l lg:border-white/10' : ''}`}
              >
                <p className="text-[13px] text-white/45">{s.day}</p>
                <p className="mt-2 text-[17px] font-medium">{s.title}</p>
                <p className="mt-2 text-[15px] leading-[1.55] text-white/60">{s.text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
