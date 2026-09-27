import { ArrowUp } from 'lucide-react'
import { LeadForm } from './LeadForm'
import { MaxBadge, TgIcon, maxHref, tgHref } from './Messengers'
import { Reveal } from './Reveal'

/** Финал без второго генератора: контакт, мессенджеры и ссылка наверх к черновику */
export function FinalCta() {
  const toGenerator = () => {
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(() => document.getElementById('gen-hero')?.focus({ preventScroll: true }), 700)
  }

  return (
    <section className="px-3 pt-24 lg:pt-32">
      <div className="mx-auto max-w-[1416px] rounded-[28px] bg-gradient-to-b from-white to-cloud px-4 pb-20 pt-16 sm:px-6 lg:pb-28 lg:pt-24">
        <Reveal className="text-center">
          <h2 className="display mx-auto max-w-[820px] text-[40px] text-ink sm:text-[64px]">
            Обсудим <span className="accent-word">ваш сайт</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] text-[17px] leading-[1.6] text-ink-soft">
            Оставьте телефон или ник в Telegram. Напишем, зададим пару вопросов и договоримся о созвоне
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mx-auto mt-10 max-w-[440px]">
          <LeadForm source="Форма внизу страницы" />
          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[13px] text-muted">или напишите сами</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={tgHref()} target="_blank" rel="noopener" className="btn-dark h-12 text-[15px]">
              <TgIcon /> Telegram
            </a>
            <a href={maxHref} target="_blank" rel="noopener" className="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] bg-white text-[15px] font-medium text-ink ring-1 ring-line transition hover:bg-cloud-2 active:scale-[0.97]">
              <MaxBadge /> Max
            </a>
          </div>
          <button type="button" onClick={toGenerator} className="mx-auto mt-8 flex items-center gap-1.5 text-[15px] text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-ink">
            Или соберите черновик своего сайта наверху <ArrowUp size={15} />
          </button>
        </Reveal>
      </div>
    </section>
  )
}
