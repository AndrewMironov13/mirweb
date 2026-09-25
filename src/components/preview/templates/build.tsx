import '@fontsource-variable/playfair-display'
import '@fontsource-variable/inter'
import { motion, type Transition } from 'motion/react'
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import type { Draft } from '../../../data/niches'
import type { Template } from '.'
import { BgVideo, SECOND_AT, nicheVideo, useAnimOn } from '../anim'

/**
 * Ремонт и стройка. Композиция rsd-agencements.com: светлая слоновая шапка, по центру
 * прописная антиква из услуг, одна тихая строка, две квадратные кнопки (латунь и контур).
 * WOW: лазерный уровень — луч расходится от центра, на нём риски и отметка ±0,000,
 * заголовок поднимается из-под линии, как дом над нулевой отметкой, луч сжимается в латунную черту.
 * Вторая секция: факты между волосяными линиями, блок «01 / НАШЕ / ДЕЛО» и прайс ниши на бежевом
 */

const SERIF = "'Playfair Display Variable', 'Playfair Display', Georgia, serif"
const SANS = "'Inter Variable', Inter, system-ui, sans-serif"

const INK = '#1A1A1A'
const BODY = '#2A2622'
const MUTED = '#8A847C'
const IDX = '#A39B90'
const GHOST = '#CFC6BA'
const BRASS = '#C9A87C'
const BRONZE = '#8B7355'
const BEIGE = '#F5EFE7'
const LINE_W = '#E6E0D8'
const LINE_B = '#DDD4C8'
const LASER = '#FFE2B0'
const DOT = '#D9BC8C'
const NAV_BG = 'rgba(236,232,226,.94)'

const OUT = [0.16, 1, 0.3, 1] as const
const INOUT = [0.65, 0, 0.35, 1] as const
const SOFT = [0.22, 1, 0.36, 1] as const
/** Подъём заголовка: медленный старт из-под линии, долгая посадка — видно, как «дом» растёт */
const RISE = [0.55, 0, 0.1, 1] as const
type Ease = readonly [number, number, number, number]

const D = { w: 1280, h: 760 }
const M = { w: 390, h: 800 }
/** Глубина прокрутки-демо родителя (ScrollDemo в ../anim): 92 % секции. Время прокрутки шапка берёт у самой анимации */
const depthOf = (h: number) => Math.round(h * 0.92)

/* ── мелочи ─────────────────────────────────────────────────────────── */

function useTr() {
  const on = useAnimOn()
  return (delay: number, duration: number, ease: Ease = OUT): Transition => (on ? { delay, duration, ease } : { duration: 0 })
}

/** Неразрывный пробел после коротких предлогов и союзов */
const nb = (s: string) => s.replace(/(^|[\s ])([а-яёА-ЯЁ]{1,2})\s/g, '$1$2 ').replace(/(^|[\s ])([а-яёА-ЯЁ]{1,2})\s/g, '$1$2 ')
const noDot = (s: string) => s.replace(/[.\s]+$/u, '')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
/** Точки из данных красим латунью */
const dots = (t: string) => t.split(/(\.)/).map((p, i) => (p === '.' ? <span key={i} style={{ color: DOT }}>.</span> : p))

/** Подпись под логотипом — род занятий из ниши; если он уже есть в имени, логотип стоит один */
function brand(d: Draft) {
  const name = d.quoted ? `«${d.name}»` : d.name
  const stem = d.niche.noun.toLowerCase().slice(0, 5)
  const tag = d.name.toLowerCase().includes(stem) ? '' : cap(d.niche.noun)
  return { name, tag }
}

/** «Свои бригады» → только подпись; «Гарантия — 5 лет» → подпись и пояснение */
function splitFact(f: string): [string, string] {
  const m = f.split(/\s[—–-]\s|:\s*/)
  return m.length > 1 ? [m[0].trim(), noDot(m.slice(1).join(' ').trim())] : [noDot(f), '']
}

/** Прайс второй секции: 4 позиции ниши с ценой «от …»; нет прайса — услуги первого экрана */
function priceList(d: Draft): [string, string][] {
  const l = d.niche.list?.filter(([n]) => n.trim()) ?? []
  return (l.length ? l : d.niche.services.map((s) => [noDot(s), ''] as [string, string])).slice(0, 4)
}

/** Два ровных ряда из трёх услуг: выбираем разбивку, где самая длинная строка короче */
function heroLines(s: string[]): string[] {
  const a = [`${s[0]} ${s[1]}`, s[2]]
  const b = [s[0], `${s[1]} ${s[2]}`]
  const m = (x: string[]) => Math.max(...x.map((t) => t.length))
  return m(a) <= m(b) ? a : b
}

/** Момент, когда кончик луча проходит долю пути v (луч идёт по кривой INOUT) */
function passAt(v: number) {
  const [x1, y1, x2, y2] = INOUT
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  let lo = 0, hi = 1
  for (let i = 0; i < 28; i++) {
    const s = (lo + hi) / 2
    if (((ay * s + by) * s + cy) * s < v) lo = s
    else hi = s
  }
  const s = (lo + hi) / 2
  return ((ax * s + bx) * s + cx) * s
}

/**
 * Подгонка кегля: меряем строки в скрытом образце на базовом кегле. Самая длинная должна влезть в maxW;
 * если задан grow — короткие наборы растут до ширины target, но не крупнее max. Перемеряем, когда догрузятся шрифты
 */
function useFit(base: number, min: number, maxW: number, key: string, grow?: { target: number; max: number }): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(base)
  const target = grow?.target ?? 0
  const max = grow?.max ?? base
  useLayoutEffect(() => {
    let alive = true
    const run = () => {
      const el = ref.current
      if (!el || !alive) return
      let w = 0
      el.querySelectorAll<HTMLElement>('[data-m]').forEach((s) => {
        w = Math.max(w, s.offsetWidth)
      })
      if (!w) return
      const half = (v: number) => Math.floor(v * 2) / 2
      const shrink = Math.min(base, half((base * maxW) / w)) // влезть в maxW, не крупнее базы
      const grow = target ? half((base * target) / w) : 0 // короткие строки дотянуть до target
      setSize(clamp(Math.max(shrink, grow), min, Math.max(base, max)))
    }
    run()
    const f = document.fonts
    if (f) {
      Promise.all([f.load(`700 40px 'Playfair Display Variable'`, 'АБВ'), f.load(`400 16px 'Inter Variable'`, 'АБВ')])
        .then(run)
        .catch(() => {})
      f.ready.then(run).catch(() => {})
      f.addEventListener?.('loadingdone', run)
    }
    return () => {
      alive = false
      f?.removeEventListener?.('loadingdone', run)
    }
  }, [base, min, maxW, key, target, max])
  return [ref, size]
}

function Measure({ mref, items, style }: { mref: RefObject<HTMLDivElement | null>; items: string[]; style: CSSProperties }) {
  return (
    <div ref={mref} aria-hidden style={{ ...style, position: 'absolute', left: 0, top: 0, visibility: 'hidden', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
      {items.map((t, i) => (
        <span key={i} data-m="" style={{ display: 'inline-block' }}>
          {t}
        </span>
      ))}
    </div>
  )
}

/* ── закреплённая шапка ─────────────────────────────────────────────── */

/** Шапка закреплена, только если макет крутит прокрутка-демо родителя */
function usePinned(ref: RefObject<HTMLDivElement | null>) {
  const on = useAnimOn()
  const [inside, setInside] = useState(false)
  useLayoutEffect(() => {
    setInside(!!ref.current?.parentElement?.closest('.scroll-demo'))
  }, [ref])
  return on && inside
}

/** Сдвиг по Y из значения transform ключевого кадра: translateY(-699px), translate(0px, -699px), matrix(…) или none */
function shiftY(v: unknown): number | null {
  if (v === 'none') return 0
  if (typeof v !== 'string') return null
  const t = v.trim()
  let m = t.match(/^translateY\((-?[\d.]+)px\)$/)
  if (m) return +m[1]
  m = t.match(/^translate(?:3d)?\(\s*0(?:px)?\s*,\s*(-?[\d.]+)px(?:\s*,\s*0(?:px)?)?\s*\)$/)
  if (m) return +m[1]
  m = t.match(/^matrix\(\s*1\s*,\s*0\s*,\s*0\s*,\s*1\s*,\s*0\s*,\s*(-?[\d.]+)\s*\)$/)
  if (m) return +m[1]
  return null
}

const movesY = (a: Animation) => {
  const fx = a.effect as KeyframeEffect | null
  return !!fx?.getKeyframes?.().some((k) => 'transform' in k)
}

/** Зеркало прокрутки: те же доли, кривые и тайминг, сдвиг с обратным знаком */
function mirrorOf(src: Animation, el: HTMLElement): Animation | null {
  const fx = src.effect as KeyframeEffect | null
  if (!fx) return null
  const frames: Keyframe[] = []
  for (const k of fx.getKeyframes()) {
    const y = shiftY(k.transform)
    if (y === null) return null
    frames.push({ offset: k.computedOffset, easing: k.easing, transform: `translateY(${-y}px)` })
  }
  const t = fx.getTiming()
  const m = el.animate(frames, {
    delay: t.delay,
    endDelay: t.endDelay,
    duration: t.duration,
    easing: t.easing,
    fill: t.fill,
    iterations: t.iterations,
    iterationStart: t.iterationStart,
    direction: t.direction,
  })
  m.playbackRate = src.playbackRate
  if (src.startTime !== null) m.startTime = src.startTime
  else if (src.currentTime !== null) m.currentTime = src.currentTime
  return m
}

/**
 * Шапка ведёт себя как position:fixed. Прокрутку-демо делает WAAPI-анимация transform у ScrollDemo:
 * берём её саму и ставим на шапку зеркальную с тем же стартом. Обе идут на компоновщике,
 * поэтому шапка не отстаёт ни на кадр и сама подхватывает любые будущие тайминги прокрутки.
 * Нет такой анимации (JS-движок) — каждый кадр ставим шапку по фактическому сдвигу страницы
 */
function Pin({ pinned, children }: { pinned: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    const demo = el?.closest<HTMLElement>('.scroll-demo')
    const vp = demo?.parentElement
    if (!pinned || !el || !demo || !vp) return
    let raf = 0
    let src: Animation | null = null
    let mirror: Animation | null = null
    const until = performance.now() + 20000
    const follow = () => {
      const r = demo.getBoundingClientRect()
      const k = r.height / (demo.offsetHeight || 1) || 1
      el.style.transform = `translateY(${(vp.getBoundingClientRect().top - r.top) / k}px)`
    }
    const tick = () => {
      const a = demo.getAnimations().find(movesY) ?? null
      if (a && a !== src) {
        mirror?.cancel()
        src = a
        mirror = mirrorOf(a, el)
        if (mirror) el.style.transform = ''
      }
      if (src && mirror) {
        // пауза и перемотка у прокрутки (стоп-кадры проверки) — повторяем, иначе держим общий старт
        if (src.playState === 'paused') {
          if (mirror.playState !== 'paused') mirror.pause()
          if (mirror.currentTime !== src.currentTime) mirror.currentTime = src.currentTime
        } else if (src.startTime !== null && mirror.startTime !== src.startTime) {
          mirror.startTime = src.startTime
        }
      } else {
        follow()
      }
      // прокрутка прошла — шапка стоит на нуле (fill), следить больше не за чем
      const done = !!src && !!mirror && src.playState === 'finished'
      if (!done && performance.now() < until) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      cancelAnimationFrame(raf)
      mirror?.cancel()
      el.style.transform = ''
    }
  }, [pinned])
  return (
    <div ref={ref} style={{ position: 'absolute', left: 0, top: 0, right: 0, zIndex: 30 }}>
      {children}
    </div>
  )
}

/* ── шапка ──────────────────────────────────────────────────────────── */

const navLinks = ['Работы', 'Услуги', 'Цены', 'О нас', 'Контакты']

function NavD({ d, enter }: { d: Draft; enter: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const { name, tag } = brand(d)
  const logo: CSSProperties = { fontFamily: SERIF, fontWeight: 700, letterSpacing: '-.01em' }
  const [mref, size] = useFit(24, 16, 300, name)
  return (
    <motion.nav
      initial={on && enter ? { opacity: 0, transform: 'translateY(-16px)' } : false}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={tr(0.15, 0.6)}
      style={{
        position: 'relative',
        height: 88,
        background: NAV_BG,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(26,26,26,.06)',
        fontFamily: SANS,
      }}
    >
      <Measure mref={mref} items={[name]} style={{ ...logo, fontSize: 24 }} />
      <div style={{ position: 'absolute', left: 48, top: 0, bottom: 0, width: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ ...logo, fontSize: size, lineHeight: 1.05, color: INK, whiteSpace: 'nowrap' }}>{name}</div>
        {tag && <div style={{ marginTop: 5, fontSize: 9.5, fontWeight: 500, letterSpacing: '.04em', color: '#6B645C', whiteSpace: 'nowrap' }}>{tag}</div>}
      </div>
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 36 }}>
        {navLinks.map((l) => (
          <span key={l} style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,.7)', whiteSpace: 'nowrap' }}>
            {l}
          </span>
        ))}
      </div>
      <div
        className="bld-navbtn"
        style={{
          position: 'absolute',
          right: 48,
          top: 22,
          height: 44,
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          border: `1px solid ${INK}`,
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: '.15em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {d.niche.cta}
      </div>
    </motion.nav>
  )
}

function NavM({ d, enter }: { d: Draft; enter: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const { name, tag } = brand(d)
  const logo: CSSProperties = { fontFamily: SERIF, fontWeight: 700, letterSpacing: '-.01em' }
  const [mref, size] = useFit(19, 14, 280, name)
  return (
    <motion.nav
      initial={on && enter ? { opacity: 0, transform: 'translateY(-16px)' } : false}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={tr(0.15, 0.6)}
      style={{ position: 'relative', height: 64, background: NAV_BG, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(26,26,26,.06)', fontFamily: SANS }}
    >
      <Measure mref={mref} items={[name]} style={{ ...logo, fontSize: 19 }} />
      <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 290, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ ...logo, fontSize: size, lineHeight: 1.05, color: INK, whiteSpace: 'nowrap' }}>{name}</div>
        {tag && <div style={{ marginTop: 4, fontSize: 8.5, fontWeight: 500, letterSpacing: '.04em', color: '#6B645C', whiteSpace: 'nowrap' }}>{tag}</div>}
      </div>
      <div style={{ position: 'absolute', right: 20, top: 25, width: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ height: 1.5, background: INK }} />
        <span style={{ height: 1.5, background: INK }} />
      </div>
    </motion.nav>
  )
}

/* ── лазерный уровень ───────────────────────────────────────────────── */

const T0 = 0.4 // луч пошёл
const T1 = 1.3 // луч дошёл до краёв
const T2 = 1.9 // начал сжиматься
const T3 = 2.6 // латунная черта

/** Контейнер 0×1 px ставит вызывающий: верх = высота линии, ширина = w */
function Level({ w, step, rule, mark }: { w: number; step: number; rule: number; mark: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const k = rule / w
  const span = T3 - T0
  const half = w / 2
  const ticks: number[] = []
  for (let x = step; x < w; x += step) ticks.push(x)

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: 1 }}>
      <motion.div
        style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%' }}
        initial={on ? { transform: 'scaleX(0)' } : false}
        animate={{ transform: on ? ['scaleX(0)', 'scaleX(1)', 'scaleX(1)', `scaleX(${k})`] : `scaleX(${k})` }}
        transition={on ? { delay: T0, duration: span, times: [0, (T1 - T0) / span, (T2 - T0) / span, 1], ease: [INOUT, 'linear', INOUT] } : { duration: 0 }}
      >
        <motion.div
          style={{ position: 'absolute', inset: 0, background: LASER, boxShadow: '0 0 10px 1px rgba(255,170,80,.85)' }}
          initial={on ? { opacity: 1 } : false}
          animate={{ opacity: 0 }}
          transition={tr(T2, T3 - T2, INOUT)}
        />
        <motion.div style={{ position: 'absolute', inset: 0, background: BRASS }} initial={on ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={tr(T2 + 0.1, T3 - T2 - 0.1, INOUT)} />
      </motion.div>

      {on && (
        <motion.div style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: T2, duration: 0.3 }}>
          {ticks.map((x) => (
            <motion.span
              key={x}
              style={{ position: 'absolute', left: x, top: -7, width: 1, height: 7, background: 'rgba(255,226,176,.7)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: T0 + (T1 - T0) * passAt(Math.abs(x - half) / half), duration: 0.15 }}
            />
          ))}
          {[-1, 1].map((dir) => (
            <motion.span
              key={dir}
              style={{ position: 'absolute', left: half - 3, top: -2.5, width: 6, height: 6, borderRadius: 6, background: '#fff', boxShadow: '0 0 14px 4px rgba(255,170,80,.9)' }}
              initial={{ opacity: 0, transform: 'translateX(0px)' }}
              animate={{ opacity: 1, transform: `translateX(${dir * half}px)` }}
              transition={{ delay: T0, duration: T1 - T0, ease: INOUT, opacity: { delay: T0, duration: 0.12 } }}
            />
          ))}
          {mark && (
            <motion.div
              style={{ position: 'absolute', left: 1134, top: -30, width: 70, height: 30 }}
              initial={{ opacity: 0, transform: 'translateY(4px)' }}
              animate={{ opacity: 1, transform: 'translateY(0px)' }}
              transition={{ delay: 1.1, duration: 0.4, ease: OUT }}
            >
              <svg width="70" height="30" viewBox="0 0 70 30" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                <path d="M0.5 23.5 H8.5 L4.5 30 Z M8.5 23.5 H62" fill="none" stroke="rgba(255,236,210,.85)" strokeWidth="1" />
              </svg>
              <span style={{ position: 'absolute', left: 11, top: 7, fontFamily: SANS, fontSize: 10.5, fontWeight: 500, letterSpacing: '.12em', color: 'rgba(255,236,210,.85)', whiteSpace: 'nowrap' }}>±0,000</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

/* ── первый экран ───────────────────────────────────────────────────── */

/**
 * Где в кадре главное (focusX из public/video/niche/<видео>.json): по нему кадрируем узкий экран телефона.
 * У заката со стройкой кран и каркас слева, 0,31 держит их и солнце в кадре
 */
const FOCUS: Record<string, number> = { build: 0.31, windows: 0.45, cleaning: 0.38, flat: 0.52 }

/** Кадрирование cover ролика 16:9 в рамке w×h: доля object-position по x и прямоугольник кадра */
function coverBox(focus: number, w: number, h: number) {
  const iw = Math.max(w, (h * 16) / 9)
  const ih = (iw * 9) / 16
  const px = iw - w < 1 ? 0.5 : clamp((focus * iw - w / 2) / (iw - w), 0, 1)
  return { px, iw, ih, ox: (w - iw) * px, oy: (h - ih) / 2 }
}

/**
 * Солнце в ролике сферы (build.mp4, петля 8,63 с): доли кадра по времени, замерено по яркости.
 * Оно опускается из-за линии уровня за строку и кнопки; постер (build.webp) = кадр около 1,6 с
 */
const SUN: [number, number, number][] = [
  [0, 0.361, 0.606], [1, 0.367, 0.639], [2, 0.388, 0.658], [3, 0.383, 0.694], [4, 0.391, 0.725],
  [5, 0.398, 0.761], [6, 0.4, 0.794], [7, 0.406, 0.825], [8, 0.409, 0.858], [8.64, 0.418, 0.87],
]
const SUN_POSTER = 1.6
function sunAt(t: number): [number, number] {
  const i = Math.max(0, SUN.findIndex(([at]) => at > t) - 1)
  const a = SUN[i]
  const b = SUN[Math.min(i + 1, SUN.length - 1)]
  const k = b[0] > a[0] ? clamp((t - a[0]) / (b[0] - a[0]), 0, 1) : 0
  return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

/**
 * Тёплое пятно поверх солнца (multiply): белый диск становится янтарным, а не серым, и белый текст над ним
 * читается. Пятно ходит за солнцем по кадрам ролика (requestVideoFrameCallback, иначе rAF) — только transform,
 * поэтому остальное небо остаётся золотым. Без анимаций стоит там, где солнце на постере
 */
function SunSpot({ w, h, focus }: { w: number; h: number; focus: number }) {
  const on = useAnimOn()
  const ref = useRef<HTMLDivElement>(null)
  const R = 190
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { iw, ih, ox, oy } = coverBox(focus, w, h)
    const place = (t: number) => {
      const [fx, fy] = sunAt(t)
      el.style.transform = `translate(${Math.round(ox + fx * iw - R)}px, ${Math.round(oy + fy * ih - R)}px)`
    }
    place(SUN_POSTER)
    const v = el.parentElement?.querySelector('video')
    if (!on || !v) return
    let id = 0
    let alive = true
    const rvfc = typeof v.requestVideoFrameCallback === 'function'
    const tick = () => {
      if (!alive) return
      // пока ролик не пошёл, виден постер — пятно стоит на его солнце
      if (v.readyState >= 2 && v.style.opacity !== '0') place(v.currentTime)
      id = rvfc ? v.requestVideoFrameCallback(tick) : requestAnimationFrame(tick)
    }
    tick()
    // перемотка на паузе кадр не «показывает» для rVFC — ставим пятно по событию
    const seeked = () => place(v.currentTime)
    v.addEventListener('seeked', seeked)
    return () => {
      alive = false
      v.removeEventListener('seeked', seeked)
      if (rvfc) v.cancelVideoFrameCallback(id)
      else cancelAnimationFrame(id)
    }
  }, [w, h, focus, on])
  // красный почти не трогаем, зелёный вдвое, синий гасим: белое становится янтарным, свечение остаётся
  const warm = (a: number) => `rgba(205,108,22,${a})`
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: R * 2,
        height: R * 2,
        pointerEvents: 'none',
        background: `radial-gradient(circle closest-side, ${warm(0.78)} 0%, ${warm(0.68)} 30%, ${warm(0.42)} 55%, ${warm(0.13)} 80%, ${warm(0)} 100%)`,
        mixBlendMode: 'multiply',
        willChange: 'transform',
      }}
    />
  )
}

function Video({ d, mobile }: { d: Draft; mobile?: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const v = nicheVideo(d, 'build')
  const [w, h] = mobile ? [M.w, M.h] : [D.w, D.h]
  // десктоп по центру, как в спецификации; телефон — по focusX ролика, чтобы главное не уехало за край
  const fx = mobile ? (FOCUS[d.niche.video ?? 'build'] ?? 0.5) : 0.5
  const pos = `${Math.round(coverBox(fx, w, h).px * 1000) / 10}% 50%`
  return (
    <motion.div style={{ position: 'absolute', inset: 0 }} initial={on ? { transform: 'scale(1.08)' } : false} animate={{ transform: 'scale(1)' }} transition={tr(0, 2.4)}>
      <BgVideo src={v.src} poster={v.poster} position={pos} push={false} reveal="none" style={{ position: 'absolute', inset: 0 }} />
      {!d.niche.video && <SunSpot w={w} h={h} focus={fx} />}
    </motion.div>
  )
}

/**
 * Затемнение под текст. Закат (ролик сферы) светится сам: плоский слой лёгкий, чтобы небо осталось золотым,
 * а солнце за строкой и кнопками гасим тёплым multiply — оно остаётся янтарным, а не серым пятном.
 * Свои ролики ниш — светлые интерьеры с белыми стенами и окнами: там слой плотнее и темнее к центру,
 * где стоят заголовок, строка и кнопки
 */
function Scrim({ d, mobile }: { d: Draft; mobile?: boolean }) {
  const layer: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' }
  const bottom = `linear-gradient(180deg, transparent ${mobile ? 55 : 62}%, rgba(14,10,6,.55) 100%)`
  if (!d.niche.video) {
    // закат светится сам: лёгкий слой, чтобы небо осталось золотым; солнце гасит SunSpot внутри Video.
    // Мягкая полоса только под строкой и кнопками: там проходит засвеченный ореол солнца
    const band = mobile ? 'ellipse 80% 25% at 50% 62%' : 'ellipse 34% 20% at 50% 71%'
    const ink = (a: number) => `rgba(14,10,6,${a})`
    return (
      <>
        <div style={{ ...layer, background: ink(0.2) }} />
        <div style={{ ...layer, background: `radial-gradient(${band}, ${ink(0.28)} 0%, ${ink(0.24)} 55%, ${ink(0)} 100%)` }} />
        <div style={{ ...layer, background: bottom }} />
      </>
    )
  }
  const mid = mobile ? 'ellipse 90% 42% at 50% 50%' : 'ellipse 58% 46% at 50% 58%'
  return (
    <>
      <div style={{ ...layer, background: `rgba(14,10,6,${mobile ? 0.46 : 0.36})` }} />
      <div style={{ ...layer, background: `radial-gradient(${mid}, rgba(14,10,6,.34), transparent 78%)` }} />
      <div style={{ ...layer, background: bottom }} />
    </>
  )
}

function Veil() {
  const on = useAnimOn()
  const tr = useTr()
  return <motion.div style={{ position: 'absolute', inset: 0, background: '#0E0A06' }} initial={on ? { opacity: 0.55 } : false} animate={{ opacity: 0 }} transition={tr(0, 1.2)} />
}

const HEAD: CSSProperties = { fontFamily: SERIF, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.005em' }
const SHADOW = '0 2px 24px rgba(0,0,0,.25)'
const PAIN_SHADOW = '0 1px 2px rgba(14,10,6,.6), 0 0 20px rgba(14,10,6,.5)'

/** Кнопки первого экрана: заканчивают появляться к 2,95 с, до прокрутки-демо */
function Buttons({ d, stacked }: { d: Draft; stacked?: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const base: CSSProperties = {
    height: stacked ? 52 : 56,
    padding: '0 30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: SANS,
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: '.15em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    width: stacked ? 350 : undefined,
    minWidth: stacked ? undefined : 210,
    boxSizing: 'border-box',
  }
  return (
    <div style={{ display: 'flex', flexDirection: stacked ? 'column' : 'row', gap: stacked ? 12 : 16, justifyContent: 'center' }}>
      <motion.div initial={on ? { opacity: 0, transform: 'translateY(14px)' } : false} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={tr(2.35, 0.5)}>
        <div className="bld-fill" style={base}>
          {d.niche.cta}
        </div>
      </motion.div>
      <motion.div initial={on ? { opacity: 0, transform: 'translateY(14px)' } : false} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={tr(2.45, 0.5)}>
        <div className="bld-ghost" style={{ ...base, border: '1px solid rgba(255,255,255,.6)' }}>
          {d.niche.cta2}
        </div>
      </motion.div>
    </div>
  )
}

function Pain({ text, style }: { text: string; style: CSSProperties }) {
  const on = useAnimOn()
  const tr = useTr()
  return (
    <motion.p
      initial={on ? { opacity: 0, transform: 'translateY(10px)', filter: 'blur(6px)' } : false}
      animate={{ opacity: 1, transform: 'translateY(0px)', filter: 'blur(0px)' }}
      transition={tr(2.15, 0.6)}
      style={{ margin: 0, fontFamily: SANS, fontWeight: 400, letterSpacing: '.02em', color: 'rgba(255,255,255,.88)', textShadow: PAIN_SHADOW, textAlign: 'center', ...style }}
    >
      {nb(noDot(text))}
    </motion.p>
  )
}

function HeroD({ d }: { d: Draft }) {
  const on = useAnimOn()
  const tr = useTr()
  const lines = heroLines(d.niche.services)
  // короткие наборы («Дома. Бани. / Кровля.») растут до ~880 px, длинные ужимаются до 1080
  const [mref, size] = useFit(74, 54, 1080, lines.join('|'), { target: 880, max: 96 })
  const pain = noDot(d.niche.pain)
  return (
    <section style={{ position: 'relative', width: D.w, height: D.h, overflow: 'hidden', background: '#0E0A06' }}>
      <Video d={d} />
      <Scrim d={d} />
      <Veil />

      <Measure mref={mref} items={lines} style={{ ...HEAD, fontSize: 74 }} />
      {/* заголовок поднимается из-под линии уровня: нижний край обрезки = y 480 */}
      <div style={{ position: 'absolute', left: 0, top: 120, width: D.w, height: 360, clipPath: 'inset(-40px -60px 0px -60px)' }}>
        <motion.h1
          initial={on ? { transform: 'translateY(118%)' } : false}
          animate={{ transform: 'translateY(0%)' }}
          transition={tr(0.95, 1.5, RISE)}
          style={{ ...HEAD, position: 'absolute', left: 0, right: 0, bottom: 26, margin: 0, fontSize: size, lineHeight: 1.04, color: '#fff', textAlign: 'center', textShadow: SHADOW }}
        >
          {lines.map((l) => (
            <span key={l} style={{ display: 'block', whiteSpace: 'nowrap' }}>
              {dots(l)}
            </span>
          ))}
        </motion.h1>
      </div>

      <div style={{ position: 'absolute', left: 0, top: 480, width: D.w, height: 1 }}>
        <Level w={D.w} step={80} rule={96} mark />
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 504, display: 'flex', justifyContent: 'center' }}>
        <Pain text={pain} style={{ maxWidth: 900, fontSize: pain.length > 96 ? 15 : 17, lineHeight: '26px' }} />
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 570 }}>
        <Buttons d={d} />
      </div>

      <motion.div
        style={{ position: 'absolute', left: 640, top: 712, width: 1, height: 28, background: 'rgba(255,255,255,.35)', overflow: 'hidden' }}
        initial={on ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={tr(2.6, 0.4)}
      >
        <motion.div
          style={{ width: 1, height: 8, background: '#fff' }}
          initial={on ? { transform: 'translateY(-8px)' } : false}
          animate={on ? { transform: ['translateY(-8px)', 'translateY(28px)'] } : { transform: 'translateY(0px)' }}
          transition={on ? { delay: 2.8, duration: 1.6, repeat: Infinity, ease: INOUT } : { duration: 0 }}
        />
      </motion.div>
    </section>
  )
}

function HeroM({ d }: { d: Draft }) {
  const on = useAnimOn()
  const tr = useTr()
  const s = d.niche.services
  const words = s.flatMap((x) => x.split(' '))
  const [mref, size] = useFit(46, 34, 350, words.join('|'), { target: 320, max: 54 })
  return (
    <section style={{ position: 'relative', width: M.w, height: M.h, overflow: 'hidden', background: '#0E0A06' }}>
      <Video d={d} mobile />
      <Scrim d={d} mobile />
      <Veil />
      <Measure mref={mref} items={words} style={{ ...HEAD, fontSize: 46 }} />

      <div style={{ position: 'absolute', left: 20, top: 190, width: 350, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 350, paddingBottom: 22, clipPath: 'inset(-40px -30px 0px -30px)' }}>
          <motion.h1
            initial={on ? { transform: 'translateY(122%)' } : false}
            animate={{ transform: 'translateY(0%)' }}
            transition={tr(0.95, 1.5, RISE)}
            style={{ ...HEAD, margin: 0, fontSize: size, lineHeight: 1.02, color: '#fff', textAlign: 'center', textShadow: SHADOW }}
          >
            {s.map((l) => (
              <span key={l} style={{ display: 'block' }}>
                {dots(l)}
              </span>
            ))}
          </motion.h1>
        </div>
        <div style={{ position: 'relative', width: M.w, height: 1, marginLeft: -20, marginRight: -20, flex: 'none' }}>
          <Level w={M.w} step={48} rule={64} mark={false} />
        </div>
        <Pain text={d.niche.pain} style={{ marginTop: 20, width: 330, fontSize: 15.5, lineHeight: '23px' }} />
        <div style={{ marginTop: 38 }}>
          <Buttons d={d} stacked />
        </div>
      </div>
    </section>
  )
}

/* ── вторая секция ──────────────────────────────────────────────────── */

/*
 * Всё во второй секции привязано к S = SECOND_AT и собирается к S + 0,55:
 * страница приезжает вниз около 3,9 с и стоит там недолго, собранный кадр должен успеть постоять
 */

function Heading({ size, stacked, at }: { size: number; stacked?: boolean; at: number }) {
  const on = useAnimOn()
  const tr = useTr()
  const t: CSSProperties = { fontFamily: SERIF, textTransform: 'uppercase', letterSpacing: '.005em', lineHeight: 1 }
  return (
    <div style={{ ...t, fontSize: size, whiteSpace: 'nowrap' }}>
      <motion.span
        style={{ display: stacked ? 'block' : 'inline-block', fontWeight: 400, color: GHOST, paddingBottom: '0.06em' }}
        initial={on ? { clipPath: 'inset(0% 100% 0% 0%)' } : false}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        transition={tr(at, 0.75, INOUT)}
      >
        {'Наше /\u00a0'}
      </motion.span>
      <span style={{ display: stacked ? 'block' : 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.06em' }}>
        <motion.span
          style={{ display: 'block', fontWeight: 700, color: INK }}
          initial={on ? { transform: 'translateY(105%)' } : false}
          animate={{ transform: 'translateY(0%)' }}
          transition={tr(at + 0.15, 0.65)}
        >
          Дело
        </motion.span>
      </span>
    </div>
  )
}

/** Прайс: позиция, цена «от …», стрелка. Волосяные линии тянутся слева, текст проявляется следом */
function Rows({ d, at, h, mobile }: { d: Draft; at: number; h: number; mobile?: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const rows = priceList(d)
  const step = 0.05
  return (
    <div style={{ position: 'relative', height: h * rows.length + 1 }}>
      {rows.map(([name, price], i) => (
        <div key={name} className="bld-rowwrap" style={{ position: 'relative', height: h }}>
          <motion.span
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: LINE_B, transformOrigin: '0 50%' }}
            initial={on ? { transform: 'scaleX(0)' } : false}
            animate={{ transform: 'scaleX(1)' }}
            transition={tr(at + i * step, 0.45, INOUT)}
          />
          <motion.div
            className="bld-row"
            style={{ position: 'absolute', inset: '1px 0 0 0', display: 'flex', alignItems: 'center', gap: mobile ? 10 : 16 }}
            initial={on ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={tr(at + 0.05 + i * step, 0.4, SOFT)}
          >
            {!mobile && <span style={{ width: 28, flex: 'none', fontFamily: SANS, fontSize: 11, color: IDX, letterSpacing: '.08em' }}>{String(i + 1).padStart(2, '0')}</span>}
            <span style={{ flex: 1, minWidth: 0, fontFamily: SERIF, fontSize: mobile ? 17 : 24, fontWeight: 400, color: INK, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {noDot(name)}
            </span>
            {price && (
              <span style={{ flex: 'none', fontFamily: SANS, fontSize: mobile ? 12 : 13, fontWeight: 500, color: BRONZE, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {noDot(price)}
              </span>
            )}
            <span className="bld-arrow" style={{ flex: 'none', fontFamily: SANS, fontSize: mobile ? 13 : 15, color: BRONZE }}>
              →
            </span>
          </motion.div>
        </div>
      ))}
      <motion.span
        style={{ position: 'absolute', left: 0, right: 0, top: h * rows.length, height: 1, background: LINE_B, transformOrigin: '0 50%' }}
        initial={on ? { transform: 'scaleX(0)' } : false}
        animate={{ transform: 'scaleX(1)' }}
        transition={tr(at + rows.length * step, 0.45, INOUT)}
      />
    </div>
  )
}

/** Ссылка второй секции ведёт дальше по сайту: на работы, цены, состав — вторая кнопка первого экрана */
function MoreLink({ d }: { d: Draft }) {
  return (
    <div style={{ display: 'inline-flex', gap: 10, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: INK, whiteSpace: 'nowrap' }}>
      <span style={{ textDecoration: 'underline', textDecorationColor: BRASS, textDecorationThickness: 1, textUnderlineOffset: 6 }}>{d.niche.cta2}</span>
      <span style={{ color: BRONZE }}>→</span>
    </div>
  )
}

function SecondD({ d, pinned }: { d: Draft; pinned: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const S = SECOND_AT
  // когда шапка закреплена, в кадре прокрутки секция стоит на (h - глубина) ниже верха: подтягиваем содержимое
  const shift = pinned ? D.h - depthOf(D.h) : 0
  const facts = d.niche.facts.map(splitFact)
  const described = facts.some(([, desc]) => desc)
  const col = D.w / 3
  // факты без пояснений: полоса ниже, в каждой колонке латунный номер и подпись антиквой
  const strip = described ? 168 : 120
  const B = 88 + strip
  const rowH = 64
  const C = B + 190
  const rowsH = rowH * priceList(d).length
  return (
    <section style={{ position: 'relative', width: D.w, height: D.h, overflow: 'hidden', background: BEIGE, fontFamily: SANS }}>
      <div style={{ position: 'absolute', left: 0, top: -shift, width: D.w, height: D.h }}>
        {/* полоса фактов */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: D.w, height: B, background: '#fff' }}>
          {[1, 2].map((i) => (
            <motion.span
              key={i}
              style={{ position: 'absolute', left: Math.round(col * i), top: 0, width: 1, height: B, background: LINE_W, transformOrigin: '50% 0' }}
              initial={on ? { transform: 'scaleY(0)' } : false}
              animate={{ transform: 'scaleY(1)' }}
              transition={tr(S - 0.45, 0.7, INOUT)}
            />
          ))}
          <motion.span
            style={{ position: 'absolute', left: 0, bottom: 0, width: D.w, height: 1, background: LINE_W, transformOrigin: '50% 50%' }}
            initial={on ? { transform: 'scaleX(0)' } : false}
            animate={{ transform: 'scaleX(1)' }}
            transition={tr(S - 0.45, 0.7, INOUT)}
          />
          {facts.map(([label, desc], i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                left: col * i,
                top: 88,
                width: col,
                height: strip,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: desc ? 'flex-start' : 'center',
                paddingTop: desc ? 44 : 0,
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
              initial={on ? { opacity: 0, transform: 'translateY(16px)' } : false}
              animate={{ opacity: 1, transform: 'translateY(0px)' }}
              transition={tr(S - 0.35 + i * 0.07, 0.55, SOFT)}
            >
              {described ? (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.16em', lineHeight: 1.5, textTransform: 'uppercase', color: INK, maxWidth: 320 }}>{nb(label)}</div>
                  {desc && (
                    <div style={{ marginTop: 12, maxWidth: 260, fontSize: 13, lineHeight: '20px', color: MUTED, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{nb(desc)}</div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: '.2em', color: BRASS }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ marginTop: 10, maxWidth: 340, fontFamily: SERIF, fontSize: 22, fontWeight: 400, lineHeight: 1.25, color: INK, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {nb(cap(label))}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* бежевый блок «01 / НАШЕ / ДЕЛО» */}
        <motion.div
          style={{ position: 'absolute', right: 80, top: B + 4, fontFamily: SERIF, fontSize: 160, fontWeight: 400, lineHeight: 1, color: 'rgba(26,26,26,.04)', pointerEvents: 'none' }}
          initial={on ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={tr(S - 0.3, 0.8)}
        >
          01
        </motion.div>
        <motion.div
          style={{ position: 'absolute', left: 96, top: B + 44, fontSize: 12, letterSpacing: '.2em', color: IDX }}
          initial={on ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={tr(S - 0.2, 0.4)}
        >
          01
        </motion.div>
        <div style={{ position: 'absolute', left: 96, top: B + 66 }}>
          <Heading size={76} at={S - 0.3} />
        </div>

        <motion.div
          style={{ position: 'absolute', left: 96, top: C, width: 500, height: rowsH, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          initial={on ? { opacity: 0, transform: 'translateY(12px)' } : false}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={tr(S - 0.1, 0.55, SOFT)}
        >
          <p style={{ margin: '-6px 0 0', fontFamily: SERIF, fontSize: 22, lineHeight: 1.5, color: BODY, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{nb(noDot(d.niche.pain))}</p>
          <div style={{ marginBottom: 20 }}>
            <MoreLink d={d} />
          </div>
        </motion.div>

        <div style={{ position: 'absolute', left: 688, top: C, width: 496 }}>
          <Rows d={d} at={S - 0.05} h={rowH} />
        </div>

        {!pinned && (
          <div style={{ position: 'absolute', left: 0, top: 0, right: 0, zIndex: 5 }}>
            <NavD d={d} enter={false} />
          </div>
        )}
      </div>
    </section>
  )
}

function SecondM({ d, pinned }: { d: Draft; pinned: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const S = SECOND_AT
  const shift = pinned ? M.h - depthOf(M.h) : 0
  const facts = d.niche.facts.map(splitFact)
  const described = facts.some(([, desc]) => desc)
  const fh = described ? 80 : 60
  const B = 64 + fh * 3
  const rowH = 46
  const R = B + 272
  const rowsEnd = R + rowH * priceList(d).length
  return (
    <section style={{ position: 'relative', width: M.w, height: M.h, overflow: 'hidden', background: BEIGE, fontFamily: SANS }}>
      <div style={{ position: 'absolute', left: 0, top: -shift, width: M.w, height: M.h }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: M.w, height: B, background: '#fff' }}>
          {facts.map(([label, desc], i) => (
            <div key={i} style={{ position: 'absolute', left: 0, top: 64 + i * fh, width: M.w, height: fh }}>
              {i > 0 && (
                <motion.span
                  style={{ position: 'absolute', left: 20, right: 20, top: 0, height: 1, background: LINE_W, transformOrigin: '0 50%' }}
                  initial={on ? { transform: 'scaleX(0)' } : false}
                  animate={{ transform: 'scaleX(1)' }}
                  transition={tr(S - 0.45 + i * 0.06, 0.6, INOUT)}
                />
              )}
              <motion.div
                style={{ position: 'absolute', inset: 0, padding: described ? '18px 20px' : '0 20px', display: 'flex', alignItems: desc ? 'flex-start' : 'center' }}
                initial={on ? { opacity: 0, transform: 'translateY(16px)' } : false}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                transition={tr(S - 0.35 + i * 0.07, 0.55, SOFT)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {described ? (
                    <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: INK }}>{label}</div>
                  ) : (
                    <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 400, lineHeight: 1.2, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nb(cap(label))}</div>
                  )}
                  {desc && (
                    <div style={{ marginTop: 6, fontSize: 13, lineHeight: '19px', color: MUTED, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{nb(desc)}</div>
                  )}
                </div>
                <span style={{ marginLeft: 16, fontSize: 10.5, letterSpacing: '.14em', color: BRASS, fontWeight: 500 }}>{String(i + 1).padStart(2, '0')}</span>
              </motion.div>
            </div>
          ))}
          <motion.span
            style={{ position: 'absolute', left: 0, bottom: 0, width: M.w, height: 1, background: LINE_W, transformOrigin: '50% 50%' }}
            initial={on ? { transform: 'scaleX(0)' } : false}
            animate={{ transform: 'scaleX(1)' }}
            transition={tr(S - 0.45, 0.7, INOUT)}
          />
        </div>

        <motion.div
          style={{ position: 'absolute', left: 20, top: B + 32, fontSize: 12, letterSpacing: '.2em', color: IDX }}
          initial={on ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={tr(S - 0.2, 0.4)}
        >
          01
        </motion.div>
        <div style={{ position: 'absolute', left: 20, top: B + 52 }}>
          <Heading size={44} stacked at={S - 0.3} />
        </div>
        <motion.p
          style={{ position: 'absolute', left: 20, top: B + 164, width: 350, margin: 0, fontFamily: SERIF, fontSize: 18, lineHeight: 1.5, color: BODY, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          initial={on ? { opacity: 0, transform: 'translateY(12px)' } : false}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={tr(S - 0.1, 0.55, SOFT)}
        >
          {nb(noDot(d.niche.pain))}
        </motion.p>
        <div style={{ position: 'absolute', left: 20, top: R, width: 350 }}>
          <Rows d={d} at={S - 0.05} h={rowH} mobile />
        </div>
        {rowsEnd + 58 <= M.h && (
          <motion.div
            style={{ position: 'absolute', left: 20, top: rowsEnd + 26 }}
            initial={on ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={tr(S + 0.1, 0.4)}
          >
            <MoreLink d={d} />
          </motion.div>
        )}

        {!pinned && (
          <div style={{ position: 'absolute', left: 0, top: 0, right: 0, zIndex: 5 }}>
            <NavM d={d} enter={false} />
          </div>
        )}
      </div>
    </section>
  )
}

/* ── сборка ─────────────────────────────────────────────────────────── */

/** Наведение: свои классы, чтобы не зависеть от сканера Tailwind */
const CSS = `
.bld-navbtn{color:#1A1A1A;transition:background-color .3s,color .3s}
.bld-navbtn:hover{background:#1A1A1A;color:#fff}
.bld-fill{background:#C9A87C;color:#fff;transition:background-color .3s}
.bld-fill:hover{background:#B8925F}
.bld-ghost{background:rgba(255,255,255,.04);color:#fff;transition:background-color .3s,color .3s}
.bld-ghost:hover{background:#fff;color:#1A1A1A}
.bld-row{transition:background-color .3s}
.bld-rowwrap:hover .bld-row{background:rgba(255,255,255,.35)}
.bld-arrow{transition:transform .3s}
.bld-rowwrap:hover .bld-arrow{transform:translateX(6px)}
`

function Desktop({ d }: { d: Draft }) {
  const ref = useRef<HTMLDivElement>(null)
  const pinned = usePinned(ref)
  return (
    <div ref={ref} style={{ position: 'relative', width: D.w, height: D.h * 2, overflow: 'hidden', background: BEIGE }}>
      <style>{CSS}</style>
      <HeroD d={d} />
      <SecondD d={d} pinned={pinned} />
      <Pin pinned={pinned}>
        <NavD d={d} enter />
      </Pin>
    </div>
  )
}

function Mobile({ d }: { d: Draft }) {
  const ref = useRef<HTMLDivElement>(null)
  const pinned = usePinned(ref)
  return (
    <div ref={ref} style={{ position: 'relative', width: M.w, height: M.h * 2, overflow: 'hidden', background: BEIGE }}>
      <style>{CSS}</style>
      <HeroM d={d} />
      <SecondM d={d} pinned={pinned} />
      <Pin pinned={pinned}>
        <NavM d={d} enter />
      </Pin>
    </div>
  )
}

export default { Desktop, Mobile } satisfies Template
