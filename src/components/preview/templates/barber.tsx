/**
 * Барбершоп. Референс — barbershopjordaan.nl: тёмный зал, тёплые лампы, антиква по центру.
 * WOW — «бритвенный проход»: косой штрих света срезает тёмный слой и открывает видео и текст.
 * Вторая секция — «история»: прайс слева, кадр из той же съёмки справа, наклейка с фактом
 */
import '@fontsource-variable/noto-serif-display/wght.css'
import '@fontsource-variable/noto-serif-display/wght-italic.css'
import { animate, motion, useMotionTemplate, useMotionValue, useTransform, type Transition } from 'motion/react'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { Draft } from '../../../data/niches'
import type { Template } from '.'
import { BgVideo, EASE, SECOND_AT, asset, nicheVideo, useAnimOn } from '../anim'

const C = {
  ink: '#0B0908',
  ink2: '#15100D',
  cream: '#F2EADC',
  dim: '#C9BBA3',
  tung: '#E3A862',
  fil: '#FFE3B8',
  hair: 'rgba(242,234,220,.14)',
}
const SERIF = "'Noto Serif Display Variable', 'Noto Serif Display', Georgia, serif"
const SANS = "'Onest Variable', system-ui, sans-serif"
const CUT = [0.7, 0, 0.25, 1] as const
const GRADE = 'sepia(.15) saturate(.9) brightness(.95) contrast(1.06)'
/** Кадр той же съёмки (7.5 с) для второй секции: барбер, рука в перчатке и клиент целиком */
const STORY = 'video/niche/barber-story.webp'

/* ---------- текст ---------- */

/** Неразрывный пробел после коротких предлогов и союзов и между числом и словом */
function nb(s: string) {
  const re = /(^|[\s(«])(в|во|на|за|с|со|к|ко|у|о|об|по|до|из|от|и|а|но|не|для|без|при|под|над|про)\s+/giu
  return s.replace(re, '$1$2\u00A0').replace(re, '$1$2\u00A0').replace(/(\d)\s+(?=[^\d\s])/g, '$1\u00A0')
}
/** Боль по предложениям: каждое с новой строки, чтобы фраза не рвалась посреди строки */
function Sentences({ text }: { text: string }) {
  return (
    <>
      {text.split(/(?<=[.!?…])\s+/).map((s, i) => (
        <span key={i} style={{ display: 'block', textWrap: 'balance' }}>
          {nb(s)}
        </span>
      ))}
    </>
  )
}
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const longest = (xs: string[]) => xs.reduce((a, b) => (b.length > a.length ? b : a), '')
/** Кегль, при котором строка из n знаков влезает в ширину: k — средняя ширина знака в долях кегля */
const fitPx = (text: string, max: number, width: number, k: number) => Math.min(max, Math.floor(width / (Math.max(1, text.length) * k)))

function names(d: Draft) {
  const noun = d.niche.noun
  const hasNoun = d.name.toLowerCase().includes(noun.toLowerCase().slice(0, 5))
  const main = d.quoted ? `«${d.name}»` : d.name
  const top = hasNoun ? '' : noun
  return { top, main }
}

/** «Работаем до 22:00» → [«Работаем до», «22:00»] */
function splitLast(s: string): [string, string] {
  const w = s.trim().split(/\s+/)
  return w.length < 2 ? ['', s] : [w.slice(0, -1).join(' '), w[w.length - 1]]
}

/* ---------- время ---------- */

/**
 * Часы второй секции. Прокрутка едет вниз с 3.3 до 4.4 с, поэтому вход начинается, пока секция въезжает,
 * и к ~4.6 с всё уже стоит — вторую секцию успевают увидеть собранной до обратной прокрутки
 */
const S2 = SECOND_AT - 0.5

function useS(off: number, duration = 0.6, ease: Transition['ease'] = EASE): Transition {
  const on = useAnimOn()
  return on ? { delay: S2 + off, duration, ease } : { duration: 0 }
}

/* ---------- кирпичи ---------- */

const eyebrowStyle: CSSProperties = {
  fontFamily: SANS,
  fontWeight: 500,
  fontSize: 10.5,
  letterSpacing: '.28em',
  textTransform: 'uppercase',
  color: C.tung,
  lineHeight: 1,
  whiteSpace: 'nowrap',
}

function Btn({ primary, children, h = 54, minW, fs = 13, style }: { primary?: boolean; children: ReactNode; h?: number; minW?: number; fs?: number; style?: CSSProperties }) {
  return (
    <span
      className={primary ? 'transition-colors hover:!bg-[#F0B96E]' : 'transition-colors hover:!border-[#E3A862] hover:!text-[#E3A862]'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: h,
        minWidth: minW,
        padding: '0 28px',
        paddingLeft: 'calc(28px + .22em)',
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: fs,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        background: primary ? C.tung : 'transparent',
        color: primary ? C.ink : C.cream,
        border: primary ? 'none' : '1px solid rgba(242,234,220,.55)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** Видео слегка «садится» после прохода бритвы: камера отъезжает 1.06 → 1 */
function Settle({ children }: { children: ReactNode }) {
  const on = useAnimOn()
  return (
    <motion.div
      className="absolute inset-0"
      initial={on ? { transform: 'scale(1.06)' } : false}
      animate={{ transform: 'scale(1)' }}
      transition={on ? { delay: 0.35, duration: 2.4, ease: EASE } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

/** Слои поверх видео: лицо клиента и лампы читаются за заголовком, текст остаётся чистым */
function Overlays({ pool, poolA, bottom }: { pool: string; poolA: number; bottom: number }) {
  const layer: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' }
  return (
    <>
      <div style={{ ...layer, background: 'rgba(11,9,8,.3)' }} />
      <div style={{ ...layer, background: `radial-gradient(${pool}, rgba(11,9,8,${poolA}), transparent)` }} />
      <div style={{ ...layer, background: 'linear-gradient(180deg, rgba(11,9,8,.85) 0, transparent 150px)' }} />
      <div style={{ ...layer, background: `linear-gradient(0deg, ${C.ink} 0, transparent ${bottom}px)` }} />
      <div style={{ ...layer, background: 'radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,.5))' }} />
    </>
  )
}

/**
 * Бритвенный проход. Тёмный слой срезается косой кромкой T→B, по кромке идёт лезвие света.
 * slant — насколько низ кромки отстаёт от верха (в % ширины), span — путь верха кромки
 */
function Razor({ w, h, slant, span, dur }: { w: number; h: number; slant: number; span: number; dur: number }) {
  const on = useAnimOn()
  const p = useMotionValue(0)
  const T = useTransform(p, (v) => -16 + v * span)
  const B = useTransform(T, (v) => v - slant)
  const clip = useMotionTemplate`polygon(${T}% 0%, 100% 0%, 100% 100%, ${B}% 100%)`
  const x = useTransform(T, (v) => ((v - slant / 2) / 100) * w)
  const angle = (Math.atan2((slant / 100) * w, h) * 180) / Math.PI
  const bladeOp = useTransform(p, [0, 0.94, 1], [1, 1, 0])
  useEffect(() => {
    if (!on) return
    const c = animate(p, 1, { delay: 0.35, duration: dur, ease: CUT })
    return () => c.stop()
  }, [on, p, dur])
  if (!on) return null
  const L = h * 1.3
  const bar = (width: number, bg: string, extra?: CSSProperties): CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: -width / 2,
    width,
    height: L,
    background: bg,
    ...extra,
  })
  return (
    <>
      <motion.div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 30, background: C.ink, clipPath: clip, pointerEvents: 'none' }} />
      <motion.div
        aria-hidden
        style={{ position: 'absolute', left: 0, top: (h - L) / 2, width: 0, height: L, zIndex: 31, x, rotate: angle, opacity: bladeOp, pointerEvents: 'none' }}
      >
        <div style={bar(150, 'linear-gradient(90deg, transparent, rgba(227,168,98,.09) 50%, transparent)')} />
        <div style={bar(26, 'linear-gradient(90deg, transparent, rgba(227,168,98,.42) 50%, transparent)')} />
        <div style={bar(1.5, C.fil, { boxShadow: `0 0 6px 1px rgba(255,227,184,.85), 0 0 18px 2px rgba(227,168,98,.5)` })} />
      </motion.div>
    </>
  )
}

/**
 * Слово-борода ловит свет, когда по нему проходит лезвие.
 * Тень заголовка на тексте с background-clip рисуется поверх заливки и мутит акцент,
 * поэтому на время блика тень снята, а после блика слово становится обычным текстом цвета лампы
 */
function Sheen({ children }: { children: ReactNode }) {
  const on = useAnimOn()
  const [done, setDone] = useState(false)
  const base: CSSProperties = { display: 'inline-block', paddingRight: '.14em', marginRight: '-.14em' }
  if (!on || done) return <span style={{ ...base, color: C.tung }}>{children}</span>
  return (
    <motion.span
      style={{
        ...base,
        backgroundImage: `linear-gradient(100deg, ${C.tung} 40%, ${C.fil} 50%, ${C.tung} 60%)`,
        backgroundSize: '250% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        textShadow: 'none',
      }}
      initial={{ backgroundPosition: '100% 0%' }}
      animate={{ backgroundPosition: '0% 0%' }}
      transition={{ delay: 0.95, duration: 0.9, ease: [0.45, 0, 0.3, 1] }}
      onAnimationComplete={() => setDone(true)}
    >
      {children}
    </motion.span>
  )
}

function Wordmark({ d, small }: { d: Draft; small?: boolean }) {
  const { top, main } = names(d)
  const maxW = small ? 230 : 360
  const fs = fitPx(main, small ? 17 : 19, maxW, 0.62)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: small ? 4 : 5, maxWidth: maxW }}>
      {top && (
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: small ? 9.5 : 10.5, letterSpacing: '.34em', textTransform: 'uppercase', color: C.dim, lineHeight: 1, whiteSpace: 'nowrap' }}>
          {top}
        </span>
      )}
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: fs, color: C.cream, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{main}</span>
    </div>
  )
}

function NavLine() {
  const on = useAnimOn()
  return (
    <motion.div
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'rgba(227,168,98,.16)', transformOrigin: '50% 50%' }}
      initial={on ? { transform: 'scaleX(0)' } : false}
      animate={{ transform: 'scaleX(1)' }}
      transition={on ? { delay: 1.7, duration: 0.4, ease: EASE } : { duration: 0 }}
    />
  )
}

function Headline({ d, fs }: { d: Draft; fs: number }) {
  const [a, b, c] = d.niche.services
  const line: CSSProperties = { display: 'block', whiteSpace: 'nowrap' }
  return (
    <h1
      style={{
        margin: 0,
        fontFamily: SERIF,
        fontWeight: 800,
        fontSize: fs,
        lineHeight: 0.92,
        letterSpacing: '-.02em',
        color: C.cream,
        textShadow: '0 2px 40px rgba(11,9,8,.35)',
      }}
    >
      <span style={line}>{a}</span>
      <span style={{ ...line, fontStyle: 'italic', fontWeight: 700 }}>
        <Sheen>{b}</Sheen>
      </span>
      <span style={line}>{c}</span>
    </h1>
  )
}

/* ---------- первая секция ---------- */

function HeroDesktop({ d }: { d: Draft }) {
  const on = useAnimOn()
  const n = d.niche
  const { src, poster } = nicheVideo(d, 'barber')
  const fs = fitPx(longest(n.services), 104, 1120, 0.58)
  return (
    <section style={{ position: 'relative', width: 1280, height: 760, overflow: 'hidden', background: C.ink }}>
      <Settle>
        <BgVideo src={src} poster={poster} position="50% 40%" push={false} reveal="none" className="absolute inset-0" style={{ filter: GRADE }} />
      </Settle>
      <Overlays pool="ellipse 560px 330px at 50% 46%" poolA={0.5} bottom={220} />

      <header style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 76, padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
        <Wordmark d={d} />
        <nav style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 40 }}>
            {['Услуги', 'Мастера', 'Цены', 'Контакты'].map((l) => (
              <span key={l} style={{ fontFamily: SANS, fontWeight: 500, fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', color: C.dim }}>
                {l}
              </span>
            ))}
          </div>
          <Btn primary h={40} fs={12} style={{ marginLeft: 44, padding: '0 22px', paddingLeft: 'calc(22px + .2em)', letterSpacing: '.2em' }}>
            {n.cta}
          </Btn>
        </nav>
        <NavLine />
      </header>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 122, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, zIndex: 4 }}>
        <span style={{ width: 32, height: 1, background: 'rgba(227,168,98,.55)' }} />
        <span style={eyebrowStyle}>{n.facts[0]}</span>
        <span style={{ width: 32, height: 1, background: 'rgba(227,168,98,.55)' }} />
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', zIndex: 4 }}>
        <Headline d={d} fs={fs} />
      </div>

      <p
        style={{
          position: 'absolute',
          left: '50%',
          top: 466,
          width: 560,
          marginLeft: -280,
          textAlign: 'center',
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 22,
          lineHeight: 1.45,
          color: 'rgba(242,234,220,.82)',
          zIndex: 4,
          textWrap: 'balance',
        }}
      >
        <Sentences text={n.pain} />
      </p>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 566, display: 'flex', justifyContent: 'center', gap: 16, zIndex: 4 }}>
        <Btn primary minW={210}>
          {n.cta}
        </Btn>
        <Btn minW={180}>{n.cta2}</Btn>
      </div>

      {/* кончается выше линии, где останавливается прокрутка (0.92 высоты), чтобы не свисать над второй секцией */}
      <div style={{ position: 'absolute', left: '50%', top: 640, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 4 }}>
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 9.5, letterSpacing: '.4em', paddingLeft: '.4em', color: 'rgba(227,168,98,.7)', lineHeight: 1 }}>ВНИЗ</span>
        <span style={{ position: 'relative', marginTop: 10, width: 1, height: 36, background: 'rgba(242,234,220,.25)', overflow: 'hidden' }}>
          <motion.span
            style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 12, background: C.tung }}
            initial={on ? { transform: 'translateY(-12px)' } : false}
            animate={on ? { transform: ['translateY(-12px)', 'translateY(36px)'] } : { transform: 'translateY(0px)' }}
            transition={on ? { delay: 2.2, duration: 2.2, ease: [0.65, 0, 0.35, 1], repeat: Infinity } : { duration: 0 }}
          />
        </span>
      </div>

      <Razor w={1280} h={760} slant={14} span={132} dur={1.3} />
    </section>
  )
}

function HeroMobile({ d }: { d: Draft }) {
  const n = d.niche
  const { src, poster } = nicheVideo(d, 'barber')
  const fs = fitPx(longest(n.services), 66, 350, 0.58)
  return (
    <section style={{ position: 'relative', width: 390, height: 800, overflow: 'hidden', background: C.ink }}>
      <Settle>
        <BgVideo src={src} poster={poster} position="55% 45%" push={false} reveal="none" className="absolute inset-0" style={{ filter: GRADE }} />
      </Settle>
      <Overlays pool="ellipse 260px 300px at 50% 44%" poolA={0.5} bottom={300} />

      <header style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 60, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
        <Wordmark d={d} small />
        <span style={{ width: 40, height: 40, marginRight: -11, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 1, background: C.cream }} />
          <span style={{ width: 18, height: 1, background: C.cream }} />
        </span>
        <NavLine />
      </header>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', zIndex: 4 }}>
        <Headline d={d} fs={fs} />
      </div>

      <p
        style={{
          position: 'absolute',
          left: 30,
          right: 30,
          top: 356,
          margin: 0,
          textAlign: 'center',
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 18,
          lineHeight: 1.45,
          color: 'rgba(242,234,220,.82)',
          zIndex: 4,
          textWrap: 'balance',
        }}
      >
        <Sentences text={n.pain} />
      </p>

      <div style={{ position: 'absolute', left: 20, right: 20, top: 472, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 4 }}>
        <Btn primary h={52} style={{ width: '100%' }}>
          {n.cta}
        </Btn>
        <Btn h={52} style={{ width: '100%' }}>
          {n.cta2}
        </Btn>
      </div>

      <div style={{ position: 'absolute', left: 20, right: 20, top: 596, zIndex: 4 }}>
        {n.facts.map((f, i) => (
          <div
            key={i}
            style={{
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderTop: i > 0 ? `1px solid ${C.hair}` : 'none',
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: 10.5,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: C.dim,
              whiteSpace: 'nowrap',
            }}
          >
            {f}
          </div>
        ))}
      </div>

      <Razor w={390} h={800} slant={40} span={160} dur={1.1} />
    </section>
  )
}

/* ---------- вторая секция ---------- */

function S2Fade({ at, y = 8, duration = 0.5, children, style }: { at: number; y?: number; duration?: number; children: ReactNode; style?: CSSProperties }) {
  const on = useAnimOn()
  const t = useS(at, duration)
  return (
    <motion.div style={style} initial={on ? { opacity: 0, transform: `translateY(${y}px)` } : false} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={t}>
      {children}
    </motion.div>
  )
}

/** Строка заголовка открывается той же косой кромкой, что и первый экран — эхо бритвы */
function Slash({ at, children, style, wrap }: { at: number; children: ReactNode; style?: CSSProperties; wrap?: boolean }) {
  const on = useAnimOn()
  const t = useS(at, 0.7, CUT)
  return (
    <motion.span
      style={{ display: 'block', ...(wrap ? { whiteSpace: 'normal', textWrap: 'balance' } : { whiteSpace: 'nowrap' }), ...style }}
      initial={on ? { clipPath: 'polygon(-12% -30%, -12% -30%, -18% 130%, -12% 130%)' } : false}
      animate={{ clipPath: 'polygon(-12% -30%, 124% -30%, 118% 130%, -12% 130%)' }}
      transition={t}
    >
      {children}
    </motion.span>
  )
}

/** Кадр из той же съёмки, что и видео. Один и тот же в живом черновике и на миниатюре — без подмены посреди появления */
function StoryFrame({ d, w, h, at }: { d: Draft; w: number; h: number; at: number }) {
  const on = useAnimOn()
  const clipT = useS(at, 0.9, CUT)
  const scaleT = useS(at, 1.2)
  // своё видео у ниши → кадр берём из его постера, иначе заготовленный кадр съёмки барбершопа
  const own = d.niche.video ? { src: nicheVideo(d, 'barber').poster, pos: '8% 40%' } : { src: asset(STORY), pos: '30% 40%' }
  return (
    <motion.div
      style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: C.ink2 }}
      initial={on ? { clipPath: 'inset(0% 0% 100% 0%)' } : false}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      transition={clipT}
    >
      <motion.div style={{ position: 'absolute', inset: 0 }} initial={on ? { transform: 'scale(1.12)' } : false} animate={{ transform: 'scale(1)' }} transition={scaleT}>
        <img
          src={own.src}
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: own.pos, filter: 'sepia(.12) saturate(.9) brightness(.92) contrast(1.05)' }}
        />
      </motion.div>
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(242,234,220,.08)', pointerEvents: 'none' }} />
    </motion.div>
  )
}

function Sticker({ text, at, w, h, small, big, style }: { text: string; at: number; w: number; h: number; small: number; big: number; style?: CSSProperties }) {
  const on = useAnimOn()
  const [lead, last] = splitLast(text)
  const bigFs = fitPx(last, big, w - 20, 0.62)
  return (
    <motion.div
      style={{
        position: 'absolute',
        width: w,
        height: h,
        background: C.tung,
        boxShadow: '0 18px 40px rgba(0,0,0,.45)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: small * 0.7,
        textAlign: 'center',
        zIndex: 3,
        ...style,
      }}
      initial={on ? { opacity: 0, scale: 0.8, rotate: 14 } : false}
      animate={{ opacity: 1, scale: 1, rotate: 4 }}
      transition={on ? { delay: S2 + at, type: 'spring', stiffness: 260, damping: 18, opacity: { delay: S2 + at, duration: 0.2 } } : { duration: 0 }}
    >
      {lead && (
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: small, letterSpacing: '.3em', paddingLeft: '.3em', textTransform: 'uppercase', color: C.ink, lineHeight: 1.2, maxWidth: w - 16 }}>
          {lead}
        </span>
      )}
      <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: bigFs, color: C.ink, lineHeight: 0.95, letterSpacing: '-.01em' }}>{last}</span>
    </motion.div>
  )
}

function PriceRows({ d, at, rowH, nameFs, priceFs, idx = true, width }: { d: Draft; at: number; rowH: number; nameFs: number; priceFs: number; idx?: boolean; width: number }) {
  const on = useAnimOn()
  const list = d.niche.list.slice(0, 4)
  const fs = fitPx(longest(list.map((r) => r[0])), nameFs, width - (idx ? 36 : 0) - 120, 0.5)
  return (
    <div>
      {list.map(([name, price], i) => {
        const t = on ? { delay: S2 + at + i * 0.08, duration: 0.5, ease: EASE } : { duration: 0 }
        return (
          <div key={i} style={{ position: 'relative', height: rowH }}>
            <motion.div
              style={{ display: 'flex', alignItems: 'center', height: '100%' }}
              initial={on ? { opacity: 0, transform: `translateY(${rowH > 55 ? 14 : 11}px)` } : false}
              animate={{ opacity: 1, transform: 'translateY(0px)' }}
              transition={t}
            >
              {idx && <span style={{ width: 36, flex: 'none', fontFamily: SANS, fontWeight: 500, fontSize: 10, letterSpacing: '.1em', color: 'rgba(227,168,98,.7)' }}>{String(i + 1).padStart(2, '0')}</span>}
              <span style={{ flex: 1, minWidth: 0, fontFamily: SERIF, fontWeight: 400, fontSize: fs, color: C.cream, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nb(name)}</span>
              <span style={{ flex: 'none', marginLeft: 16, fontFamily: SANS, fontWeight: 500, fontSize: priceFs, letterSpacing: '.12em', color: C.tung, whiteSpace: 'nowrap' }}>
                {price.replace(/\s/g, '\u00A0')}
              </span>
            </motion.div>
            <motion.div
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: C.hair, transformOrigin: '0 50%' }}
              initial={on ? { transform: 'scaleX(0)' } : false}
              animate={{ transform: 'scaleX(1)' }}
              transition={on ? { ...t, duration: 0.6 } : t}
            />
          </div>
        )
      })}
    </div>
  )
}

function Divider({ at, width, seg = 40 }: { at: number; width: number | string; seg?: number }) {
  const on = useAnimOn()
  const t = useS(at, 0.6)
  return (
    <motion.div
      style={{ position: 'relative', width, height: 2, transformOrigin: '0 50%' }}
      initial={on ? { transform: 'scaleX(0)' } : false}
      animate={{ transform: 'scaleX(1)' }}
      transition={t}
    >
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0.5, height: 1, background: C.hair }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: seg, height: 2, background: C.tung }} />
    </motion.div>
  )
}

/**
 * Имя в два кегля: короткое слово ниши и само название считаются отдельно.
 * Длинное название не мельчит ниже пола, а переносится на вторую строку
 */
function H2({ d, max, width, floor }: { d: Draft; max: number; width: number; floor: number }) {
  const { top, main } = names(d)
  const fsTop = fitPx(cap(top), max, width, 0.67)
  const fsMain = Math.max(floor, fitPx(main, max, width, 0.62))
  return (
    <h2 style={{ margin: 0, fontFamily: SERIF, lineHeight: 1, letterSpacing: '-.015em' }}>
      {top && (
        <Slash at={0.05} style={{ fontSize: fsTop, fontWeight: 800, color: C.cream }}>
          {cap(top)}
        </Slash>
      )}
      <Slash wrap at={0.17} style={{ fontSize: fsMain, fontWeight: 700, fontStyle: 'italic', color: C.tung, paddingRight: '.1em' }}>
        {nb(main)}
      </Slash>
    </h2>
  )
}

function StoryDesktop({ d }: { d: Draft }) {
  const n = d.niche
  return (
    <section style={{ position: 'relative', width: 1280, height: 760, overflow: 'hidden', background: C.ink }}>
      <div style={{ position: 'absolute', left: 150, top: 40, width: 450, height: 198, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <S2Fade at={0} style={{ marginBottom: 16 }}>
          <span style={eyebrowStyle}>Услуги и цены</span>
        </S2Fade>
        <H2 d={d} max={58} width={450} floor={40} />
      </div>
      <div style={{ position: 'absolute', left: 150, top: 270 }}>
        <Divider at={0.2} width={450} />
      </div>
      <div style={{ position: 'absolute', left: 150, top: 300, width: 450 }}>
        <PriceRows d={d} at={0.3} rowH={62} nameFs={23} priceFs={14} width={450} />
      </div>
      <div style={{ position: 'absolute', left: 150, top: 588 }}>
        <S2Fade at={0.5} y={8} style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
          <Btn primary h={52} minW={200}>
            {n.cta}
          </Btn>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', color: C.dim, textDecoration: 'underline', textDecorationThickness: 1, textUnderlineOffset: 6, textDecorationColor: 'rgba(201,187,163,.6)', whiteSpace: 'nowrap' }}>
            {n.cta2}
          </span>
        </S2Fade>
      </div>

      <div style={{ position: 'absolute', left: 700, top: 170 }}>
        <StoryFrame d={d} w={440} h={330} at={0.15} />
      </div>
      <Sticker text={n.facts[2]} at={0.55} w={132} h={104} small={9} big={34} style={{ left: 1076, top: 430 }} />
    </section>
  )
}

function StoryMobile({ d }: { d: Draft }) {
  const n = d.niche
  return (
    <section style={{ position: 'relative', width: 390, height: 800, overflow: 'hidden', background: C.ink }}>
      <div style={{ position: 'absolute', left: 20, top: 20, width: 350, height: 160, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <S2Fade at={0} y={6.4} style={{ marginBottom: 13 }}>
          <span style={eyebrowStyle}>Услуги и цены</span>
        </S2Fade>
        <H2 d={d} max={42} width={350} floor={30} />
      </div>
      <div style={{ position: 'absolute', left: 20, top: 204 }}>
        <Divider at={0.2} width={350} />
      </div>
      <div style={{ position: 'absolute', left: 20, top: 228 }}>
        <StoryFrame d={d} w={350} h={262} at={0.15} />
      </div>
      <Sticker text={n.facts[2]} at={0.55} w={104} h={84} small={8} big={26} style={{ left: 20 + 350 + 6 - 104, top: 228 + 262 + 28 - 84 }} />
      {/* ряды кончаются на 728 — выше края, где останавливается прокрутка (0.92 высоты) */}
      <div style={{ position: 'absolute', left: 20, top: 520, width: 350 }}>
        <PriceRows d={d} at={0.3} rowH={52} nameFs={19} priceFs={13} width={350} idx={false} />
      </div>
    </section>
  )
}

/* ---------- сборка ---------- */

function Desktop({ d }: { d: Draft }) {
  return (
    <div style={{ width: 1280, height: 1520, background: C.ink, color: C.cream }}>
      <HeroDesktop d={d} />
      <StoryDesktop d={d} />
    </div>
  )
}

function Mobile({ d }: { d: Draft }) {
  return (
    <div style={{ width: 390, height: 1600, background: C.ink, color: C.cream }}>
      <HeroMobile d={d} />
      <StoryMobile d={d} />
    </div>
  )
}

export default { Desktop, Mobile } satisfies Template
