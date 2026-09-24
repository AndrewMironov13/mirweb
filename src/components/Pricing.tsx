import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { ArrowUpRight, Send } from 'lucide-react'
import { brand, pricing, tgLink } from '../data/content'
import { Reveal } from './Reveal'

/** Где висят плашки вокруг заголовка на широком экране: left/top в %, наклон в градусах */
const SPOTS = [
  { l: 2, t: 4, r: -9 },
  { l: 78, t: -2, r: 7 },
  { l: 12, t: 60, r: 8 },
  { l: 82, t: 50, r: -6 },
  { l: -6, t: 32, r: 4 },
  { l: 70, t: 84, r: -5 },
]

export function Pricing() {
  const box = useRef<HTMLDivElement>(null)
  const visible = useInView(box, { margin: '100px 0px' })
  const scrollTop = () => {
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(() => document.getElementById('gen-hero')?.focus({ preventScroll: true }), 700)
  }

  return (
    <section id="price" className="scroll-mt-16 bg-night pb-24 pt-8 text-white lg:pb-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-0">
        <div className="relative mx-auto max-w-[900px] py-10 text-center lg:py-16">
          <Reveal className="relative">
          {/* Плашки: на широком экране разбросаны вокруг, на телефоне — строкой */}
          <div ref={box} className={`pointer-events-none absolute inset-0 hidden lg:block ${visible ? '' : 'paused'}`} aria-hidden>
            {pricing.pills.map((p, i) => (
              <motion.span
                key={p.label}
                className="absolute"
                style={{ left: `${SPOTS[i].l}%`, top: `${SPOTS[i].t}%` }}
                initial={{ opacity: 0, transform: `scale(.4) rotate(${SPOTS[i].r * 3}deg)` }}
                whileInView={{ opacity: 1, transform: `scale(1) rotate(${SPOTS[i].r}deg)` }}
                viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                transition={{ delay: 0.15 + i * 0.09, type: 'spring', bounce: 0.45, visualDuration: 0.6 }}
              >
                <span
                  className="float-pill block rounded-full px-5 py-2.5 text-[16px] font-medium text-white shadow-[0_14px_30px_-10px_rgba(0,0,0,.6)]"
                  style={{ background: p.color, animationDelay: `${i * -1.3}s` }}
                >
                  {p.label}
                </span>
              </motion.span>
            ))}
          </div>

            <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#c4a5ff]">{pricing.eyebrow}</p>
            <h2 className="display relative mt-4 text-[44px] sm:text-[64px]">{pricing.title}</h2>
            <p className="display relative mt-6 text-[64px] text-[#f0a37a] sm:text-[96px]">{brand.priceLabel.replace(/ /g, ' ')}</p>
            <p className="relative mx-auto mt-5 max-w-[520px] text-[17px] leading-[1.6] text-white/65">{pricing.text}</p>
          </Reveal>

          <div className="mt-8 flex flex-wrap justify-center gap-2 lg:hidden">
            {pricing.pills.map((p) => (
              <span key={p.label} className="rounded-full px-4 py-2 text-[14px] font-medium text-white" style={{ background: p.color }}>
                {p.label}
              </span>
            ))}
          </div>

          <Reveal delay={0.1} className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={scrollTop} className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-white px-6 text-[15px] font-medium text-ink transition hover:bg-white/90 active:scale-[0.98]">
              Собрать свой черновик <ArrowUpRight size={17} />
            </button>
            <a
              href={tgLink('Здравствуйте! Хочу обсудить сайт. ')}
              target="_blank"
              rel="noopener"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] px-6 text-[15px] font-medium text-white ring-1 ring-white/25 transition hover:bg-white/10 active:scale-[0.98]"
            >
              <Send size={16} /> Обсудить в Telegram
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
