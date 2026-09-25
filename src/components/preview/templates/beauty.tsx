import '@fontsource-variable/cormorant-garamond'
import '@fontsource-variable/cormorant-garamond/wght-italic.css'
import '@fontsource-variable/manrope'
import { motion, type Transition } from 'motion/react'
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import type { Draft } from '../../../data/niches'
import type { Template } from '.'
import { BgVideo, EASE, SECOND_AT, nicheVideo, useAnimOn } from '../anim'

/**
 * Красота: мягкая премиальная редакция (референс venetianspa.ca).
 * Одна идея трижды: арка открывает страницу, остаётся аркой внизу первого экрана
 * и возвращается окном с видео во второй секции
 */

const SERIF = "'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif"
const SANS = "'Manrope Variable', Manrope, system-ui, sans-serif"
const CREAM = '#f5f1e8'
const BAR = '#faf8f3'
const GOLD = '#b69f64'
const GOLD_T = '#9c844f'
const INK = '#2f2620'
const MUTED = '#726350'
const SH = (a: number) => `rgba(51,36,27,${a})`
const CURTAIN = [0.76, 0, 0.24, 1] as const
const NAV = ['Услуги', 'Цены', 'Мастера', 'Контакты']
const OPEN = 'inset(0px 0px 0px 0px round 0px 0px 0px 0px)'

/**
 * Кадр под каждый ролик сферы: у маникюра, салона и массажа руки и лица в разных местах.
 * pos / mpos — куда смотрит первый экран на компьютере и телефоне (фокус ролика),
 * win / winAt — кадр в окне-арке второй секции (другой, чем в первом экране),
 * wash / washAt / washK — выцветшая подложка второй секции, tone — насколько гуще тени,
 * glow — тёплое пятно прямо за заголовком, когда под ним светлые руки (glowD — своё место на компьютере),
 * peek / mpeek — сдвиг кадра на старте, чтобы в маленьком окне-арке было главное (лицо, кисть), а не кусок кожи
 */
interface Look {
  pos: string
  mpos: string
  win: string
  winAt: string
  winK: number
  wash: string
  washAt: string
  washK: number
  tone: number
  glow: number
  glowD?: string
  peek: [number, number]
  mpeek: [number, number]
  grade: string
}
const LOOKS: Record<string, Look> = {
  // массаж: рука на шее справа от центра, яркие простыни и занавеска справа сверху
  beauty: {
    pos: '50% 50%',
    mpos: '36% 55%',
    win: '30% 50%',
    winAt: '50% 75%',
    winK: 1.35,
    wash: '100% 0%',
    washAt: '100% 0%',
    washK: 2.2,
    tone: 1,
    glow: 0,
    peek: [0, 10],
    mpeek: [0, 0],
    grade: 'contrast(1.1) saturate(1.12) brightness(.97)',
  },
  // маникюр: кисть и ноготь чуть правее центра на белом фоне — фон светлый, тени гуще
  nails: {
    pos: '60% 50%',
    mpos: '60% 50%',
    win: '66% 50%',
    winAt: '50% 55%',
    winK: 1.3,
    wash: '0% 100%',
    washAt: '0% 100%',
    washK: 1.7,
    tone: 1.18,
    glow: 0.55,
    peek: [-110, 20],
    mpeek: [0, 0],
    grade: 'contrast(1.08) saturate(1.1) brightness(.93)',
  },
  // салон: профиль клиентки в центре, щипцы слева, зелень в левом верхнем углу
  salon: {
    pos: '55% 50%',
    mpos: '55% 50%',
    win: '60% 50%',
    winAt: '50% 30%',
    winK: 1.3,
    wash: '0% 0%',
    washAt: '0% 0%',
    washK: 2.8,
    tone: 1,
    // синие щипцы у левого края стоят прямо за первой строкой — гасим их
    glow: 0.4,
    glowD: '42% 46% at 14% 42%',
    peek: [-200, 0],
    mpeek: [-160, -30],
    grade: 'contrast(1.08) saturate(1.1) brightness(.98)',
  },
}
const lookOf = (d: Draft) => LOOKS[d.niche.video ?? 'beauty'] ?? LOOKS.beauty

type Ease = Transition['ease']
function useTr() {
  const on = useAnimOn()
  return (delay: number, duration: number, ease: Ease = EASE): Transition => (on ? { delay, duration, ease } : { duration: 0 })
}

/** Неразрывный пробел после коротких предлогов и союзов, перед тире */
const nb = (s: string) =>
  s
    .replace(/(?<=^|[\s«(])(в|во|с|со|к|ко|о|об|у|и|а|но|на|за|до|по|из|от|не|ни|без|для|как|или)\s+/gi, '$1 ')
    .replace(/\s+—/g, ' —')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Ширина букв Cormorant Garamond 500 в верхнем регистре, em (замерено в браузере) — чтобы длинные слова влезали без замеров DOM */
const GLYPH: Record<string, number> = {"0":0.47,"1":0.33,"2":0.4,"3":0.39,"4":0.45,"5":0.4,"6":0.46,"7":0.42,"8":0.48,"9":0.46,"А":0.7,"Б":0.56,"В":0.56,"Г":0.51,"Д":0.71,"Е":0.54,"Ё":0.54,"Ж":0.99,"З":0.51,"И":0.76,"Й":0.76,"К":0.66,"Л":0.7,"М":0.84,"Н":0.76,"О":0.76,"П":0.74,"Р":0.54,"С":0.66,"Т":0.63,"У":0.61,"Ф":0.77,"Х":0.65,"Ц":0.73,"Ч":0.63,"Ш":1.04,"Щ":1.04,"Ъ":0.58,"Ы":0.86,"Ь":0.55,"Э":0.62,"Ю":1.03,"Я":0.6,"A":0.7,"B":0.56,"C":0.68,"D":0.69,"E":0.54,"F":0.51,"G":0.71,"H":0.76,"I":0.33,"J":0.32,"K":0.65,"L":0.53,"M":0.84,"N":0.72,"O":0.76,"P":0.54,"Q":0.76,"R":0.68,"S":0.49,"T":0.63,"U":0.69,"V":0.66,"W":0.92,"X":0.65,"Y":0.61,"Z":0.59," ":0.23,".":0.25,",":0.27,"-":0.32,"+":0.39,"«":0.46,"»":0.46,"&":0.7}
/** Ширина строки капсом в em; tracking — дополнительная разрядка в em на букву */
const capsEm = (t: string, tracking = 0) => [...t.toUpperCase()].reduce((a, c) => a + (GLYPH[c] ?? 0.66) + tracking, 0)

/** «Мастера с опытом от 5 лет» → число «от 5 лет» + подпись «мастера с опытом». Без цифры — null */
function splitFact(f: string): { value: string; caption: string } | null {
  const m = f.match(/(?:(?:от|до|за|с)\s)?\d[\d\s:.,]*(?:\s?(?:лет|года?|мин(?:ут)?|час(?:а|ов)?|₽|%|\+))?/i)
  if (!m || m.index === undefined) return null
  const value = m[0].trim()
  const caption = `${f.slice(0, m.index)} ${f.slice(m.index + m[0].length)}`.replace(/\s+/g, ' ').trim()
  return caption ? { value, caption } : null
}

// ── геометрия двух версий
interface Geo {
  w: number
  h: number
  /** окно-арка на старте: отступы сверху, справа, снизу, слева */
  win: [number, number, number, number]
  svg: { x: number; y: number; w: number; h: number; r: number }
  arch: number
  archTop: number
  /** сила нижней тени: у края, в точке bAt %, ноль в zAt % */
  low: [number, number, number, number]
  /** где стоит заголовок: центр тёплого пятна glow */
  glowAt: string
}
const DG: Geo = {
  w: 1280,
  h: 760,
  win: [190, 490, 170, 490],
  svg: { x: 478, y: 178, w: 324, h: 412, r: 161.5 },
  arch: 1200,
  archTop: 704,
  low: [0.74, 0.42, 34, 62],
  glowAt: '62% 40% at 32% 56%',
}
const MG: Geo = {
  w: 390,
  h: 800,
  win: [250, 95, 280, 95],
  svg: { x: 83, y: 238, w: 224, h: 282, r: 111.5 },
  arch: 640,
  archTop: 770,
  low: [0.8, 0.5, 40, 72],
  glowAt: '95% 30% at 30% 70%',
}

/** Окно-арка: полукруглый верх при любой ширине — так арка держит форму, пока раскрывается */
const archInset = (g: Geo, k: number) => {
  const [t, r, b, l] = g.win.map((v) => Math.round(v * k))
  const rad = Math.round((g.w - r - l) / 2)
  return `inset(${t}px ${r}px ${b}px ${l}px round ${rad}px ${rad}px 0px 0px)`
}

/** Тёплые тени поверх видео: шапка (с подсветкой углов, где стоят лого и кнопка), левый нижний угол под текстом, низ кадра */
const shade = (g: Geo, look: Look) => {
  const k = (a: number) => SH(+Math.min(0.92, a * look.tone).toFixed(3))
  const [a, b, bAt, zAt] = g.low
  return [
    `linear-gradient(to bottom, ${k(0.7)} 0px, ${k(0.42)} 88px, ${SH(0)} 190px)`,
    `radial-gradient(55% 190px at 88% 0%, ${k(0.35)}, ${SH(0)} 70%)`,
    `radial-gradient(45% 170px at 10% 0%, ${k(0.22)}, ${SH(0)} 70%)`,
    `radial-gradient(90% 80% at 0% 100%, ${k(0.6)}, ${SH(0)} 65%)`,
    `linear-gradient(to top, ${k(a)} 0%, ${k(b)} ${bAt}%, ${SH(0)} ${zAt}%)`,
    ...(look.glow ? [`radial-gradient(${(g.w > 500 && look.glowD) || g.glowAt}, ${SH(look.glow)}, ${SH(0)})`] : []),
  ].join(', ')
}

const sectionStyle = (g: Geo, background: string): CSSProperties => ({
  position: 'relative',
  width: g.w,
  height: g.h,
  overflow: 'hidden',
  background,
})

// ── первый экран: окно-арка раскрывается в полный кадр (всё встаёт к ~2,6 с, прокрутка стартует в 3,3 с)
function Window({ d, g, m }: { d: Draft; g: Geo; m: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const v = nicheVideo(d, 'beauty')
  const look = lookOf(d)
  const peek = m ? look.mpeek : look.peek
  // арка растёт, оставаясь аркой почти во весь экран, и только в самом конце расправляет плечи в полный кадр
  const open: Transition = on
    ? {
        delay: 0.6,
        duration: 1.2,
        times: [0, 0.45, 0.8, 1],
        ease: [[0.6, 0, 0.8, 0.7], 'linear', [0.3, 0.6, 0.4, 1]],
      }
    : { duration: 0 }
  return (
    <motion.div
      className="absolute inset-0"
      initial={on ? { clipPath: archInset(g, 1) } : false}
      animate={{ clipPath: on ? [archInset(g, 1), archInset(g, 0.5), archInset(g, 0.12), OPEN] : OPEN }}
      transition={open}
    >
      {/* в окне на старте — главное в кадре; к полному раскрытию кадр встаёт на место */}
      <motion.div
        className="absolute inset-0"
        initial={on ? { transform: `translate(${peek[0]}px, ${peek[1]}px)` } : false}
        animate={{ transform: 'translate(0px, 0px)' }}
        transition={tr(0.6, 1.1, [0.45, 0, 0.25, 1])}
      >
        <motion.div
          className="absolute inset-0"
          style={{ filter: look.grade }}
          initial={on ? { transform: 'scale(1.08)' } : false}
          animate={{ transform: 'scale(1)' }}
          transition={tr(0.6, 1.8, 'easeOut')}
        >
          <BgVideo src={v.src} poster={v.poster} position={m ? look.mpos : look.pos} push={false} reveal="none" className="absolute inset-0" />
        </motion.div>
      </motion.div>
      {/* тёплый грейд: холодный кадр становится шампанским уже в окне, до раскрытия */}
      <motion.div
        className="absolute inset-0"
        style={{ background: '#ead6c4', mixBlendMode: 'multiply' }}
        initial={on ? { opacity: 0.3 } : false}
        animate={{ opacity: 0.4 }}
        transition={tr(0.9, 0.9)}
      />
      <motion.div
        className="absolute inset-0"
        style={{ background: shade(g, look) }}
        initial={on ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={tr(0.9, 0.9)}
      />
    </motion.div>
  )
}

/** Золотая волосяная арка вокруг окна: прорисовывается, потом расходится и гаснет */
function HairArch({ g }: { g: Geo }) {
  const on = useAnimOn()
  const tr = useTr()
  if (!on) return null
  const { x, y, w, h, r } = g.svg
  return (
    <motion.svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }}
      initial={{ opacity: 1, transform: 'scale(1)' }}
      animate={{ opacity: 0, transform: 'scale(1.5)' }}
      transition={tr(0.6, 0.4, 'easeIn')}
    >
      <motion.path
        d={`M0.5 ${h - 0.5}V${r + 0.5}A${r} ${r} 0 0 1 ${w - 0.5} ${r + 0.5}V${h - 0.5}`}
        stroke={GOLD}
        strokeWidth={1}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={tr(0.1, 0.6, 'easeInOut')}
      />
    </motion.svg>
  )
}

function BottomArch({ g }: { g: Geo }) {
  const on = useAnimOn()
  const tr = useTr()
  return (
    <motion.div
      style={{ position: 'absolute', left: (g.w - g.arch) / 2, top: g.archTop, width: g.arch, height: g.arch, borderRadius: '50%', background: CREAM }}
      initial={on ? { transform: `translateY(${g.h - g.archTop}px)` } : false}
      animate={{ transform: 'translateY(0px)' }}
      transition={tr(1.95, 0.6)}
    />
  )
}

/** Строка услуг выезжает из-под маски */
function Line({ delay, children }: { delay: number; children: ReactNode }) {
  const on = useAnimOn()
  const tr = useTr()
  return (
    <span style={{ display: 'block', overflow: 'hidden', padding: '0.08em 0 0.1em', margin: '-0.08em 0 -0.1em', whiteSpace: 'nowrap' }}>
      <motion.span
        style={{ display: 'block' }}
        initial={on ? { transform: 'translateY(105%)' } : false}
        animate={{ transform: 'translateY(0%)' }}
        transition={tr(delay, 0.8)}
      >
        {children}
      </motion.span>
    </span>
  )
}

function Up({ delay, y = 12, dur = 0.6, children, style }: { delay: number; y?: number; dur?: number; children: ReactNode; style?: CSSProperties }) {
  const on = useAnimOn()
  const tr = useTr()
  return (
    <motion.div
      style={style}
      initial={on ? { opacity: 0, transform: `translateY(${y}px)` } : false}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={tr(delay, dur)}
    >
      {children}
    </motion.div>
  )
}

function Logo({ d, color, size, sub, subColor, maxW }: { d: Draft; color: string; size: number; sub: boolean; subColor: string; maxW: number }) {
  // совсем длинное имя не мельчим дальше 14 px — переносим на вторую строку
  const wrap = size < 14
  // под именем — кто мы («студия маникюра»), как «NAIL SPA» у референса; если это уже есть в имени, не повторяем
  const noun = d.niche.noun
  const showSub = sub && !d.name.toLowerCase().includes(noun.toLowerCase().slice(0, 5))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: maxW }}>
      <span
        style={{
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: wrap ? 14 : size,
          lineHeight: wrap ? 1.15 : 1,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color,
          whiteSpace: wrap ? 'normal' : 'nowrap',
        }}
      >
        {d.name}
      </span>
      {showSub && (
        <span
          style={{
            marginTop: 6,
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 10,
            lineHeight: 1,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: subColor,
            whiteSpace: 'nowrap',
          }}
        >
          {noun}
        </span>
      )}
    </div>
  )
}

function NavD({ d, solid }: { d: Draft; solid?: boolean }) {
  const c = solid ? GOLD_T : '#fff'
  const size = Math.floor(Math.min(24, 420 / capsEm(d.name, 0.125)))
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: solid ? 72 : 88,
        padding: '0 104px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 40,
        background: solid ? BAR : undefined,
        zIndex: 5,
      }}
    >
      <Logo d={d} color={c} size={size} sub subColor={solid ? GOLD_T : 'rgba(255,255,255,.78)'} maxW={430} />
      <nav style={{ display: 'flex', alignItems: 'center', gap: 36, fontFamily: SERIF, fontWeight: 500, fontSize: 18, color: c, whiteSpace: 'nowrap' }}>
        {NAV.map((n) => (
          <span key={n}>{n}</span>
        ))}
        <span
          style={{
            border: `1px solid ${solid ? GOLD : 'rgba(255,255,255,.8)'}`,
            borderRadius: 999,
            padding: '10px 26px 11px',
            fontSize: 17,
            lineHeight: 1,
          }}
        >
          {d.niche.cta}
        </span>
      </nav>
    </div>
  )
}

function Burger({ color }: { color: string }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 22, flex: 'none' }}>
      <span style={{ height: 1, background: color }} />
      <span style={{ height: 1, background: color }} />
    </span>
  )
}

function NavM({ d, solid }: { d: Draft; solid?: boolean }) {
  const c = solid ? GOLD_T : '#fff'
  // длинное имя важнее кнопки в шапке: кнопка записи всё равно есть на экране ниже
  const pillW = d.niche.cta.length * 14 * 0.44 + 32
  const em = capsEm(d.name, 0.105)
  const withPill = em * 17 <= 350 - 38 - pillW - 16
  const room = 350 - 38 - (withPill ? pillW + 16 : 0)
  const size = Math.floor(Math.min(20, room / em))
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: solid ? 60 : 64,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        background: solid ? BAR : undefined,
        zIndex: 5,
      }}
    >
      <Logo d={d} color={c} size={size} sub={false} subColor={c} maxW={room} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 'none' }}>
        {withPill && (
          <span
            style={{
              border: `1px solid ${solid ? GOLD : 'rgba(255,255,255,.8)'}`,
              borderRadius: 999,
              padding: '8px 16px 9px',
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 14,
              lineHeight: 1,
              color: c,
              whiteSpace: 'nowrap',
            }}
          >
            {d.niche.cta}
          </span>
        )}
        <Burger color={c} />
      </div>
    </div>
  )
}

function Ctas({ d, m }: { d: Draft; m: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: m ? 20 : 28 }}>
      {/* цвет и фон — классами, чтобы наведение перекрашивало кнопку в крем */}
      <span
        className="cursor-pointer text-white transition-colors duration-300 hover:bg-[#f5f1e8] hover:text-[#33241b]"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: m ? 48 : 50,
          padding: m ? '0 24px 2px' : '0 30px 2px',
          border: `1px solid ${CREAM}`,
          borderRadius: 999,
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: m ? 16 : 18,
          whiteSpace: 'nowrap',
        }}
      >
        {d.niche.cta}
      </span>
      <span
        className="cursor-pointer decoration-[rgba(245,241,232,.5)] transition-colors duration-300 hover:decoration-[#f5f1e8]"
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: m ? 17 : 19,
          color: CREAM,
          textDecoration: 'underline',
          textDecorationThickness: 1,
          textUnderlineOffset: 6,
          whiteSpace: 'nowrap',
        }}
      >
        {d.niche.cta2}
      </span>
    </div>
  )
}

function Hero({ d, m }: { d: Draft; m: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  const g = m ? MG : DG
  const s = d.niche.services
  // две строки, как у референса, если первая пара влезает крупно; иначе по услуге на строку
  const avail = m ? 350 : 820
  const lines = m || avail / capsEm(`${s[0]} ${s[1]}`) < 64 ? [...s] : [`${s[0]} ${s[1]}`, s[2]]
  const widest = Math.max(...lines.map((l) => capsEm(l)))
  const fs = Math.min(m ? 50 : 84, avail / widest)
  return (
    <section style={sectionStyle(g, CREAM)}>
      <Window d={d} g={g} m={m} />
      <HairArch g={g} />
      <BottomArch g={g} />
      <motion.div
        className="absolute inset-x-0 top-0"
        style={{ zIndex: 5, textShadow: '0 1px 14px rgba(51,36,27,.45)' }}
        initial={on ? { opacity: 0, transform: 'translateY(-8px)' } : false}
        animate={{ opacity: 1, transform: 'translateY(0px)' }}
        transition={tr(1.35, 0.6)}
      >
        {m ? <NavM d={d} /> : <NavD d={d} />}
      </motion.div>
      <div style={{ position: 'absolute', left: m ? 20 : 104, bottom: m ? 76 : 113, width: m ? 350 : 826 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: Math.round(fs),
            lineHeight: 0.92,
            letterSpacing: '-0.005em',
            textTransform: 'uppercase',
            color: '#fff',
          }}
        >
          {lines.map((l, i) => (
            <Line key={i} delay={1.45 + i * 0.1}>
              {l}
            </Line>
          ))}
        </h1>
        <Up delay={1.85} style={{ marginTop: m ? 14 : 20 }}>
          <p
            style={{
              margin: 0,
              maxWidth: m ? 340 : 560,
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: m ? 17 : 22,
              lineHeight: 1.3,
              color: 'rgba(245,241,232,.92)',
              textWrap: 'balance',
            }}
          >
            {nb(d.niche.pain)}
          </p>
        </Up>
        <Up delay={2} style={{ marginTop: m ? 20 : 28 }}>
          <Ctas d={d} m={m} />
        </Up>
      </div>
    </section>
  )
}

// ── вторая секция: арка-окно с видео, слоган, факты
function Lozenge({ style }: { style?: CSSProperties }) {
  return <span style={{ position: 'absolute', width: 7, height: 7, border: `1px solid ${GOLD}`, transform: 'rotate(45deg)', ...style }} />
}

function Ornament({ delay, style, children }: { delay: number; style: CSSProperties; children: ReactNode }) {
  const on = useAnimOn()
  const tr = useTr()
  return (
    <motion.div
      style={{ position: 'absolute', ...style }}
      initial={on ? { opacity: 0, transform: 'scale(0.6)' } : false}
      animate={{ opacity: 1, transform: 'scale(1)' }}
      transition={tr(delay, 0.5)}
    >
      {children}
    </motion.div>
  )
}

/** Факт: число с подписью, если цифры есть у всех трёх; иначе все три одной тихой курсивной строкой */
function Fact({ f, m, numeric }: { f: string; m: boolean; numeric: boolean }) {
  const p = numeric ? splitFact(f) : null
  if (!p)
    return (
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: m ? 22 : 25, lineHeight: 1.15, color: INK, textAlign: 'center', textWrap: 'balance' }}>
        {nb(f)}
      </span>
    )
  return (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <span style={{ fontFamily: SERIF, fontWeight: 500, fontSize: m ? 32 : 40, lineHeight: 1, color: INK, whiteSpace: 'nowrap' }}>{p.value}</span>
      <span
        style={{
          marginTop: m ? 8 : 10,
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: m ? 10 : 11,
          lineHeight: 1.4,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: MUTED,
        }}
      >
        {nb(p.caption)}
      </span>
    </span>
  )
}

/** Золотая волосяная арка вокруг окна второй секции — та же, что открывала страницу; ромбы стоят у её ног */
function WinArch({ x, y, w, h, delay }: { x: number; y: number; w: number; h: number; delay: number }) {
  const on = useAnimOn()
  const tr = useTr()
  const r = w / 2
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }}>
      <motion.path
        d={`M0.5 ${h}V${r}A${r - 0.5} ${r - 0.5} 0 0 1 ${w - 0.5} ${r}V${h}`}
        stroke={GOLD}
        strokeWidth={1}
        opacity={0.75}
        initial={on ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={tr(delay, 0.9, 'easeInOut')}
      />
    </svg>
  )
}

function Second({ d, m }: { d: Draft; m: boolean }) {
  const on = useAnimOn()
  const tr = useTr()
  // прокрутка доезжает до второй секции к SECOND_AT и держит её до ~5,8 с: всё встаёт к ~5,2 с
  const T = SECOND_AT
  const g = m ? MG : DG
  const v = nicheVideo(d, 'beauty')
  const look = lookOf(d)
  const win = m ? { x: 85, y: 168, w: 220, h: 290 } : { x: 500, y: 178, w: 280, h: 372 }
  const r = win.w / 2
  const round = `round ${r}px ${r}px 0px 0px`
  // волосяная арка снаружи окна и ромбы: венец над вершиной, по ромбу у ног арки
  const ofs = m ? 10 : 14
  const crownY = win.y - ofs - 12
  const footY = win.y + win.h
  const tagline = nb(cap(d.label))
  const numeric = d.niche.facts.every((f) => splitFact(f))
  return (
    <section style={sectionStyle(g, GOLD)}>
      {/* кремовая панель — во всю ширину арка, продолжает арку первого экрана */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          /* вершина арки уходит под шапку, как у референса: золото видно только в углах */
          top: m ? -31 : -160,
          bottom: 0,
          background: CREAM,
          borderRadius: m ? '50% 50% 0 0 / 231px 231px 0 0' : '50% 50% 0 0 / 440px 440px 0 0',
          overflow: 'hidden',
        }}
      >
        {/* выцветшее фото, как у референса: другой угол того же ролика, без размытия */}
        <motion.img
          src={v.poster}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: look.wash,
            transform: `scale(${look.washK})`,
            transformOrigin: look.washAt,
            // выцветшая тёплая фотография, а не цветное пятно: синие щипцы и сиреневая заколка уходят в беж
            filter: 'sepia(.55) saturate(.7)',
            maskImage: 'linear-gradient(#000 55%, transparent)',
            WebkitMaskImage: 'linear-gradient(#000 55%, transparent)',
          }}
          initial={on ? { opacity: 0 } : false}
          animate={{ opacity: 0.12 }}
          transition={tr(T - 0.2, 1.2)}
        />
      </div>

      {m ? <NavM d={d} solid /> : <NavD d={d} solid />}

      {/* слоган: растёт вверх, если имя длинное */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: g.h - (m ? 130 : 126), display: 'flex', justifyContent: 'center' }}>
        <Up delay={T - 0.1} y={16} dur={0.8}>
          <p
            style={{
              margin: 0,
              maxWidth: m ? 300 : 900,
              textAlign: 'center',
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: m ? (tagline.length > 34 ? 19 : 22) : tagline.length > 56 ? 24 : 30,
              lineHeight: 1.15,
              color: GOLD_T,
              textWrap: 'balance',
            }}
          >
            {tagline}
          </p>
        </Up>
      </div>

      {/* окно-арка с крупным планом: другой кадр того же ролика */}
      <motion.div
        style={{ position: 'absolute', left: win.x, top: win.y, width: win.w, height: win.h, borderRadius: `${r}px ${r}px 0 0`, overflow: 'hidden', background: '#e9e1d3' }}
        initial={on ? { clipPath: `inset(100% 0px 0px 0px ${round})` } : false}
        animate={{ clipPath: `inset(0% 0px 0px 0px ${round})` }}
        transition={tr(T, 1, CURTAIN)}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transformOrigin: look.winAt, filter: look.grade }}
          initial={on ? { transform: `scale(${look.winK + 0.15})` } : false}
          animate={{ transform: `scale(${look.winK})` }}
          transition={tr(T, 1.3, 'easeOut')}
        >
          <BgVideo src={v.src} poster={v.poster} position={look.win} push={false} reveal="none" className="absolute inset-0" />
        </motion.div>
        <div className="absolute inset-0" style={{ background: '#ead6c4', mixBlendMode: 'multiply', opacity: 0.5 }} />
        <div className="absolute inset-0" style={{ borderRadius: `${r}px ${r}px 0 0`, boxShadow: 'inset 0 0 0 1px rgba(182,159,100,.5)' }} />
      </motion.div>
      <WinArch x={win.x - ofs} y={win.y - ofs} w={win.w + ofs * 2} h={win.h + ofs - 7} delay={T + 0.35} />

      {/* орнамент: ромб-венец над вершиной с волосяными линиями, ромбы у ног арки */}
      <Ornament delay={T + 0.4} style={{ left: g.w / 2 - 50, top: crownY - 5, width: 100, height: 10 }}>
        <span style={{ position: 'absolute', left: 0, top: 5, width: 28, height: 1, background: GOLD }} />
        <Lozenge style={{ left: 46, top: 1.5 }} />
        <span style={{ position: 'absolute', right: 0, top: 5, width: 28, height: 1, background: GOLD }} />
      </Ornament>
      <Ornament delay={T + 0.48} style={{ left: win.x - ofs - 5, top: footY - 5, width: 10, height: 10 }}>
        <Lozenge style={{ left: 1.5, top: 1.5 }} />
      </Ornament>
      <Ornament delay={T + 0.48} style={{ left: win.x + win.w + ofs - 5, top: footY - 5, width: 10, height: 10 }}>
        <Lozenge style={{ left: 1.5, top: 1.5 }} />
      </Ornament>

      {/* факты тихой антиквой */}
      {m ? (
        <div style={{ position: 'absolute', left: 20, right: 20, top: 482, height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {d.niche.facts.map((f, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <motion.span
                  style={{ width: 32, height: 1, background: GOLD, margin: numeric ? '16px 0' : '14px 0', flex: 'none' }}
                  initial={on ? { transform: 'scaleX(0)' } : false}
                  animate={{ transform: 'scaleX(1)' }}
                  transition={tr(T + 0.45 + i * 0.1, 0.6)}
                />
              )}
              <Up delay={T + 0.45 + i * 0.1} y={14}>
                <Fact f={f} m numeric={numeric} />
              </Up>
            </Fragment>
          ))}
        </div>
      ) : (
        <div style={{ position: 'absolute', left: 104, right: 104, top: 612, height: 74, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {d.niche.facts.map((f, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <motion.span
                  style={{ width: 1, height: 44, background: GOLD, flex: 'none' }}
                  initial={on ? { transform: 'scaleY(0)' } : false}
                  animate={{ transform: 'scaleY(1)' }}
                  transition={tr(T + 0.45 + i * 0.1, 0.6)}
                />
              )}
              <Up
                delay={T + 0.45 + i * 0.1}
                y={14}
                style={{ minWidth: numeric ? 230 : 260, maxWidth: 380, padding: '0 40px', display: 'flex', justifyContent: 'center' }}
              >
                <Fact f={f} m={false} numeric={numeric} />
              </Up>
            </Fragment>
          ))}
        </div>
      )}
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
