import { motion } from 'motion/react'
import { ArrowUp, Send } from 'lucide-react'
import type { ComponentType } from 'react'
import { brand, included, pricing, tgLink } from '../data/content'
import { goToGenerator } from '../lib/goto'
import { SNAPSHOT } from '../lib/snapshot'
import { T } from '../lib/typo'
import { CopyMarker, DesignFan, LeadsStack, MotionDemo, PhoneMock, SeoSnippet } from './IncludedVisuals'
import { Reveal } from './Reveal'
import { useLive } from './useLive'

type Id = (typeof included)[number]['id']

/**
 * Плитка «Что входит», как у durable: ячейки разного размера, в каждой — своя живая картинка.
 * На телефоне сначала то, что цепляет: дизайн и заявки. На компьютере (lg:order) — дизайн широкий, телефон во всю
 * высоту двух рядов, заявки широкие снизу; у широкой ячейки заявок текст слева, картинка справа — без пустой половины
 */
const CELLS: { id: Id; Visual: ComponentType; className: string; h: string; row?: boolean }[] = [
  { id: 'design', Visual: DesignFan, className: 'md:col-span-2 lg:order-1', h: 'h-[250px] sm:h-[300px] lg:h-auto' },
  { id: 'leads', Visual: LeadsStack, className: 'md:col-span-2 lg:order-5', h: 'h-[230px] lg:h-auto', row: true },
  { id: 'mobile', Visual: PhoneMock, className: 'lg:order-2 lg:row-span-2', h: 'h-[280px] lg:h-auto' },
  { id: 'seo', Visual: SeoSnippet, className: 'lg:order-3', h: 'h-[240px] lg:h-auto' },
  { id: 'copy', Visual: CopyMarker, className: 'lg:order-4', h: 'h-[210px] lg:h-auto' },
  { id: 'motion', Visual: MotionDemo, className: 'lg:order-6', h: 'h-[220px] lg:h-auto' },
]

/** Цена «0 ₽» обводится от руки, как пометка маркером. Рисуем маской слева направо, один раз */
function Circled({ children }: { children: string }) {
  const { ref, seen, still } = useLive<HTMLSpanElement>()
  return (
    <span ref={ref} className="relative inline-block">
      {children}
      <motion.svg
        viewBox="0 0 200 110"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -inset-x-[34%] -inset-y-[18%] h-[136%] w-[168%] text-[#e8772f]"
        aria-hidden
        {...(still
          ? { initial: { opacity: 0 }, animate: seen ? { opacity: 1 } : undefined }
          : { initial: { clipPath: 'inset(0 100% 0 0)' }, animate: seen ? { clipPath: 'inset(0 0% 0 0)' } : undefined })}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.45, 0, 0.2, 1] }}
      >
        <path
          d="M156 14C118 2 52 6 22 32 2 50 10 86 64 98c52 11 118 4 128-34C200 30 150 10 104 10 82 10 64 13 50 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </motion.svg>
    </span>
  )
}

/** Сравнение, как у durable «Typical spend / Launch plan»: только наши цифры, без чужих цен */
function PriceCompare() {
  const { free, full } = pricing
  const from = brand.priceLabel.replace(/^от\s*/, '')
  return (
    <Reveal delay={0.05} className="mx-auto mt-12 grid max-w-[720px] items-start gap-10 text-center sm:mt-14 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
      <div>
        <p className="text-[15px] text-ink-soft">{free.label}</p>
        <p className="display mt-3 text-[72px] leading-none sm:text-[88px]">
          <Circled>{free.value}</Circled>
        </p>
        <p className="mt-4 text-[15px] text-muted">
          <T>{free.note}</T>
        </p>
      </div>
      <span className="mx-auto hidden h-px w-12 self-center bg-ink/20 sm:block" aria-hidden />
      <div>
        <p className="text-[15px] text-ink-soft">{full.label}</p>
        <p className="display mt-3 whitespace-nowrap text-[64px] leading-none sm:text-[88px]">
          {/* Пробел настоящий: без него скринридер и снимок пререндера читают «от30 000 ₽» */}
          <span className="text-[0.42em] text-ink-soft">от</span> {from}
        </p>
        <p className="mt-4 text-[15px] text-muted">
          <T>{full.note}</T>
        </p>
      </div>
    </Reveal>
  )
}

export function Pricing() {
  return (
    // Светлый лист со скруглённым верхом наезжает на тёмный «Как работаем»: переход виден сразу, как смена страницы
    <section id="price" className="relative z-10 -mt-10 scroll-mt-16 rounded-t-[28px] bg-paper pb-4 pt-20 sm:rounded-t-[40px] lg:-mt-12 lg:pt-28">
      <div className="mx-auto max-w-[1248px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-[900px] text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-rust">{pricing.eyebrow}</p>
          <h2 className="display mt-4 text-[40px] sm:text-[56px]">
            <T>{pricing.title}</T>
          </h2>
        </Reveal>

        <PriceCompare />

        <Reveal delay={0.05} className="mx-auto mt-12 max-w-[520px] text-center">
          <p className="text-[16px] leading-[1.6] text-ink-soft sm:text-[17px]">
            <T>{pricing.text}</T>
          </p>
        </Reveal>

        <div className="mt-10 grid gap-3 md:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:grid-rows-[400px_400px_380px] lg:gap-4">
          {CELLS.map(({ id, Visual, className, h, row }, i) => {
            const it = included.find((x) => x.id === id)!
            return (
              <Reveal key={id} delay={(i % 3) * 0.05} className={`h-full ${className}`}>
                <article className={`flex h-full flex-col overflow-hidden rounded-[22px] bg-cloud ${row ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Картинка — иллюстрация, её содержимое скринридеру не читаем; в снимок пререндера не идёт */}
                  <div aria-hidden className={`relative shrink-0 overflow-hidden lg:min-h-0 lg:flex-1 ${h}`}>
                    {!SNAPSHOT && <Visual />}
                  </div>
                  <div className={`px-6 pb-6 pt-3 sm:px-7 sm:pb-7 ${row ? 'lg:w-[40%] lg:shrink-0 lg:self-end lg:pb-9 lg:pl-9' : ''}`}>
                    <h3 className="text-[17px] font-medium">
                      <T>{it.title}</T>
                    </h3>
                    <p className="mt-1.5 max-w-[460px] text-[15px] leading-[1.55] text-ink-soft">
                      <T>{it.text}</T>
                    </p>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={0.1} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={goToGenerator} className="btn-dark h-12 px-6 text-[15px]">
            Собрать свой черновик <ArrowUp size={17} />
          </button>
          <a
            href={tgLink('Здравствуйте! Хочу обсудить сайт. ')}
            target="_blank"
            rel="noopener"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] px-6 text-[15px] font-medium text-ink ring-1 ring-ink/20 transition hover:bg-cloud active:scale-[0.98]"
          >
            <Send size={16} /> Обсудить в Telegram
          </a>
        </Reveal>
      </div>
    </section>
  )
}
