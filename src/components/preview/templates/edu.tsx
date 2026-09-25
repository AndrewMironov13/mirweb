/**
 * Обучение. Референс — cambly.com/english: живое видео урока на весь экран, тёплая антиква по центру,
 * одна жёлтая кнопка и жёлтая полоса с тремя фактами под первым экраном.
 * WOW — «Маркер»: жёлтый текстовыделитель проходит по второй услуге, слово темнеет под ним,
 * как у ученицы в кадре с ручкой. Эхо — на выбранных чипах блокнота во второй секции.
 * Вторая секция — «Начнём с вашей цели»: коралловая панель с коллажем бумажных ярлыков и страницей блокнота,
 * рядом кадр из той же съёмки с двумя карточками курсов
 */
import '@fontsource-variable/literata/opsz.css'
import '@fontsource-variable/literata/opsz-italic.css'
import '@fontsource-variable/golos-text'
import { animate, motion, useMotionValue, useTransform, type Transition } from 'motion/react'
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import type { Draft } from '../../../data/niches'
import type { Template } from '.'
import { BgVideo, EASE, SECOND_AT, asset, nicheVideo, useAnimOn } from '../anim'

const C = {
  ink: '#15120E',
  paper: '#FAF4EB',
  page: '#FFFDF8',
  lamp: '#FFD95A',
  lampHi: '#FFE385',
  apple: '#E8664F',
  stone: '#6B6259',
  chip: '#EFE7DA',
  rule: 'rgba(21,18,14,.12)',
  streak: '#F2C23C',
}
const ink = (a: number) => `rgba(21,18,14,${a})`
/** Скримы тёплые, в цвет вольфрама лампы: нейтральный ink гасит тепло клипа */
const warm = (a: number) => `rgba(30,17,6,${a})`
const SERIF = "'Literata Variable', Georgia, serif"
const SANS = "'Golos Text Variable', system-ui, sans-serif"
const DISPLAY: CSSProperties = { fontFamily: SERIF, fontWeight: 500, fontVariationSettings: '"opsz" 72', letterSpacing: '-.02em' }
const WRITE = [0.65, 0, 0.35, 1] as const
const MARK = [0.45, 0, 0.2, 1] as const
/** Соседний кадр той же съёмки: лампа, яблоко, ноутбук, рука с ручкой. У ниши со своим видео — её постер */
const STORY = 'video/niche/edu-story.webp'
/** Вторая секция собирается, пока страница едет к ней, и стоит готовой к приезду */
const S2 = SECOND_AT - 0.55
const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect

/* ---------- текст ---------- */

/** Неразрывный пробел после коротких предлогов и союзов и между числом и словом */
function nb(s: string) {
  const re = /(^|[\s(«])(в|во|на|за|с|со|к|ко|у|о|об|по|до|из|от|и|а|но|не|для|без|при|под|над|про)\s+/giu
  return s.replace(re, '$1$2 ').replace(re, '$1$2 ').replace(/(\d)\s+(?=[^\d\s])/g, '$1 ')
}
const noDot = (s: string) => s.trim().replace(/[.。]+$/u, '')
/** Кегль по числу знаков: k — средняя ширина знака в долях кегля */
const fitPx = (text: string, max: number, width: number, k: number) => Math.min(max, Math.floor(width / (Math.max(1, text.length) * k)))
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

const NAV = ['Курсы', 'Преподаватели', 'Цены', 'Контакты']
/**
 * Ярлыки коллажа «Под вашу цель»: цели и предметы, общие для репетиторов, курсов и подготовки к экзаменам.
 * Если у ниши появятся свои (niche.tags), берём их
 */
const GOALS = [
  'Поступление',
  'С нуля',
  'Для взрослых',
  'Английский',
  'ОГЭ',
  'Подтянуть оценки',
  'Физика',
  'Математика',
  'Сессия',
  'Для школьников',
  'Олимпиады',
  'Программирование',
  'Русский язык',
]
const MOB_GOALS = ['ОГЭ', 'С нуля', 'Английский', 'Физика', 'Для взрослых']

function goals(d: Draft, base: string[]) {
  const own = (d.niche as { tags?: string[] }).tags?.filter(Boolean)
  if (!own?.length) return base
  return base.map((_, i) => own[i % own.length])
}

/* ---------- время ---------- */

function useTr(delay: number, duration: number, ease: Transition['ease'] = EASE): Transition {
  const on = useAnimOn()
  return on ? { delay, duration, ease } : { duration: 0 }
}

/** Прогресс 0→1 для маркера. Без анимаций — сразу 1. go = false держит маркер на старте */
function useWipe(delay: number, duration: number, go = true) {
  const on = useAnimOn()
  const p = useMotionValue(on ? 0 : 1)
  useEffect(() => {
    if (!on) {
      p.set(1)
      return
    }
    if (!go) return
    const c = animate(p, 1, { delay, duration, ease: MARK })
    return () => c.stop()
  }, [on, go, p, delay, duration])
  return useTransform(p, (v) => `inset(-40% ${((1 - v) * 100).toFixed(2)}% -40% 0%)`)
}

/* ---------- «фиксированная» шапка и настоящее положение прокрутки ---------- */

/*
 * Макет прокручивает ScrollDemo (translateY всего содержимого). Чтобы шапка вела себя как position: fixed,
 * её слой едет навстречу: берём настоящую анимацию прокрутки (WAAPI) и запускаем зеркало с тем же startTime.
 * Нет WAAPI — слой каждый кадр догоняет измеренное положение. От него же: шапка становится сплошной
 * после 40 px, а маркер на чипах идёт, когда страница действительно доехала до второй секции
 */
function useScroll(root: RefObject<HTMLDivElement | null>, h: number) {
  const on = useAnimOn()
  const layer = useRef<HTMLDivElement>(null)
  const [base, setBase] = useState(0)
  const [solid, setSolid] = useState(false)
  const [arrived, setArrived] = useState(!on)
  const reach = h * 0.72

  useIso(() => {
    const el = root.current
    const vp = el?.parentElement?.parentElement
    if (!el || !vp) return
    const r = el.getBoundingClientRect()
    const v = vp.getBoundingClientRect()
    const k = r.height / (el.offsetHeight || 1) || 1
    const b = clamp(Math.round((v.top - r.top) / k), 0, h)
    setBase(b)
    setSolid(b > 40)
    if (b > reach) setArrived(true)
  }, [on, h, reach])

  useEffect(() => {
    if (!on) return
    // запас: без прокрутки-демо (стенд) или если она не доехала — маркер всё равно проходит
    const safety = window.setTimeout(() => setArrived(true), (SECOND_AT + 0.7) * 1000)
    const el = root.current
    const ly = layer.current
    const host = el?.parentElement
    const vp = host?.parentElement
    if (!el || !ly || !host || !vp || !host.classList.contains('scroll-demo')) return () => window.clearTimeout(safety)
    const t0 = performance.now()
    let raf = 0
    let mirror: Animation | null = null
    let done = false
    const offset = () => {
      const r = el.getBoundingClientRect()
      const v = vp.getBoundingClientRect()
      const k = r.height / (el.offsetHeight || 1) || 1
      return (v.top - r.top) / k
    }
    const clone = (): Animation | null => {
      const a = host.getAnimations?.().find((x) => x.startTime !== null && x.effect instanceof KeyframeEffect)
      const fx = a?.effect as KeyframeEffect | undefined
      if (!a || !fx) return null
      const kf = fx.getKeyframes()
      const ys = kf.map((f) => /translateY\((-?[\d.]+)px\)/.exec(String(f.transform ?? ''))?.[1])
      if (!kf.length || ys.some((y) => y === undefined)) return null
      const m = ly.animate(
        kf.map((f, i) => ({ offset: f.offset, easing: f.easing, transform: `translateY(${-Number(ys[i])}px)` })),
        fx.getTiming(),
      )
      m.startTime = a.startTime
      a.finished.then(
        () => (done = true),
        () => (done = true),
      )
      ly.style.transform = ''
      return m
    }
    const tick = () => {
      const off = offset()
      setSolid(off > 40)
      if (off > reach) setArrived(true)
      if (!mirror) mirror = clone()
      if (!mirror) ly.style.transform = `translateY(${off - base}px)`
      if (!done && performance.now() - t0 < 15000) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      window.clearTimeout(safety)
      cancelAnimationFrame(raf)
      mirror?.cancel()
    }
  }, [on, base, reach, root])

  const layerStyle: CSSProperties = { position: 'absolute', left: 0, top: base, width: '100%', height: 0, zIndex: 30 }
  return { layer, layerStyle, solid, arrived }
}

/* ---------- замер строк после загрузки шрифта ---------- */

function useWidths(texts: string[], style: CSSProperties) {
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const [ws, setWs] = useState<number[] | null>(null)
  const key = texts.join('|')
  useLayoutEffect(() => {
    let alive = true
    const m = () => {
      if (!alive) return
      const next = texts.map((_, i) => refs.current[i]?.offsetWidth ?? 0)
      if (!next.every((w) => w > 0)) return
      setWs((prev) => (prev && prev.length === next.length && prev.every((w, i) => w === next[i]) ? prev : next))
    }
    m()
    const f = document.fonts
    f?.ready.then(m)
    f?.addEventListener?.('loadingdone', m)
    const t = window.setTimeout(m, 700)
    return () => {
      alive = false
      window.clearTimeout(t)
      f?.removeEventListener?.('loadingdone', m)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const probes = (
    <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
      {texts.map((t, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          style={{ ...style, display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          {t}
        </span>
      ))}
    </span>
  )
  return [ws, probes] as const
}

/* ---------- кирпичи ---------- */

/** Услуга «вписывается» слева направо, как будто её пишут */
function Write({ i, children, base = 0.35 }: { i: number; children: ReactNode; base?: number }) {
  const on = useAnimOn()
  const t = useTr(base + i * 0.2, 0.5, WRITE)
  return (
    <motion.span
      style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
      initial={on ? { clipPath: 'inset(-30% 106% -30% -6%)' } : false}
      animate={{ clipPath: 'inset(-30% -6% -30% -6%)' }}
      transition={t}
    >
      {children}
    </motion.span>
  )
}

/** Жёлтый маркер под словом: мазок и тёмная копия слова открываются одной шторкой */
function Marker({ children, delay, dur = 0.65 }: { children: ReactNode; delay: number; dur?: number }) {
  const clip = useWipe(delay, dur)
  return (
    <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
      <Write i={1}>{children}</Write>
      <motion.span
        aria-hidden
        style={{ position: 'absolute', top: '-.1em', bottom: '-.16em', left: '-.14em', right: '-.1em', clipPath: clip, pointerEvents: 'none' }}
      >
        <Swash style={{ position: 'absolute', left: 0, top: '.3em', width: '100%', height: 'calc(100% - .5em)', transform: 'rotate(-1.5deg)' }} />
        <span style={{ position: 'absolute', left: '.14em', top: '.1em', color: C.ink, whiteSpace: 'nowrap' }}>{children}</span>
      </motion.span>
    </span>
  )
}

function Swash({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 200 40" preserveAspectRatio="none" style={style} aria-hidden>
      <path d="M3 8 L10 5 L60 4 L140 5 L193 3 L197 9 L195 20 L199 31 L190 36 L120 35 L50 37 L8 36 L2 30 L5 19Z" fill={C.lamp} />
      <path d="M8 12H190M6 28H192" stroke={C.streak} strokeOpacity={0.5} strokeWidth={2} vectorEffect="non-scaling-stroke" fill="none" />
    </svg>
  )
}

/** Учительская галочка от руки */
function Tick({ delay, size = 16 }: { delay: number; size?: number }) {
  const on = useAnimOn()
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ transform: 'rotate(-6deg)', flex: 'none', overflow: 'visible' }} aria-hidden>
      <motion.path
        d="M2 9 L6 13 L14 3"
        fill="none"
        stroke={C.ink}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={on ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={on ? { delay, duration: 0.35, ease: [0.5, 0, 0.3, 1] } : { duration: 0 }}
      />
    </svg>
  )
}

function Pill({
  kind,
  children,
  h,
  px,
  fs,
  style,
}: {
  kind: 'lamp' | 'ghost' | 'line'
  children: ReactNode
  h: number
  px: number
  fs: number
  style?: CSSProperties
}) {
  const cls =
    kind === 'lamp'
      ? 'transition duration-200 hover:-translate-y-px hover:!bg-[#FFE385]'
      : 'transition duration-200 hover:!bg-white/15'
  return (
    <span
      className={cls}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        height: h,
        padding: `0 ${px}px`,
        borderRadius: 999,
        fontFamily: SANS,
        fontWeight: kind === 'lamp' ? 600 : 500,
        fontSize: fs,
        letterSpacing: '-.005em',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        background: kind === 'lamp' ? C.lamp : kind === 'ghost' ? 'rgba(255,255,255,.06)' : 'transparent',
        color: kind === 'lamp' ? C.ink : '#fff',
        border: kind === 'lamp' ? 'none' : kind === 'ghost' ? '1.5px solid rgba(255,255,255,.7)' : '1px solid rgba(255,255,255,.55)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/**
 * Видео урока на всю высоту первого экрана: полоса фактов ложится поверх кадра,
 * поэтому до её шторки под видео нет чёрной плиты. Проявляется из темноты и чуть «садится»
 */
function HeroVideo({ d, h, strip, position, top, pool, bottom }: { d: Draft; h: number; strip: number; position: string; top: number; pool: string; bottom: number }) {
  const on = useAnimOn()
  const v = nicheVideo(d, 'edu')
  const layer: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' }
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: h, overflow: 'hidden', background: C.ink }}>
      <motion.div
        className="absolute inset-0"
        initial={on ? { opacity: 0, transform: 'scale(1.04)' } : false}
        animate={{ opacity: 1, transform: 'scale(1)' }}
        transition={on ? { opacity: { duration: 0.6, ease: 'linear' }, transform: { duration: 2.4, ease: EASE } } : { duration: 0 }}
        style={{ filter: 'brightness(.94) contrast(1.04) saturate(1.15)' }}
      >
        <BgVideo src={v.src} poster={v.poster} position={position} push={false} reveal="none" className="absolute inset-0" />
      </motion.div>
      <div style={{ ...layer, background: warm(0.3) }} />
      <div style={{ ...layer, background: `linear-gradient(180deg, ${warm(0.72)} 0, ${warm(0.3)} ${Math.round(top * 0.58)}px, ${warm(0)} ${top}px)` }} />
      <div style={{ ...layer, background: `radial-gradient(${pool}, ${warm(0.35)}, transparent 70%)` }} />
      <div style={{ ...layer, background: `linear-gradient(0deg, ${warm(0.3)} 0, ${warm(0.3)} ${strip}px, ${warm(0)} ${strip + bottom}px)` }} />
    </div>
  )
}

/**
 * Шапка: прозрачная над видео, после 40 px прокрутки — сплошная ink (слой фона растворяется за .3 с).
 * Лежит в «фиксированном» слое из useScroll
 */
function NavBar({ h, solid, children, style }: { h: number; solid: boolean; children: ReactNode; style?: CSSProperties }) {
  const on = useAnimOn()
  return (
    <motion.div
      style={{ position: 'absolute', left: 0, right: 0, top: 0, height: h, pointerEvents: 'auto' }}
      initial={on ? { opacity: 0, transform: 'translateY(-8px)' } : false}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={on ? { delay: 0.15, duration: 0.4, ease: EASE } : { duration: 0 }}
    >
      <div style={{ position: 'absolute', inset: 0, background: C.ink, opacity: solid ? 1 : 0, transition: on ? 'opacity .3s ease-out' : 'none' }} />
      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', ...style }}>{children}</div>
    </motion.div>
  )
}

function Up({ delay, dur = 0.5, y = 10, scale, children, style }: { delay: number; dur?: number; y?: number; scale?: number; children: ReactNode; style?: CSSProperties }) {
  const on = useAnimOn()
  const from = `translateY(${y}px)${scale ? ` scale(${scale})` : ''}`
  const to = `translateY(0px)${scale ? ' scale(1)' : ''}`
  return (
    <motion.div
      style={style}
      initial={on ? { opacity: 0, transform: from } : false}
      animate={{ opacity: 1, transform: to }}
      transition={on ? { delay, duration: dur, ease: EASE } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

/** Жёлтая полоса проявляется слева направо */
function StripWipe({ children, style, delay = 2.0 }: { children: ReactNode; style?: CSSProperties; delay?: number }) {
  const on = useAnimOn()
  return (
    <motion.div
      style={style}
      initial={on ? { clipPath: 'inset(0% 100% 0% 0%)' } : false}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      transition={on ? { delay, duration: 0.5, ease: WRITE } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

function Fact({ i, text, fs, size = 16, from = 2.25 }: { i: number; text: string; fs: number; size?: number; from?: number }) {
  const on = useAnimOn()
  const at = from + i * 0.08
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <Tick delay={at} size={size} />
      <motion.span
        style={{ fontFamily: SANS, fontWeight: 600, fontSize: fs, color: C.ink, letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        initial={on ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={on ? { delay: at, duration: 0.35 } : { duration: 0 }}
      >
        {nb(noDot(text))}
      </motion.span>
    </span>
  )
}

/* ---------- вторая секция: общие детали ---------- */

function useS(off: number, duration = 0.6, ease: Transition['ease'] = EASE): Transition {
  const on = useAnimOn()
  return on ? { delay: S2 + off, duration, ease } : { duration: 0 }
}

/** Заголовок поднимается по словам из-под маски */
function RiseWords({ lines, style }: { lines: string[]; style?: CSSProperties }) {
  const on = useAnimOn()
  let n = 0
  return (
    <h2 style={{ margin: 0, ...style }}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          {line.split(' ').map((w, wi) => {
            const k = n++
            return (
              <Fragment key={wi}>
                {wi > 0 && ' '}
                <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0 .04em .12em', margin: '0 -.04em -.12em' }}>
                  <motion.span
                    style={{ display: 'inline-block' }}
                    initial={on ? { transform: 'translateY(110%)' } : false}
                    animate={{ transform: 'translateY(0%)' }}
                    transition={on ? { delay: S2 + 0.1 + k * 0.05, duration: 0.6, ease: EASE } : { duration: 0 }}
                  >
                    {w}
                  </motion.span>
                </span>
              </Fragment>
            )
          })}
        </span>
      ))}
    </h2>
  )
}

function Panel({ off, k, children, style, bg }: { off: number; k: number; children: ReactNode; style: CSSProperties; bg: string }) {
  const on = useAnimOn()
  return (
    <motion.div
      style={{ position: 'absolute', overflow: 'hidden', borderRadius: 24, background: bg, ...style }}
      initial={on ? { clipPath: 'inset(12% 0% 0% 0% round 24px)', transform: `translateY(${30 * k}px)` } : false}
      animate={{ clipPath: 'inset(0% 0% 0% 0% round 24px)', transform: 'translateY(0px)' }}
      transition={on ? { delay: S2 + off, duration: 0.6, ease: EASE } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

function PanelLabel({ children, fs = 15, top = 22 }: { children: ReactNode; fs?: number; top?: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, zIndex: 5, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: fs, color: C.ink, letterSpacing: '-.01em' }}>
      {children}
    </div>
  )
}

type TagSpec = { x: number; y: number; r: number }

/** Бумажный ярлык: падает на панель с лёгким перебором и ложится под своим углом */
function Tag({ text, at, i, fs }: { text: string; at: TagSpec; i: number; fs: number }) {
  const on = useAnimOn()
  return (
    <motion.span
      style={{
        position: 'absolute',
        left: at.x,
        top: at.y,
        padding: `${Math.round(fs * 0.13)}px ${Math.round(fs * 0.47)}px`,
        borderRadius: 4,
        background: C.paper,
        color: C.ink,
        whiteSpace: 'nowrap',
        fontSize: fs,
        lineHeight: 1.2,
        ...DISPLAY,
        letterSpacing: '-.015em',
      }}
      initial={on ? { opacity: 0, scale: 1.15, rotate: 0 } : false}
      animate={{ opacity: 1, scale: 1, rotate: at.r }}
      transition={
        on
          ? { type: 'spring', stiffness: 380, damping: 20, delay: S2 + 0.2 + i * 0.025, opacity: { duration: 0.2, delay: S2 + 0.2 + i * 0.025 } }
          : { duration: 0 }
      }
    >
      {text}
    </motion.span>
  )
}

/**
 * Чип в блокноте. Выбранный закрашивается тем же маркером, что и услуга в первом экране:
 * мазок шире таблетки и чуть наклонён, рваные концы выходят за её края
 */
function Chip({ text, picked, delay, go, h, fs, px }: { text: string; picked: boolean; delay: number; go: boolean; h: number; fs: number; px: number }) {
  const clip = useWipe(delay, 0.35, go)
  const over = Math.round(h * 0.16)
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        height: h,
        padding: `0 ${px}px`,
        borderRadius: 999,
        background: C.chip,
        fontFamily: SANS,
        fontWeight: 500,
        fontSize: fs,
        color: C.ink,
        whiteSpace: 'nowrap',
        isolation: 'isolate',
      }}
    >
      {picked && (
        <motion.span
          aria-hidden
          style={{ position: 'absolute', left: -over, right: -over, top: -Math.round(h * 0.12), bottom: -Math.round(h * 0.1), clipPath: clip, zIndex: -1, transform: 'rotate(-1.5deg)' }}
        >
          <Swash style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        </motion.span>
      )}
      {text}
    </span>
  )
}

/** Страница блокнота: вопрос и форматы школы чипами, два выбраны маркером */
function Notebook({ d, w, h, s, go, title = 26 }: { d: Draft; w: number; h: number; s: number; go: boolean; title?: number }) {
  const n = d.niche
  const chips = [...n.services.map(noDot), 'Пока не знаю', 'Другое…']
  const line = Math.round(32 * s)
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: 18 * s,
        background: `repeating-linear-gradient(180deg, transparent 0 ${line - 1}px, ${ink(0.07)} ${line - 1}px ${line}px) 0px ${Math.round(10 * s)}px, ${C.page}`,
        boxShadow: `0 ${24 * s}px ${48 * s}px ${ink(0.25)}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: Math.round(28 * s), top: 0, bottom: 0, width: 1, background: C.apple, opacity: 0.4 }} />
      <div style={{ position: 'absolute', left: Math.round(44 * s), right: Math.round(16 * s), top: Math.round(26 * s) }}>
        <div style={{ ...DISPLAY, letterSpacing: '-.015em', fontSize: Math.round(title * s), lineHeight: 1.18, color: C.ink, textWrap: 'balance' }}>{nb('Что вам подойдёт?')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: Math.round(8 * s), marginTop: Math.round(22 * s) }}>
          {chips.map((c, i) => (
            <Chip
              key={i}
              text={nb(c)}
              picked={i === 0 || i === 2}
              delay={0.05 + (i === 2 ? 0.15 : 0)}
              go={go}
              h={Math.round(38 * s)}
              fs={Math.round(15 * s)}
              px={Math.round(14 * s)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Две карточки из прайса ниши: формат и цена «от …». Бесплатный пробный урок пропускаем,
 * он и так на кнопках. Прайса нет — берём первую и третью услугу без цены
 */
function courses(d: Draft): { title: string; price: string }[] {
  const rows = d.niche.list.filter(([, p]) => !/бесплатн/iu.test(p))
  if (rows.length >= 2) {
    const b = rows[Math.min(2, rows.length - 1)]
    return [rows[0], b].map(([t, p]) => ({ title: noDot(t), price: noDot(p) }))
  }
  const [a, , c] = d.niche.services.map(noDot)
  return [
    { title: a, price: '' },
    { title: c, price: '' },
  ]
}

/** Карточка курса поверх ноутбука */
function CourseCard({ title, fact, band, x, y, r, i, s }: { title: string; fact: string; band: string; x: number; y: number; r: number; i: number; s: number }) {
  const on = useAnimOn()
  const W = 116 * s
  // самый длинный неразрывный кусок после nb(): «8 занятий» не переносится, поэтому меряем его целиком
  const longest = nb(title)
    .split(' ')
    .reduce((a, b) => (b.length > a.length ? b : a), '')
  const fs = Math.max(10, Math.min(17 * s, Math.floor((W - 20 * s) / (longest.length * 0.68))))
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: W,
        height: 150 * s,
        borderRadius: 10 * s,
        background: C.page,
        overflow: 'hidden',
        boxShadow: `0 ${12 * s}px ${30 * s}px ${ink(0.22)}`,
        rotate: r,
        display: 'flex',
        flexDirection: 'column',
      }}
      initial={on ? { opacity: 0, x: -20 * s } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={on ? { delay: S2 + 0.28 + i * 0.1, duration: 0.45, ease: EASE } : { duration: 0 }}
    >
      <div style={{ height: 30 * s, background: band, flex: 'none' }} />
      <div style={{ padding: `${8 * s}px ${10 * s}px ${10 * s}px`, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 10 * s, color: C.stone }}>Формат</div>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontVariationSettings: '"opsz" 36', fontSize: fs, lineHeight: 1.15, color: C.ink, marginTop: 3 * s, letterSpacing: '-.01em', overflowWrap: 'anywhere' }}>
          {nb(title)}
        </div>
        {fact && (
          <div style={{ marginTop: 'auto' }}>
            <span
              style={{
                display: 'inline-block',
                maxWidth: '100%',
                padding: `${3 * s}px ${6 * s}px`,
                borderRadius: 4 * s,
                background: C.chip,
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 11 * s,
                lineHeight: 1.25,
                color: C.ink,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nb(fact)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/** Кадр из той же съёмки: лампа, ноутбук, рука с ручкой */
function Story({ d, off, s }: { d: Draft; off: number; s: number }) {
  const on = useAnimOn()
  const src = d.niche.video ? nicheVideo(d, 'edu').poster : asset(STORY)
  return (
    <motion.img
      src={src}
      alt=""
      draggable={false}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '0% 50%', transformOrigin: `${30 * s}% 60%` }}
      initial={on ? { transform: 'scale(1.1)' } : false}
      animate={{ transform: 'scale(1)' }}
      transition={on ? { delay: S2 + off, duration: 1.3, ease: EASE } : { duration: 0 }}
    />
  )
}

/* ---------- десктоп ---------- */

/**
 * Две наложенные стопки ярлыков по краям панели, как у Cambly: блокнот стоит в x 132–432,
 * край панели срезает внешние слова, короткие («С нуля», «ОГЭ», «Сессия») читаются целиком
 */
const DESK_TAGS: TagSpec[] = [
  // слева
  { x: -96, y: 92, r: -7 },
  { x: 10, y: 140, r: 5 },
  { x: -118, y: 190, r: -4 },
  { x: -24, y: 240, r: 9 },
  { x: 34, y: 292, r: -11 },
  { x: -150, y: 330, r: -3 },
  { x: -30, y: 372, r: 6 },
  // справа
  { x: 410, y: 92, r: 7 },
  { x: 440, y: 146, r: -6 },
  { x: 414, y: 200, r: -3 },
  { x: 450, y: 254, r: 10 },
  { x: 396, y: 306, r: -8 },
  { x: 436, y: 356, r: 4 },
]

function DesktopNav({ d, solid }: { d: Draft; solid: boolean }) {
  const nameFs = fitPx(d.name, 20, 330, 0.58)
  return (
    <NavBar h={72} solid={solid} style={{ padding: '0 40px' }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: nameFs, letterSpacing: '-.02em', color: '#fff', whiteSpace: 'nowrap', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {d.name}
      </span>
      <nav style={{ display: 'flex', gap: 28, marginLeft: 48 }}>
        {NAV.map((l) => (
          <span key={l} className="transition-colors hover:!text-white" style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, color: 'rgba(255,255,255,.88)', cursor: 'pointer' }}>
            {l}
          </span>
        ))}
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 26 }}>
        <span className="transition-colors hover:!text-white" style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, color: 'rgba(255,255,255,.88)', cursor: 'pointer' }}>
          Войти
        </span>
        <Pill kind="lamp" h={40} px={20} fs={15}>
          {d.niche.cta}
        </Pill>
      </div>
    </NavBar>
  )
}

function DesktopHero({ d }: { d: Draft }) {
  const n = d.niche
  const svcs = n.services.map((s) => nb(s.trim()))
  const probeStyle: CSSProperties = { ...DISPLAY, fontSize: 84 }
  const [ws, probes] = useWidths([svcs.join(' ')], probeStyle)
  const est = svcs.join(' ').length * 84 * 0.5
  // Цель 1100 px; замер идёт по сплошной строке, а в заголовке слова — отдельные блоки, поэтому берём с запасом
  const raw = Math.min(84, (84 * 1070) / (ws?.[0] ?? est))
  const wrap = raw < 56
  const size = wrap ? 56 : Math.floor(raw * 10) / 10

  return (
    <section style={{ position: 'relative', width: 1280, height: 760, overflow: 'hidden', background: C.ink }}>
      {probes}
      <HeroVideo d={d} h={760} strip={64} position="50% 50%" top={520} pool="ellipse 720px 300px at 50% 38%" bottom={140} />

      <div style={{ position: 'absolute', left: 90, right: 90, top: 196, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h1
          style={{
            ...DISPLAY,
            margin: 0,
            fontSize: size,
            lineHeight: 1.1,
            color: '#fff',
            textWrap: wrap ? 'balance' : 'nowrap',
            maxWidth: 1100,
          }}
        >
          {svcs.map((s, i) => (
            <Fragment key={i}>
              {i > 0 && ' '}
              {i === 1 ? <Marker delay={1.2}>{s}</Marker> : <Write i={i}>{s}</Write>}
            </Fragment>
          ))}
        </h1>
        <Up delay={1.5} dur={0.5} style={{ marginTop: wrap ? 20 : 24, minHeight: 73 }}>
          <p
            style={{
              margin: 0,
              maxWidth: 720,
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontWeight: 400,
              fontVariationSettings: '"opsz" 36',
              fontSize: 26,
              lineHeight: 1.4,
              color: 'rgba(255,255,255,.9)',
              textWrap: 'balance',
            }}
          >
            {nb(noDot(n.pain))}
          </p>
        </Up>
      </div>

      <Up delay={1.75} dur={0.4} y={12} scale={0.96} style={{ position: 'absolute', left: 0, right: 0, top: 428, display: 'flex', justifyContent: 'center', gap: 14 }}>
        <Pill kind="lamp" h={64} px={36} fs={18}>
          {n.cta}
        </Pill>
        <Pill kind="ghost" h={64} px={32} fs={18}>
          {n.cta2}
        </Pill>
      </Up>

      <StripWipe style={{ position: 'absolute', left: 0, right: 0, top: 696, height: 64, background: C.lamp, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', alignItems: 'center', padding: '0 40px' }}>
        {n.facts.map((f, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'center', minWidth: 0, padding: '0 12px' }}>
            <Fact i={i} text={f} fs={16} />
          </div>
        ))}
      </StripWipe>
    </section>
  )
}

function DesktopSecond({ d, go }: { d: Draft; go: boolean }) {
  const n = d.niche
  const words = goals(d, GOALS)
  const [a, b] = courses(d)
  const on = useAnimOn()
  const leadT = useS(0.22, 0.5)
  return (
    <section style={{ position: 'relative', width: 1280, height: 760, overflow: 'hidden', background: C.paper }}>
      <RiseWords lines={[nb('Начнём с вашей цели')]} style={{ position: 'absolute', left: 0, right: 0, top: 104, textAlign: 'center', ...DISPLAY, fontSize: 48, lineHeight: 1.1, color: C.ink }} />
      <motion.p
        style={{ position: 'absolute', left: 0, right: 0, top: 172, margin: '0 auto', maxWidth: 600, textAlign: 'center', fontFamily: SANS, fontWeight: 400, fontSize: 17, lineHeight: 1.55, color: C.stone, textWrap: 'balance' }}
        initial={on ? { opacity: 0, transform: 'translateY(10px)' } : false}
        animate={{ opacity: 1, transform: 'translateY(0px)' }}
        transition={leadT}
      >
        {nb('Скажите, к чему готовитесь, — подберём формат и преподавателя')}
      </motion.p>
      <SecondCta cta={n.cta} top={248} h={56} px={30} fs={17} />

      <Panel off={0.05} k={1} bg={C.apple} style={{ left: 64, top: 336, width: 564, height: 400 }}>
        <PanelLabel>Под вашу цель</PanelLabel>
        {words.map((w, i) => (
          <Tag key={i} text={w} at={DESK_TAGS[i]} i={i} fs={30} />
        ))}
        <NotebookIn off={0.25} y={24} style={{ position: 'absolute', left: 132, top: 64, zIndex: 3 }}>
          <Notebook d={d} w={300} h={300} s={1} go={go} />
        </NotebookIn>
      </Panel>

      <Panel off={0.12} k={1} bg="#E9DCC8" style={{ left: 652, top: 336, width: 564, height: 400 }}>
        <Story d={d} off={0.12} s={1} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 90, background: 'linear-gradient(180deg, rgba(250,244,235,.55), rgba(250,244,235,0))' }} />
        <PanelLabel>Как вам удобно</PanelLabel>
        <CourseCard title={a.title} fact={a.price} band={C.apple} x={16} y={214} r={-4} i={0} s={1} />
        <CourseCard title={b.title} fact={b.price} band={C.lamp} x={104} y={232} r={3} i={1} s={1} />
      </Panel>
    </section>
  )
}

function SecondCta({ cta, top, h, px, fs, full }: { cta: string; top: number; h: number; px: number; fs: number; full?: boolean }) {
  const on = useAnimOn()
  return (
    <motion.div
      style={{ position: 'absolute', left: full ? 20 : 0, right: full ? 20 : 0, top, display: 'flex', justifyContent: 'center' }}
      initial={on ? { opacity: 0, scale: 0.94 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={on ? { type: 'spring', stiffness: 300, damping: 22, delay: S2 + 0.28, opacity: { duration: 0.25, delay: S2 + 0.28 } } : { duration: 0 }}
    >
      <Pill kind="lamp" h={h} px={px} fs={fs} style={full ? { width: '100%' } : undefined}>
        {cta}
      </Pill>
    </motion.div>
  )
}

function NotebookIn({ off, y, children, style }: { off: number; y: number; children: ReactNode; style?: CSSProperties }) {
  const on = useAnimOn()
  return (
    <motion.div
      style={style}
      initial={on ? { opacity: 0, transform: `translateY(${y}px)` } : false}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={on ? { delay: S2 + off, duration: 0.45, ease: EASE } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

function Desktop({ d }: { d: Draft }) {
  const root = useRef<HTMLDivElement>(null)
  const { layer, layerStyle, solid, arrived } = useScroll(root, 760)
  return (
    <div ref={root} style={{ position: 'relative', width: 1280, height: 1520, background: C.paper }}>
      <DesktopHero d={d} />
      <DesktopSecond d={d} go={arrived} />
      <div ref={layer} className="pointer-events-none" style={layerStyle}>
        <DesktopNav d={d} solid={solid} />
      </div>
    </div>
  )
}

/* ---------- телефон ---------- */

/** Блокнот сдвинут вправо (x 118–332): в левом поле три коротких ярлыка читаются целиком */
const MOB_TAGS: TagSpec[] = [
  { x: 22, y: 60, r: -8 },
  { x: 36, y: 104, r: 6 },
  { x: -2, y: 150, r: -5 },
  { x: 26, y: 196, r: 7 },
  { x: -38, y: 242, r: -4 },
]

function MobileNav({ d, solid }: { d: Draft; solid: boolean }) {
  const nameFs = fitPx(d.name, 18, 270, 0.58)
  return (
    <NavBar h={60} solid={solid} style={{ padding: '0 20px', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: nameFs, letterSpacing: '-.02em', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 290 }}>
        {d.name}
      </span>
      <span style={{ width: 40, height: 40, marginRight: -10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }} aria-label="Меню">
        <span style={{ width: 20, height: 1.5, background: '#fff', borderRadius: 1 }} />
        <span style={{ width: 20, height: 1.5, background: '#fff', borderRadius: 1 }} />
      </span>
    </NavBar>
  )
}

function MobileHero({ d }: { d: Draft }) {
  const n = d.niche
  const svcs = n.services.map((s) => nb(s.trim()))
  const [ws, probes] = useWidths(svcs, { ...DISPLAY, fontSize: 50 })
  const sizes = svcs.map((s, i) => {
    const w = ws?.[i] ?? s.length * 50 * 0.5
    return Math.max(30, Math.floor(Math.min(50, (50 * 350) / w) * 10) / 10)
  })

  return (
    <section style={{ position: 'relative', width: 390, height: 800, overflow: 'hidden', background: C.ink }}>
      {probes}
      <HeroVideo d={d} h={800} strip={168} position="45% 50%" top={420} pool="ellipse 240px 280px at 50% 36%" bottom={120} />

      <h1 style={{ position: 'absolute', left: 20, right: 20, top: 128, margin: 0, textAlign: 'center', color: '#fff', ...DISPLAY }}>
        {svcs.map((s, i) => (
          <span key={i} style={{ display: 'block', fontSize: sizes[i], lineHeight: 1.06 }}>
            {i === 1 ? <Marker delay={1.2}>{s}</Marker> : <Write i={i}>{s}</Write>}
          </span>
        ))}
      </h1>

      <Up delay={1.5} style={{ position: 'absolute', left: 30, right: 30, top: 310, display: 'flex', justifyContent: 'center' }}>
        <p
          style={{
            margin: 0,
            maxWidth: 330,
            textAlign: 'center',
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            fontVariationSettings: '"opsz" 36',
            fontSize: 19,
            lineHeight: 1.42,
            color: 'rgba(255,255,255,.9)',
            textWrap: 'balance',
          }}
        >
          {nb(noDot(n.pain))}
        </p>
      </Up>

      <Up delay={1.75} dur={0.4} y={12} scale={0.96} style={{ position: 'absolute', left: 20, right: 20, top: 424, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Pill kind="lamp" h={56} px={24} fs={17} style={{ width: '100%' }}>
          {n.cta}
        </Pill>
        <Pill kind="ghost" h={56} px={24} fs={17} style={{ width: '100%' }}>
          {n.cta2}
        </Pill>
      </Up>

      <StripWipe delay={1.9} style={{ position: 'absolute', left: 0, right: 0, top: 632, height: 168, background: C.lamp, padding: '0 20px' }}>
        {n.facts.map((f, i) => (
          <div key={i} style={{ height: 56, display: 'flex', alignItems: 'center', borderTop: i ? `1px solid ${C.rule}` : 'none', minWidth: 0 }}>
            <Fact i={i} text={f} fs={15} from={2.15} />
          </div>
        ))}
      </StripWipe>
    </section>
  )
}

function MobileSecond({ d, go }: { d: Draft; go: boolean }) {
  const n = d.niche
  const words = goals(d, MOB_GOALS).slice(0, MOB_TAGS.length)
  const [a, b] = courses(d)
  const on = useAnimOn()
  const leadT = useS(0.22, 0.5)
  return (
    <section style={{ position: 'relative', width: 390, height: 800, overflow: 'hidden', background: C.paper }}>
      <RiseWords
        lines={['Начнём', nb('с вашей цели')]}
        style={{ position: 'absolute', left: 20, right: 20, top: 88, textAlign: 'center', ...DISPLAY, fontSize: 34, lineHeight: 1.1, color: C.ink }}
      />
      <motion.p
        style={{ position: 'absolute', left: 0, right: 0, top: 178, margin: '0 auto', maxWidth: 320, textAlign: 'center', fontFamily: SANS, fontWeight: 400, fontSize: 16, lineHeight: 1.55, color: C.stone, textWrap: 'balance' }}
        initial={on ? { opacity: 0, transform: 'translateY(8px)' } : false}
        animate={{ opacity: 1, transform: 'translateY(0px)' }}
        transition={leadT}
      >
        {nb('Скажите, к чему готовитесь, — подберём формат и преподавателя')}
      </motion.p>
      <SecondCta cta={n.cta} top={272} h={56} px={24} fs={17} full />

      <Panel off={0.05} k={0.8} bg={C.apple} style={{ left: 20, top: 352, width: 350, height: 280 }}>
        <PanelLabel fs={14} top={16}>
          Под вашу цель
        </PanelLabel>
        {words.map((w, i) => (
          <Tag key={i} text={w} at={MOB_TAGS[i]} i={i} fs={18} />
        ))}
        <NotebookIn off={0.25} y={19} style={{ position: 'absolute', left: 118, top: 54, zIndex: 3 }}>
          <Notebook d={d} w={214} h={240} s={0.8} go={go} title={24} />
        </NotebookIn>
      </Panel>

      <Panel off={0.12} k={0.8} bg="#E9DCC8" style={{ left: 20, top: 648, width: 350, height: 280 }}>
        <Story d={d} off={0.12} s={1} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 72, background: 'linear-gradient(180deg, rgba(250,244,235,.55), rgba(250,244,235,0))' }} />
        <PanelLabel fs={14} top={16}>
          Как вам удобно
        </PanelLabel>
        <CourseCard title={a.title} fact={a.price} band={C.apple} x={12} y={120} r={-4} i={0} s={0.8} />
        <CourseCard title={b.title} fact={b.price} band={C.lamp} x={84} y={134} r={3} i={1} s={0.8} />
      </Panel>
    </section>
  )
}

function Mobile({ d }: { d: Draft }) {
  const root = useRef<HTMLDivElement>(null)
  const { layer, layerStyle, solid, arrived } = useScroll(root, 800)
  return (
    <div ref={root} style={{ position: 'relative', width: 390, height: 1600, background: C.paper }}>
      <MobileHero d={d} />
      <MobileSecond d={d} go={arrived} />
      <div ref={layer} className="pointer-events-none" style={layerStyle}>
        <MobileNav d={d} solid={solid} />
      </div>
    </div>
  )
}

export default { Desktop, Mobile } satisfies Template
