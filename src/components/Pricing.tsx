import { ArrowUpRight, Send } from 'lucide-react'
import { brand, included, pricing, tgLink } from '../data/content'
import { Reveal } from './Reveal'

export function Pricing() {
  const scrollTop = () => {
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(() => document.getElementById('gen-hero')?.focus({ preventScroll: true }), 700)
  }

  return (
    <section id="price" className="scroll-mt-16 bg-night pb-24 pt-8 text-white lg:pb-28">
      <div className="mx-auto max-w-[1248px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-[900px] py-10 text-center lg:py-16">
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#c4a5ff]">{pricing.eyebrow}</p>
          <h2 className="display mt-4 text-[44px] sm:text-[64px]">{pricing.title}</h2>
          <p className="display mt-6 text-[54px] text-[#f0a37a] min-[400px]:text-[64px] sm:text-[96px]">{brand.priceLabel.replace(/ /g, ' ')}</p>
          <p className="mx-auto mt-5 max-w-[520px] text-[17px] leading-[1.6] text-white/65">{pricing.text}</p>
        </Reveal>

        {/* Что входит. Линии сетки — просвет между ячейками на светлой подложке */}
        <Reveal delay={0.05} className="grid gap-px overflow-hidden rounded-[22px] bg-white/10 ring-1 ring-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {included.map((it) => (
            <div key={it.title} className="bg-night p-7">
              <h3 className="text-[17px] font-medium">{it.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-white/60">{it.text}</p>
            </div>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
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
    </section>
  )
}
