import { Send } from 'lucide-react'
import { about, channels, tgLink } from '../data/content'
import { Reveal } from './Reveal'

export function About() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-24 sm:px-6 lg:px-0 lg:pt-32">
      <Reveal>
        <div className="grid items-center gap-10 rounded-[24px] bg-cloud p-6 sm:p-10 lg:grid-cols-[auto_1fr] lg:gap-16 lg:p-14">
          <div className="relative mx-auto h-[200px] w-[200px] lg:h-[240px] lg:w-[240px]">
            {/* Сюда встанет кружок-видео: 15 секунд, «привет, я Андрей». Пока — знак студии */}
            <img
              src={`${import.meta.env.BASE_URL}img/logo-256.png`}
              alt="МирВеб"
              className="h-full w-full rounded-full object-cover shadow-[0_24px_60px_-20px_rgba(80,70,220,.55)]"
            />
          </div>
          <div>
            <p className="display text-[28px] leading-[1.18] text-ink sm:text-[38px]">«{about.quote}»</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
              <div>
                <p className="text-[16px] font-semibold text-ink">{about.name}</p>
                <p className="text-[14px] text-ink-soft">{about.role}</p>
              </div>
              <div className="flex gap-2">
                <a href={tgLink('Здравствуйте! ')} target="_blank" rel="noopener" className="btn-dark h-11 px-4 text-[14px]">
                  <Send size={15} /> Telegram
                </a>
                <a href={channels.max} target="_blank" rel="noopener" className="inline-flex h-11 items-center rounded-[11px] bg-white px-4 text-[14px] font-medium text-ink ring-1 ring-line transition hover:ring-ink/25 active:scale-[0.97]">
                  Max
                </a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
