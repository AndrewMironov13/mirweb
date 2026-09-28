import { ArrowUp } from 'lucide-react'
import { goToGenerator } from '../lib/goto'
import { T } from '../lib/typo'
import { LeadForm } from './LeadForm'
import { TgIcon, maxHref, tgHref } from './Messengers'
import { Reveal } from './Reveal'

/** Финал без второго генератора: контакт, мессенджеры и ссылка наверх к черновику */
export function FinalCta() {
  return (
    <section className="px-3 pt-24 lg:pt-32">
      <div className="mx-auto max-w-[1416px] rounded-[28px] bg-cloud px-4 pb-20 pt-16 sm:px-6 lg:pb-28 lg:pt-24">
        <Reveal className="text-center">
          <h2 className="display mx-auto max-w-[820px] text-[40px] text-ink sm:text-[64px]">
            Обсудим <span className="accent-word">ваш сайт</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] text-balance text-[17px] leading-[1.6] text-ink-soft">
            <T>Коротко расспросим о бизнесе и назовём точную цену и срок</T>
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
            <a
              href={maxHref}
              target="_blank"
              rel="noopener"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] bg-white text-[15px] font-medium text-ink ring-1 ring-line transition-[box-shadow,transform] duration-200 hover:shadow-[0_10px_24px_-12px_rgba(28,27,26,.35)] active:scale-[0.97]"
            >
              Max
            </a>
          </div>
          {/* Блоком, а не flex: строка переносится целиком, «наверху» и стрелка не отрываются друг от друга */}
          <button
            type="button"
            onClick={goToGenerator}
            className="mx-auto mt-5 block text-balance px-2 py-3 text-center text-[15px] text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            Или соберите черновик своего сайта{' '}
            <span className="whitespace-nowrap">
              наверху <ArrowUp size={15} className="inline-block align-[-2px]" />
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  )
}
