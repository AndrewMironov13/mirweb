import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, CircleCheck, Dices, Loader2 } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import { SPHERES } from '../../data/niches'
import { useGen, type Status } from './store'

const statusText = (s: Status, noun: string, took: number) =>
  s === 'style'
    ? `Подбираю стиль: ${noun}`
    : s === 'headline'
      ? 'Пишу заголовок и кнопки'
      : s === 'mobile'
        ? 'Собираю мобильную версию'
        : s === 'done'
          ? `Готово за ${String(took).replace('.', ',')} сек`
          : ''

export function GeneratorBox({ id, compact, toStage }: { id?: string; compact?: boolean; toStage?: boolean }) {
  const g = useGen()
  /** После сборки по действию посетителя показываем сцену, если она ниже экрана (телефон, ноутбук 1280×720, поле внизу страницы) */
  const reveal = () => {
    window.setTimeout(() => {
      const el = document.getElementById('stage')
      if (!el) return
      const r = el.getBoundingClientRect()
      if (toStage || r.top > window.innerHeight * 0.55 || r.bottom < 120) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }
  const ta = useRef<HTMLTextAreaElement>(null)
  const building = g.status === 'style' || g.status === 'headline' || g.status === 'mobile'

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      g.generate()
      reveal()
    }
  }

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div
        className="rounded-[20px] bg-cloud p-2 transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_rgba(43,42,41,.14),0_12px_40px_-12px_rgba(43,42,41,.18)]"
        onClick={() => ta.current?.focus()}
      >
        <label htmlFor={id} className="sr-only">
          Как называется ваш бизнес и чем занимаетесь
        </label>
        <textarea
          id={id}
          ref={ta}
          rows={compact ? 1 : 2}
          value={g.text}
          onFocus={() => {
            if (g.demo) {
              g.stopDemo()
              g.setText('')
            }
          }}
          onChange={(e) => g.setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Название и чем занимаетесь. Например: барбершоп «Борода»"
          className="block w-full resize-none bg-transparent px-3.5 pt-3 text-[16px] leading-[1.5] text-ink outline-none placeholder:text-muted"
        />

        {!compact && (
          <div className="mt-2 flex flex-wrap gap-1.5 px-2.5" role="group" aria-label="Сфера бизнеса">
            {SPHERES.map((s) => {
              const on = g.shownSphere === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    g.pickSphere(s.id)
                    reveal()
                  }}
                  aria-pressed={on}
                  className={`rounded-full px-3 py-2 text-[13px] font-medium transition-[background-color,color,transform] duration-300 active:scale-95 ${on ? 'bg-ink text-white' : 'text-ink-soft hover:bg-white hover:text-ink'}`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pl-2.5">
          {/* На узком телефоне статус уходит отдельной строкой под кнопки, иначе от него остаётся «Гот…» */}
          <div className="relative order-last flex h-8 w-full min-w-0 items-center overflow-hidden text-[13px] sm:order-none sm:h-10 sm:w-auto sm:flex-1">
            <AnimatePresence initial={false}>
              {building || g.status === 'done' ? (
                <motion.span
                  key={g.status}
                  initial={{ opacity: 0, transform: 'translateY(10px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  exit={{ opacity: 0, transform: 'translateY(-10px)' }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute inset-y-0 left-0 right-0 flex min-w-0 items-center gap-1.5 ${g.status === 'done' ? 'text-go' : 'text-ink-soft'}`}
                  aria-live="polite"
                >
                  {g.status === 'done' ? <CircleCheck size={15} className="shrink-0" /> : <Loader2 size={15} className="shrink-0 animate-spin" />}
                  <span className="truncate">{statusText(g.status, g.draft.niche.noun, g.took)}</span>
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-y-0 left-0 right-0 flex items-center truncate text-muted">
                  {g.text.trim() && !g.demo ? 'Enter или «Показать» — и черновик готов' : ''}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              g.random()
              reveal()
            }}
            className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-[11px] text-ink-soft sm:ml-0 transition hover:bg-white hover:text-ink active:scale-95"
            title="Случайный пример"
            aria-label="Показать случайный пример"
          >
            <Dices size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              g.generate()
              reveal()
            }}
            className="btn-dark h-10 shrink-0 px-4 text-[14px]"
          >
            <span className="hidden sm:inline">Показать мой сайт</span>
            <span className="sm:hidden">Показать</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
