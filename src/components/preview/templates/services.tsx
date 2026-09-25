import '@fontsource-variable/cormorant-garamond'
import '@fontsource-variable/golos-text'
import '@fontsource/tenor-sans/400.css'
import { motion, type Transition } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { Draft } from '../../../data/niches'
import type { Template } from '.'
import { BgVideo, EASE, SECOND_AT, nicheVideo, useAnimOn } from '../anim'

/**
 * Услуги: тёмный кинематографичный первый экран (референс cadogantate.com).
 * WOW — «окно открывается»: сначала светится только окно из самого кадра (окно переговорной,
 * видоискатель вокруг модели, полоса горизонта с фурой), потом оно раскрывается на весь экран.
 * Вторая секция — печатный указатель услуг с ценами на тёмно-синем
 */

const SERIF = "'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif"
const CAPS = "'Tenor Sans', 'Gill Sans', 'Trebuchet MS', sans-serif"
const SANS = "'Golos Text Variable', 'Golos Text', system-ui, sans-serif"
const INK = '#07080A'
const RED = '#F22D13'
const NAVY = '#1C2136'
const NAVY_D = '#151A2B'
const MUTED = '#8B91A8'
const LINE = 'rgba(255,255,255,.14)'
const IO = [0.65, 0, 0.35, 1] as const
const CURTAIN = [0.76, 0, 0.24, 1] as const
const FULL = 'inset(0px 0px 0px 0px)'

type Ease = Transition['ease']
function useTr() {
  const on = useAnimOn()
  return (delay: number, duration: number, ease: Ease = EASE): Transition => (on ? { delay, duration, ease } : { duration: 0 })
}

/** Неразрывный пробел после коротких предлогов и союзов, перед тире */
const nb = (s: string) =>
  s
    .replace(/(?<=^|[\s«(])(в|во|с|со|к|ко|о|об|у|и|а|но|на|за|до|по|из|от|не|ни|без|для|как|или|через)\s+/gi, '$1 ')
    .replace(/\s+—/g, ' —')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const bare = (s: string) => s.trim().replace(/\.+$/, '')

/** Ширина заглавных Tenor Sans, em (замерено в браузере) */
const TENOR: Record<string, number> = {"А":0.732,"Б":0.671,"В":0.641,"Г":0.577,"Д":0.841,"Е":0.602,"Ё":0.602,"Ж":1.198,"З":0.664,"И":0.837,"Й":0.837,"К":0.724,"Л":0.79,"М":1.026,"Н":0.841,"О":0.865,"П":0.841,"Р":0.643,"С":0.781,"Т":0.667,"У":0.66,"Ф":0.872,"Х":0.699,"Ц":0.863,"Ч":0.708,"Ш":1.137,"Щ":1.162,"Ъ":0.802,"Ы":0.92,"Ь":0.669,"Э":0.771,"Ю":1.152,"Я":0.718," ":0.25,".":0.25,",":0.25,"-":0.333,"1":0.47,"I":0.33,"M":0.89,"W":0.94}
const capsEm = (t: string, tracking = 0) => [...t.toUpperCase()].reduce((a, c) => a + (TENOR[c] ?? (/\d/.test(c) ? 0.5 : 0.72)) + tracking, 0)
/** Ширина строчных Cormorant Garamond 500, em */
const CORM: Record<string, number> = {"а":0.42,"б":0.478,"в":0.443,"г":0.373,"д":0.494,"е":0.405,"ё":0.405,"ж":0.675,"з":0.377,"и":0.512,"й":0.512,"к":0.465,"л":0.469,"м":0.564,"н":0.522,"о":0.482,"п":0.522,"р":0.505,"с":0.41,"т":0.421,"у":0.448,"ф":0.647,"х":0.439,"ц":0.517,"ч":0.433,"ш":0.746,"щ":0.745,"ъ":0.44,"ы":0.651,"ь":0.418,"э":0.433,"ю":0.692,"я":0.425," ":0.23,".":0.25,",":0.25,"-":0.33,"«":0.45,"»":0.45,"&":0.72}
const serifEm = (t: string) =>
  [...t].reduce((a, c) => a + (CORM[c] ?? (/[А-ЯЁ]/.test(c) ? 0.68 : /[A-Z]/.test(c) ? 0.66 : /\d/.test(c) ? 0.5 : 0.46)), 0)
/** Golos 400–500, средняя ширина знака — для оценки ширины кнопок */
const sansW = (t: string, px: number) => t.length * px * 0.56

/** Ссылки меню без повторов: если «Услуги» или «Цены» уже есть в кнопке или в услугах — ставим другое */
function navOf(d: Draft): string[] {
  const said = [d.niche.cta, d.niche.cta2, ...d.niche.services].join(' ')
  const links = ['Услуги', 'Цены', 'О нас'].filter(
    (n) => !(n === 'Услуги' && /услуг/i.test(said)) && !(n === 'Цены' && /цен|тариф|прайс/i.test(said)),
  )
  for (const f of ['Отзывы', 'Команда']) if (links.length < 3 && !said.toLowerCase().includes(f.toLowerCase())) links.push(f)
  return [...links, 'Контакты']
}
const NAV_GAP = 32
const navW = (links: string[]) => links.reduce((a, n) => a + sansW(n, 15), 0) + NAV_GAP * (links.length - 1)

/** Имя бизнеса в две строки, как «Cadogan / Tate»: ищем самый ровный перенос, короткий предлог не висит в конце */
function splitName(name: string): string[] {
  const w = name.trim().split(/\s+/)
  // «Газель 24», «Бюро А» — короткий хвост на своей строке выглядит обрывком: оставляем одну строку
  if (w.length < 2 || name.trim().length <= 9 || w[w.length - 1].length < 4) return [name.trim()]
  let best: string[] = [name]
  let score = Infinity
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(' ')
    const b = w.slice(i).join(' ')
    if (/^(и|в|на|с|у|к|о|по|для|&)$/i.test(w[i - 1]) && i > 1) continue
    const s = Math.max(serifEm(a), serifEm(b))
    if (s < score) {
      score = s
      best = [a, b]
    }
  }
  return best
}

// ── геометрия WOW: у каждого ролика своё «окно» из самого кадра (замерено по постеру 1280×720)
interface Geo {
  /** object-position ролика */
  pos: string
  /** щель, с которой начинается раскрытие (нулевой ширины или высоты) */
  slit: string
  /** окно, которое светится одно, пока остальное чёрное */
  win: string
  /** световая линия по щели: вертикальная (x) или горизонтальная (y) */
  line: { x: number } | { y: number }
  /** ровное затемнение поверх кадра */
  dim: number
}
interface Look {
  d: Geo
  m: Geo
}
const LOOKS: Record<string, Look> = {
  // рукопожатие: стекло x 428–825, y 105–457, импост x 619–626. Cover 1280×760 при 49%
  services: {
    d: { pos: '49% 50%', slit: 'inset(111px 658px 278px 622px)', win: 'inset(111px 444px 278px 417px)', line: { x: 622 }, dim: 0.12 },
    m: { pos: '49% 50%', slit: 'inset(117px 204px 292px 186px)', win: 'inset(117px 16px 292px 16px)', line: { x: 186 }, dim: 0.12 },
  },
  // фотостудия: окно — кадр видоискателя 3:4 вокруг модели в красном (x 610–840 за весь ролик, голова y≈230)
  photo: {
    d: { pos: '55% 50%', slit: 'inset(179px 559px 106px 721px)', win: 'inset(179px 390px 106px 552px)', line: { x: 721 }, dim: 0.06 },
    m: { pos: '58% 50%', slit: 'inset(189px 195px 111px 195px)', win: 'inset(189px 32px 111px 32px)', line: { x: 195 }, dim: 0.06 },
  },
  // трасса: окно — широкая полоса вдоль горизонта (y≈554) с фурой, линия света идёт по горизонту.
  // На телефоне кадр сдвинут вправо: фура въезжает в полосу как раз к паузе WOW (x 655–1020 на 0.8–1.2 с)
  transport: {
    d: { pos: '50% 50%', slit: 'inset(585px 0px 175px 0px)', win: 'inset(404px 0px 116px 0px)', line: { y: 585 }, dim: 0.12 },
    m: { pos: '75% 50%', slit: 'inset(615px 0px 185px 0px)', win: 'inset(440px 0px 110px 0px)', line: { y: 615 }, dim: 0.12 },
  },
}
/** Ролик без замера: ровная рамка по центру */
const CENTRED: Look = {
  d: { pos: '50% 50%', slit: 'inset(137px 640px 91px 640px)', win: 'inset(137px 435px 91px 435px)', line: { x: 640 }, dim: 0.14 },
  m: { pos: '50% 50%', slit: 'inset(144px 195px 240px 195px)', win: 'inset(144px 31px 240px 31px)', line: { x: 195 }, dim: 0.14 },
}
const lookOf = (d: Draft) => LOOKS[d.niche.video ?? 'services'] ?? CENTRED

const shadeOf = (m: boolean, dim: number) =>
  (m
    ? [
        'linear-gradient(to bottom, rgba(8,9,12,.55) 0px, rgba(8,9,12,0) 120px)',
        'linear-gradient(to top, rgba(8,9,12,.85) 0%, rgba(8,9,12,.55) 34%, rgba(8,9,12,0) 58%)',
      ]
    : [
        'linear-gradient(to bottom, rgba(8,9,12,.5) 0px, rgba(8,9,12,0) 140px)',
        'linear-gradient(to right, rgba(8,9,12,.45) 0%, rgba(8,9,12,0) 48%)',
        'linear-gradient(to top, rgba(8,9,12,.72) 0%, rgba(8,9,12,.35) 38%, rgba(8,9,12,0) 62%)',
      ]
  )
    .concat(`linear-gradient(rgba(10,11,14,${dim}), rgba(10,11,14,${dim}))`)
    .join(', ')

/** Появление: прозрачность + сдвиг по y */
function Up({ at, dur = 0.5, y = 12, children, style, className }: { at: number; dur?: number; y?: number; children: ReactNode; style?: CSSProperties; className?: string }) {
  const on = useAnimOn()
  return (
    <motion.div
      className={className}
      style={style}
      initial={on ? { opacity: 0, y } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={on ? { delay: at, duration: dur, ease: EASE } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Строка выезжает из-под маски. Запас снизу — чтобы хвосты Д, Ц, Щ не резались.
 * Старт ниже запаса (from > 100% + 0.14em + верх заглавных), иначе до начала подъёма в щели видны «зубцы» букв
 */
function Mask({ at, dur = 0.75, from = '120%', children, style }: { at: number; dur?: number; from?: string; children: ReactNode; style?: CSSProperties }) {
  const on = useAnimOn()
  return (
    <span style={{ display: 'block', overflow: 'hidden', padding: '0.12em 0 0.14em', margin: '-0.12em 0 -0.14em', ...style }}>
      <motion.span
        style={{ display: 'block' }}
        initial={on ? { y: from } : false}
        animate={{ y: '0%' }}
        transition={on ? { delay: at, duration: dur, ease: EASE } : { duration: 0 }}
      >
        {children}
      </motion.span>
    </span>
  )
}

function Arrow({ w, h = 14 }: { w: number; h?: number }) {
  const c = h / 2
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden style={{ display: 'block' }}>
      <path d={`M0 ${c}H${w - 1}M${w - 1 - c + 0.5} 0.75L${w - 1} ${c}L${w - 1 - c + 0.5} ${h - 0.75}`} stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

// ── первый экран

interface Mark {
  lines: string[]
  fs: number
  /** на телефоне красная кнопка в шапке: убираем, если из-за неё имя мельче 22px (та же кнопка есть внизу экрана) */
  btn: boolean
}
function markOf(d: Draft, m: boolean): Mark {
  const lines = splitName(d.name)
  const one = lines.length === 1
  const em = Math.max(...lines.map(serifEm))
  if (!m) {
    const group = navW(navOf(d)) + 48 + sansW(d.niche.cta2, 15) + 48 + 16 + sansW(d.niche.cta, 15) + 48
    const budget = Math.min(360, 1216 - 64 - group - 40)
    return { lines, fs: Math.max(26, Math.min(one ? 56 : 40, Math.floor(budget / em))), btn: true }
  }
  const base = one ? 32 : 26
  const tight = Math.min(base, Math.floor((390 - 40 - 16 - (sansW(d.niche.cta, 13) + 28)) / em))
  if (tight >= 22) return { lines, fs: tight, btn: true }
  return { lines, fs: Math.max(17, Math.min(base, Math.floor(350 / em))), btn: false }
}

function Wordmark({ mark }: { mark: Mark }) {
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontWeight: 500,
        fontSize: mark.fs,
        lineHeight: 0.84,
        letterSpacing: '-0.01em',
        color: '#fff',
        whiteSpace: 'nowrap',
      }}
    >
      {mark.lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  )
}

function Btn({ children, solid, h, px, fs, style }: { children: ReactNode; solid: 'red' | 'white' | 'ghost'; h: number; px: number; fs: number; style?: CSSProperties }) {
  const look: CSSProperties =
    solid === 'red'
      ? { background: RED, color: '#fff' }
      : solid === 'white'
        ? { background: '#fff', color: NAVY }
        : { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.7)', color: '#fff' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: h,
        padding: `0 ${px}px`,
        fontFamily: SANS,
        fontWeight: 500,
        fontSize: fs,
        letterSpacing: '0.005em',
        whiteSpace: 'nowrap',
        borderRadius: 0,
        ...look,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function Hero({ d, m }: { d: Draft; m: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const g = m ? lookOf(d).m : lookOf(d).d
  const v = nicheVideo(d, 'services')
  const mark = markOf(d, m)
  const one = mark.lines.length === 1
  const nav = navOf(d)
  const words = d.niche.services.map((s) => s.trim().toUpperCase())
  const longest = Math.max(...words.map((w) => bare(w).length))
  const widest = Math.max(...words.map((w) => capsEm(w, 0.01)))
  const rule = m ? (longest > 11 ? 30 : 36) : longest > 14 ? 42 : longest > 11 ? 48 : 56
  const hfs = Math.min(rule, Math.floor((m ? 350 : 620) / widest))
  const pain = nb(bare(d.niche.pain))
  const vert = 'x' in g.line

  return (
    <section style={{ position: 'relative', width: m ? 390 : 1280, height: m ? 800 : 760, overflow: 'hidden', background: INK }}>
      {/* видео раскрывается окном из самого кадра */}
      <motion.div
        style={{ position: 'absolute', inset: 0 }}
        initial={on ? { clipPath: g.slit } : false}
        animate={on ? { clipPath: [g.slit, g.win, g.win, FULL] } : { clipPath: FULL }}
        transition={on ? { delay: 0.25, duration: 1.8, times: [0, 0.39, 0.556, 1], ease: [IO, 'linear', CURTAIN] } : { duration: 0 }}
      >
        <BgVideo src={v.src} poster={v.poster} position={g.pos} push={false} reveal="none" className="absolute inset-0" />
        <motion.div
          style={{ position: 'absolute', inset: 0, background: shadeOf(m, g.dim) }}
          initial={on ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={tr(1.25, 0.8, 'linear')}
        />
      </motion.div>

      {/* световая линия по щели: гаснет, пока окно открывается, чтобы окно стояло чистым */}
      {on && (
        <motion.div
          style={
            'x' in g.line
              ? { position: 'absolute', top: 0, bottom: 0, left: g.line.x - 0.5, width: 1, background: '#fff' }
              : { position: 'absolute', left: 0, right: 0, top: g.line.y - 0.5, height: 1, background: '#fff' }
          }
          initial={vert ? { scaleY: 0, opacity: 1 } : { scaleX: 0, opacity: 1 }}
          animate={vert ? { scaleY: 1, opacity: 0 } : { scaleX: 1, opacity: 0 }}
          transition={{
            scaleY: { duration: 0.35, ease: IO },
            scaleX: { duration: 0.35, ease: IO },
            opacity: { delay: 0.6, duration: 0.35, ease: 'linear' },
          }}
        />
      )}

      {/* навигация */}
      <Up
        at={1.7}
        dur={0.6}
        y={-8}
        style={
          m
            ? { position: 'absolute', left: 20, right: 20, top: 20, display: 'flex', justifyContent: 'space-between', alignItems: one ? 'center' : 'flex-start', minHeight: 36 }
            : { position: 'absolute', left: 64, right: 64, top: 0, height: 112, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
        }
      >
        <div style={m ? { paddingTop: one ? 0 : 2 } : { alignSelf: 'flex-start', paddingTop: one ? Math.round(57 - mark.fs * 0.42) : 32 }}>
          <Wordmark mark={mark} />
        </div>
        {m ? (
          mark.btn && (
            <Btn solid="red" h={36} px={14} fs={13}>
              {d.niche.cta}
            </Btn>
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', height: 44 }}>
            <nav style={{ display: 'flex', gap: NAV_GAP, fontFamily: SANS, fontSize: 15, color: '#fff', marginRight: 48 }}>
              {nav.map((n) => (
                <span key={n} style={{ whiteSpace: 'nowrap' }}>
                  {n}
                </span>
              ))}
            </nav>
            <Btn solid="ghost" h={44} px={24} fs={15} style={{ marginRight: 16 }}>
              {d.niche.cta2}
            </Btn>
            <Btn solid="red" h={44} px={24} fs={15}>
              {d.niche.cta}
            </Btn>
          </div>
        )}
      </Up>

      {/* услуги, боль, кнопка */}
      <div
        style={
          m
            ? { position: 'absolute', left: 20, right: 20, bottom: 26, display: 'flex', flexDirection: 'column' }
            : { position: 'absolute', left: 64, bottom: 96, width: 620, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }
        }
      >
        <h1
          style={{
            margin: 0,
            fontFamily: CAPS,
            fontWeight: 400,
            fontSize: hfs,
            lineHeight: m ? 1.04 : 1.02,
            letterSpacing: '0.01em',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}
        >
          {words.map((w, i) => (
            <Mask key={i} at={1.8 + i * 0.08}>
              {w}
            </Mask>
          ))}
        </h1>
        <Up
          at={2.2}
          style={{
            marginTop: m ? 20 : 18,
            maxWidth: m ? 350 : 520,
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: m ? 16 : 20,
            lineHeight: 1.35,
            color: 'rgba(255,255,255,.92)',
            textWrap: 'pretty',
          }}
        >
          {pain}
        </Up>
        <Up at={2.35} style={{ marginTop: 28, width: m ? '100%' : undefined }}>
          <Btn solid="white" h={m ? 52 : 50} px={32} fs={16} style={m ? { width: '100%' } : undefined}>
            {d.niche.cta}
          </Btn>
        </Up>
        {m && (
          <Up at={2.45} style={{ marginTop: 14, textAlign: 'center' }}>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 15,
                lineHeight: '20px',
                color: 'rgba(255,255,255,.8)',
                textDecoration: 'underline',
                textDecorationThickness: 1,
                textUnderlineOffset: 4,
              }}
            >
              {d.niche.cta2}
            </span>
          </Up>
        )}
      </div>
    </section>
  )
}

// ── вторая секция: указатель услуг с ценами (четыре позиции из прайса ниши)

function Second({ d, m }: { d: Draft; m: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  // въезд начинается, пока секция заезжает в кадр, и садится к ~4.6 с
  const S = SECOND_AT - 0.5
  const W = m ? 390 : 1280
  const list = d.niche.list.slice(0, 4).map(([n, p]) => ({ name: bare(n).toUpperCase(), price: bare(p) }))
  const pad = m ? 20 : 64
  const rowH = m ? 80 : 90
  const top = m ? 100 : 140
  const priceW = Math.max(0, ...list.map((r) => sansW(r.price, 20)))
  // таблица ширин занижает капс Tenor на 1–2 % — берём с запасом
  const widest = Math.max(1, ...list.map((r) => capsEm(r.name, 0.005) * 1.03))
  // телефон: номер слева (32px), название, стрелка справа
  const budget = m ? W - pad * 2 - 32 - 28 - 12 : Math.min(760, W - 136 - priceW - 48 - 184)
  const tfs = m ? Math.max(18, Math.min(22, Math.floor(budget / widest))) : Math.min(44, Math.floor(budget / widest))
  const wrap = m && widest * tfs > budget
  const facts = d.niche.facts.map((f) => nb(cap(bare(f))))
  const side = /услуг/i.test(d.label) ? null : d.label
  const factsTop = m ? top + list.length * rowH + 32 : 556

  return (
    <section style={{ position: 'relative', width: W, height: m ? 800 : 760, overflow: 'hidden', background: NAVY, color: '#fff' }}>
      {/* колонтитул */}
      <motion.div
        style={{
          position: 'absolute',
          left: pad,
          right: pad,
          top: m ? 64 : 96,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 13,
          lineHeight: '16px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: MUTED,
          whiteSpace: 'nowrap',
        }}
        initial={on ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={tr(S, 0.4, 'linear')}
      >
        <span>Услуги и цены</span>
        {!m && side && <span style={{ letterSpacing: '0.12em' }}>{side}</span>}
      </motion.div>

      {/* строки */}
      {list.map((r, i) => {
        const idx = String(i + 1).padStart(2, '0')
        const meta = S + 0.35 + i * 0.05
        const arrow = (
          <Up at={meta} dur={0.4} y={0} style={m ? { flex: 'none' } : { position: 'absolute', right: pad, top: (rowH - 14) / 2 }}>
            <motion.div variants={{ rest: { x: 0 }, hover: { x: 8 } }} transition={{ duration: 0.35, ease: EASE }}>
              <Arrow w={m ? 28 : 40} />
            </motion.div>
          </Up>
        )
        const title = (
          <Mask at={S + 0.12 + i * 0.08} dur={0.6} from="130%">
            {r.name}
          </Mask>
        )
        return (
          <motion.div
            key={i}
            initial="rest"
            animate="rest"
            whileHover="hover"
            style={{ position: 'absolute', left: 0, right: 0, top: top + i * rowH, height: rowH, cursor: 'pointer' }}
          >
            <motion.div
              style={{ position: 'absolute', inset: 0, background: NAVY_D }}
              variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
              transition={{ duration: 0.3 }}
            />
            {m ? (
              <div style={{ position: 'absolute', left: pad, right: pad, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <Up
                    at={meta}
                    dur={0.4}
                    y={0}
                    style={{ width: 32, flex: 'none', paddingTop: Math.max(0, Math.round((tfs * 1.05 - 16) / 2)), fontFamily: SANS, fontSize: 12, lineHeight: '16px', letterSpacing: '0.04em', color: MUTED }}
                  >
                    {idx}
                  </Up>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: CAPS,
                        fontSize: tfs,
                        lineHeight: 1.05,
                        letterSpacing: '0.005em',
                        ...(wrap ? { textWrap: 'balance', maxWidth: budget } : { whiteSpace: 'nowrap' }),
                      }}
                    >
                      {title}
                    </div>
                    <Up at={meta} dur={0.4} y={0} style={{ marginTop: 5, fontFamily: SANS, fontSize: 14, lineHeight: '18px', color: MUTED, whiteSpace: 'nowrap' }}>
                      {r.price}
                    </Up>
                  </div>
                </div>
                {arrow}
              </div>
            ) : (
              <>
                <Up
                  at={meta}
                  dur={0.4}
                  y={0}
                  style={{ position: 'absolute', left: pad, top: (rowH - 16) / 2, fontFamily: SANS, fontSize: 13, lineHeight: '16px', letterSpacing: '0.04em', color: MUTED }}
                >
                  {idx}
                </Up>
                <div
                  style={{
                    position: 'absolute',
                    left: 184,
                    top: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: CAPS,
                    fontSize: tfs,
                    lineHeight: 1,
                    letterSpacing: '0.005em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </div>
                <Up
                  at={meta}
                  dur={0.4}
                  y={0}
                  style={{
                    position: 'absolute',
                    right: 136,
                    top: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: SANS,
                    fontWeight: 400,
                    fontSize: 20,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.price}
                </Up>
                {arrow}
              </>
            )}
          </motion.div>
        )
      })}

      {/* волосяные линии рисуются слева направо */}
      {Array.from({ length: list.length + 1 }, (_, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', left: pad, right: pad, top: top + i * rowH, height: 1, background: LINE, transformOrigin: '0% 50%' }}
          initial={on ? { scaleX: 0 } : false}
          animate={{ scaleX: 1 }}
          transition={tr(S + i * 0.06, 0.6, IO)}
        />
      ))}

      {/* факты */}
      <div
        style={
          m
            ? { position: 'absolute', left: pad, right: pad, top: factsTop }
            : { position: 'absolute', left: pad, top: factsTop, display: 'flex', gap: 24 }
        }
      >
        {facts.map((f, i) => (
          <div key={i} style={m ? { height: 84 } : { width: 360 }}>
            <motion.div
              style={{ width: 32, height: 2, background: RED, transformOrigin: '0% 50%' }}
              initial={on ? { scaleX: 0 } : false}
              animate={{ scaleX: 1 }}
              transition={tr(S + 0.45 + i * 0.1, 0.5, IO)}
            />
            <Up
              at={S + 0.5 + i * 0.1}
              y={16}
              style={{
                marginTop: 16,
                fontFamily: CAPS,
                fontSize: m ? 20 : 24,
                lineHeight: 1.25,
                color: '#fff',
                maxWidth: m ? 330 : 340,
                textWrap: 'balance',
              }}
            >
              {f}
            </Up>
          </div>
        ))}
      </div>
    </section>
  )
}

function Desktop({ d }: { d: Draft }) {
  return (
    <div style={{ width: 1280, height: 1520 }}>
      <Hero d={d} m={false} />
      <Second d={d} m={false} />
    </div>
  )
}

function Mobile({ d }: { d: Draft }) {
  return (
    <div style={{ width: 390, height: 1600 }}>
      <Hero d={d} m />
      <Second d={d} m />
    </div>
  )
}

export default { Desktop, Mobile } satisfies Template
