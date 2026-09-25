/**
 * Спорт. Референс — BLOK London: тёмный кадр с тёплым светом, один гротеск, иерархия прозрачностью
 * 100 / 80 / 45 и предложение в одной «таблетке», которая едет за посетителем и инвертируется над бумагой.
 * WOW — «свет в зале»: страница открывается в темноте, и свет приходит из самого кадра.
 * В ролике сферы (боксёр) мигает и загорается та лампа, что стоит за ним, как в зале в шесть утра.
 * В роликах ниш без лампы (йога у стены в солнечных полосах) свет приходит мягко, как солнце из-за облака.
 * Вторая секция — белый экран-высказывание: факты одной фразой, направления в три колонки и цены
 */
import '@fontsource-variable/inter-tight'
import { motion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import type { Draft } from '../../../data/niches'
import type { Template } from '.'
import { BgVideo, SECOND_AT, nicheVideo, useAnimOn } from '../anim'

const FONT = "'Inter Tight Variable', 'Inter Tight', system-ui, sans-serif"
const C = {
  night: '#070301',
  tungsten: '#7E2600',
  ink: '#0B0908',
  ink45: 'rgba(11,9,8,.45)',
  ink80: 'rgba(11,9,8,.8)',
  rule: 'rgba(11,9,8,.12)',
}
const JAB = [0.16, 1, 0.3, 1] as const
const OUT = [0.22, 1, 0.36, 1] as const
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='220' height='220' filter='url(#n)'/></svg>",
)}")`

/* Мигание лампы: вуаль и свечение в противофазе. Мигание несёт вуаль, свечение только подсвечивает лампу */
const FLICK_T = [0, 0.12, 0.2, 0.38, 0.46, 0.7, 1]
const VEIL = [1, 0.55, 0.95, 0.3, 0.85, 0.12, 0]
const BLOOM = [0, 0.7, 0.1, 0.75, 0.2, 0.6, 0.38]
/* Без лампы: свет приходит в два вдоха, как солнце из-за облака */
const SUN_T = [0, 0.25, 0.4, 0.7, 0.88, 1]
const SUN = [1, 0.72, 0.78, 0.3, 0.08, 0]

/**
 * Ролики сферы. Лампа есть только в ролике боксёра: её координаты на кадре 1280×760 (десктоп) и 390×800 (телефон).
 * light — светлый кадр (стена в солнце): нужны вуаль сверху под шапкой и плотнее низ под словами.
 * Ролика нет в таблице — считаем его светлым: так текст читается на любом кадре
 */
type Clip = { pos: string; lamp?: { d: [number, number]; m: [number, number] }; light: boolean; grade: string }
const CLIPS: Record<string, Clip> = {
  sport: { pos: '47% 50%', lamp: { d: [520, 336], m: [100, 354] }, light: false, grade: 'sepia(.5) saturate(2.2) hue-rotate(-12deg) brightness(1.05)' },
  yoga: { pos: '47% 50%', light: true, grade: 'sepia(.3) saturate(1.35) hue-rotate(-8deg)' },
}
const clipOf = (d: Draft): Clip => CLIPS[d.niche.video ?? 'sport'] ?? { pos: '50% 50%', light: true, grade: 'sepia(.25) saturate(1.3)' }

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect

/* ---------- текст ---------- */

const SHORT = /(^|[\s(«])(в|во|на|за|с|со|к|ко|у|о|об|по|до|из|от|и|а|но|не|для|без|при|под|над|про)\s+/giu
/** Неразрывный пробел после коротких предлогов и союзов и между числом и следующим словом */
const nb = (s: string) => s.replace(SHORT, '$1$2 ').replace(SHORT, '$1$2 ').replace(/(\d)\s+(?=\S)/g, '$1 ')
const bare = (s: string) => s.trim().replace(/[.\s]+$/u, '')
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const sentence = (s: string) => {
  const t = cap(s.trim())
  return /[.!?…]$/u.test(t) ? t : `${t}.`
}
/** Факты высказывания: точки между фактами, в конце точки нет */
const factsOf = (d: Draft) => d.niche.facts.map((f, i, a) => nb(i < a.length - 1 ? sentence(f) : cap(bare(f))))

/** Ширина строки в px: меряем настоящим шрифтом в скрытом span */
let meter: HTMLSpanElement | null = null
function tw(text: string, px: number, weight = 500, track = -0.035) {
  if (typeof document === 'undefined') return text.length * px * 0.52
  if (!meter || !meter.isConnected) {
    meter = document.createElement('span')
    Object.assign(meter.style, { position: 'absolute', left: '-99999px', top: '0', visibility: 'hidden', whiteSpace: 'pre', fontFamily: FONT })
    document.body.appendChild(meter)
  }
  meter.style.fontSize = `${px}px`
  meter.style.fontWeight = String(weight)
  meter.style.letterSpacing = `${track}em`
  meter.textContent = text
  return meter.getBoundingClientRect().width
}
/** Стрелка рисуется SVG шириной .8em и отступом .22em */
const ARROW_EM = 1.02

/** Перемеряем текст, когда догрузится шрифт (кириллица приходит отдельным файлом) */
function useFontTick() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const fs = typeof document !== 'undefined' ? document.fonts : undefined
    if (!fs) return
    let alive = true
    const bump = () => alive && setN((x) => x + 1)
    fs.load(`500 40px 'Inter Tight Variable'`, 'Бокс Box').then(bump, () => {})
    fs.load(`600 20px 'Inter Tight Variable'`, 'ЗАЛ').then(bump, () => {})
    fs.ready.then(bump)
    fs.addEventListener('loadingdone', bump)
    return () => {
      alive = false
      fs.removeEventListener('loadingdone', bump)
    }
  }, [])
  return n
}

/** Высота блока после раскладки: от неё строится всё, что ниже */
function useHeight(ref: RefObject<HTMLElement | null>, guess: number, deps: unknown[]) {
  const [hgt, setH] = useState(guess)
  useIso(() => {
    const e = ref.current
    if (e && e.offsetHeight) setH(e.offsetHeight)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return hgt
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/* ---------- «фиксированные» навигация и таблетка ---------- */

/*
 * Макет прокручивает ScrollDemo (translateY всего содержимого). Чтобы шапка и таблетка вели себя
 * как position: fixed, слой с ними едет навстречу. Кривую не копируем числами: берём настоящую
 * анимацию прокрутки (WAAPI) и запускаем её зеркало с тем же startTime — слой стоит на месте
 * при любой длительности и любых times. Нет WAAPI — слой каждый кадр догоняет настоящее положение.
 * Цвет шапки и таблетки тоже по настоящему положению страницы, а не по таймеру
 */
function useFixed(root: RefObject<HTMLDivElement | null>, h: number, navH: number, pillMid: number) {
  const on = useAnimOn()
  const layer = useRef<HTMLDivElement>(null)
  const [base, setBase] = useState(0)
  const [paper, setPaper] = useState({ nav: false, pill: false })
  // шапка становится сплошной, когда первый экран ушёл из-под неё
  const navAt = h - navH - 8

  useIso(() => {
    const el = root.current
    const vp = el?.parentElement?.parentElement
    if (!el || !vp) return
    const r = el.getBoundingClientRect()
    const v = vp.getBoundingClientRect()
    const k = r.height / (el.offsetHeight || 1) || 1
    const b = clamp(Math.round((v.top - r.top) / k), 0, h)
    setBase(b)
    setPaper({ nav: b > navAt, pill: b > pillMid })
  }, [on, h, navAt, pillMid])

  useEffect(() => {
    const el = root.current
    const ly = layer.current
    const host = el?.parentElement
    const vp = host?.parentElement
    if (!on || !el || !ly || !host || !vp || !host.classList.contains('scroll-demo')) return
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
      const nav = off > navAt
      const pill = off > pillMid
      setPaper((s) => (s.nav === nav && s.pill === pill ? s : { nav, pill }))
      if (!mirror) mirror = clone()
      if (!mirror) ly.style.transform = `translateY(${off - base}px)`
      if (!done && performance.now() - t0 < 15000) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      mirror?.cancel()
    }
  }, [on, base, navAt, pillMid, root])

  const layerProps = {
    ref: layer,
    className: 'pointer-events-none',
    style: { position: 'absolute', left: 0, top: base, width: '100%', height: h, zIndex: 30 } as CSSProperties,
  }
  return { layerProps, paper }
}

/** Два состояния одного элемента, перекрёстным растворением */
function Tone({ show, children, className, style }: { show: boolean; children: ReactNode; className?: string; style?: CSSProperties }) {
  const on = useAnimOn()
  return (
    <motion.div
      className={className ?? 'absolute inset-0'}
      style={style}
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      transition={on ? { duration: 0.3, ease: 'easeOut' } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

/** Шапка появляется последней: сначала свет, потом слова */
function NavIn({ children, style }: { children: ReactNode; style: CSSProperties }) {
  const on = useAnimOn()
  return (
    <motion.div
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'auto', ...style }}
      initial={on ? { opacity: 0, transform: 'translateY(-8px)' } : false}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={on ? { delay: 1.8, duration: 0.5, ease: OUT } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

function PillIn({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const on = useAnimOn()
  return (
    <motion.div
      style={{ pointerEvents: 'auto', ...style }}
      initial={on ? { opacity: 0, transform: 'translateY(18px) scale(0.96)' } : false}
      animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
      transition={
        on
          ? { default: { delay: 2, type: 'spring', stiffness: 260, damping: 24 }, opacity: { delay: 2, duration: 0.35, ease: 'easeOut' } }
          : { duration: 0 }
      }
    >
      {children}
    </motion.div>
  )
}

/** Стрелка рисуется, а не набирается: «→» нет в Inter Tight, и системный глиф разный на каждой ОС */
function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width=".8em"
      height=".8em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: '-0.06em' }}
      aria-hidden="true"
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

/** Главное предложение: белая полупрозрачная над видео, чёрная над бумагой */
function Pill({ text, paper, h, px, full }: { text: string; paper: boolean; h: number; px: number; full?: boolean }) {
  const face = (ink: boolean): CSSProperties => ({
    height: h,
    padding: '0 30px',
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4em',
    width: full ? '100%' : undefined,
    whiteSpace: 'nowrap',
    fontSize: px,
    fontWeight: 500,
    letterSpacing: '-0.01em',
    background: ink ? C.ink : 'rgba(255,255,255,.9)',
    color: ink ? '#fff' : C.night,
    backdropFilter: ink ? undefined : 'blur(12px)',
    WebkitBackdropFilter: ink ? undefined : 'blur(12px)',
    boxShadow: ink ? '0 10px 30px rgba(11,9,8,.18)' : '0 10px 40px rgba(7,3,1,.28)',
  })
  const label = (
    <>
      <span>{text}</span>
      <span className="inline-flex transition-transform duration-300 group-hover:translate-x-1">
        <ArrowIcon />
      </span>
    </>
  )
  return (
    <div className="group relative cursor-pointer" style={{ width: full ? '100%' : undefined }}>
      <Tone show={!paper} className="relative" style={{ display: 'block' }}>
        <div className="transition-colors duration-300 group-hover:bg-white!" style={face(false)}>
          {label}
        </div>
      </Tone>
      <Tone show={paper}>
        <div style={face(true)}>{label}</div>
      </Tone>
    </div>
  )
}

/* ---------- свет ---------- */

/**
 * Вуаль темноты и, если в кадре есть лампа, её свечение. Свечение живёт в той же «камере», что и видео
 * (тот же наезд), и смешивается как color-dodge: ярче становится только то, что уже светится,
 * а силуэт перед лампой остаётся чёрным
 */
function Light({ lamp, w, h }: { lamp?: [number, number]; w: number; h: number }) {
  const on = useAnimOn()
  const [breathe, setBreathe] = useState(false)
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ background: C.night }}
        initial={on ? { opacity: 1 } : false}
        animate={{ opacity: on ? (lamp ? VEIL : SUN) : 0 }}
        transition={on ? { duration: lamp ? 0.9 : 1.2, delay: 0.3, times: lamp ? FLICK_T : SUN_T, ease: 'linear' } : { duration: 0 }}
      />
      {lamp && (
        <motion.div
          className="absolute inset-0"
          style={{ mixBlendMode: 'color-dodge' }}
          initial={on ? { transform: 'scale(1.12)' } : false}
          animate={{ transform: 'scale(1)' }}
          transition={on ? { duration: 9, ease: JAB } : { duration: 0 }}
        >
          <motion.div
            style={{
              position: 'absolute',
              left: lamp[0] - w / 2,
              top: lamp[1] - h / 2,
              width: w,
              height: h,
              background:
                'radial-gradient(closest-side, rgba(216,204,160,.6), rgba(216,204,160,.25) 30%, rgba(216,204,160,.08) 62%, rgba(216,204,160,0))',
            }}
            initial={on ? { opacity: 0 } : false}
            animate={!on ? { opacity: 0.38 } : breathe ? { opacity: [0.38, 0.42, 0.3, 0.38] } : { opacity: BLOOM }}
            transition={
              !on
                ? { duration: 0 }
                : breathe
                  ? { duration: 4.64, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.9, delay: 0.3, times: FLICK_T, ease: 'linear' }
            }
            onAnimationComplete={() => on && !breathe && setBreathe(true)}
          />
        </motion.div>
      )}
    </>
  )
}

function Grain() {
  return <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, backgroundSize: '220px 220px', opacity: 0.06 }} />
}

/**
 * Кадр первого экрана: видео ниши, тёплый грейд, вуали под текст, свет и зерно.
 * На светлом кадре добавляем общее затемнение и вуаль под шапкой — белые слова читаются на любом ролике
 */
function Footage({ d, mobile }: { d: Draft; mobile?: boolean }) {
  const v = nicheVideo(d, 'sport')
  const clip = clipOf(d)
  const lamp = clip.lamp ? (mobile ? clip.lamp.m : clip.lamp.d) : undefined
  const bottom = mobile
    ? clip.light
      ? 'linear-gradient(to top, rgba(7,3,1,.94) 0%, rgba(7,3,1,.8) 30%, rgba(7,3,1,.35) 48%, rgba(7,3,1,0) 64%)'
      : 'linear-gradient(to top, rgba(7,3,1,.9) 0%, rgba(7,3,1,.6) 32%, rgba(7,3,1,0) 58%)'
    : clip.light
      ? 'linear-gradient(to top, rgba(7,3,1,.9) 0%, rgba(7,3,1,.72) 30%, rgba(7,3,1,.3) 52%, rgba(7,3,1,0) 70%)'
      : 'linear-gradient(to top, rgba(7,3,1,.78) 0%, rgba(7,3,1,.5) 30%, rgba(7,3,1,0) 55%)'
  return (
    <>
      <BgVideo src={v.src} poster={v.poster} position={mobile ? clip.pos : '50% 50%'} reveal="none" className="absolute inset-0" style={{ filter: clip.grade }} />
      <div className="absolute inset-0" style={{ background: C.tungsten, mixBlendMode: 'soft-light', opacity: 0.4 }} />
      {clip.light && <div className="absolute inset-0" style={{ background: 'rgba(7,3,1,.34)' }} />}
      {clip.light && <div className="absolute inset-x-0 top-0" style={{ height: 180, background: 'linear-gradient(to bottom, rgba(7,3,1,.55), rgba(7,3,1,0))' }} />}
      <div className="absolute inset-0" style={{ background: bottom }} />
      <Light lamp={lamp} w={mobile ? 150 : 240} h={mobile ? 180 : 280} />
      <Grain />
    </>
  )
}

/* ---------- слова ---------- */

/** Слово-джеб: выстреливает снизу из-под своей маски */
function Jab({ i, children, gap }: { i: number; children: ReactNode; gap: string | number }) {
  const on = useAnimOn()
  return (
    <span
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        verticalAlign: 'top',
        paddingTop: '0.08em',
        paddingBottom: '0.14em',
        marginTop: '-0.08em',
        marginBottom: '-0.14em',
        marginRight: gap,
      }}
    >
      <motion.span
        style={{ display: 'inline-block' }}
        initial={on ? { transform: 'translateY(130%)' } : false}
        animate={{ transform: 'translateY(0%)' }}
        transition={on ? { delay: 1.15 + i * 0.09, duration: 0.62, ease: JAB } : { duration: 0 }}
      >
        {children}
      </motion.span>
    </span>
  )
}

/** Слово высказывания во второй секции: поднимается из-под маски, когда страница доехала */
function Said({ delay, children, color }: { delay: number; children: ReactNode; color: string }) {
  const on = useAnimOn()
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.14em', marginBottom: '-0.14em', color }}>
      <motion.span
        style={{ display: 'inline-block' }}
        initial={on ? { transform: 'translateY(110%)' } : false}
        animate={{ transform: 'translateY(0%)' }}
        transition={on ? { delay, duration: 0.55, ease: JAB } : { duration: 0 }}
      >
        {children}
      </motion.span>
    </span>
  )
}

/**
 * Три факта одним абзацем: первый чёрным, остальные на 45 %.
 * Короткий факт не рвётся: строки переносятся только между фактами
 */
function Statement({ d, style, px, lh, keep, boxRef }: { d: Draft; style: CSSProperties; px: number; lh: number; keep: number; boxRef?: RefObject<HTMLDivElement | null> }) {
  const facts = factsOf(d)
  return (
    <div ref={boxRef} style={{ ...style, fontSize: px, fontWeight: 500, lineHeight: lh, letterSpacing: '-0.03em', textWrap: 'balance' }}>
      {facts.map((f, i) => {
        const words = f.split(' ')
        const whole = tw(f, px, 500, -0.03) < keep
        return (
          <span key={i}>
            <span style={whole ? { whiteSpace: 'nowrap' } : undefined}>
              {words.map((word, j) => (
                <span key={j}>
                  <Said delay={SECOND_AT + i * 0.05 + j * 0.01} color={i === 0 ? C.ink : C.ink45}>
                    {word}
                  </Said>
                  {j < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </span>
            {i < facts.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </div>
  )
}

function Hairline({ style }: { style: CSSProperties }) {
  const on = useAnimOn()
  return (
    <motion.div
      style={{ position: 'absolute', height: 1, background: C.rule, transformOrigin: '0% 50%', ...style }}
      initial={on ? { transform: 'scaleX(0)' } : false}
      animate={{ transform: 'scaleX(1)' }}
      transition={on ? { delay: SECOND_AT + 0.1, duration: 0.6, ease: OUT } : { duration: 0 }}
    />
  )
}

function Rise2({ i, children, style, at = 0.15 }: { i: number; children: ReactNode; style?: CSSProperties; at?: number }) {
  const on = useAnimOn()
  return (
    <motion.div
      style={style}
      initial={on ? { opacity: 0, transform: 'translateY(20px)' } : false}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={on ? { delay: SECOND_AT + at + i * 0.05, duration: 0.5, ease: OUT } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

/** Стрелка направления: на 45 %, при наведении уезжает на 6 px и становится чёрной */
function Arrow({ ink }: { ink?: boolean }) {
  return (
    <span
      className={`inline-flex transition duration-300 group-hover:translate-x-[6px] ${ink ? '' : 'text-[rgba(11,9,8,.45)] group-hover:text-[#0B0908]'}`}
      style={{ marginLeft: '0.22em' }}
    >
      <ArrowIcon />
    </span>
  )
}

/** Цены второй секции: название слева, цена справа, тонкая линейка сверху */
function PriceRow({ name, price, px, h, last }: { name: string; price: string; px: number; h: number; last?: boolean }) {
  return (
    <div
      style={{
        height: h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        borderTop: `1px solid ${C.rule}`,
        borderBottom: last ? `1px solid ${C.rule}` : undefined,
        fontSize: px,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis' }}>{nb(bare(name))}</span>
      <span style={{ color: C.ink45 }}>{nb(bare(price))}</span>
    </div>
  )
}

/* ---------- раскладка слов ---------- */

/** Услуги в одну строку 84 → 64 px; не влезли — две строки по 72 px с самым ровным переносом */
function heroLines(words: string[]) {
  const GAP = 0.25
  const em = words.map((w) => tw(w, 100) / 100)
  const sum = (a: number, b: number) => em.slice(a, b).reduce((x, y) => x + y, 0) + GAP * Math.max(0, b - a - 1)
  const one = sum(0, em.length)
  const s1 = Math.min(84, 1088 / one)
  if (s1 >= 64) return { lines: [words], size: Math.floor(s1), top: 468 }
  let best = { lines: [words], max: one }
  for (let i = 1; i < words.length; i++) {
    const m = Math.max(sum(0, i), sum(i, words.length))
    if (m < best.max) best = { lines: [words.slice(0, i), words.slice(i)], max: m }
  }
  return { lines: best.lines, size: Math.floor(Math.min(72, 1088 / best.max)), top: 400 }
}

/**
 * Шапка десктопа: ссылки по центру, имя слева. Сначала убираем ссылки-услуги (Цены и Контакты остаются),
 * пока имя не отойдёт от ссылок на 64 px и ссылки не отойдут от кнопки; уменьшаем имя только потом
 */
function navLayout(d: Draft) {
  const svc = d.niche.services.map(bare)
  const fixed = ['Цены', 'Контакты']
  const btn = 36 + tw(bare(d.niche.cta2).toUpperCase(), 12, 600, 0.08) + 12 * ARROW_EM
  const right = 1280 - 44 - btn
  const width = (ls: string[]) => ls.reduce((a, l) => a + tw(l, 15, 400, -0.02), 0) + 32 * (ls.length - 1)
  const nameW = tw(d.name.toUpperCase(), 20, 600, 0.06)
  const pick = (n: number) => [...svc.slice(0, n), ...fixed]
  let n = svc.length
  while (n > 0 && (640 + width(pick(n)) / 2 > right - 40 || 640 - width(pick(n)) / 2 - 44 - nameW < 64)) n--
  const links = pick(n)
  const markMax = 640 - width(links) / 2 - 44 - 64
  const mark = clamp(Math.floor((20 * markMax) / Math.max(1, nameW)), 13, 20)
  return { links, markMax, mark }
}

/* ---------- десктоп ---------- */

function NavD({ d, paper, lay }: { d: Draft; paper: boolean; lay: ReturnType<typeof navLayout> }) {
  const link = paper ? C.ink80 : 'rgba(255,255,255,.85)'
  return (
    <div
      className="absolute inset-0"
      style={{
        background: paper ? '#fff' : 'transparent',
        borderBottom: `1px solid ${paper ? C.rule : 'transparent'}`,
        color: paper ? C.ink : '#fff',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 44,
          top: 0,
          height: 72,
          maxWidth: lay.markMax,
          display: 'flex',
          alignItems: 'center',
          fontSize: lay.mark,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {d.name}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 640,
          top: 0,
          height: 72,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          fontSize: 15,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: link,
          whiteSpace: 'nowrap',
        }}
      >
        {lay.links.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <div style={{ position: 'absolute', right: 44, top: 0, height: 72, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        <span
          className="group cursor-pointer"
          style={{
            height: 40,
            padding: '0 18px',
            borderRadius: 2,
            display: 'inline-flex',
            alignItems: 'center',
            background: paper ? C.ink : '#fff',
            color: paper ? '#fff' : C.ink,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {bare(d.niche.cta2)}
          <Arrow ink />
        </span>
      </div>
    </div>
  )
}

function Desktop({ d }: { d: Draft }) {
  const on = useAnimOn()
  const tick = useFontTick()
  const root = useRef<HTMLDivElement>(null)
  const { layerProps, paper } = useFixed(root, 760, 72, 61)
  const services = d.niche.services
  const L = useMemo(() => heroLines(services.map((s) => nb(s))), [services, tick])
  const lay = useMemo(() => navLayout(d), [d, tick])
  const dirs = services.map((s) => nb(bare(s)))
  // направления в одну строку по ширине сетки: первое от левого края, последнее до правого, между ними не меньше 56 px
  const dirPx = useMemo(() => {
    const em = dirs.reduce((a, w) => a + tw(w, 100) / 100 + ARROW_EM, 0)
    return clamp(Math.floor((1088 - 56 * (dirs.length - 1)) / em), 30, 56)
  }, [dirs.join('|'), tick])
  const stateText = factsOf(d).join(' ')
  const statePx = useMemo(() => {
    const total = tw(stateText, 52, 500, -0.03)
    return total > 1000 * 2.7 ? clamp(Math.floor((52 * 1000 * 2.7) / total), 36, 52) : 52
  }, [stateText, tick])

  // вторая секция строится от настоящей высоты высказывания: без пустых полей под ним
  const stRef = useRef<HTMLDivElement>(null)
  const stH = useHeight(stRef, Math.round(statePx * 1.08 * 2), [stateText, statePx, tick])
  const list = d.niche.list.slice(0, 4)
  const ROW = 56
  const listH = Math.ceil(list.length / 2) * ROW
  const dirH = Math.round(dirPx * 1.1)
  const total = stH + 60 + 28 + dirH + (list.length ? 44 + listH : 0)
  // видимое окно второй секции в демо: от шапки до таблетки, примерно 72–600
  const top = clamp(Math.round(84 + (516 - total) / 2), 84, 176)
  const hair = top + stH + 60
  const dirTop = hair + 28
  const listTop = dirTop + dirH + 44
  let k = 0

  return (
    <div ref={root} style={{ position: 'relative', width: 1280, height: 1520, fontFamily: FONT, WebkitFontSmoothing: 'antialiased' }}>
      {/* первый экран */}
      <section style={{ position: 'relative', width: 1280, height: 760, overflow: 'hidden', background: C.night, isolation: 'isolate' }}>
        <Footage d={d} />

        <div
          role="heading"
          aria-level={1}
          style={{
            position: 'absolute',
            left: 96,
            top: L.top,
            width: 1088,
            fontSize: L.size,
            fontWeight: 500,
            lineHeight: 0.94,
            letterSpacing: '-0.035em',
            color: '#fff',
          }}
        >
          {L.lines.map((line, li) => (
            <div key={li} style={{ whiteSpace: 'nowrap' }}>
              {line.map((w, wi) => (
                <Jab key={wi} i={k++} gap={wi < line.length - 1 ? '0.25em' : 0}>
                  {w}
                </Jab>
              ))}
            </div>
          ))}
        </div>
        <motion.p
          style={{
            position: 'absolute',
            left: 96,
            top: 563,
            maxWidth: 820,
            margin: 0,
            fontSize: 30,
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,.8)',
            textWrap: 'balance',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          initial={on ? { opacity: 0, transform: 'translateY(14px)' } : false}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={on ? { delay: 1.55, duration: 0.6, ease: OUT } : { duration: 0 }}
        >
          {nb(bare(d.niche.pain))}
        </motion.p>
      </section>

      {/* вторая секция: белый экран-высказывание */}
      <section style={{ position: 'relative', width: 1280, height: 760, overflow: 'hidden', background: '#fff', color: C.ink }}>
        <Statement d={d} px={statePx} lh={1.08} keep={900} boxRef={stRef} style={{ position: 'absolute', left: 140, top, width: 1000, textAlign: 'center' }} />
        <Hairline style={{ left: 96, top: hair, width: 1088 }} />
        <div style={{ position: 'absolute', left: 96, top: dirTop, width: 1088, display: 'flex', justifyContent: 'space-between' }}>
          {dirs.map((w, i) => (
            <Rise2 key={i} i={i}>
              <div className="group" style={{ fontSize: dirPx, fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.035em', whiteSpace: 'nowrap' }}>
                {w}
                <Arrow />
              </div>
            </Rise2>
          ))}
        </div>
        {list.length > 0 && (
          <div style={{ position: 'absolute', left: 96, top: listTop, width: 1088, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 32 }}>
            {list.map(([name, price], i) => (
              <Rise2 key={i} i={i} at={0.25}>
                <PriceRow name={name} price={price} px={20} h={ROW} last={i >= list.length - 2} />
              </Rise2>
            ))}
          </div>
        )}
      </section>

      {/* шапка и таблетка ведут себя как fixed */}
      <div {...layerProps}>
        <NavIn style={{ width: 1280, height: 72 }}>
          <Tone show={!paper.nav}>
            <NavD d={d} paper={false} lay={lay} />
          </Tone>
          <Tone show={paper.nav}>
            <NavD d={d} paper lay={lay} />
          </Tone>
        </NavIn>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 32, display: 'flex', justifyContent: 'center' }}>
          <PillIn>
            <Pill text={nb(bare(d.niche.cta))} paper={paper.pill} h={58} px={18} />
          </PillIn>
        </div>
      </div>
    </div>
  )
}

/* ---------- телефон ---------- */

type MarkM = { px: number; max: number; two: boolean }

function NavM({ d, paper, mark }: { d: Draft; paper: boolean; mark: MarkM }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        background: paper ? '#fff' : 'transparent',
        borderBottom: `1px solid ${paper ? C.rule : 'transparent'}`,
        color: paper ? C.ink : '#fff',
      }}
    >
      <span
        style={{
          maxWidth: mark.max,
          fontSize: mark.px,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          overflow: 'hidden',
          ...(mark.two
            ? { whiteSpace: 'normal', lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflowWrap: 'anywhere' }
            : { whiteSpace: 'nowrap', textOverflow: 'ellipsis' }),
        }}
      >
        {d.name}
      </span>
      <span
        style={{
          flex: 'none',
          height: 34,
          padding: '0 14px',
          borderRadius: 2,
          display: 'inline-flex',
          alignItems: 'center',
          background: paper ? C.ink : '#fff',
          color: paper ? '#fff' : C.ink,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {bare(d.niche.cta2)}
        <Arrow ink />
      </span>
    </div>
  )
}

function Mobile({ d }: { d: Draft }) {
  const on = useAnimOn()
  const tick = useFontTick()
  const root = useRef<HTMLDivElement>(null)
  const { layerProps, paper } = useFixed(root, 800, 64, 48)
  const services = d.niche.services.map((s) => nb(s))
  const svcPx = useMemo(() => clamp(Math.floor(Math.min(...services.map((w) => (350 * 100) / tw(w, 100)))), 40, 54), [services.join('|'), tick])
  // имя в шапке: не мельче 14 px в строку, иначе две строки по 13 px — без многоточия
  const mark = useMemo<MarkM>(() => {
    const btnW = 28 + tw(bare(d.niche.cta2).toUpperCase(), 11, 600, 0.08) + 11 * ARROW_EM
    const max = Math.floor(350 - btnW - 16)
    const px = Math.floor((17 * max) / Math.max(1, tw(d.name.toUpperCase(), 17, 600, 0.06)))
    return px >= 14 ? { px: Math.min(17, px), max, two: false } : { px: 13, max, two: true }
  }, [d.name, d.niche.cta2, tick])
  const dirs = d.niche.services.map((s) => nb(bare(s)))
  const dirPx = useMemo(() => clamp(Math.floor(Math.min(...dirs.map((w) => (310 * 100) / tw(w, 100)))), 24, 36), [dirs.join('|'), tick])

  const stateText = factsOf(d).join(' ')
  const stRef = useRef<HTMLDivElement>(null)
  const stH = useHeight(stRef, 101, [stateText, tick])
  const list = d.niche.list.slice(0, 4)
  const DIR = 56
  const ROW = 44
  const stTop = 76
  const dirTop = stTop + stH + 36
  const listTop = dirTop + dirs.length * DIR + 24

  return (
    <div ref={root} style={{ position: 'relative', width: 390, height: 1600, fontFamily: FONT, WebkitFontSmoothing: 'antialiased' }}>
      <section style={{ position: 'relative', width: 390, height: 800, overflow: 'hidden', background: C.night, isolation: 'isolate' }}>
        <Footage d={d} mobile />

        <div style={{ position: 'absolute', left: 20, top: 452, width: 350 }}>
          <div
            role="heading"
            aria-level={1}
            style={{ fontSize: svcPx, fontWeight: 500, lineHeight: 0.94, letterSpacing: '-0.035em', color: '#fff', overflowWrap: 'anywhere' }}
          >
            {services.map((w, i) => (
              <div key={i}>
                <Jab i={i} gap={0}>
                  {w}
                </Jab>
              </div>
            ))}
          </div>
          <motion.p
            style={{
              margin: '18px 0 0',
              fontSize: 17,
              fontWeight: 500,
              lineHeight: 1.35,
              letterSpacing: '-0.015em',
              color: 'rgba(255,255,255,.8)',
              textWrap: 'balance',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            initial={on ? { opacity: 0, transform: 'translateY(14px)' } : false}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={on ? { delay: 1.55, duration: 0.6, ease: OUT } : { duration: 0 }}
          >
            {nb(bare(d.niche.pain))}
          </motion.p>
        </div>
      </section>

      <section style={{ position: 'relative', width: 390, height: 800, overflow: 'hidden', background: '#fff', color: C.ink }}>
        <Statement d={d} px={30} lh={1.12} keep={350} boxRef={stRef} style={{ position: 'absolute', left: 20, top: stTop, width: 350 }} />
        <div style={{ position: 'absolute', left: 20, top: dirTop, width: 350 }}>
          {dirs.map((w, i) => (
            <Rise2 key={i} i={i}>
              <div
                className="group"
                style={{
                  height: DIR,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: `1px solid ${C.rule}`,
                  fontSize: dirPx,
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{w}</span>
                <Arrow />
              </div>
            </Rise2>
          ))}
        </div>
        {list.length > 0 && (
          <div style={{ position: 'absolute', left: 20, top: listTop, width: 350 }}>
            {list.map(([name, price], i) => (
              <Rise2 key={i} i={i} at={0.3}>
                <PriceRow name={name} price={price} px={15} h={ROW} last={i === list.length - 1} />
              </Rise2>
            ))}
          </div>
        )}
      </section>

      <div {...layerProps}>
        <NavIn style={{ width: 390, height: 64 }}>
          <Tone show={!paper.nav}>
            <NavM d={d} paper={false} mark={mark} />
          </Tone>
          <Tone show={paper.nav}>
            <NavM d={d} paper mark={mark} />
          </Tone>
        </NavIn>
        <PillIn style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
          <Pill text={nb(bare(d.niche.cta))} paper={paper.pill} h={56} px={16} full />
        </PillIn>
      </div>
    </div>
  )
}

export default { Desktop, Mobile } satisfies Template
