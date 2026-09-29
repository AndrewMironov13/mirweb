import { ArrowRight, Dices } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { SPHERES } from '../../data/niches'
import { smooth } from '../../lib/goto'
import { useMedia } from '../../lib/useMedia'
import { useGen, type Status } from './store'

export const statusText = (s: Status, noun: string, took: number) =>
  s === 'style'
    ? `Подбираю стиль: ${noun}`
    : s === 'headline'
      ? 'Пишу заголовок и кнопки'
      : s === 'mobile'
        ? 'Собираю мобильную версию'
        : s === 'done'
          ? `Готово за ${String(took).replace('.', ',')} сек`
          : ''

/**
 * Поле генератора: одна строка ввода и сферы в одну прокручиваемую ленту.
 * Так первый экран ниже и сцена с превью поднимается в него. Ход сборки показывают сцена и строка под полем
 */
export function GeneratorBox({ id, toStage }: { id?: string; toStage?: boolean }) {
  const g = useGen()
  const sm = useMedia('(min-width: 640px)')
  /**
   * После сборки по действию посетителя показываем сцену целиком: низ сцены к низу экрана,
   * а если она выше экрана — верх под шапку. Уже видна целиком — страницу не двигаем
   */
  const box = useRef<HTMLDivElement>(null)
  const reveal = () => {
    window.setTimeout(() => {
      // Телефон: сцена выше экрана, поэтому держим под шапкой само поле — ввод, сферы и начало черновика видны вместе
      if (!toStage && window.innerWidth < 1024) {
        const b = box.current?.getBoundingClientRect()
        if (b && (b.top < 64 || b.top > 140)) window.scrollTo({ top: window.scrollY + b.top - 76, behavior: smooth() })
        return
      }
      const scene = document.getElementById('stage')?.firstElementChild
      if (!scene) return
      const r = scene.getBoundingClientRect()
      const vh = window.innerHeight
      const TOP = 84
      if (!toStage && r.top >= TOP && r.bottom <= vh) return
      const dy = Math.min(r.bottom - vh + 16, r.top - TOP)
      window.scrollTo({ top: window.scrollY + dy, behavior: smooth() })
    }, 60)
  }
  const field = useRef<HTMLTextAreaElement & HTMLInputElement>(null)
  /** Фокус был в поле в момент нажатия: кнопка или чип могли его уже забрать, а клавиатура ещё уезжает */
  const typing = useRef(false)

  /**
   * Сенсорный экран: убираем клавиатуру и двигаем страницу, когда она уехала.
   * Иначе место считается по экрану с клавиатурой, и сцена остаётся под ней
   */
  const revealAfterKeyboard = () => {
    const was = typing.current || document.activeElement === field.current
    typing.current = false
    if (!was || !window.matchMedia('(pointer: coarse)').matches) return reveal()
    field.current?.blur()
    const vv = window.visualViewport
    let fired = false
    const go = () => {
      if (fired) return
      fired = true
      vv?.removeEventListener('resize', go)
      window.clearTimeout(t)
      reveal()
    }
    vv?.addEventListener('resize', go)
    const t = window.setTimeout(go, 450)
  }

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      g.generate()
      revealAfterKeyboard()
    }
  }
  const onFocus = () => {
    if (g.demo) {
      g.stopDemo()
      g.setText('')
    }
  }

  /** cls задаёт и display: grid или hidden, чтобы не спорить с базовыми классами */
  const dice = (cls: string) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        g.random()
        revealAfterKeyboard()
      }}
      className={`h-10 w-10 shrink-0 place-items-center rounded-[11px] text-ink-soft transition hover:bg-white hover:text-ink active:scale-95 ${cls}`}
      title="Случайный пример"
      aria-label="Показать случайный пример"
    >
      <Dices size={18} />
    </button>
  )
  const show = (cls = '') => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        g.generate()
        revealAfterKeyboard()
      }}
      className={`btn-dark shrink-0 px-4 text-[14px] ${cls}`}
    >
      <span className="hidden sm:inline">Показать мой сайт</span>
      <span className="sm:hidden">Показать</span>
      {/* На 320 стрелка съедает место подсказки в поле */}
      <ArrowRight size={15} className="hidden min-[360px]:block" />
    </button>
  )

  return (
      <div ref={box} className="mx-auto w-full max-w-[760px]">
        <div
          className="rounded-[20px] bg-cloud p-1.5 transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_rgba(43,42,41,.14),0_12px_40px_-12px_rgba(43,42,41,.18)] sm:p-2"
          onClick={() => field.current?.focus()}
          onPointerDownCapture={() => {
            typing.current = document.activeElement === field.current
          }}
        >
          <label htmlFor={id} className="sr-only">
            Как называется ваш бизнес и чем занимаетесь
          </label>
          <div className="flex items-center gap-1">
            <input
              id={id}
              ref={field}
              type="text"
              enterKeyHint="go"
              autoComplete="off"
              value={g.text}
              onFocus={onFocus}
              onChange={(e) => g.setText(e.target.value)}
              onKeyDown={onKey}
              placeholder={sm ? 'Название и сфера, например: детейлинг «Глянец»' : 'Название и сфера'}
              className="h-11 min-w-0 flex-1 truncate bg-transparent px-3 text-[16px] text-ink outline-none placeholder:text-muted sm:px-3.5"
            />
            {dice('hidden sm:grid')}
            {show('h-11')}
          </div>
          <Spheres onPick={revealAfterKeyboard} lead={dice('grid sm:hidden')} />
        </div>
      </div>
  )
}

function Chip({ id, label, onPick }: { id: (typeof SPHERES)[number]['id']; label: string; onPick: () => void }) {
  const g = useGen()
  const on = g.shownSphere === id
  return (
    <button
      type="button"
      data-sphere={id}
      onClick={(e) => {
        e.stopPropagation()
        g.pickSphere(id)
        onPick()
      }}
      aria-pressed={on}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2.5 text-[13px] font-medium transition-[background-color,color,transform] duration-300 active:scale-95 ${on ? 'bg-ink text-white' : 'bg-white/60 text-ink-soft hover:bg-white hover:text-ink'}`}
    >
      {label}
    </button>
  )
}

/**
 * Сферы одной лентой. Не влезают (телефон) — лента листается пальцем, край гаснет,
 * а подсвеченная автодемо сфера сама выезжает в видимую часть ленты (страница при этом не двигается)
 */
function Spheres({ onPick, lead }: { onPick: () => void; lead?: ReactNode }) {
  const g = useGen()
  const row = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ l: false, r: false })

  const measure = () => {
    const el = row.current
    if (!el) return
    const l = el.scrollLeft > 2
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
    setEdge((p) => (p.l === l && p.r === r ? p : { l, r }))
  }

  useEffect(() => {
    const el = row.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    // Ширина кнопок меняется, когда догружается шрифт: пересчитываем край ленты
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = row.current
    if (!el || !g.shownSphere || el.scrollWidth <= el.clientWidth + 2) return
    const b = el.querySelector<HTMLElement>(`[data-sphere="${g.shownSphere}"]`)
    if (!b) return
    const from = b.offsetLeft
    const to = from + b.offsetWidth
    if (from < el.scrollLeft + 8 || to > el.scrollLeft + el.clientWidth - 24) {
      el.scrollTo({ left: Math.max(0, from - (el.clientWidth - b.offsetWidth) / 2), behavior: smooth() })
    }
  }, [g.shownSphere])

  const mask =
    edge.l || edge.r
      ? `linear-gradient(90deg, ${edge.l ? 'transparent 0, #000 24px' : '#000 0'}, ${edge.r ? '#000 calc(100% - 36px), transparent 100%' : '#000 100%'})`
      : undefined

  return (
    <div className="mt-0.5 flex items-center">
      {lead}
      <div
        ref={row}
        onScroll={measure}
        role="group"
        aria-label="Сфера бизнеса"
        className="relative flex min-w-0 flex-1 gap-1 overflow-x-auto sm:justify-between overscroll-x-contain px-1 [scrollbar-width:none] sm:px-1.5 [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {SPHERES.map((s) => (
          <Chip key={s.id} id={s.id} label={s.label} onPick={onPick} />
        ))}
      </div>
    </div>
  )
}
