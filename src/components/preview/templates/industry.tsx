import '@fontsource-variable/unbounded'
import '@fontsource-variable/roboto'
import '@fontsource-variable/roboto-mono'
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Draft } from '../../../data/niches'
import type { Template } from '.'
import { BgVideo, nicheVideo, SECOND_AT, useAnimOn } from '../anim'

/**
 * Производство: металлоконструкции, мебель на заказ, завод.
 * Референс — machinalabs.ai: цех на видео, одна моноширинная строка услуг внизу,
 * вторая секция — тёмный «лист спецификации» на бумажном фоне с чертежом.
 * WOW: заголовок «приваривается» — искра идёт по шву, буквы остывают из янтарного в белый
 */

// В Roboto Mono нет «₽»: знак рубля берём из Roboto той же жирности, а не из системного шрифта
const MONO = "'Roboto Mono Variable', 'Roboto Variable', ui-monospace, monospace"
const SANS = "'Roboto Variable', system-ui, sans-serif"
const WIDE = "'Unbounded Variable', system-ui, sans-serif"

const C = {
  nav: '#191919',
  ink: '#121213',
  panel: '#181717',
  paper: '#F3F0EE',
  text: '#FCFCFC',
  sub: '#D9D5CF',
  label: '#A8A39B',
  dim: '#8E8A84',
  line: '#D6D2CC',
  navCta: '#FFD699',
  amber: '#FFB547',
  hot: '#FFC870',
  warm: '#FFE6BF',
  particle: '#FFD28A',
  ink2: '#5B5852',
}

const WELD_EASE = [0.45, 0, 0.25, 1] as const
const GATE_EASE = [0.7, 0, 0.2, 1] as const
const OUT = [0.22, 1, 0.36, 1] as const
/** Вторая секция: её анимации стартуют, пока макет прокручивается к ней */
const S2 = SECOND_AT - 0.4

// ── утилиты

/** Кубическая кривая Безье как функция: нужна, чтобы знать, где искра окажется в момент t */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const f = (a: number, b: number, t: number) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t
  return (x: number) => {
    let lo = 0
    let hi = 1
    let t = x
    for (let i = 0; i < 26; i++) {
      t = (lo + hi) / 2
      if (f(x1, x2, t) < x) lo = t
      else hi = t
    }
    return f(y1, y2, t)
  }
}
const weldAt = bezier(...WELD_EASE)

/** Детерминированный «случай»: одинаковые искры при каждом показе */
const rnd = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return v - Math.floor(v)
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/**
 * Неразрывный пробел после коротких предлогов и союзов; слова через дефис не рвём.
 * Дефис оставляем обычным: неразрывного (U+2011) нет ни в одном из наших шрифтов, он пришёл бы из системного
 */
function nb(s: string): ReactNode {
  const t = s.replace(/(^|[\s(«])(в|во|на|с|со|к|ко|по|за|до|от|из|у|о|об|и|а|но|не|для|под|без|при)\s/giu, '$1$2\u00a0')
  const parts = t.split(/(\S+-\S+)/)
  if (parts.length === 1) return t
  return parts.map((p, i) =>
    i % 2 ? (
      <span key={i} style={{ whiteSpace: 'nowrap' }}>
        {p}
      </span>
    ) : (
      p
    ),
  )
}

/** Подгоняем кегль под ширину по реальному замеру: широкий Unbounded считать по буквам нельзя */
function useFit(text: string, maxW: number, maxPx: number, minPx: number, guess: number, font: string) {
  const ref = useRef<HTMLSpanElement>(null)
  const [px, setPx] = useState(() => {
    const n = Math.max(1, ...text.split('\n').map((l) => l.length))
    return clamp(Math.floor((maxW / (n * guess)) * 2) / 2, minPx, maxPx)
  })
  const cur = useRef(px)
  cur.current = px
  useLayoutEffect(() => {
    let alive = true
    const fit = () => {
      const el = ref.current
      if (!alive || !el) return
      const w = el.scrollWidth
      if (!w) return
      const next = clamp(Math.floor(((cur.current * maxW) / w) * 2) / 2, minPx, maxPx)
      if (Math.abs(next - cur.current) >= 0.5) setPx(next)
    }
    fit()
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    if (fonts) {
      fonts.load(font, text).then(fit, () => {})
      fonts.ready.then(() => requestAnimationFrame(fit))
    }
    return () => {
      alive = false
    }
  }, [text, maxW, maxPx, minPx, px, font])
  return [ref, px] as const
}

/** Стрелка рисунком: в Roboto Mono нет «→», а чужой шрифт в кнопке выдаёт шаблон */
function Arrow({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 14 10" fill="none" aria-hidden style={{ flex: 'none' }}>
      <path d="M0 5h12.5M8.5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

/**
 * Знак. У металлоконструкций — сечение двутавра, у остальных нейтральный:
 * торец панели с пазом (читается и как фасад шкафа, и как складской короб)
 */
function Mark({ h = 22, beam }: { h?: number; beam: boolean }) {
  return (
    <svg width={(h * 16) / 22} height={h} viewBox="0 0 16 22" aria-hidden style={{ flex: 'none' }}>
      {beam ? <path d="M0 0h16v4H10v14h6v4H0v-4h6V4H0z" fill={C.amber} /> : <path d="M0 0h16v22H0zM7 4v14h2V4z" fill={C.amber} fillRule="evenodd" />}
    </svg>
  )
}

/** Имя в шапке. Длинное — в две строки, как фирменный блок, и кегль по замеру */
function Wordmark({ name, px, maxW, split }: { name: string; px: number; maxW: number; split: number }) {
  const text = name.toUpperCase()
  const words = text.split(' ')
  let lines = [text]
  if (text.length > split && words.length > 1) {
    let best = 1
    let bestLen = Infinity
    for (let i = 1; i < words.length; i++) {
      const m = Math.max(words.slice(0, i).join(' ').length, words.slice(i).join(' ').length)
      if (m < bestLen) {
        bestLen = m
        best = i
      }
    }
    lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]
  }
  const [ref, size] = useFit(lines.join('\n'), maxW, px, 10, 0.86, `600 ${px}px "Unbounded Variable"`)
  return (
    <span
      ref={ref}
      style={{ display: 'inline-block', whiteSpace: 'nowrap', fontFamily: WIDE, fontWeight: 600, fontSize: size, letterSpacing: '0.02em', color: C.text, lineHeight: lines.length > 1 ? 1.12 : 1 }}
    >
      {lines.map((l, i) => (
        <span key={i} style={{ display: 'block' }}>
          {l}
        </span>
      ))}
    </span>
  )
}

/** Появление снизу: y и прозрачность, по времени */
function Up({ delay, y = 12, dur = 0.5, children, style, className }: { delay: number; y?: number; dur?: number; children: ReactNode; style?: CSSProperties; className?: string }) {
  const on = useAnimOn()
  return (
    <motion.div
      className={className}
      style={style}
      initial={on ? { opacity: 0, y } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={on ? { delay, duration: dur, ease: OUT } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

// ── сварка заголовка

type Pass = { sx: MotionValue<number>; ax: MotionValue<number>; hot: MotionValue<number> }

/** Один проход искры: sx — где искра, ax — докуда буквы уже остыли, hot — видимость горячего слоя */
function usePass(on: boolean, delay: number, dur: number, travel: number, lag: number): Pass {
  const sx = useMotionValue(on ? 0 : travel)
  const ax = useMotionValue(on ? 0 : travel)
  const hot = useMotionValue(on ? 1 : 0)
  useEffect(() => {
    if (!on) {
      sx.set(travel)
      ax.set(travel)
      hot.set(0)
      return
    }
    sx.set(0)
    ax.set(0)
    hot.set(1)
    const a = animate(sx, travel, { delay, duration: dur, ease: WELD_EASE })
    const b = animate(ax, travel, { delay: delay + lag, duration: dur, ease: WELD_EASE })
    const c = animate(hot, 0, { delay: delay + dur, duration: 0.4, ease: 'easeOut' })
    return () => {
      a.stop()
      b.stop()
      c.stop()
    }
  }, [on, delay, dur, travel, lag, sx, ax, hot])
  return { sx, ax, hot }
}

const R = (edge: number, w: number) => (edge >= w - 0.5 ? -40 : w - edge)
const Lft = (edge: number) => (edge <= 0.5 ? -40 : edge)
const HIDE = 'inset(0px 100% 0px 0px)'

/** Строка в трёх слоях: белая (остывшая), тёплая и раскалённая у самой искры */
function WeldLine({ text, w, fs, lh, left, top, pass }: { text: string; w: number; fs: number; lh: number; left: number; top: number; pass: Pass }) {
  const { sx, ax, hot } = pass
  const clipA = useTransform(ax, (a) => (a <= 0.5 ? HIDE : `inset(-40px ${R(a, w)}px -40px -40px)`))
  const clipC = useTransform([sx, ax], ([s, a]: number[]) => {
    const e = Math.min(a + 110, s)
    return e - a < 0.5 || a >= w ? HIDE : `inset(-40px ${R(e, w)}px -40px ${Lft(a)}px)`
  })
  const clipB = useTransform([sx, ax], ([s, a]: number[]) => {
    const l = Math.min(a + 110, s)
    return s - l < 0.5 || l >= w ? HIDE : `inset(-40px ${R(s, w)}px -40px ${Lft(l)}px)`
  })
  const base: CSSProperties = {
    position: 'absolute',
    left,
    top,
    width: w,
    height: fs * lh,
    whiteSpace: 'nowrap',
    fontFamily: MONO,
    fontWeight: 500,
    fontSize: fs,
    lineHeight: lh,
    letterSpacing: 0,
  }
  return (
    <>
      <motion.div style={{ ...base, color: C.text, clipPath: clipA }}>{text}</motion.div>
      <motion.div aria-hidden style={{ ...base, color: C.warm, textShadow: '0 0 10px rgba(255,160,70,.35)', clipPath: clipC, opacity: hot }}>
        {text}
      </motion.div>
      <motion.div aria-hidden style={{ ...base, color: C.hot, textShadow: '0 0 18px rgba(255,138,31,.55)', clipPath: clipB, opacity: hot }}>
        {text}
      </motion.div>
    </>
  )
}

/** Шов под заголовком: рисуется искрой, потом остывает до 0.7 */
function Seam({ left, top, w, pass, thick = 2 }: { left: number; top: number; w: number; pass: Pass; thick?: number }) {
  const on = useAnimOn()
  const scaleX = useTransform(pass.sx, (s) => clamp(s / w, 0, 1))
  return (
    <>
      <motion.div
        style={{ position: 'absolute', left, top, width: w, height: thick, background: C.amber, transformOrigin: '0 50%', scaleX }}
        initial={on ? { opacity: 1 } : false}
        animate={{ opacity: 0.7 }}
        transition={on ? { delay: 2.0, duration: 0.6 } : { duration: 0 }}
      />
      {on && (
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            left,
            top: top - 1,
            width: w,
            height: thick + 2,
            background: '#FFE2A8',
            boxShadow: '0 0 10px 2px rgba(255,138,31,.55)',
            transformOrigin: '0 50%',
            scaleX,
            opacity: pass.hot,
          }}
        />
      )}
    </>
  )
}

/**
 * Головка искры: ядро, мягкий отсвет на окружение, мерцание; в конце ядро вспыхивает и гаснет.
 * Отсвет без mix-blend и без края: градиент по closest-side сходит в ноль, и растёт в конце только ядро
 */
function Spark({ sx, x0, y, start, end, size = 80, flare = 420 }: { sx: MotionValue<number>; x0: number; y: number; start: number; end: number; size?: number; flare?: number }) {
  const on = useAnimOn()
  if (!on) return null
  const total = end + 0.25 - (start - 0.08)
  const t1 = 0.08 / total
  const t2 = (end - (start - 0.08)) / total
  const tr = { delay: start - 0.08, duration: total, times: [0, t1, t2, 1], ease: 'easeOut' as const }
  return (
    <motion.div
      aria-hidden
      style={{ position: 'absolute', left: x0 - size / 2, top: y - size / 2, width: size, height: size, x: sx, pointerEvents: 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={tr}
    >
      {flare > 0 && (
        <div
          style={{
            position: 'absolute',
            left: size / 2 - flare / 2,
            top: size / 2 - flare / 2,
            width: flare,
            height: flare,
            background: 'radial-gradient(closest-side, rgba(255,176,90,.26), rgba(255,138,31,.10) 40%, rgba(255,138,31,.03) 70%, rgba(255,138,31,0))',
          }}
        />
      )}
      <motion.div style={{ position: 'absolute', inset: 0 }} initial={{ scale: 0.4 }} animate={{ scale: [0.4, 1, 1, 2.4] }} transition={tr}>
        <motion.div
          style={{ position: 'absolute', inset: 0 }}
          animate={{ opacity: [1, 0.7, 1, 0.85], scale: [1, 1.25, 0.9, 1.1] }}
          transition={{ duration: 0.12, repeat: Math.ceil((end - start + 0.4) / 0.12), ease: 'linear' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: size / 2 - 1,
              width: size,
              height: 2,
              background: 'linear-gradient(90deg, rgba(255,214,150,0), rgba(255,244,220,.95) 50%, rgba(255,214,150,0))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: size / 2 - 1,
              top: size * 0.22,
              width: 2,
              height: size * 0.56,
              background: 'linear-gradient(180deg, rgba(255,214,150,0), rgba(255,244,220,.9) 50%, rgba(255,214,150,0))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, #FFF4DC 0 3.5px, rgba(255,205,130,.9) 6px, rgba(255,160,60,.42) 12px, rgba(255,138,31,.12) 24px, rgba(255,138,31,0) 40px)',
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

type Particle = { x: number; y: number; at: number; i: number }

/** Брызги: 2×2 px, дуга с «гравитацией», гаснут за 0.55 с */
function Sparks({ list }: { list: Particle[] }) {
  const on = useAnimOn()
  if (!on) return null
  return (
    <>
      {list.map((p) => {
        const dx = (rnd(p.i, 1) - 0.5) * 100
        const up = -18 - rnd(p.i, 2) * 30
        const down = 45 + rnd(p.i, 3) * 40
        return (
          <motion.div
            key={p.i}
            aria-hidden
            style={{ position: 'absolute', left: p.x - 1, top: p.y - 1, width: 2.5, height: 2.5, background: C.particle, boxShadow: '0 0 5px 1.5px rgba(255,138,31,.85)', pointerEvents: 'none' }}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], x: [0, dx * 0.1, dx * 0.45, dx], y: [0, up * 0.6, up, down] }}
            transition={{ delay: p.at, duration: 0.55, times: [0, 0.06, 0.32, 1], ease: 'linear' }}
          />
        )
      })}
    </>
  )
}

// ── заголовок: расчёт кегля по числу знаков (у Roboto Mono каждый знак ровно 0.6 em)

function deskHead(services: string[]) {
  const one = services.join(' ').toUpperCase()
  const fs = Math.min(72, Math.floor(1184 / (one.length * 0.6)))
  if (fs >= 50) return { lines: [one], fs, lh: 1 }
  const words = one.split(' ')
  let best = 1
  let bestD = Infinity
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - one.length / 2)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  const lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]
  const longest = Math.max(...lines.map((l) => l.length))
  return { lines, fs: Math.min(72, Math.floor(1184 / (longest * 0.6))), lh: 1.02 }
}

// ── кнопки

const btn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  fontFamily: MONO,
  fontWeight: 500,
  fontSize: 14,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  borderRadius: 4,
}

// ── первый экран, десктоп

/** Меню: третий пункт — из второй кнопки ниши («Каталог работ», «Объекты», «Каталог») */
function menuOf(d: Draft) {
  const work = d.niche.cta2.replace(/^Наши\s+/i, '')
  return ['Услуги', 'Производство', work.length <= 14 ? work : 'Работы', 'Контакты']
}

function NavD({ d }: { d: Draft }) {
  const on = useAnimOn()
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1280, height: 72, background: C.nav, zIndex: 5 }}>
      <div style={{ position: 'absolute', left: 48, top: 0, height: 72, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Mark beam={d.niche.id === 'metal'} />
        <Wordmark name={d.name} px={20} maxW={300} split={16} />
      </div>
      <div style={{ position: 'absolute', left: 640, top: 0, height: 72, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 28 }}>
        {menuOf(d).map((m, i) => (
          <motion.span
            key={m}
            style={{ fontFamily: MONO, fontWeight: 500, fontSize: 14, letterSpacing: '0.02em', textTransform: 'uppercase', color: C.text, whiteSpace: 'nowrap' }}
            initial={on ? { opacity: 0, y: -6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={on ? { delay: 0.25 + i * 0.05, duration: 0.45, ease: OUT } : { duration: 0 }}
          >
            /{m}
          </motion.span>
        ))}
      </div>
      <motion.div
        style={{ ...btn, position: 'absolute', right: 48, top: 14, height: 44, padding: '0 20px', border: `1px solid ${C.navCta}`, color: C.navCta, letterSpacing: '0.02em' }}
        initial={on ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={on ? { delay: 0.45, duration: 0.5 } : { duration: 0 }}
      >
        Связаться
      </motion.div>
    </div>
  )
}

/**
 * Как кадрировать узкий экран телефона (доля по горизонтали, как focusX в public/video/niche/<видео>.json).
 * У мебели сдвинуто левее json (0.55): точка реза стоит за заголовком, поэтому в кадр берём стамеску и палец над ней,
 * иначе верх экрана занимает размытая ладонь. Нет в списке — центр кадра
 */
const FOCUS: Record<string, number> = { industry: 0.6, furniture: 0.38 }
const focusOf = (d: Draft) => FOCUS[d.niche.video ?? 'industry'] ?? 0.5

/** Видео ниши с затемнением; «свет в цехе включается» — вуаль уходит за 0.9 с */
function Footage({ d, top, h, w, position, base, grad }: { d: Draft; top: number; h: number; w: number; position: string; base: number; grad: string }) {
  const on = useAnimOn()
  const v = nicheVideo(d, 'industry')
  return (
    <div style={{ position: 'absolute', left: 0, top, width: w, height: h, overflow: 'hidden', background: C.ink }}>
      <BgVideo
        src={v.src}
        poster={v.poster}
        position={position}
        reveal="none"
        push
        style={{ position: 'absolute', inset: 0 }}
      />
      <div style={{ position: 'absolute', inset: 0, background: `rgba(18,18,19,${base})` }} />
      <div style={{ position: 'absolute', inset: 0, background: grad }} />
      {on && (
        <motion.div
          style={{ position: 'absolute', inset: 0, background: C.ink }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
    </div>
  )
}

function HeroD({ d }: { d: Draft }) {
  const on = useAnimOn()
  const { lines, fs, lh } = deskHead(d.niche.services)
  const widths = lines.map((l) => l.length * 0.6 * fs)
  const W = Math.max(...widths)
  const blockH = lines.length * fs * lh
  const top = 628 - blockH
  const seamY = 642
  const START = 0.6
  const DUR = 1.3
  const pass = usePass(on, START, DUR, W, 0.2)
  const particles: Particle[] = Array.from({ length: 14 }, (_, i) => ({
    i,
    at: START + i * 0.09,
    x: 48 + W * weldAt(Math.min(1, (i * 0.09) / DUR)),
    y: seamY + 1,
  }))
  return (
    <section style={{ position: 'relative', width: 1280, height: 760, overflow: 'hidden', background: C.ink }}>
      <Footage
        d={d}
        top={72}
        h={688}
        w={1280}
        position="50% 50%"
        base={0.28}
        grad="linear-gradient(to top, rgba(18,18,19,.9) 0%, rgba(18,18,19,.55) 28%, rgba(18,18,19,0) 58%)"
      />
      <NavD d={d} />

      {lines.map((l, i) => (
        <WeldLine key={i} text={l} w={widths[i]} fs={fs} lh={lh} left={48} top={top + i * fs * lh} pass={pass} />
      ))}
      <Seam left={48} top={seamY} w={W} pass={pass} />
      <Sparks list={particles} />
      <Spark sx={pass.sx} x0={48} y={seamY + 1} start={START} end={START + DUR} />

      <Up delay={1.95} style={{ position: 'absolute', left: 48, top: 668, height: 48, display: 'flex', alignItems: 'center', maxWidth: 560 }}>
        <p style={{ margin: 0, fontFamily: SANS, fontWeight: 400, fontSize: 18, lineHeight: 1.4, color: C.sub }}>{nb(d.niche.pain)}</p>
      </Up>
      <div style={{ position: 'absolute', right: 48, top: 668, display: 'flex', gap: 12 }}>
        <Up delay={2.1}>
          <div style={{ ...btn, height: 48, padding: '0 24px', background: C.amber, color: '#141414' }}>
            {d.niche.cta}
            <Arrow />
          </div>
        </Up>
        <Up delay={2.2}>
          <div style={{ ...btn, height: 48, padding: '0 24px', border: '1px solid rgba(252,252,252,.55)', color: C.text }}>{d.niche.cta2}</div>
        </Up>
      </div>
    </section>
  )
}

// ── чертёж: каркас в аксонометрии, двойные линии профиля, раскосы, размеры

type Pt = [number, number]

function useDrawing(w: number, h: number, k: number) {
  const L = 2
  const D = 1
  const H = 2 / 3
  const t = 0.04
  const vx: Pt = [150 * k, 42 * k]
  const vz: Pt = [-110 * k, 60 * k]
  const vy = -150 * k
  const raw = (x: number, y: number, z: number): Pt => [x * vx[0] + z * vz[0], x * vx[1] + z * vz[1] + y * vy]
  // рамка с размерами: считаем габарит и центрируем
  const ext = [raw(-0.36, 0, D), raw(-0.36, H, D), raw(0, H, 0), raw(L + 0.34, 0, 0), raw(L, 0, D + 0.44), raw(0, 0, D + 0.44), raw(L + 0.34, 0, D)]
  const minX = Math.min(...ext.map((p) => p[0]))
  const maxX = Math.max(...ext.map((p) => p[0]))
  const minY = Math.min(...ext.map((p) => p[1]))
  const maxY = Math.max(...ext.map((p) => p[1]))
  const ox = (w - (maxX - minX)) / 2 - minX
  const oy = (h - (maxY - minY)) / 2 - minY
  const P = (x: number, y: number, z: number): Pt => {
    const r = raw(x, y, z)
    return [+(r[0] + ox).toFixed(1), +(r[1] + oy).toFixed(1)]
  }
  const path = (pts: Pt[], close = false) => `M${pts.map((p) => `${p[0]} ${p[1]}`).join('L')}${close ? 'Z' : ''}`
  const seg = (a: Pt, b: Pt) => path([a, b])

  const outline = path([P(0, 0, D), P(L, 0, D), P(L, 0, 0), P(L, H, 0), P(0, H, 0), P(0, H, D)], true)
  const near = [seg(P(L, H, D), P(0, H, D)), seg(P(L, H, D), P(L, 0, D)), seg(P(L, H, D), P(L, H, 0))].join('')
  const inner = [
    path([P(t, t, D), P(L - t, t, D), P(L - t, H - t, D), P(t, H - t, D)], true),
    path([P(L, t, D - t), P(L, t, t), P(L, H - t, t), P(L, H - t, D - t)], true),
    path([P(t, H, t), P(L - t, H, t), P(L - t, H, D - t), P(t, H, D - t)], true),
  ].join('')
  const m = L / 2
  const g = 0.055
  const braces = [
    seg(P(m - t / 2, t, D), P(m - t / 2, H - t, D)),
    seg(P(m + t / 2, t, D), P(m + t / 2, H - t, D)),
    seg(P(t, t, D), P(m - t / 2 - g, H - t, D)),
    seg(P(t + g, t, D), P(m - t / 2, H - t, D)),
    seg(P(m + t / 2, H - t, D), P(L - t - g, t, D)),
    seg(P(m + t / 2 + g, H - t, D), P(L - t, t, D)),
  ].join('')
  const hidden = [seg(P(0, 0, 0), P(L, 0, 0)), seg(P(0, 0, 0), P(0, H, 0)), seg(P(0, 0, 0), P(0, 0, D))].join('')

  // размеры: выносные линии, размерная линия, засечки под 45°
  const tick = (p: Pt) => seg([p[0] - 4, p[1] + 4], [p[0] + 4, p[1] - 4])
  const zl = D + 0.3
  const xr = L + 0.24
  const xl = -0.24
  const dims = [
    seg(P(0, 0, D + 0.06), P(0, 0, zl + 0.07)),
    seg(P(L, 0, D + 0.06), P(L, 0, zl + 0.07)),
    seg(P(0, 0, zl), P(L, 0, zl)),
    tick(P(0, 0, zl)),
    tick(P(L, 0, zl)),
    seg(P(L + 0.06, 0, 0), P(xr + 0.07, 0, 0)),
    seg(P(L + 0.06, 0, D), P(xr + 0.07, 0, D)),
    seg(P(xr, 0, 0), P(xr, 0, D)),
    tick(P(xr, 0, 0)),
    tick(P(xr, 0, D)),
    seg(P(-0.06, 0, D), P(xl - 0.07, 0, D)),
    seg(P(-0.06, H, D), P(xl - 0.07, H, D)),
    seg(P(xl, 0, D), P(xl, H, D)),
    tick(P(xl, 0, D)),
    tick(P(xl, H, D)),
  ].join('')
  const deg = (v: Pt) => (Math.atan2(v[1], v[0]) * 180) / Math.PI
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const labels = [
    { text: '2400', at: mid(P(0, 0, zl + 0.13), P(L, 0, zl + 0.13)), rot: deg(vx) },
    { text: '1200', at: mid(P(xr + 0.1, 0, 0), P(xr + 0.1, 0, D)), rot: deg([-vz[0], -vz[1]]) },
    { text: '800', at: mid(P(xl - 0.1, 0, D), P(xl - 0.1, H, D)), rot: -90 },
  ]
  return { outline, near, inner, braces, hidden, dims, labels }
}

function Drawing({ w, h, k, at, label = 11 }: { w: number; h: number; k: number; at: number; label?: number }) {
  const on = useAnimOn()
  const g = useDrawing(w, h, k)
  const draw = (delay: number, dur: number) =>
    on
      ? { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { delay, duration: dur, ease: [0.45, 0, 0.2, 1] as const } }
      : { initial: false as const, animate: { pathLength: 1 }, transition: { duration: 0 } }
  const fade = (delay: number, to = 1) =>
    on
      ? { initial: { opacity: 0 }, animate: { opacity: to }, transition: { delay, duration: 0.5 } }
      : { initial: false as const, animate: { opacity: to }, transition: { duration: 0 } }
  const stroke = { fill: 'none', stroke: C.line, strokeWidth: 1.25, strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <motion.path d={g.hidden} {...stroke} strokeDasharray="4 3" {...fade(at + 0.3, 0.35)} />
      <motion.path d={g.outline} {...stroke} {...draw(at, 0.7)} />
      <motion.path d={g.near} {...stroke} {...draw(at + 0.1, 0.7)} />
      <motion.path d={g.inner} {...stroke} strokeWidth={1} {...draw(at + 0.15, 0.7)} />
      <motion.path d={g.braces} {...stroke} strokeWidth={1} {...draw(at + 0.2, 0.6)} />
      <motion.path d={g.dims} {...stroke} stroke={C.dim} strokeWidth={0.9} {...draw(at + 0.4, 0.45)} />
      {g.labels.map((l) => (
        <motion.text
          key={l.text}
          x={l.at[0]}
          y={l.at[1]}
          transform={`rotate(${l.rot.toFixed(1)} ${l.at[0]} ${l.at[1]})`}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontFamily: MONO, fontSize: label, fill: C.dim, letterSpacing: '0.04em' }}
          {...fade(at + 0.65)}
        >
          {l.text}
        </motion.text>
      ))}
    </svg>
  )
}

/** Подпись под чертежом: имя крупно, открывается слева направо, янтарная черта с искрой на конце */
function Caption({ name, maxW, maxPx, at, gap, thick }: { name: string; maxW: number; maxPx: number; at: number; gap: number; thick: number }) {
  const on = useAnimOn()
  const text = name.toUpperCase()
  const [ref, px] = useFit(text, maxW, maxPx, 12, 0.9, `500 ${maxPx}px "Unbounded Variable"`)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <motion.span
        ref={ref}
        style={{ display: 'inline-block', whiteSpace: 'nowrap', fontFamily: WIDE, fontWeight: 500, fontSize: px, lineHeight: 1.1, letterSpacing: '0.04em', color: C.text }}
        initial={on ? { clipPath: 'inset(-10% 100% -10% 0%)' } : false}
        animate={{ clipPath: 'inset(-10% 0% -10% 0%)' }}
        transition={on ? { delay: at, duration: 0.5, ease: [0.6, 0, 0.2, 1] } : { duration: 0 }}
      >
        {text}
      </motion.span>
      <div style={{ position: 'absolute', left: 0, right: 0, top: `calc(100% + ${gap}px)`, height: thick }}>
        <motion.div
          style={{ position: 'absolute', inset: 0, background: C.amber, transformOrigin: '0 50%' }}
          initial={on ? { scaleX: 0 } : false}
          animate={{ scaleX: 1 }}
          transition={on ? { delay: at + 0.3, duration: 0.45, ease: WELD_EASE } : { duration: 0 }}
        />
        {on && (
          <motion.div
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
            initial={{ x: '0%' }}
            animate={{ x: '100%' }}
            transition={{ delay: at + 0.3, duration: 0.45, ease: WELD_EASE }}
          >
            <motion.div
              style={{
                position: 'absolute',
                left: -20,
                top: thick / 2 - 20,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #FFF4DC 0 2px, rgba(255,190,90,.85) 4px, rgba(255,138,31,.25) 10px, transparent 20px)',
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1.2, 1.8] }}
              transition={{ delay: at + 0.26, duration: 0.75, times: [0, 0.1, 0.7, 1] }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}

/** Волосяная линия, которая прочерчивается слева направо */
function Hair({ at, color = 'rgba(252,252,252,.12)' }: { at: number; color?: string }) {
  const on = useAnimOn()
  return (
    <motion.div
      style={{ height: 1, background: color, transformOrigin: '0 50%' }}
      initial={on ? { scaleX: 0 } : false}
      animate={{ scaleX: 1 }}
      transition={on ? { delay: at, duration: 0.5, ease: OUT } : { duration: 0 }}
    />
  )
}

/** Строка характеристики: волосяная линия прочерчивается, номер и текст выезжают из-под маски */
function FactRow({ i, fact, at, h, fs }: { i: number; fact: string; at: number; h: number; fs: number }) {
  const on = useAnimOn()
  return (
    <div style={{ position: 'relative', height: h }}>
      <motion.div
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: 'rgba(252,252,252,.12)', transformOrigin: '0 50%' }}
        initial={on ? { scaleX: 0 } : false}
        animate={{ scaleX: 1 }}
        transition={on ? { delay: at, duration: 0.5, ease: OUT } : { duration: 0 }}
      />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <motion.div
          style={{ display: 'flex', alignItems: 'baseline', width: '100%' }}
          initial={on ? { y: 24, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={on ? { delay: at + 0.08, duration: 0.6, ease: OUT } : { duration: 0 }}
        >
          <span style={{ width: 48, flex: 'none', fontFamily: MONO, fontSize: 12, color: C.label, letterSpacing: '0.04em' }}>0{i + 1}</span>
          <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: fs, lineHeight: 1.18, color: C.text }}>{nb(fact)}</span>
        </motion.div>
      </div>
    </div>
  )
}

/** Цены под листом: четыре колонки через волосяные линии, как таблица в спецификации */
function Prices({ d, at }: { d: Draft; at: number }) {
  const on = useAnimOn()
  const list = d.niche.list.slice(0, 4)
  // у опта в списке условия («в день заказа», «по запросу»), а не цены — и шапка должна это говорить
  const priced = list.some(([, p]) => /₽/.test(p))
  return (
    <div style={{ position: 'absolute', left: 24, top: 548, width: 1232 }}>
      <Up delay={at} y={8}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 20, fontFamily: MONO, fontWeight: 500, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.nav }}>
          <span>{priced ? '/Цены' : '/Условия'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.nav }}>
            {priced ? 'Весь прайс' : d.niche.cta}
            <Arrow size={13} />
          </span>
        </div>
      </Up>
      <motion.div
        style={{ marginTop: 10, height: 1, background: C.nav, transformOrigin: '0 50%' }}
        initial={on ? { scaleX: 0 } : false}
        animate={{ scaleX: 1 }}
        transition={on ? { delay: at + 0.05, duration: 0.7, ease: OUT } : { duration: 0 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${list.length}, 1fr)` }}>
        {list.map(([name, price], i) => (
          <Up
            key={i}
            delay={at + 0.12 + i * 0.06}
            y={10}
            style={{ height: 112, padding: i ? '18px 20px 0' : '18px 20px 0 0', borderLeft: i ? '1px solid rgba(25,25,25,.14)' : 'none' }}
          >
            <div style={{ height: 42, fontFamily: SANS, fontSize: 15, lineHeight: 1.38, color: C.ink2 }}>{nb(name)}</div>
            <div style={{ marginTop: 14, fontFamily: MONO, fontWeight: 500, fontSize: 26, lineHeight: 1, color: C.nav, whiteSpace: 'nowrap' }}>{price}</div>
          </Up>
        ))}
      </div>
    </div>
  )
}

/** Вторая секция: бумага и тёмный лист спецификации, открывается как рольставня цеха */
function SecondD({ d }: { d: Draft }) {
  const on = useAnimOn()
  return (
    <section style={{ position: 'relative', width: 1280, height: 760, overflow: 'hidden', background: C.paper }}>
      <motion.div
        style={{ position: 'absolute', left: 24, top: 64, width: 1232, height: 456, background: C.panel }}
        initial={on ? { clipPath: 'inset(0% 0% 100% 0%)' } : false}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        transition={on ? { delay: S2, duration: 0.55, ease: GATE_EASE } : { duration: 0 }}
      >
        <div style={{ position: 'absolute', left: 56, top: 48, width: 520 }}>
          <Up delay={S2 + 0.2} y={8}>
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.amber, whiteSpace: 'nowrap' }}>
              /{d.niche.noun}
            </div>
          </Up>
          <div style={{ marginTop: 20 }}>
            {d.niche.facts.map((f, i) => (
              <FactRow key={i} i={i} fact={f} at={S2 + 0.28 + i * 0.08} h={76} fs={24} />
            ))}
            <Hair at={S2 + 0.52} />
          </div>
          <Up delay={S2 + 0.6} style={{ marginTop: 28 }}>
            <div style={{ ...btn, borderRadius: 2, height: 48, padding: '0 22px', border: `1px solid ${C.text}`, color: C.text }}>
              {d.niche.cta2}
              <Arrow />
            </div>
          </Up>
        </div>
        <div style={{ position: 'absolute', left: 656, top: 30, width: 520 }}>
          <Drawing w={520} h={280} k={0.88} at={S2 + 0.3} />
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <Caption name={d.name} maxW={520} maxPx={44} at={S2 + 0.55} gap={12} thick={3} />
          </div>
        </div>
      </motion.div>
      <Prices d={d} at={S2 + 0.45} />
    </section>
  )
}

function Desktop({ d }: { d: Draft }) {
  return (
    <div style={{ width: 1280, height: 1520, fontFamily: SANS, background: C.paper }}>
      <HeroD d={d} />
      <SecondD d={d} />
    </div>
  )
}

// ── телефон

function NavM({ d }: { d: Draft }) {
  const on = useAnimOn()
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 390, height: 60, background: C.nav, zIndex: 5 }}>
      <div style={{ position: 'absolute', left: 16, top: 0, height: 60, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mark h={18} beam={d.niche.id === 'metal'} />
        <Wordmark name={d.name} px={16} maxW={214} split={12} />
      </div>
      <motion.div
        style={{ position: 'absolute', right: 16, top: 0, height: 60, display: 'flex', alignItems: 'center', gap: 10 }}
        initial={on ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={on ? { delay: 0.3, duration: 0.5 } : { duration: 0 }}
      >
        <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, letterSpacing: '0.04em', color: C.text }}>МЕНЮ</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ width: 18, height: 1.5, background: C.text }} />
          <span style={{ width: 18, height: 1.5, background: C.text }} />
        </span>
      </motion.div>
    </div>
  )
}

function HeroM({ d }: { d: Draft }) {
  const on = useAnimOn()
  const lines = d.niche.services.map((s) => s.toUpperCase())
  const longest = Math.max(...lines.map((l) => l.length))
  const fs = Math.min(40, Math.floor(358 / (longest * 0.6)))
  const lh = 1.02
  const widths = lines.map((l) => l.length * 0.6 * fs)
  const top = 560 - lines.length * fs * lh
  const seamY = 570
  const STEP = 0.46
  const DUR = 0.42
  const starts = lines.map((_, i) => 0.6 + i * STEP)
  const ys = lines.map((_, i) => (i === lines.length - 1 ? seamY + 1 : top + i * fs * lh + 0.9 * fs + 3))
  // каждый проход — по своей строке: искра не варит пустоту после короткой последней строки
  const travels = widths
  const p0 = usePass(on, starts[0], DUR, travels[0], 0.07)
  const p1 = usePass(on, starts[1], DUR, travels[1], 0.07)
  const p2 = usePass(on, starts[2], DUR, travels[2], 0.07)
  const passes = [p0, p1, p2]
  const taus = [
    [0, 0.08],
    [0, 0.22],
    [0, 0.34],
    [1, 0.1],
    [1, 0.28],
    [2, 0.06],
    [2, 0.2],
    [2, 0.33],
  ]
  const particles: Particle[] = taus.map(([p, tau], i) => ({
    i,
    at: starts[p] + tau,
    x: 16 + travels[p] * weldAt(tau / DUR),
    y: ys[p],
  }))
  return (
    <section style={{ position: 'relative', width: 390, height: 800, overflow: 'hidden', background: C.ink }}>
      <Footage
        d={d}
        top={60}
        h={740}
        w={390}
        position={`${Math.round(focusOf(d) * 100)}% 50%`}
        base={0.25}
        grad="linear-gradient(to top, rgba(18,18,19,.93) 0%, rgba(18,18,19,.7) 40%, rgba(18,18,19,0) 66%)"
      />
      <NavM d={d} />
      {lines.map((l, i) => (
        <WeldLine key={i} text={l} w={widths[i]} fs={fs} lh={lh} left={16} top={top + i * fs * lh} pass={passes[i]} />
      ))}
      <Seam left={16} top={seamY} w={widths[lines.length - 1]} pass={p2} />
      <Sparks list={particles} />
      {passes.map((p, i) => (
        <Spark key={i} sx={p.sx} x0={16} y={ys[i]} start={starts[i]} end={starts[i] + DUR} size={64} flare={260} />
      ))}
      <Up delay={1.95} style={{ position: 'absolute', left: 16, top: 584, width: 358 }}>
        <p
          style={{
            margin: 0,
            fontFamily: SANS,
            fontSize: 16,
            lineHeight: 1.45,
            color: C.sub,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {nb(d.niche.pain)}
        </p>
      </Up>
      <Up delay={2.1} style={{ position: 'absolute', left: 16, top: 668, width: 358 }}>
        <div style={{ ...btn, width: 358, height: 52, background: C.amber, color: '#141414' }}>
          {d.niche.cta}
          <Arrow />
        </div>
      </Up>
      <Up delay={2.2} style={{ position: 'absolute', left: 16, top: 728, width: 358 }}>
        <div style={{ ...btn, width: 358, height: 52, border: '1px solid rgba(252,252,252,.55)', color: C.text }}>{d.niche.cta2}</div>
      </Up>
    </section>
  )
}

function SecondM({ d }: { d: Draft }) {
  const on = useAnimOn()
  return (
    <section style={{ position: 'relative', width: 390, height: 800, overflow: 'hidden', background: C.paper }}>
      <motion.div
        style={{ position: 'absolute', left: 12, top: 72, width: 366, height: 716, background: C.panel }}
        initial={on ? { clipPath: 'inset(0% 0% 100% 0%)' } : false}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        transition={on ? { delay: S2, duration: 0.55, ease: GATE_EASE } : { duration: 0 }}
      >
        <div style={{ position: 'absolute', left: 20, top: 24, width: 326 }}>
          <Up delay={S2 + 0.2} y={8}>
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.amber, whiteSpace: 'nowrap' }}>
              /{d.niche.noun}
            </div>
          </Up>
        </div>
        <div style={{ position: 'absolute', left: 20, top: 52 }}>
          <Drawing w={326} h={190} k={0.55} at={S2 + 0.3} label={10} />
        </div>
        <div style={{ position: 'absolute', left: 20, top: 258, width: 326, textAlign: 'center' }}>
          <Caption name={d.name} maxW={326} maxPx={30} at={S2 + 0.55} gap={8} thick={3} />
        </div>
        <div style={{ position: 'absolute', left: 20, top: 320, width: 326 }}>
          {d.niche.facts.map((f, i) => (
            <FactRow key={i} i={i} fact={f} at={S2 + 0.28 + i * 0.08} h={84} fs={20} />
          ))}
          <Hair at={S2 + 0.52} />
        </div>
        <Up delay={S2 + 0.6} style={{ position: 'absolute', left: 20, top: 600, width: 326 }}>
          <div style={{ ...btn, borderRadius: 2, width: 326, height: 52, border: `1px solid ${C.text}`, color: C.text }}>
            {d.niche.cta2}
            <Arrow />
          </div>
        </Up>
      </motion.div>
    </section>
  )
}

function Mobile({ d }: { d: Draft }) {
  return (
    <div style={{ width: 390, height: 1600, fontFamily: SANS, background: C.paper }}>
      <HeroM d={d} />
      <SecondM d={d} />
    </div>
  )
}

export default { Desktop, Mobile } satisfies Template
