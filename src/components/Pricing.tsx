import { ArrowUp, Send } from 'lucide-react'
import { brand, included, pricing, tgLink } from '../data/content'
import { goToGenerator } from '../lib/goto'
import { T } from '../lib/typo'
import { Reveal } from './Reveal'

export function Pricing() {
  return (
    <section id="price" data-dark className="on-dark scroll-mt-16 bg-night pb-24 pt-8 text-white lg:pb-28">
      <div className="mx-auto max-w-[1248px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-[900px] py-10 text-center lg:py-16">
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#f0a37a]">{pricing.eyebrow}</p>
          <h2 className="display mt-4 text-[40px] sm:text-[56px]">
            <T>{pricing.title}</T>
          </h2>
          <p className="display mt-6 whitespace-nowrap text-[54px] text-[#f0a37a] min-[400px]:text-[64px] sm:text-[96px]">{brand.priceLabel}</p>
          <p className="mx-auto mt-5 max-w-[520px] text-[17px] leading-[1.6] text-white/65">
            <T>{pricing.text}</T>
          </p>
        </Reveal>

        {/* Что входит. Линии сетки — просвет между ячейками на светлой подложке */}
        <Reveal delay={0.05} className="grid gap-px overflow-hidden rounded-[22px] bg-white/10 ring-1 ring-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {included.map((it) => (
            <div key={it.title} className="bg-night p-7">
              <h3 className="text-[17px] font-medium">
                <T>{it.title}</T>
              </h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-white/60">
                <T>{it.text}</T>
              </p>
            </div>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={goToGenerator}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-white px-6 text-[15px] font-medium text-ink transition-[box-shadow,transform] duration-200 hover:shadow-[0_10px_30px_-10px_rgba(255,255,255,.45)] active:scale-[0.98]"
          >
            Собрать свой черновик <ArrowUp size={17} />
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
