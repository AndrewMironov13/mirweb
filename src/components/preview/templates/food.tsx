import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
import '@fontsource-variable/source-sans-3'
import '@fontsource/bad-script/400.css'
import { animate, motion, useInView, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Draft } from '../../../data/niches'
import type { Template } from '.'
import { BgVideo, EASE, SECOND_AT, nicheVideo, useAnimOn } from '../anim'

/**
 * Еда: открытый огонь, «устье печи». Композиция по ekstedt.nu:
 * плавающая тёмная плашка меню с буквами-плитками, большие услуги по центру поверх ролика,
 * вторая секция на льне — цены с отточиями, круг с другим моментом того же ролика и подпись от руки.
 * Ролик свой у ниши (кофейня — латте-арт, кондитерская — сахарная пудра), иначе общий «вок на огне»
 */

const C = {
  soot: '#0E0B09',
  band: '#222221',
  linen: '#F2EEE2',
  candle: '#FBF7EE',
  flame: '#E28546',
  crust: '#9A4A1C',
  hair: 'rgba(34,34,33,.16)',
}
const SERIF = "'Source Serif 4 Variable', Georgia, serif"
const SANS = "'Source Sans 3 Variable', system-ui, sans-serif"
const SCRIPT = "'Bad Script', cursive"
const INOUT = [0.65, 0, 0.35, 1] as const
const LINKS = ['Меню', 'О нас', 'Галерея', 'Отзывы', 'Контакты']
const SHADOW = '0 2px 28px rgba(14,11,9,.6)'

type Video = { src: string; poster: string }
/** Кадрирование ролика 16:9 в круге: z — во сколько раз крупнее «cover», fx/fy — точка кадра (доли), которую ставим в центр */
type Crop = { z: number; fx: number; fy: number }
type Clip = {
  /** object-position героя: десктоп и телефон (на телефоне видна четверть ширины кадра) */
  desk: string
  mob: string
  /** Цветокор: светлым кадрам (белая чашка, сахар) нужно темнее, иначе светлый текст не читается */
  grade: string
  /** Сплошное затемнение и «лужа» под текстом */
  flat: number
  pool: number
  /** Большой круг второй секции: живое видео с секунды t, в том же кадрировании — постер */
  disc: Crop & { t: number }
  /** Круг-подглядывание у нижнего края: крупная деталь постера */
  peek: Crop
}

/** Настройки под конкретный ролик (не под бизнес): куда смотреть и насколько гасить */
const CLIPS: Record<string, Clip> = {
  // вок над огнём: пламя слева и снизу, на телефоне сдвигаем кадр к огню
  food: {
    desk: '52% 50%',
    mob: '30% 50%',
    grade: 'saturate(.92) contrast(1.05)',
    flat: 0.34,
    pool: 0.64,
    disc: { t: 7.9, z: 1.3, fx: 0.5, fy: 0.55 },
    peek: { z: 2.2, fx: 0.2, fy: 0.72 },
  },
  // белая чашка во весь центр: гасим яркость, круг — латте-арт крупно, подглядывание — ручка чашки
  coffee: {
    desk: '40% 50%',
    mob: '42% 50%',
    grade: 'brightness(.64) saturate(.95) contrast(1.08)',
    flat: 0.36,
    pool: 0.72,
    disc: { t: 5.8, z: 1.6, fx: 0.42, fy: 0.38 },
    peek: { z: 1.8, fx: 0.62, fy: 0.55 },
  },
  // пончик и сахар на тёмном: круг — пончик крупно, подглядывание — сито
  bakery: {
    desk: '55% 50%',
    mob: '56% 50%',
    grade: 'brightness(.84) saturate(.95) contrast(1.05)',
    flat: 0.34,
    pool: 0.68,
    disc: { t: 5, z: 1.6, fx: 0.56, fy: 0.62 },
    peek: { z: 1.8, fx: 0.62, fy: 0.2 },
  },
}
/** Незнакомый ролик: центр кадра и затемнение с запасом */
const ANY_CLIP: Clip = {
  desk: '50% 50%',
  mob: '50% 50%',
  grade: 'brightness(.8) saturate(.95) contrast(1.05)',
  flat: 0.38,
  pool: 0.7,
  disc: { t: 2, z: 1.3, fx: 0.5, fy: 0.5 },
  peek: { z: 1.8, fx: 0.5, fy: 0.35 },
}

function useClip(d: Draft) {
  const v = nicheVideo(d, 'food')
  const clip = CLIPS[d.niche.video ?? 'food'] ?? ANY_CLIP
  return { v, clip }
}

/** Неразрывный пробел после коротких слов и между числом и словом */
const typo = (s: string) => {
  let out = s
  for (let i = 0; i < 2; i++) out = out.replace(/(^|[\s(«])([А-ЯЁа-яёA-Za-z]{1,2})\s+/g, '$1$2 ')
  return out.replace(/(\d)\s+(?=[^\s\d·])/g, '$1 ')
}

const lettersOf = (s: string) => [...s.toUpperCase()].filter((c) => /[A-ZА-ЯЁ0-9]/.test(c))
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]/g, '').trim()

/** Тексты второй секции без повторов: «меню» не дублируем, факт, который уже есть строкой в ценах, не повторяем */
function copyOf(d: Draft) {
  const n = d.niche
  const menuCta = /меню/i.test(n.cta)
  const links = menuCta ? LINKS.filter((l) => l !== 'Меню') : LINKS
  const primary = menuCta ? n.cta2 : n.cta
  const link = menuCta || /меню/i.test(n.cta2) ? null : n.cta2
  const facts = n.facts.filter((f) => !n.list.some(([name]) => norm(name).startsWith(norm(f)) || norm(f).startsWith(norm(name))))
  // Подпись от руки — только у настоящего имени: «Ленина» из адреса или одинокое «Я» от руки выглядят нелепо
  const sign = d.quoted && lettersOf(d.name).length >= 3
  return { links, primary, link, facts, sign }
}

/** Естественная ширина элемента (transform её не меняет), пересчёт при смене шрифта */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.offsetWidth)
    const ro = new ResizeObserver(() => setW(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** Появление: прозрачность + сдвиг. Без анимаций — сразу финал */
function Up({ delay, y = 10, dur = 0.6, children, style, className }: { delay: number; y?: number; dur?: number; children: ReactNode; style?: CSSProperties; className?: string }) {
  const on = useAnimOn()
  return (
    <motion.div
      className={className}
      style={style}
      initial={on ? { opacity: 0, y } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={on ? { delay, duration: dur, ease: EASE } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────── Логотип и плашка меню

const tileStyle = (size: number, fs: number, bg: string): CSSProperties => ({
  width: size,
  height: size,
  background: bg,
  color: C.band,
  font: `400 ${fs}px/1 ${SERIF}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 1,
  flex: 'none',
})

function Tiles({ letters, size, fs }: { letters: string[]; size: number; fs: number }) {
  const cols = Math.ceil(letters.length / 2)
  const cells = Array.from({ length: cols * 2 }, (_, i) => letters[i] ?? null)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: 2, flex: 'none' }}>
      {cells.map((c, i) => (
        <span key={i} style={tileStyle(size, fs, c ? C.linen : C.flame)}>
          {c}
        </span>
      ))}
    </div>
  )
}

/** Строка, которая ужимается под ширину (масштабом, чтобы не прыгала вёрстка) */
function FitLine({ text, maxW, style }: { text: string; maxW: number; style: CSSProperties }) {
  const [ref, w] = useWidth<HTMLSpanElement>()
  const k = w > maxW ? Math.max(0.55, maxW / w) : 1
  return (
    <span style={{ display: 'block', width: w ? Math.min(maxW, Math.ceil(w * k)) : undefined, overflow: 'hidden' }}>
      <span ref={ref} style={{ display: 'inline-block', whiteSpace: 'nowrap', transform: k < 1 ? `scale(${k})` : undefined, transformOrigin: '0 50%', ...style }}>
        {text}
      </span>
    </span>
  )
}

/** Две строки примерно поровну по границе слов */
function twoLines(t: string): string[] {
  const words = t.split(/\s+/)
  if (words.length < 2 || t.length <= 14) return [t]
  let best = 1
  let diff = Infinity
  for (let i = 1; i < words.length; i++) {
    const dd = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (dd < diff) {
      diff = dd
      best = i
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

/**
 * Логотип: буквы имени плитками в две строки, как у Ekstedt.
 * Длинное имя плитками не режем (КОНСТ/АНТИН читается как другое слово): одна плитка с первой буквой и имя строкой.
 * Имя из одной буквы — плитка и род занятий рядом
 */
function Logo({ d, size, fs, wfs, maxW }: { d: Draft; size: number; fs: number; wfs: number; maxW: number }) {
  const letters = lettersOf(d.name)
  if (letters.length >= 2 && letters.length <= 8) return <Tiles letters={letters} size={size} fs={fs} />
  const initial = letters[0] ?? lettersOf(d.niche.noun)[0] ?? ''
  const lines = twoLines((letters.length > 1 ? d.name : d.niche.noun).toUpperCase().trim())
  const lfs = lines.length > 1 ? wfs - 2 : wfs
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none', minWidth: 0 }}>
      <span style={tileStyle(size, fs, C.flame)}>{initial}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {lines.map((l, i) => (
          <FitLine key={i} text={l} maxW={maxW} style={{ font: `400 ${lfs}px/1.15 ${SERIF}`, letterSpacing: '.16em', color: C.linen }} />
        ))}
      </div>
    </div>
  )
}

function Rule({ i, h, appear }: { i: number; h: number; appear: boolean }) {
  const on = useAnimOn() && appear
  return (
    <motion.span
      style={{ width: 1, height: h, background: C.linen, display: 'block', flex: 'none', transformOrigin: '50% 50%' }}
      initial={on ? { scaleY: 0 } : false}
      animate={{ scaleY: 1 }}
      transition={on ? { delay: 1.95 + i * 0.04, duration: 0.45, ease: EASE } : { duration: 0 }}
    />
  )
}

/** Плашка: логотип, ссылки и кнопка с равными промежутками между ними */
function BandDesktop({ d, appear, top }: { d: Draft; appear: boolean; top: number }) {
  const on = useAnimOn() && appear
  const { links } = copyOf(d)
  return (
    <motion.div
      style={{ position: 'absolute', top, left: 0, width: 1280, height: 82, background: C.band, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px' }}
      initial={on ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={on ? { delay: 1.9, duration: 0.5, ease: EASE } : { duration: 0 }}
    >
      <Logo d={d} size={26} fs={15} wfs={17} maxW={220} />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {links.map((l, i) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center' }}>
            <Rule i={i} h={26} appear={appear} />
            <span style={{ font: `400 15px/1 ${SERIF}`, letterSpacing: '.1em', color: C.linen, padding: '0 28px', whiteSpace: 'nowrap' }}>{l}</span>
          </span>
        ))}
        <Rule i={links.length} h={26} appear={appear} />
      </div>
      <span
        className="cursor-pointer transition-[background-color,color] duration-200 hover:!bg-[#F2EEE2] hover:!text-[#222221]"
        style={{
          color: C.linen,
          height: 41,
          padding: '0 22px',
          border: `2px solid ${C.linen}`,
          font: `700 15px/1 ${SERIF}`,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          flex: 'none',
        }}
      >
        {d.niche.cta}
      </span>
    </motion.div>
  )
}

function BandMobile({ d, appear, top }: { d: Draft; appear: boolean; top: number }) {
  const on = useAnimOn() && appear
  return (
    <motion.div
      style={{ position: 'absolute', top, left: 0, width: 390, height: 60, background: C.band, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}
      initial={on ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={on ? { delay: 1.9, duration: 0.5, ease: EASE } : { duration: 0 }}
    >
      <Logo d={d} size={20} fs={12} wfs={14} maxW={236} />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Rule i={0} h={26} appear={appear} />
        <span style={{ width: 44, height: 44, marginLeft: 6, marginRight: -8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 20, height: 1, background: C.linen }} />
          <span style={{ width: 20, height: 1, background: C.linen }} />
        </span>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────── WOW: устье печи

type Keys = { S: number[]; T: number[]; B: number[]; R: number[] }
const K_DESK: Keys = { S: [560, 300, 0], T: [600, 150, 0], B: [110, 90, 0], R: [80, 340, 0] }
const K_MOB: Keys = { S: [150, 45, 0], T: [560, 230, 0], B: [180, 120, 0], R: [45, 150, 0] }

function useAperture(W: number, H: number, k: Keys) {
  const on = useAnimOn()
  const S = useMotionValue(on ? k.S[0] : 0)
  const T = useMotionValue(on ? k.T[0] : 0)
  const B = useMotionValue(on ? k.B[0] : 0)
  const R = useMotionValue(on ? k.R[0] : 0)
  useEffect(() => {
    const mvs: [MotionValue<number>, number[]][] = [[S, k.S], [T, k.T], [B, k.B], [R, k.R]]
    if (!on) {
      mvs.forEach(([mv]) => mv.set(0))
      return
    }
    mvs.forEach(([mv, kf]) => mv.set(kf[0]))
    const ctl = mvs.map(([mv, kf]) => animate(mv, kf, { delay: 0.3, duration: 1.9, times: [0, 1 / 1.9, 1], ease: INOUT }))
    return () => ctl.forEach((c) => c.stop())
  }, [on, S, T, B, R, k])
  // Радиус как его реально рисует браузер: не больше половины ширины и не больше высоты окна
  const r = useTransform(() => {
    const w = W - 2 * S.get()
    const h = H - T.get() - B.get()
    return Math.max(0, Math.min(R.get(), w / 2, h))
  })
  const clip = useTransform(() => `inset(${T.get()}px ${S.get()}px ${B.get()}px ${S.get()}px round ${r.get()}px ${r.get()}px 0px 0px)`)
  const path = (side: 1 | -1) => {
    const s = S.get()
    const t = T.get()
    const rr = r.get()
    const bottom = H - B.get()
    const x = side < 0 ? s : W - s
    const xr = side < 0 ? s + rr : W - s - rr
    return `M ${W / 2} ${t} L ${xr} ${t} A ${rr} ${rr} 0 0 ${side < 0 ? 0 : 1} ${x} ${t + rr} L ${x} ${bottom}`
  }
  const left = useTransform(() => path(-1))
  const right = useTransform(() => path(1))
  return { clip, left, right }
}

function Rim({ W, H, left, right }: { W: number; H: number; left: MotionValue<string>; right: MotionValue<string> }) {
  const fid = `rim${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const draw = { delay: 0.3, duration: 0.65, ease: INOUT }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }} aria-hidden>
      <defs>
        <filter id={fid} filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <feGaussianBlur stdDeviation={7} />
        </filter>
      </defs>
      <motion.g initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }} transition={{ duration: 2.05, times: [0, 1.6 / 2.05, 1], ease: 'easeOut' }}>
        {[left, right].map((dd, i) => (
          <g key={i}>
            <motion.path d={dd} fill="none" stroke={C.flame} strokeOpacity={0.45} strokeWidth={10} filter={`url(#${fid})`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={draw} />
            <motion.path d={dd} fill="none" stroke={C.flame} strokeWidth={1.5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={draw} />
          </g>
        ))}
      </motion.g>
    </svg>
  )
}

function Hero({ d, W, H, k, mobile, children }: { d: Draft; W: number; H: number; k: Keys; mobile?: boolean; children: ReactNode }) {
  const on = useAnimOn()
  const ap = useAperture(W, H, k)
  const { v, clip } = useClip(d)
  const flat = clip.flat + (mobile ? 0.08 : 0)
  const pool = mobile
    ? `radial-gradient(ellipse 300px 330px at 50% 60%, rgba(14,11,9,${clip.pool}), transparent 72%)`
    : `radial-gradient(ellipse 640px 250px at 50% 66%, rgba(14,11,9,${clip.pool}), transparent 72%)`
  return (
    <section style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: C.soot }}>
      {on && (
        <motion.div
          style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 45% 26% at 50% 100%, rgba(226,133,70,.38), transparent)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ delay: 0.1, duration: 1.9, times: [0, 0.35 / 1.9, 1.3 / 1.9, 1], ease: 'easeInOut' }}
        />
      )}
      <motion.div style={{ position: 'absolute', inset: 0, overflow: 'hidden', clipPath: on ? ap.clip : undefined, zIndex: 2 }}>
        <motion.div
          style={{ position: 'absolute', inset: 0 }}
          initial={on ? { scale: mobile ? 1.04 : 1.12 } : false}
          animate={{ scale: 1 }}
          transition={on ? { delay: 0.3, duration: 2.3, ease: EASE } : { duration: 0 }}
        >
          <BgVideo src={v.src} poster={v.poster} position={mobile ? clip.mob : clip.desk} push={false} reveal="none" className="absolute inset-0" style={{ filter: clip.grade }} />
        </motion.div>
        {/* Пока слова остывают, фон чуть темнее — раскалённые буквы отделяются от огня */}
        <motion.div
          style={{ position: 'absolute', inset: 0, background: `rgba(14,11,9,${Math.min(0.95, flat * 1.25).toFixed(3)})` }}
          initial={on ? { opacity: 1 } : false}
          animate={{ opacity: 0.8 }}
          transition={on ? { delay: 1.6, duration: 1.3, ease: 'easeInOut' } : { duration: 0 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: pool }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,11,9,.7) 0, transparent 170px)' }} />
        {mobile && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(14,11,9,.6) 0, transparent 240px)' }} />}
      </motion.div>
      {on && <Rim W={W} H={H} left={ap.left} right={ap.right} />}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}>{children}</div>
    </section>
  )
}

/** Слово заголовка: приходит раскалённым, с ореолом, и остывает снизу вверх до цвета свечи */
const HOT = 'drop-shadow(0px 0px 10px rgba(255,150,70,0.9)) drop-shadow(0px 0px 28px rgba(255,120,40,0.55))'
const COOL = 'drop-shadow(0px 0px 10px rgba(255,150,70,0)) drop-shadow(0px 2px 22px rgba(14,11,9,0.55))'

function HotWord({ text, i, block }: { text: string; i: number; block?: boolean }) {
  const on = useAnimOn()
  return (
    <motion.span
      style={{ display: block ? 'block' : 'inline-block' }}
      initial={on ? { opacity: 0, y: 22 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={on ? { delay: 1.5 + i * 0.12, duration: 0.8, ease: EASE } : { duration: 0 }}
    >
      <motion.span
        style={{
          display: 'inline-block',
          padding: '0.16em 0.05em',
          margin: '-0.16em -0.05em',
          backgroundImage: `linear-gradient(to top, ${C.candle} 0 40%, #FFE6C4 50%, #FFB26B 62% 100%)`,
          backgroundSize: '100% 250%',
          backgroundRepeat: 'no-repeat',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
        }}
        initial={on ? { backgroundPosition: '50% 0%', filter: HOT } : false}
        animate={{ backgroundPosition: '50% 100%', filter: COOL }}
        transition={on ? { delay: 1.55 + i * 0.1, duration: 1.1, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
      >
        {text}
      </motion.span>
    </motion.span>
  )
}

// ─────────────────────────────── Кадры из ролика во вторую секцию

function cropBox(size: number, c: Crop, cy = 0.5): CSSProperties {
  const h = size * c.z
  const w = (h * 16) / 9
  const left = Math.min(0, Math.max(size - w, size / 2 - c.fx * w))
  const top = Math.min(0, Math.max(size - h, cy * size - c.fy * h))
  return { position: 'absolute', maxWidth: 'none', objectFit: 'cover', width: w, height: h, left, top }
}

/**
 * Кадр ролика в круге. Большой круг при анимациях — живое видео с секунды t (другой момент, не тот, что в герое),
 * без анимаций и в подглядывании — постер в своём кадрировании. Видео грузится полностью, только когда пора играть
 */
function Frame({ v, crop, size, t, cy }: { v: Video; crop: Crop; size: number; t?: number; cy?: number }) {
  const on = useAnimOn()
  const live = on && t !== undefined
  const ref = useRef<HTMLVideoElement>(null)
  const seen = useInView(ref, { margin: '80px' })
  const [go, setGo] = useState(false)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!live) return
    const id = window.setTimeout(() => setGo(true), (SECOND_AT - 0.65) * 1000)
    return () => window.clearTimeout(id)
  }, [live])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (go && seen) el.play().catch(() => {})
    else el.pause()
  }, [go, seen])
  const st = cropBox(size, crop, cy)
  return (
    <>
      <img src={v.poster} alt="" draggable={false} style={st} />
      {live && (
        <video
          ref={ref}
          src={`${v.src}#t=${t}`}
          muted
          loop
          playsInline
          preload={go ? 'auto' : 'metadata'}
          onLoadedData={() => setShown(true)}
          style={{ ...st, opacity: shown ? 1 : 0, transition: 'opacity .3s' }}
        />
      )}
    </>
  )
}

/** Круг открывается из точки — эхо устья печи. Начинается вместе с прокруткой и готов к её концу */
function Disc({ size, children, style }: { size: number; children: ReactNode; style: CSSProperties }) {
  const on = useAnimOn()
  const delay = SECOND_AT - 0.55
  return (
    <motion.div
      style={{ position: 'absolute', width: size, height: size, overflow: 'hidden', background: C.soot, ...style }}
      initial={on ? { clipPath: 'circle(0% at 50% 50%)' } : false}
      animate={{ clipPath: 'circle(50% at 50% 50%)' }}
      transition={on ? { delay, duration: 0.85, ease: INOUT } : { duration: 0 }}
    >
      <motion.div
        style={{ position: 'absolute', inset: 0 }}
        initial={on ? { scale: 1.15 } : false}
        animate={{ scale: 1 }}
        transition={on ? { delay, duration: 1.0, ease: EASE } : { duration: 0 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/** Цены с отточиями. Один кегль на все строки: если одно название длинное, мельчают все, цена всегда меньше названия */
function MenuRows({ d, rowH, fs, pfs, delay, gap }: { d: Draft; rowH: number; fs: number; pfs: number; delay: number; gap: number }) {
  const on = useAnimOn()
  const list = d.niche.list.slice(0, 4)
  const maxLen = Math.max(...list.map(([name]) => name.length))
  const size = maxLen > 20 ? Math.round(fs * Math.max(0.8, 20 / maxLen)) : fs
  const psize = Math.round((pfs * size) / fs)
  return (
    <div>
      {list.map(([name, price], i) => (
        <Up key={name} delay={delay + i * 0.05} dur={0.55} y={16 * (fs < 25 ? 0.8 : 1)} style={{ position: 'relative', height: rowH, display: 'flex', alignItems: 'flex-end', paddingBottom: Math.round(rowH * 0.2) }}>
          <span style={{ font: `400 ${size}px/1.27 ${SERIF}`, letterSpacing: '.015em', color: C.band, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: '0 1 auto' }}>
            {name}
          </span>
          <span
            style={{
              flex: '1 1 12px',
              minWidth: 12,
              height: 1.5,
              margin: `0 ${gap}px ${Math.round(size * 0.28)}px`,
              backgroundImage: 'radial-gradient(circle, rgba(34,34,33,.55) 0.75px, transparent 0.9px)',
              backgroundSize: '6px 1.5px',
              backgroundRepeat: 'repeat-x',
            }}
          />
          <span style={{ font: `italic 400 ${psize}px/1.3 ${SERIF}`, color: C.crust, whiteSpace: 'nowrap', flex: 'none' }}>{price}</span>
          <motion.span
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: C.hair, transformOrigin: '0 50%' }}
            initial={on ? { scaleX: 0 } : false}
            animate={{ scaleX: 1 }}
            transition={on ? { delay: delay + i * 0.05 + 0.1, duration: 0.5, ease: EASE } : { duration: 0 }}
          />
        </Up>
      ))}
    </div>
  )
}

/** Подпись от руки: «пишется» шторкой слева направо */
function Signature({ word, fs, left, top, maxRight, minLeft, delay }: { word: string; fs: number; left: number; top: number; maxRight: number; minLeft: number; delay: number }) {
  const on = useAnimOn()
  const [ref, w] = useWidth<HTMLSpanElement>()
  const k = w > maxRight - minLeft ? (maxRight - minLeft) / w : 1
  const x = w * k > maxRight - left ? Math.max(minLeft, maxRight - w * k) : left
  return (
    <div style={{ position: 'absolute', top: top + Math.round(w * k * 0.035), left: x, transform: `rotate(-4deg) scale(${k})`, transformOrigin: '0 50%' }}>
      <motion.span
        ref={ref}
        style={{ display: 'inline-block', whiteSpace: 'nowrap', font: `400 ${fs}px/1.4 ${SCRIPT}`, color: 'rgba(34,34,33,.85)', padding: '0 6px' }}
        initial={on ? { clipPath: 'inset(0% 100% 0% 0%)' } : false}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        transition={on ? { delay, duration: 0.5, ease: [0.45, 0, 0.55, 1] } : { duration: 0 }}
      >
        {word}
      </motion.span>
    </div>
  )
}

/** Кнопки на льне: контурная и, если есть что сказать другое, ссылка */
function LinenCtas({ primary, link, full }: { primary: string; link: string | null; full?: boolean }) {
  return (
    <>
      <span
        className="cursor-pointer transition-[background-color,color] duration-200 hover:!bg-[#222221] hover:!text-[#F2EEE2]"
        style={{
          color: C.band,
          height: 46,
          padding: '0 26px',
          border: `2px solid ${C.band}`,
          font: `700 ${full ? 14 : 15}px/1 ${SERIF}`,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {primary}
      </span>
      {link && <span style={{ font: `italic 400 18px/1 ${SERIF}`, color: C.band, textDecoration: 'underline', textDecorationThickness: 1, textUnderlineOffset: 6, whiteSpace: 'nowrap' }}>{link}</span>}
    </>
  )
}

const heroCta = 'cursor-pointer transition-[background-color,color] duration-200 hover:!bg-[#FBF7EE] hover:!text-[#0E0B09]'

// ─────────────────────────────── Десктоп

function Desktop({ d }: { d: Draft }) {
  const on = useAnimOn()
  const [hRef, hw] = useWidth<HTMLDivElement>()
  const hk = hw > 1100 ? 1100 / hw : 1
  const n = d.niche
  const S2 = SECOND_AT
  const { v, clip } = useClip(d)
  const cp = copyOf(d)
  return (
    <div style={{ width: 1280, height: 1520, background: C.linen }}>
      <Hero d={d} W={1280} H={760} k={K_DESK}>
        <BandDesktop d={d} appear top={44} />
        <div style={{ position: 'absolute', top: 400, left: 0, width: 1280, display: 'flex', justifyContent: 'center' }}>
          <div
            ref={hRef}
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              font: `300 80px/1.1 ${SERIF}`,
              fontVariationSettings: "'opsz' 60",
              letterSpacing: '-.01em',
              color: C.candle,
              transform: hk < 1 ? `scale(${hk})` : undefined,
              transformOrigin: '50% 50%',
            }}
          >
            {n.services.map((s, i) => (
              <span key={i}>
                {i > 0 && ' '}
                <HotWord text={s} i={i} />
              </span>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 512, left: 0, width: 1280, textAlign: 'center', color: C.candle, textShadow: SHADOW }}>
          <Up delay={2.0}>
            <p style={{ font: `400 18px/1.55 ${SANS}`, opacity: 0.92, maxWidth: 760, margin: '0 auto' }}>{typo(n.pain)}</p>
          </Up>
          <Up delay={2.2} y={0} dur={0.6}>
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
              <span
                className={heroCta}
                style={{ color: C.candle, height: 48, padding: '0 36px', border: `1px solid ${C.candle}`, font: `400 19px/1 ${SERIF}`, letterSpacing: '.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', textShadow: 'none' }}
              >
                {n.cta}
              </span>
              <span style={{ font: `italic 400 19px/1 ${SERIF}`, color: 'rgba(251,247,238,.9)', textDecoration: 'underline', textDecorationThickness: 1, textUnderlineOffset: 6, whiteSpace: 'nowrap' }}>
                {n.cta2}
              </span>
            </div>
          </Up>
        </div>
      </Hero>

      <section style={{ position: 'relative', width: 1280, height: 760, overflow: 'hidden', background: C.linen, color: C.band }}>
        {/* Плашка «прилипла» к верху: при прокрутке-демо секция встаёт на 61 px ниже края, поэтому плашка без отступа */}
        <BandDesktop d={d} appear={false} top={on ? 0 : 44} />
        <Disc size={512} style={{ left: 698, top: 150 }}>
          <Frame v={v} crop={clip.disc} size={512} t={clip.disc.t} />
        </Disc>
        <div style={{ position: 'absolute', left: 73, top: 164, width: 560 }}>
          <Up delay={S2 - 0.3} y={8} dur={0.5}>
            <p style={{ font: `600 11px/1 ${SANS}`, letterSpacing: '.28em', textTransform: 'uppercase', color: C.crust }}>Цены</p>
          </Up>
        </div>
        <div style={{ position: 'absolute', left: 73, top: 190, width: 560 }}>
          <MenuRows d={d} rowH={58} fs={30} pfs={24} delay={S2 - 0.25} gap={16} />
        </div>
        {cp.sign && <Signature word={d.name} fs={46} left={300} top={450} minLeft={73} maxRight={640} delay={S2 + 0.05} />}
        <Up delay={S2 + 0.1} dur={0.45} style={{ position: 'absolute', left: 73, top: cp.sign ? 548 : 470, display: 'flex', alignItems: 'center', gap: 24 }}>
          <LinenCtas primary={cp.primary} link={cp.link} />
        </Up>
        <Up delay={S2 + 0.1} y={40} dur={0.5} style={{ position: 'absolute', left: 40, top: 640 }}>
          <div style={{ position: 'relative', width: 380, height: 380, borderRadius: '50%', overflow: 'hidden', background: C.soot }}>
            <Frame v={v} crop={clip.peek} size={380} cy={0.18} />
          </div>
        </Up>
        {cp.facts.length > 0 && (
          <Up delay={S2 + 0.15} y={12} dur={0.45} style={{ position: 'absolute', left: 520, top: 668, width: 640 }}>
            <p style={{ font: `400 30px/38px ${SERIF}`, letterSpacing: '.015em', textAlign: 'center', color: C.band }}>{cp.facts.map(typo).join('. ')}</p>
          </Up>
        )}
      </section>
    </div>
  )
}

// ─────────────────────────────── Телефон

function Mobile({ d }: { d: Draft }) {
  const on = useAnimOn()
  const [hRef, hw] = useWidth<HTMLDivElement>()
  const hk = hw > 350 ? 350 / hw : 1
  const n = d.niche
  const S2 = SECOND_AT
  const { v, clip } = useClip(d)
  const cp = copyOf(d)
  return (
    <div style={{ width: 390, height: 1600, background: C.linen }}>
      <Hero d={d} W={390} H={800} k={K_MOB} mobile>
        <BandMobile d={d} appear top={24} />
        <div style={{ position: 'absolute', top: 340, left: 0, width: 390, display: 'flex', justifyContent: 'center' }}>
          <div
            ref={hRef}
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              font: `300 56px/1.04 ${SERIF}`,
              fontVariationSettings: "'opsz' 60",
              letterSpacing: '-.01em',
              color: C.candle,
              transform: hk < 1 ? `scale(${hk})` : undefined,
              transformOrigin: '50% 0',
            }}
          >
            {n.services.map((s, i) => (
              <HotWord key={i} text={s} i={i} block />
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 534, left: 32, width: 326, textAlign: 'center', color: C.candle, textShadow: SHADOW }}>
          <Up delay={2.0}>
            <p style={{ font: `400 16px/1.5 ${SANS}`, opacity: 0.94 }}>{typo(n.pain)}</p>
          </Up>
          <Up delay={2.2} y={0} dur={0.6}>
            <span
              className={heroCta}
              style={{ marginTop: 34, color: C.candle, height: 48, border: `1px solid ${C.candle}`, font: `400 17px/1 ${SERIF}`, letterSpacing: '.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', textShadow: 'none' }}
            >
              {n.cta}
            </span>
          </Up>
          <Up delay={2.3} y={0} dur={0.6}>
            <span style={{ display: 'inline-block', marginTop: 22, font: `italic 400 18px/1 ${SERIF}`, color: 'rgba(251,247,238,.92)', textDecoration: 'underline', textDecorationThickness: 1, textUnderlineOffset: 6 }}>{n.cta2}</span>
          </Up>
        </div>
      </Hero>

      <section style={{ position: 'relative', width: 390, height: 800, overflow: 'hidden', background: C.linen, color: C.band }}>
        <BandMobile d={d} appear={false} top={on ? 0 : 24} />
        {/* При прокрутке-демо видно 736 px секции из 800: всё, включая кнопку, укладываем выше */}
        <Disc size={280} style={{ left: 55, top: 104 }}>
          <Frame v={v} crop={clip.disc} size={280} t={clip.disc.t} />
        </Disc>
        <div style={{ position: 'absolute', left: 32, top: 408, width: 326 }}>
          <Up delay={S2 - 0.3} y={6} dur={0.5}>
            <p style={{ font: `600 11px/1 ${SANS}`, letterSpacing: '.28em', textTransform: 'uppercase', color: C.crust }}>Цены</p>
          </Up>
        </div>
        <div style={{ position: 'absolute', left: 32, top: 432, width: 326 }}>
          <MenuRows d={d} rowH={44} fs={20} pfs={17} delay={S2 - 0.25} gap={10} />
        </div>
        {cp.sign && <Signature word={d.name} fs={34} left={120} top={618} minLeft={32} maxRight={358} delay={S2 + 0.05} />}
        <Up delay={S2 + 0.1} y={8} dur={0.45} style={{ position: 'absolute', left: 32, top: cp.sign ? 680 : 632, width: 326 }}>
          <LinenCtas primary={cp.primary} link={null} full />
        </Up>
      </section>
    </div>
  )
}

export default { Desktop, Mobile } satisfies Template
