import { motion, useReducedMotion } from 'motion/react'
import { process } from '../data/content'
import { draftPoster } from '../lib/snapshot'
import { T } from '../lib/typo'
import { CallVisual, DraftVisual, LaunchVisual, SiteVisual } from './ProcessVisuals'
import { Reveal } from './Reveal'

const EASE = [0.22, 1, 0.36, 1] as const

/** Переписка появляется по сообщению, как в настоящем чате. Просили меньше движения — только проявление */
function Chat() {
  const still = useReducedMotion()
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
              hidden: still ? { opacity: 0 } : { opacity: 0, transform: 'translateY(14px) scale(.97)' },
              show: still ? { opacity: 1, transition: { duration: 0.5 } } : { opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: 0.5, ease: EASE } },
            }}
            className={`max-w-[86%] ${us ? 'self-start' : 'self-end'}`}
            style={{ transformOrigin: us ? 'left bottom' : 'right bottom' }}
          >
            {/* Пузырь — div, а не p: правило text-wrap: pretty из index.css на него не действует, ставим явно */}
            <div className={`text-pretty rounded-[18px] px-4 py-3 text-[15px] leading-[1.5] ${us ? 'rounded-bl-[6px] bg-night-2 text-white/85 ring-1 ring-white/[0.06]' : 'rounded-br-[6px] bg-[#e9e6e1] text-ink'}`}>
              <T>{m.text}</T>
              {m.preview && (
                <div className="mt-3 w-[260px] max-w-full overflow-hidden rounded-[10px] ring-1 ring-white/10">
                  <img src={draftPoster()} alt="Черновик первого экрана барбершопа «Борода»" loading="lazy" width={1280} height={760} className="block h-auto w-full" />
                </div>
              )}
            </div>
            <p className={`mt-1.5 flex items-center gap-1.5 px-1 text-[12px] text-white/55 ${us ? '' : 'justify-end'}`}>
              {us && <img src={`${import.meta.env.BASE_URL}img/andrey-avatar.webp`} alt="" loading="lazy" width={40} height={40} className="h-5 w-5 rounded-full object-cover" />}
              {us ? 'Андрей, МирВеб' : 'Клиент'}
            </p>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

const VISUALS = [CallVisual, DraftVisual, SiteVisual, LaunchVisual]

/** Карточка дня: сверху живая картинка, снизу день, что делаем и зачем — как ячейки плитки у durable */
function Step({ i }: { i: number }) {
  const s = process.steps[i]
  const Visual = VISUALS[i]
  return (
    <Reveal delay={0.06 * i} y={32} className="h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#34322f_0%,#2c2b29_100%)] ring-1 ring-white/[0.07]">
        <div className="relative h-[228px] overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,rgba(240,163,122,.16),transparent_70%)] lg:h-[236px]">
          <Visual />
        </div>
        <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
          <p className="text-[13px] font-medium text-[#f0a37a]">{s.day}</p>
          <h4 className="mt-1.5 text-[18px] font-medium leading-snug">
            <T>{s.title}</T>
          </h4>
          <p className="mt-1.5 text-[15px] leading-[1.55] text-white/65">
            <T>{s.text}</T>
          </p>
        </div>
      </article>
    </Reveal>
  )
}

export function Process() {
  return (
    // Тёмный лист со скруглённым верхом выезжает из белых «Наших работ»; снизу на него наезжает светлый лист «Цены»
    <section id="process" data-dark className="on-dark mt-20 scroll-mt-16 rounded-t-[28px] bg-night pb-28 pt-20 text-white sm:rounded-t-[40px] lg:mt-28 lg:pb-36 lg:pt-28">
      <div className="mx-auto max-w-[1248px] px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#f0a37a]">Как работаем</p>
          <h2 className="display mx-auto mt-4 max-w-[900px] text-[40px] sm:text-[56px]">Первый экран вы видите до оплаты</h2>
        </Reveal>

        <div className="mt-12 lg:mt-14">
          <Chat />
        </div>

        {/* Шаги отделены от переписки своим заголовком и линией: это уже не чат, а план на пять дней */}
        <Reveal className="mt-20 flex flex-col gap-4 border-t border-white/10 pt-12 lg:mt-24 lg:flex-row lg:items-end lg:justify-between lg:pt-16">
          <h3 className="display max-w-[560px] text-[36px] sm:text-[48px]">
            <T>{process.stepsTitle}</T>
          </h3>
          <p className="max-w-[400px] text-[16px] leading-[1.6] text-white/60 lg:pb-1.5">
            <T>{process.stepsLead}</T>
          </p>
        </Reveal>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:gap-4">
          {process.steps.map((s, i) => (
            <Step key={s.title} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
