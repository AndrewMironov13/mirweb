import '@fontsource-variable/playfair-display'
import '@fontsource-variable/playfair-display/wght-italic.css'
import '@fontsource-variable/inter'
import { motion, type Transition } from 'motion/react'
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import type { Draft, Niche } from '../../../data/niches'
import type { Template } from '.'
import { BgVideo, EASE, SECOND_AT, asset, nicheVideo, useAnimOn } from '../anim'

/**
 * Здоровье: тёплая редакционная клиника (референс dentologie.com).
 * Одна идея: кино во весь экран отступает и ложится на бумагу фотографией в рамке,
 * текст живёт на бумаге и никогда не закрывает лица. Рамка уходит за сгиб — тизер, который тянет листать.
 * Во второй секции поднимается шторкой отдельный снимок ниши, а не тот же ролик второй раз
 */

const SERIF = "'Playfair Display Variable', 'Playfair Display', Georgia, serif"
const SANS = "'Inter Variable', Inter, system-ui, sans-serif"
const PAPER = '#F5F3F0'
const PILL = '#ECE9E4'
const INK = '#2A2622'
const MUTED = '#70665C'
const RULE = '#DEDBD3'
const MINT = '#7BC4A4'
/** Розоватый multiply гасит зелень исходников: белое остаётся белым, стены — тёплый нейтральный под бумагу */
const GRADE = '#FFE8EE'
const GRADE_A = 0.38
const TONE = 'saturate(.88)'
/** Снимки ниш со стока холодные, голубоватые: чуть сепии, чтобы легли на тёплую бумагу */
const PHOTO_TONE = 'saturate(.85) sepia(.12)'
const STAR = '#F2B01E'
const CURTAIN = [0.76, 0, 0.24, 1] as const
const SHADOW = '0 30px 60px -28px rgba(42,38,34,.28)'
const RING = 'inset 0 0 0 1px rgba(42,38,34,.06)'
const NAV = ['Врачи', 'Цены', 'Отзывы', 'Контакты']

type Ease = Transition['ease']

// ── кадрирование роликов (под конкретный ролик, не под бизнес)
/** Куда ставить ролик в рамке: fx — фокус по горизонтали для cover, x/y/s — конечный сдвиг и масштаб */
interface Frame {
  fx: number
  x: number
  y: number
  s: number
}
interface Clip {
  /** Секунда, с которой снят постер: ролик стартует с неё же, чтобы при подмене постера не было двойной экспозиции */
  at?: number
  d: Frame
  m: Frame
}
const CLIPS: Record<string, Clip> = {
  // пациентка с зеркальцем справа, врач слева; лица в строках 45–500 из 720, верх зеркала ~120 — над ним 16 px воздуха
  health: { at: 3.49, d: { fx: 0.5, x: 0, y: 350, s: 0.8337 }, m: { fx: 0.58, x: -27, y: 398, s: 0.5 } },
}
/** Чужой ролик ниши: середина кадра в середине рамки, без перемотки */
const ANY: Clip = { d: { fx: 0.5, x: 0, y: 283, s: 0.8337 }, m: { fx: 0.5, x: 0, y: 394, s: 0.5 } }
const clipOf = (d: Draft) => CLIPS[d.niche.video ?? 'health'] ?? ANY

/** Ролик внутри BgVideo начинаем с кадра постера */
function useStartAt(box: RefObject<HTMLDivElement | null>, at: number | undefined) {
  const on = useAnimOn()
  useEffect(() => {
    const v = box.current?.querySelector('video')
    if (!on || !v || at === undefined) return
    const seek = () => {
      try {
        v.currentTime = at
      } catch {
        /* ролик ещё не готов — останется с начала */
      }
    }
    if (v.readyState >= 1) seek()
    else v.addEventListener('loadedmetadata', seek, { once: true })
    return () => v.removeEventListener('loadedmetadata', seek)
  }, [on, box, at])
}
function useTr() {
  const on = useAnimOn()
  return (delay: number, duration: number, ease: Ease = EASE): Transition => (on ? { delay, duration, ease } : { duration: 0 })
}

/** Неразрывный пробел после коротких предлогов и союзов, перед тире */
const nb = (s: string) =>
  s
    .replace(/(?<=^|[\s«(])(в|во|с|со|к|ко|о|об|у|и|а|но|на|за|до|по|из|от|не|ни|без|для|или)\s+/gi, '$1\u00a0')
    .replace(/\s+—/g, '\u00a0—')
const bare = (s: string) => s.replace(/[.\s]+$/, '')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const quoted = (d: Draft) => (d.quoted ? `«${d.name}»` : d.name)
/** Кнопка в шапке — одно слово: «Записаться» */
const short = (cta: string) => {
  const w = cta.split(' ')[0]
  return w.length >= 5 ? w : cta
}
const isRating = (f: string) => /^[45][,.]\d/.test(f)
/** «Анна Смирнова» — это человек, а не бренд: в ёлочки не берём */
const isPerson = (s: string) => /^[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+$/.test(s)

/**
 * Ровный перенос по словам: столько же строк, сколько даёт жадный перенос по `max` знаков,
 * но строки примерно одной длины. Неразрывные пробелы из nb() не рвём
 */
function wrap(s: string, max: number): string[] {
  const words = nb(s).split(' ')
  const greedy = (w: number) => {
    const out: string[] = []
    let cur = ''
    for (const x of words) {
      const next = cur ? `${cur} ${x}` : x
      if (next.length > w && cur) {
        out.push(cur)
        cur = x
      } else cur = next
    }
    if (cur) out.push(cur)
    return out
  }
  const n = greedy(max).length
  for (let w = Math.ceil(s.length / n); w < max; w++) {
    const g = greedy(w)
    if (g.length <= n) return g
  }
  return greedy(max)
}

// ── заголовок второй секции: прямая часть и курсивный хвост. Копия ниши, не бизнеса
const WHY: Record<string, [string, string]> = {
  dental: ['Стоматология без страха:', 'честная смета и никакой спешки'],
  clinic: ['Медицина без очередей:', 'врач, анализы и ответ в один день'],
}
const why = (n: Niche): [string, string] => WHY[n.id] ?? [`${cap(n.noun)}, где`, 'вас слышат и не торопят']
/** Средняя ширина знака Playfair в em (замер: 0,48–0,52) с запасом */
const PF = 0.53

// ── мелкие глифы
const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 5, marginTop: 1 }}>
    <path d="M2.2 3.8 5 6.6l2.8-2.8" stroke={INK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Phone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
    <path
      d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11.5 11.5 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.1A1.5 1.5 0 0 1 5 3.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)
const Stars = ({ size = 13 }: { size?: number }) => (
  <span style={{ display: 'inline-flex', gap: 2, marginRight: 8 }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 20 20">
        <path d="m10 1.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8L10 1.6Z" fill={STAR} />
      </svg>
    ))}
  </span>
)
const Check = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="m2.4 5.2 1.8 1.8 3.5-3.8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** Строка заголовка выезжает из-под маски; запас снизу — под хвосты «д», «у», «р» */
function Line({ delay, children, style, dur = 0.8 }: { delay: number; children: ReactNode; style?: CSSProperties; dur?: number }) {
  const on = useAnimOn()
  const tr = useTr()
  return (
    <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.16em', marginBottom: '-0.16em', ...style }}>
      <motion.span style={{ display: 'block' }} initial={on ? { y: '135%' } : false} animate={{ y: '0%' }} transition={tr(delay, dur)}>
        {children}
      </motion.span>
    </span>
  )
}

/** Курсивное слово поднимается из той же маски чуть позже своей строки — без размытия, только сдвиг */
function Em({ children, delay }: { children: ReactNode; delay: number }) {
  const on = useAnimOn()
  const tr = useTr()
  return (
    <motion.em style={{ fontStyle: 'italic', display: 'inline-block' }} initial={on ? { y: '70%' } : false} animate={{ y: '0%' }} transition={tr(delay, 0.8)}>
      {children}
    </motion.em>
  )
}

function Rise({ delay, children, style, y = 10, dur = 0.5 }: { delay: number; children: ReactNode; style?: CSSProperties; y?: number; dur?: number }) {
  const on = useAnimOn()
  const tr = useTr()
  return (
    <motion.div style={style} initial={on ? { opacity: 0, y } : false} animate={{ opacity: 1, y: 0 }} transition={tr(delay, dur)}>
      {children}
    </motion.div>
  )
}

const pill = (dark: boolean, h: number, px: number, fs: number): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: h,
  padding: `0 ${px}px`,
  borderRadius: 999,
  fontFamily: SANS,
  fontWeight: 500,
  fontSize: fs,
  letterSpacing: '-0.005em',
  whiteSpace: 'nowrap',
  color: dark ? PAPER : INK,
  background: dark ? INK : 'transparent',
  boxShadow: dark ? 'none' : `inset 0 0 0 1.5px ${INK}`,
})

// ── геометрия первого экрана
interface G {
  w: number
  h: number
  /** рамка может уходить за сгиб (y + h > высоты экрана): низ со скруглением виден уже при прокрутке */
  card: { x: number; y: number; w: number; h: number; r: number }
}
const DG: G = { w: 1280, h: 760, card: { x: 96, y: 440, w: 1088, h: 344, r: 24 } }
const MG: G = { w: 390, h: 800, card: { x: 16, y: 404, w: 358, h: 380, r: 20 } }

/** Прямоугольник «cover» для видео 16:9 в кадре w×h */
const cover = (w: number, h: number, fx: number) => {
  const bw = Math.max(w, h * (16 / 9))
  const bh = Math.max(h, w * (9 / 16))
  return { left: (w - bw) * fx, w: bw, h: bh }
}

/**
 * Кино во весь экран → фотография в рамке на бумаге.
 * Рамка (clip-path) и видео (transform) идут одной кривой и обе через WAAPI — иначе видео отстаёт от рамки и мелькает бумага
 */
function Film({ g, d }: { g: G; d: Draft }) {
  const on = useAnimOn()
  const tr = useTr()
  const vbox = useRef<HTMLDivElement>(null)
  const v = nicheVideo(d, 'health')
  const clip = clipOf(d)
  const f = g === MG ? clip.m : clip.d
  useStartAt(vbox, clip.at)
  const c = g.card
  const H = Math.max(g.h, c.y + c.h)
  const box = cover(g.w, g.h, f.fx)
  const from = `inset(0px 0px ${H - g.h}px 0px round 0px)`
  const to = `inset(${c.y}px ${g.w - c.x - c.w}px ${H - c.y - c.h}px ${c.x}px round ${c.r}px)`
  const rect: CSSProperties = { position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, borderRadius: c.r }
  return (
    <>
      <motion.div style={{ ...rect, boxShadow: SHADOW }} initial={on ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={tr(1.9, 0.6)} />
      <motion.div
        style={{ position: 'absolute', left: 0, top: 0, width: g.w, height: H, overflow: 'hidden' }}
        initial={on ? { clipPath: from } : false}
        animate={{ clipPath: to }}
        transition={tr(1.1, 1.3, CURTAIN)}
      >
        <motion.div
          ref={vbox}
          style={{ position: 'absolute', top: 0, left: box.left, width: box.w, height: box.h, transformOrigin: `${f.fx * 100}% 0%`, filter: TONE }}
          initial={on ? { transform: 'translate(0px, 0px) scale(1)' } : false}
          animate={{ transform: `translate(${f.x}px, ${f.y}px) scale(${f.s})` }}
          transition={tr(1.1, 1.3, CURTAIN)}
        >
          <BgVideo src={v.src} poster={v.poster} className="absolute inset-0" push={false} reveal="none" position="50% 50%" />
        </motion.div>
        <div style={{ position: 'absolute', inset: 0, background: GRADE, mixBlendMode: 'multiply', opacity: GRADE_A }} />
        <motion.div style={{ ...rect, boxShadow: RING }} initial={on ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={tr(1.9, 0.6)} />
      </motion.div>
    </>
  )
}

function Wordmark({ d, max, size, min }: { d: Draft; max: number; size: number; min: number }) {
  const fs = Math.max(min, Math.min(size, max / (d.name.length * 0.68)))
  return (
    <span
      style={{
        fontFamily: SERIF,
        fontWeight: 800,
        fontSize: fs,
        lineHeight: 1.0,
        letterSpacing: '-0.01em',
        color: INK,
        maxWidth: max,
        display: 'block',
        textWrap: 'balance',
      }}
    >
      {d.name}
    </span>
  )
}

function DesktopNav({ d }: { d: Draft }) {
  return (
    <Rise delay={1.75} y={-8} style={{ position: 'absolute', left: 0, top: 0, width: 1280, height: 68, background: PAPER, borderBottom: `1px solid ${RULE}` }}>
      <div style={{ position: 'absolute', left: 40, top: 0, height: 68, display: 'flex', alignItems: 'center' }}>
        <Wordmark d={d} max={360} size={24} min={16} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 640,
          top: 14,
          transform: 'translateX(-50%)',
          height: 40,
          padding: '0 8px',
          borderRadius: 999,
          background: PILL,
          display: 'flex',
          alignItems: 'center',
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 14,
          color: INK,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ padding: '0 16px', display: 'inline-flex', alignItems: 'center' }}>
          Услуги
          <Chevron />
        </span>
        {NAV.map((t) => (
          <span key={t} style={{ padding: '0 16px' }}>
            {t}
          </span>
        ))}
      </div>
      <span style={{ ...pill(true, 40, 22, 14), position: 'absolute', right: 40, top: 14 }}>{short(d.niche.cta)}</span>
    </Rise>
  )
}

function MobileNav({ d }: { d: Draft }) {
  return (
    <Rise delay={1.75} y={-8} style={{ position: 'absolute', left: 0, top: 0, width: 390, height: 60, background: PAPER, borderBottom: `1px solid ${RULE}` }}>
      <div style={{ position: 'absolute', left: 16, top: 0, height: 60, display: 'flex', alignItems: 'center' }}>
        <Wordmark d={d} max={196} size={20} min={16} />
      </div>
      <div style={{ position: 'absolute', right: 16, top: 0, height: 60, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={pill(true, 36, 14, 13)}>{short(d.niche.cta)}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 18 }}>
          <i style={{ display: 'block', height: 1.5, background: INK, borderRadius: 1 }} />
          <i style={{ display: 'block', height: 1.5, background: INK, borderRadius: 1 }} />
        </span>
      </div>
    </Rise>
  )
}

function Facts({ d, mobile }: { d: Draft; mobile?: boolean }) {
  const f = d.niche.facts
  if (mobile)
    // ведущая мятная точка вместо « · »: разделитель не повисает в конце строки
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 14,
          rowGap: 4,
          maxWidth: 358,
          fontFamily: SANS,
          fontSize: 12,
          lineHeight: 1.5,
          color: MUTED,
        }}
      >
        {f.map((t) => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            {isRating(t) ? <Stars size={11} /> : <i style={{ display: 'block', width: 5, height: 5, borderRadius: 999, background: MINT, marginRight: 6 }} />}
            {nb(t)}
          </span>
        ))}
      </div>
    )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: SANS, fontSize: 13, color: MUTED, whiteSpace: 'nowrap' }}>
      {f.map((t, i) => (
        <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
          {i > 0 && <i style={{ display: 'block', width: 1, height: 12, background: RULE }} />}
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {isRating(t) && <Stars />}
            {nb(t)}
          </span>
        </span>
      ))}
    </div>
  )
}

function Desktop({ d }: { d: Draft }) {
  return (
    <div style={{ width: 1280, background: PAPER }}>
      <HeroD d={d} />
      <SecondD d={d} />
    </div>
  )
}

function HeroD({ d }: { d: Draft }) {
  const n = d.niche
  const [s1, s2, s3] = n.services
  const longest = Math.max(`${s1} ${s2}`.length, s3.length)
  const fs = Math.min(58, 900 / (longest * 0.5))
  const tel = /звон|телеф/i.test(n.cta2)
  // секция над второй (z 1): низ рамки со скруглением заходит за сгиб
  return (
    <section style={{ position: 'relative', zIndex: 1, width: 1280, height: 760, background: PAPER, color: INK }}>
      <Film g={DG} d={d} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 96,
          height: 336,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: fs, lineHeight: 1.0, letterSpacing: '-0.01em', color: INK }}>
          <Line delay={1.8}>
            {s1} <Em delay={1.92}>{s2}</Em>
          </Line>
          <Line delay={1.9}>{s3}</Line>
        </h1>
        <Rise delay={2.1} style={{ marginTop: 18 }}>
          <p style={{ margin: 0, fontFamily: SANS, fontSize: 18, lineHeight: 1.5, color: MUTED, maxWidth: 640, textWrap: 'balance' }}>{nb(bare(n.pain))}</p>
        </Rise>
        <Rise delay={2.25} style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <span style={pill(true, 46, 26, 15)}>{n.cta}</span>
          <span style={pill(false, 46, 26, 15)}>
            {tel && <Phone />}
            {n.cta2}
          </span>
        </Rise>
        <Rise delay={2.35} style={{ marginTop: 18 }}>
          <Facts d={d} />
        </Rise>
      </div>
      <DesktopNav d={d} />
    </section>
  )
}

// ── вторая секция: «Почему мы»
const H2_EYEBROW = (d: Draft) => (d.quoted && !isPerson(d.name) ? `Почему ${quoted(d)}` : 'Почему нам доверяют')

/** Снимок ниши поднимается шторкой, пока секция въезжает, и медленно отъезжает из крупного плана */
function Card2({ d, rect, r, pos, delay }: { d: Draft; rect: CSSProperties; r: number; pos: string; delay: number }) {
  const on = useAnimOn()
  const tr = useTr()
  return (
    <>
      <motion.div style={{ ...rect, borderRadius: r, boxShadow: SHADOW }} initial={on ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={tr(delay + 0.4, 0.6)} />
      <motion.div
        style={{ ...rect, overflow: 'hidden', borderRadius: r, background: '#d9d3c9' }}
        initial={on ? { clipPath: `inset(100% 0% 0% 0% round ${r}px)` } : false}
        animate={{ clipPath: `inset(0% 0% 0% 0% round ${r}px)` }}
        transition={tr(delay, 0.95, CURTAIN)}
      >
        <motion.img
          src={asset(`img/niche/${d.niche.photo}.webp`)}
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, filter: PHOTO_TONE }}
          initial={on ? { scale: 1.16 } : false}
          animate={{ scale: 1.02 }}
          transition={tr(delay, 2.6)}
        />
        <div style={{ position: 'absolute', inset: 0, background: GRADE, mixBlendMode: 'multiply', opacity: GRADE_A }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: r, boxShadow: RING }} />
      </motion.div>
    </>
  )
}

function Eyebrow({ d, delay }: { d: Draft; delay: number }) {
  return (
    <Rise delay={delay} y={8}>
      <p
        style={{
          margin: 0,
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 12,
          lineHeight: 1.4,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: INK,
          textWrap: 'balance',
        }}
      >
        {H2_EYEBROW(d)}
      </p>
    </Rise>
  )
}

/** h2 второй секции: прямая часть, затем курсивный хвост; строки ровные и каждая выезжает из своей маски */
function Why({ d, fs, width, delay, lh }: { d: Draft; fs: number; width: number; delay: number; lh: number }) {
  const [plain, tail] = why(d.niche)
  const max = Math.floor(width / (fs * PF))
  const lines = [...wrap(plain, max).map((t) => ({ t, em: false })), ...wrap(tail, max).map((t) => ({ t, em: true }))]
  return (
    <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: fs, lineHeight: lh, letterSpacing: '-0.01em', color: INK, whiteSpace: 'nowrap' }}>
      {lines.map((l, i) => (
        <Line key={i} delay={delay + i * 0.08}>
          {l.em ? <em style={{ fontStyle: 'italic' }}>{l.t}</em> : l.t}
        </Line>
      ))}
    </h2>
  )
}

function Checks({ d, fs, gap, delay }: { d: Draft; fs: number; gap: number; delay: number }) {
  const on = useAnimOn()
  const tr = useTr()
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap }}>
      {d.niche.facts.map((f, i) => (
        <motion.li
          key={f}
          style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: SANS, fontSize: fs, lineHeight: 1.35, color: INK }}
          initial={on ? { opacity: 0, x: -8 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={tr(delay + i * 0.08, 0.5)}
        >
          <motion.span
            style={{ flex: 'none', width: 20, height: 20, borderRadius: 999, background: MINT, display: 'grid', placeItems: 'center' }}
            initial={on ? { scale: 0.4 } : false}
            animate={{ scale: 1 }}
            transition={on ? { delay: delay + i * 0.08, type: 'spring', stiffness: 300, damping: 20 } : { duration: 0 }}
          >
            <Check />
          </motion.span>
          <span>{nb(f)}</span>
        </motion.li>
      ))}
    </ul>
  )
}

/** Прайс без повторов: строку без цены, которая уже стоит галочкой («Консультация — бесплатно»), не дублируем */
function Prices({ d, delay }: { d: Draft; delay: number }) {
  const on = useAnimOn()
  const tr = useTr()
  const n = d.niche
  const rows = n.list.filter(([s, p]) => /\d/.test(p) || !n.facts.some((f) => f.toLowerCase().startsWith(s.toLowerCase()))).slice(0, 4)
  return (
    <div style={{ borderBottom: `1px solid ${RULE}` }}>
      {rows.map(([s, p], i) => {
        const rub = /₽\s*$/.test(p)
        return (
          <motion.div
            key={s}
            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24, height: 50, paddingTop: 15, borderTop: `1px solid ${RULE}` }}
            initial={on ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={tr(delay + i * 0.07, 0.5)}
          >
            <span style={{ fontFamily: SANS, fontSize: 15, color: INK }}>{nb(s)}</span>
            {/* у Playfair старостильные цифры («45 ооо») и нет знака ₽ — цифры ставим прописные, рубль рисуем гротеском */}
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 19,
                color: INK,
                whiteSpace: 'nowrap',
                fontStyle: /\d/.test(p) ? 'normal' : 'italic',
                fontVariantNumeric: 'lining-nums tabular-nums',
              }}
            >
              {nb(p.replace(/\s*₽\s*$/, ''))}
              {rub && <span style={{ fontFamily: SANS, fontSize: '0.8em', marginLeft: 5 }}>₽</span>}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

function SecondD({ d }: { d: Draft }) {
  const n = d.niche
  // текст стартует до SECOND_AT: строки поднимаются, пока секция въезжает, а не после
  const T = SECOND_AT - 0.5
  return (
    <section style={{ position: 'relative', width: 1280, height: 760, overflow: 'hidden', background: PAPER, color: INK }}>
      <Card2 d={d} rect={{ position: 'absolute', left: 40, top: 88, width: 500, height: 592 }} r={24} pos="8% 50%" delay={SECOND_AT - 0.8} />
      <div style={{ position: 'absolute', left: 620, width: 580, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 8 }}>
        <Eyebrow d={d} delay={T - 0.1} />
        <div style={{ marginTop: 16 }}>
          <Why d={d} fs={42} width={570} lh={1.08} delay={T} />
        </div>
        <div style={{ marginTop: 30 }}>
          <Checks d={d} fs={16} gap={14} delay={T + 0.3} />
        </div>
        <div style={{ marginTop: 32 }}>
          <Prices d={d} delay={T + 0.45} />
        </div>
        <Rise delay={T + 0.7} style={{ marginTop: 34, display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={pill(true, 46, 26, 15)}>{n.cta}</span>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, color: INK, textDecoration: 'underline', textDecorationThickness: 1, textUnderlineOffset: 5 }}>
            {n.cta2}
          </span>
        </Rise>
      </div>
    </section>
  )
}

// ── телефон
function Mobile({ d }: { d: Draft }) {
  return (
    <div style={{ width: 390, background: PAPER }}>
      <HeroM d={d} />
      <SecondM d={d} />
    </div>
  )
}

function HeroM({ d }: { d: Draft }) {
  const n = d.niche
  const [s1, s2, s3] = n.services
  const longest = Math.max(s1.length, s2.length, s3.length)
  const fs = Math.min(40, 340 / (longest * 0.5))
  const tel = /звон|телеф/i.test(n.cta2)
  return (
    <section style={{ position: 'relative', zIndex: 1, width: 390, height: 800, overflow: 'hidden', background: PAPER, color: INK }}>
      <Film g={MG} d={d} />
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          top: 76,
          height: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: fs, lineHeight: 1.02, letterSpacing: '-0.01em', color: INK }}>
          <Line delay={1.8}>{s1}</Line>
          <Line delay={1.9}>
            <em style={{ fontStyle: 'italic' }}>{s2}</em>
          </Line>
          <Line delay={2.0}>{s3}</Line>
        </h1>
        <Rise delay={2.15} style={{ marginTop: 14 }}>
          <p style={{ margin: 0, fontFamily: SANS, fontSize: 16, lineHeight: 1.45, color: MUTED, maxWidth: 330, textWrap: 'balance' }}>{nb(bare(n.pain))}</p>
        </Rise>
        <Rise delay={2.3} style={{ marginTop: 20, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <span style={{ ...pill(true, 44, 10, 14), fontSize: n.cta.length > 18 ? 13 : 14 }}>{n.cta}</span>
          <span style={pill(false, 44, 10, 14)}>
            {tel && <Phone />}
            {n.cta2}
          </span>
        </Rise>
        <Rise delay={2.4} style={{ marginTop: 14 }}>
          <Facts d={d} mobile />
        </Rise>
      </div>
      <MobileNav d={d} />
    </section>
  )
}

function SecondM({ d }: { d: Draft }) {
  const n = d.niche
  // на телефоне текст под карточкой и въезжает позже — стартует чуть позже, чем на десктопе
  const T = SECOND_AT - 0.2
  const plain = why(n)[0]
  const fs = Math.max(24, Math.min(30, 358 / (plain.length * PF)))
  return (
    <section style={{ position: 'relative', width: 390, height: 800, overflow: 'hidden', background: PAPER, color: INK }}>
      <Card2 d={d} rect={{ position: 'absolute', left: 16, top: 76, width: 358, height: 300 }} r={20} pos="30% 50%" delay={SECOND_AT - 0.8} />
      <div style={{ position: 'absolute', left: 16, right: 16, top: 404 }}>
        <Eyebrow d={d} delay={T - 0.1} />
        <div style={{ marginTop: 14 }}>
          <Why d={d} fs={fs} width={358} lh={1.1} delay={T} />
        </div>
        <div style={{ marginTop: 24 }}>
          <Checks d={d} fs={15} gap={12} delay={T + 0.3} />
        </div>
      </div>
      <Rise delay={T + 0.5} style={{ position: 'absolute', left: 16, right: 16, bottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, color: INK, textDecoration: 'underline', textDecorationThickness: 1, textUnderlineOffset: 5 }}>
          {n.cta2}
        </span>
        <span style={{ ...pill(true, 48, 20, 15), width: '100%' }}>{n.cta}</span>
      </Rise>
    </section>
  )
}

export default { Desktop, Mobile } satisfies Template
