import '@fontsource-variable/inter'
import '@fontsource-variable/noto-serif-display'
import { motion, type Transition } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import type { Draft } from '../../../data/niches'
import type { Template } from '.'
import { BgVideo, SECOND_AT, nicheVideo, useAnimOn } from '../anim'

/*
 * Авто: тёмная студия, как у Mansory. Огромные тихие слова услуг антиквой 300,
 * свет фары из ролика прокатывается по ним справа налево, как блик по лаку.
 * Вторая секция: подбор услуги в тёмной панели и жёсткий переход в белый с каруселью работ
 */

const INK = '#020204'
const PANEL = '#141517'
const FIELD = '#191a1c'
const TEXT = '#f5f5f5'
const MUTED = '#b6b6b6'
const GRAPHITE = '#3d3e43'
const HAIR = 'rgba(245,245,245,.16)'
const STEEL = '#819eaf'
const STEEL_DIM = '#606a71'
const FLARE = '#dff1f8'
const PAPER = '#ffffff'
const PAPER_INK = '#0b0b0c'
const PAPER_LINE = '#d9d9d9'

const SERIF = "'Noto Serif Display Variable', 'Noto Serif Display', Georgia, serif"
const SANS = "'Inter Variable', Inter, system-ui, sans-serif"

const OUT = [0.22, 1, 0.36, 1] as const
const RISE = [0.16, 1, 0.3, 1] as const
const INOUT = [0.65, 0, 0.35, 1] as const

/* Ролик сферы: вспышка фары на 1.30 с и кадры для карточек подобраны под него. У ниши свой ролик — по часам */
const OWN_AT = [0.4, 4.2, 6.0, 2.0]
const ANY_AT = [0.5, 2.5, 4.5, 1.5]
const VIDEO_FILTER = 'brightness(.8) contrast(1.12) saturate(.78)'

/** Вспышка обязана случиться к этому времени, даже если ролик встал на буферизации: слова не должны ждать сеть */
const FLARE_CAP = 1850

/* ── текст ─────────────────────────────────────────────────────── */

const nb = (s: string) => {
  let out = s
  for (let k = 0; k < 3; k++) out = out.replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2}) /g, '$1$2\u00a0')
  return out
}
const noDot = (s: string) => s.trim().replace(/[.。]+$/, '')
const place = (d: Draft) => (/сервис|мастерск|гараж/i.test(d.niche.noun) ? { gen: 'сервиса', pre: 'сервисе' } : { gen: 'студии', pre: 'студии' })

/** Кегль по самой длинной строке: оценка ширины знака в em, без замеров — одинаково в пререндере и живьём */
function fit(lines: string[], maxW: number, base: number, min: number, em: number) {
  const n = Math.max(1, ...lines.map((l) => l.length))
  return Math.max(min, Math.min(base, Math.floor(maxW / (n * em))))
}

/** Факт: число вперёд крупно, остальное подписью. Без цифр — вся фраза антиквой */
function splitFact(f: string): { value: string; label: string } {
  const [head, ...rest] = f.trim().split(/\s+/)
  if (/\d/.test(head) && rest.length) return { value: head, label: rest.join(' ') }
  return { value: f.trim(), label: '' }
}

const caps = (size: number, track = 0.06, weight = 500): CSSProperties => ({
  fontFamily: SANS,
  fontWeight: weight,
  fontSize: size,
  letterSpacing: `${track}em`,
  textTransform: 'uppercase',
  lineHeight: 1,
  whiteSpace: 'nowrap',
})

/* ── анимации ──────────────────────────────────────────────────── */

function useTr() {
  const on = useAnimOn()
  return {
    on,
    t: (delay: number, duration: number, ease: readonly number[] = OUT): Transition => (on ? { delay, duration, ease: ease as Transition['ease'] } : { duration: 0 }),
    ini: <T,>(v: T) => (on ? v : false),
  }
}

/** Появление снизу по времени (вторая секция тоже по часам, без whileInView) */
function Up({ delay, duration = 0.6, y = 12, x = 0, children, className, style }: { delay: number; duration?: number; y?: number; x?: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  const { t, ini } = useTr()
  return (
    <motion.div
      className={className}
      style={style}
      initial={ini({ opacity: 0, transform: `translate(${x}px, ${y}px)` })}
      animate={{ opacity: 1, transform: 'translate(0px, 0px)' }}
      transition={t(delay, duration)}
    >
      {children}
    </motion.div>
  )
}

/** Сдвиг по Y из transform: 'translateY(-699px)', матрица или none */
function shiftY(t: string | null | undefined) {
  if (!t || t === 'none') return 0
  try {
    return new DOMMatrixReadOnly(t).m42
  } catch {
    return 0
  }
}

/**
 * Шапка «fixed»: страницу двигает родитель (прокрутка-демо), шапка едет обратно ровно на столько же.
 * Тайминг не копируем: берём у родителя его же анимацию (ключи, easing, startTime) и зеркалим её,
 * поэтому шапка не разъедется с прокруткой, как бы ни поменяли тайминг в anim.tsx.
 * Фон шапки проявляется по той же кривой, пока страница уезжает вниз
 */
function useFixedNav(nav: RefObject<HTMLDivElement | null>, bg: RefObject<HTMLDivElement | null>, on: boolean) {
  useLayoutEffect(() => {
    // шапка — прямой ребёнок корня шаблона, а родитель корня и двигает страницу (ref корня здесь ещё не привязан)
    const navEl = nav.current
    const bgEl = bg.current
    const p = navEl?.parentElement?.parentElement
    if (!p || !navEl || !bgEl) return
    const put = (y: number) => {
      navEl.style.transform = y ? `translateY(${-y}px)` : ''
      bgEl.style.opacity = String(Math.min(1, Math.abs(y) / 40))
    }
    const readY = () => shiftY(getComputedStyle(p).transform)
    // без анимаций (миниатюра, стенд со сдвигом на секцию) шапка просто стоит наверху страницы
    if (!on) return
    const demo = p.classList.contains('scroll-demo')

    const mine: Animation[] = []
    let raf = 0
    let stop = false
    const t0 = performance.now()
    const scroll = () =>
      p.getAnimations().find((a) => {
        const e = a.effect
        return e instanceof KeyframeEffect && e.getKeyframes().some((k) => typeof k.transform === 'string')
      })
    const mirror = (a: Animation) => {
      const e = a.effect as KeyframeEffect
      const kf = e.getKeyframes()
      const ys = kf.map((k) => shiftY(String(k.transform)))
      const tm = e.getTiming()
      const opts: KeyframeAnimationOptions = {
        delay: tm.delay,
        endDelay: tm.endDelay,
        duration: tm.duration as number,
        easing: tm.easing,
        iterations: tm.iterations,
        direction: tm.direction,
        fill: 'both',
      }
      const keys = (v: (i: number) => Keyframe) => kf.map((k, i) => ({ offset: k.offset ?? (k as ComputedKeyframe).computedOffset, easing: k.easing, ...v(i) }))
      const op = ys.map((y) => Math.min(1, Math.abs(y) / 40))
      // фон как у настоящей fixed-шапки: густеет в самом начале прокрутки и уходит у самого верха
      const opEase = (i: number, base?: string) => (i + 1 >= op.length || op[i] === op[i + 1] ? base : op[i] < op[i + 1] ? 'cubic-bezier(0,1,0,1)' : 'cubic-bezier(1,0,1,0)')
      navEl.style.transform = ''
      bgEl.style.opacity = '0'
      mine.push(navEl.animate(keys((i) => ({ transform: `translateY(${-ys[i]}px)` })), opts))
      mine.push(bgEl.animate(keys((i) => ({ opacity: op[i], easing: opEase(i, kf[i].easing) })), opts))
      const sync = () => {
        if (stop) return
        for (const m of mine) {
          m.playbackRate = a.playbackRate
          if (a.startTime !== null) m.startTime = a.startTime
          else if (a.currentTime !== null) m.currentTime = a.currentTime
        }
      }
      sync()
      a.ready.then(sync).catch(() => {})
    }
    // анимация родителя стартует после наших эффектов: ищем её по кадрам, пока ищем — просто повторяем его сдвиг
    const tick = () => {
      if (stop) return
      const a = scroll()
      if (a) return mirror(a)
      if (!demo) return
      put(readY())
      if (performance.now() - t0 < 9000) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      stop = true
      cancelAnimationFrame(raf)
      for (const m of mine) m.cancel()
    }
  }, [nav, bg, on])
}

/**
 * Вспышка фары: ролик доходит до 1.30 с — по словам идёт свет.
 * Первый раз загорается весь текст, на каждом следующем круге ролика — только блик и полосы вполсилы.
 * Автоплей не дали — по часам в 1.6 с; ролик встал на буферизации — всё равно не позже FLARE_CAP.
 * У ниши свой ролик (sync = false) — вспышки в нём нет, свет идёт по часам один раз
 */
function useFlare(root: RefObject<HTMLDivElement | null>, on: boolean, sync: boolean) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!on) return
    if (!sync) {
      const id = window.setTimeout(() => setN((x) => x + 1), 1600)
      return () => window.clearTimeout(id)
    }
    let armed = true
    let fired = false
    let last = 0
    let stop = false
    let v: HTMLVideoElement | null = null
    let rvfc = 0
    const fire = () => {
      armed = false
      fired = true
      setN((x) => x + 1)
    }
    const check = (t: number) => {
      if (t < last - 1) armed = true
      last = t
      if (armed && t >= 1.3 && t < 3.2) fire()
    }
    const tick = (_: number, meta: VideoFrameCallbackMetadata) => {
      if (stop || !v) return
      check(meta.mediaTime)
      rvfc = v.requestVideoFrameCallback(tick)
    }
    const onTime = () => v && check(v.currentTime)
    // автоплей не дали — по часам; ролик идёт, но ещё не дошёл до вспышки — ждём её
    const fallback = () => {
      if (fired) return
      if (v && !v.paused && v.currentTime > 0 && v.currentTime < 1.3) {
        fb = window.setTimeout(fallback, (1.3 - v.currentTime) * 1000 + 150)
        return
      }
      fire()
    }
    let fb = window.setTimeout(fallback, 1600)
    const cap = window.setTimeout(() => {
      if (!fired) fire()
    }, FLARE_CAP)
    const find = window.setInterval(() => {
      v = root.current?.querySelector('video') ?? null
      if (!v) return
      window.clearInterval(find)
      if ('requestVideoFrameCallback' in v) rvfc = v.requestVideoFrameCallback(tick)
      else (v as HTMLVideoElement).addEventListener('timeupdate', onTime)
    }, 60)
    return () => {
      stop = true
      window.clearTimeout(fb)
      window.clearTimeout(cap)
      window.clearInterval(find)
      if (v) {
        if ('cancelVideoFrameCallback' in v && rvfc) v.cancelVideoFrameCallback(rvfc)
        ;(v as HTMLVideoElement).removeEventListener('timeupdate', onTime)
      }
    }
  }, [on, root, sync])
  return n
}

/** Полоса света бежит справа налево по линии (кромка кузова) */
function Streak({ n, top, left, width, len, delay, dur }: { n: number; top: number; left: number; width: number; len: number; delay: number; dur: number }) {
  if (n < 1) return null
  const k = n > 1 ? 0.5 : 1
  return (
    <div className="pointer-events-none absolute overflow-hidden" style={{ top: top - 6, left, width, height: 13 }}>
      <motion.div
        key={n}
        className="absolute"
        style={{
          top: 6,
          left: 0,
          width: len,
          height: 1,
          background: `linear-gradient(90deg, rgba(223,241,248,0) 0%, ${FLARE} 50%, rgba(223,241,248,0) 100%)`,
          filter: 'drop-shadow(0 0 5px rgba(223,241,248,.9))',
        }}
        initial={{ transform: `translateX(${width}px)`, opacity: k }}
        animate={{ transform: `translateX(${-len}px)`, opacity: [k, k, 0] }}
        transition={{ delay, duration: dur, ease: INOUT, opacity: { delay, duration: dur, times: [0, 0.85, 1] } }}
      />
    </div>
  )
}

/** Одна строка услуги: графит поднимается из маски, свет фары зажигает её справа налево, блик идёт по кромке */
function ServiceLine({ text, i, n, size, lh }: { text: string; i: number; n: number; size: number; lh: number }) {
  const { on, t, ini } = useTr()
  const padT = Math.round(size * 0.22)
  const padB = Math.round(size * 0.3)
  const k = n > 1 ? 0.5 : 1
  const txt: CSSProperties = { display: 'block', whiteSpace: 'nowrap' }
  return (
    <div style={{ overflow: 'hidden', paddingTop: padT, paddingBottom: padB, marginTop: -padT, marginBottom: -padB, paddingRight: 24, marginRight: -24 }}>
      <motion.div
        style={{ position: 'relative', height: lh }}
        initial={ini({ transform: 'translateY(160%)' })}
        animate={{ transform: 'translateY(0%)' }}
        transition={t(0.35 + i * 0.12, 0.8, RISE)}
      >
        <span style={{ ...txt, color: on ? GRAPHITE : TEXT }}>{text}</span>
        {on && (
          <motion.span
            aria-hidden
            style={{ ...txt, position: 'absolute', inset: 0, color: TEXT }}
            initial={{ clipPath: 'inset(-40% -10% -50% 100%)' }}
            animate={n >= 1 ? { clipPath: 'inset(-40% -10% -50% 0%)' } : { clipPath: 'inset(-40% -10% -50% 100%)' }}
            transition={{ delay: i * 0.08, duration: 1.1, ease: INOUT }}
          >
            {text}
          </motion.span>
        )}
        {on && n >= 1 && (
          <motion.span
            key={n}
            aria-hidden
            style={{
              ...txt,
              position: 'absolute',
              inset: 0,
              color: 'transparent',
              backgroundImage: 'linear-gradient(90deg, rgba(223,241,248,0) 0%, rgba(223,241,248,.22) 30%, #fff 47%, #fff 53%, rgba(223,241,248,.22) 70%, rgba(223,241,248,0) 100%)',
              backgroundSize: '40% 100%',
              backgroundRepeat: 'no-repeat',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 14px rgba(223,241,248,.55)) drop-shadow(0 0 4px rgba(223,241,248,.9))',
            }}
            initial={{ backgroundPosition: '130% 50%', opacity: k }}
            animate={{ backgroundPosition: '-35% 50%', opacity: [k, k, 0] }}
            transition={{
              delay: i * 0.08,
              duration: 1.1,
              ease: INOUT,
              opacity: { delay: i * 0.08, duration: 1.1, times: [0, 0.82, 1], ease: 'linear' },
            }}
          >
            {text}
          </motion.span>
        )}
      </motion.div>
    </div>
  )
}

function Services({ d, n, size, lh, style }: { d: Draft; n: number; size: number; lh: number; style: CSSProperties }) {
  return (
    <div
      role="presentation"
      style={{ position: 'absolute', display: 'flex', flexDirection: 'column', fontFamily: SERIF, fontWeight: 300, fontSize: size, lineHeight: `${lh}px`, letterSpacing: '-0.01em', ...style }}
    >
      {d.niche.services.map((s, i) => (
        <ServiceLine key={s + i} text={s} i={i} n={n} size={size} lh={lh} />
      ))}
    </div>
  )
}

function Burger({ left, top }: { left: number; top: number }) {
  return (
    <div className="absolute" style={{ left, top, width: 18 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 1.25, background: TEXT, marginTop: i ? 5 : 0, width: i === 1 ? 18 : i === 2 ? 12 : 18 }} />
      ))}
    </div>
  )
}

/** Слово услуги в карточке и в списке: без точки */
const svc = (d: Draft) => d.niche.services.map(noDot)

/* ── десктоп ───────────────────────────────────────────────────── */

const DW = 1280
const DH = 760
const D_OFF = DH - Math.round(DH * 0.92) // сколько первой секции остаётся над второй в прокрутке-демо

function DesktopNav({ d, n }: { d: Draft; n: number }) {
  const { on, t, ini } = useTr()
  const nav = useRef<HTMLDivElement>(null)
  const bg = useRef<HTMLDivElement>(null)
  useFixedNav(nav, bg, on)
  const ctaW = 120
  const name = d.name.toUpperCase()
  const wm = fit([name], 360, 22, 13, 0.8)
  const links = ['Услуги', 'Цены', 'Работы', `О ${place(d).pre}`]
  return (
    <div ref={nav} className="absolute left-0 top-0 z-30" style={{ width: DW, height: 84 }}>
      {/* фон появляется, как только страницу прокрутили */}
      <div ref={bg} className="absolute inset-0" style={{ background: INK, opacity: 0 }} />
      <motion.div
        className="absolute left-0 right-0"
        style={{ bottom: 0, height: 1, background: HAIR, transformOrigin: '50% 50%' }}
        initial={ini({ transform: 'scaleX(0)' })}
        animate={{ transform: 'scaleX(1)' }}
        transition={t(0.2, 0.9)}
      />
      <Streak n={n} top={83} left={0} width={DW} len={240} delay={0} dur={0.9} />
      <motion.div className="absolute inset-0" initial={ini({ opacity: 0 })} animate={{ opacity: 1 }} transition={t(0.4, 0.5)}>
        <Burger left={28} top={37} />
        <div className="absolute flex" style={{ left: 82, top: 37, gap: 32, color: TEXT, ...caps(11) }}>
          {links.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div className="absolute flex items-center" style={{ left: DW / 2, top: 42, transform: 'translate(-50%, -50%)', gap: 14 }}>
          <span style={{ width: 36, height: 1, background: `linear-gradient(90deg, rgba(245,245,245,0), rgba(245,245,245,.55))` }} />
          <span style={{ fontFamily: SERIF, fontWeight: 400, fontSize: wm, letterSpacing: wm < 16 ? '0.04em' : '0.06em', color: TEXT, whiteSpace: 'nowrap', lineHeight: 1 }}>{name}</span>
          <span style={{ width: 36, height: 1, background: `linear-gradient(270deg, rgba(245,245,245,0), rgba(245,245,245,.55))` }} />
        </div>
        <span className="absolute" style={{ right: ctaW + 32, top: 37, color: TEXT, ...caps(11) }}>
          Контакты
        </span>
        <div className="absolute top-0" style={{ right: ctaW, width: 1, height: 84, background: HAIR }} />
        {/* главная кнопка живёт в первом экране, здесь короткое действие */}
        <div className="absolute top-0 grid place-items-center" style={{ right: 0, width: ctaW, height: 84, color: TEXT, ...caps(11) }}>
          Запись
        </div>
      </motion.div>
    </div>
  )
}

function DesktopHero({ d, n, rootRef }: { d: Draft; n: number; rootRef: RefObject<HTMLDivElement | null> }) {
  const { t, ini } = useTr()
  const v = nicheVideo(d, 'auto')
  const size = fit(d.niche.services, 540, 76, 60, 0.56)
  const lh = Math.round(size * 0.974)
  const facts = d.niche.facts.map(splitFact)
  return (
    <section ref={rootRef} className="relative overflow-hidden" style={{ width: DW, height: DH, background: INK }}>
      <BgVideo src={v.src} poster={v.poster} position="50% 50%" push={false} className="absolute inset-0" style={{ filter: VIDEO_FILTER }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(2,2,4,.9) 0%, rgba(2,2,4,.72) 38%, rgba(2,2,4,.25) 56%, rgba(2,2,4,0) 72%)' }} />
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: 170, background: 'linear-gradient(180deg, rgba(2,2,4,.82) 0, rgba(2,2,4,0) 170px)' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height: 220, background: `linear-gradient(0deg, ${INK} 0, rgba(2,2,4,0) 220px)` }} />

      <Services d={d} n={n} size={size} lh={lh} style={{ left: 72, top: 168 - Math.round(size * 0.12), width: 600 }} />

      <motion.p
        className="absolute"
        style={{ left: 72, top: 428, maxWidth: 420, margin: 0, fontFamily: SANS, fontSize: 18, lineHeight: 1.45, color: MUTED, fontWeight: 400 }}
        initial={ini({ opacity: 0, transform: 'translateY(12px)' })}
        animate={{ opacity: 1, transform: 'translateY(0px)' }}
        transition={t(1.8, 0.6)}
      >
        {nb(noDot(d.niche.pain))}
      </motion.p>

      <div className="absolute flex items-center" style={{ left: 72, top: 518, gap: 32 }}>
        <Up delay={2.0} duration={0.5} y={12}>
          <div className="grid place-items-center" style={{ minWidth: 184, height: 48, padding: '0 28px', background: STEEL, color: '#fff', ...caps(11, 0.08) }}>
            {d.niche.cta}
          </div>
        </Up>
        <Up delay={2.08} duration={0.5} y={12}>
          <span className="relative inline-block" style={{ color: TEXT, ...caps(11, 0.08) }}>
            {d.niche.cta2}
            <span className="absolute left-0 right-0" style={{ top: 'calc(100% + 6px)', height: 1, background: TEXT, opacity: 0.4 }} />
          </span>
        </Up>
      </div>

      {/* линия фактов проводится заранее: по ней потом бежит свет фары */}
      <motion.div
        className="absolute"
        style={{ left: 72, top: 624, width: 1136, height: 1, background: HAIR, transformOrigin: '0% 50%' }}
        initial={ini({ transform: 'scaleX(0)' })}
        animate={{ transform: 'scaleX(1)' }}
        transition={t(0.9, 1.0)}
      />
      <Streak n={n} top={624} left={72} width={1136} len={240} delay={0.25} dur={0.9} />
      <div className="absolute flex" style={{ left: 72, top: 646 }}>
        {facts.map((f, i) => (
          <Up key={i} delay={2.2 + i * 0.08} duration={0.55} y={10} className="relative" style={{ minWidth: 200, paddingLeft: i ? 32 : 0, paddingRight: 40 }}>
            {i > 0 && <span className="absolute left-0" style={{ top: f.label ? 2 : -3, width: 1, height: f.label ? 32 : 18, background: HAIR }} />}
            {f.label ? (
              <>
                <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, lineHeight: 1.1, color: TEXT, whiteSpace: 'nowrap' }}>{f.value}</div>
                <div style={{ marginTop: 8, color: MUTED, ...caps(10.5) }}>{f.label}</div>
              </>
            ) : (
              <div style={{ color: '#d9d9d9', ...caps(11.5) }}>{f.value}</div>
            )}
          </Up>
        ))}
      </div>
    </section>
  )
}

function Chevron({ color, size = 10, dir = 'down' }: { color: string; size?: number; dir?: 'down' | 'left' | 'right' }) {
  const rot = dir === 'down' ? 45 : dir === 'left' ? 135 : -45
  return <span style={{ display: 'inline-block', width: size, height: size, borderRight: `1px solid ${color}`, borderBottom: `1px solid ${color}`, transform: `rotate(${rot}deg)`, marginTop: dir === 'down' ? -size / 2 : 0 }} />
}

/** Кнопка подбора: по ней ещё раз проходит блик фары */
function PickButton({ label, delay, height, style }: { label: string; delay: number; height: number; style?: CSSProperties }) {
  const { on } = useTr()
  return (
    <div className="relative grid place-items-center overflow-hidden" style={{ height, background: STEEL_DIM, color: '#d4dade', ...caps(10.5, 0.08), ...style }}>
      <span className="relative">{label}</span>
      {on && (
        <motion.span
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{ width: '45%', background: 'linear-gradient(90deg, rgba(223,241,248,0) 0%, rgba(223,241,248,.38) 50%, rgba(223,241,248,0) 100%)' }}
          initial={{ transform: 'translateX(240%)' }}
          animate={{ transform: 'translateX(-110%)' }}
          transition={{ delay, duration: 0.8, ease: INOUT }}
        />
      )}
    </div>
  )
}

function Select({ label, active, height }: { label: string; active: boolean; height: number }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        height,
        padding: '0 22px 0 24px',
        border: active ? '1px solid rgba(245,245,245,.5)' : '1px solid transparent',
        background: active ? 'transparent' : FIELD,
        color: active ? TEXT : '#7c7d80',
        fontFamily: SANS,
        fontSize: 14,
      }}
    >
      <span>{label}</span>
      <Chevron color={active ? TEXT : '#7c7d80'} />
    </div>
  )
}

function WorkCard({ d, i, label, last, w, h, delay, x, title }: { d: Draft; i: number; label: string; last: boolean; w: number; h: number; delay: number; x: number; title: number }) {
  const { on, t, ini } = useTr()
  const v = nicheVideo(d, 'auto')
  const at = (d.niche.video ? ANY_AT : OWN_AT)[i % 4]
  const pos = ['30% 50%', '62% 40%', '70% 55%', '45% 50%'][i % 4]
  const pills = last ? ['Каталог'] : ['Услуга', String(i + 1).padStart(2, '0')]
  return (
    <motion.div
      className="relative shrink-0 overflow-hidden"
      style={{ width: w, height: h, background: '#111' }}
      initial={ini({ opacity: 0, transform: `translateX(${x}px)` })}
      animate={{ opacity: 1, transform: 'translateX(0px)' }}
      transition={t(delay, 0.7, RISE)}
    >
      <motion.div
        className="absolute inset-0"
        initial={ini({ transform: 'scale(1.08)' })}
        animate={{ transform: 'scale(1)' }}
        transition={on ? { delay, duration: 1.0, ease: RISE } : { duration: 0 }}
      >
        <img src={v.poster} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: pos, filter: 'brightness(.85)' }} />
        {/* стоп-кадр из ролика готовой картинкой (video/niche/auto@<сек>.webp): восемь видео на паузе слишком тяжелы для телефона */}
        <img src={v.src.replace(/\.mp4$/, `@${at}.webp`)} alt="" draggable={false} loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: pos, filter: 'brightness(.85)' }} />
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height: '40%', background: 'linear-gradient(0deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 100%)' }} />
      <div className="absolute flex" style={{ left: 12, top: 12, gap: 6 }}>
        {pills.map((p) => (
          <span key={p} className="grid place-items-center rounded-full" style={{ height: 20, padding: '0 9px', background: 'rgba(255,255,255,.88)', color: '#111', ...caps(9, 0.06, 600) }}>
            {p}
          </span>
        ))}
      </div>
      <div className="absolute" style={{ left: 16, bottom: 16, right: 16, fontFamily: SANS, fontWeight: 400, fontSize: title, color: '#fff', lineHeight: 1.2 }}>
        {label}
      </div>
    </motion.div>
  )
}

/* Вторая секция: всё успевает собраться, пока прокрутка-демо стоит на ней */
const PICK = 'Узнать цену'
const PICK_SUB = 'Класс авто и\u00a0услуга\u00a0— назовём цену до\u00a0визита'

function DesktopSecond({ d }: { d: Draft }) {
  const { t, ini } = useTr()
  const S = SECOND_AT
  const o = D_OFF
  const words = svc(d)
  const cards = [...words, 'Все услуги']
  return (
    <section className="relative overflow-hidden" style={{ width: DW, height: DH, background: INK }}>
      {/* подбор услуги */}
      <motion.div
        className="absolute"
        style={{ left: 72, top: 104 - o, width: 1136, height: 216, background: PANEL }}
        initial={ini({ clipPath: 'inset(0% 50% 0% 50%)' })}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        transition={t(S, 0.7)}
      />
      <Up delay={S + 0.05} y={14} className="absolute text-center" style={{ left: 72, width: 1136, top: 130 - o - 8 }}>
        <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, letterSpacing: '0.02em', lineHeight: 1, color: TEXT, textTransform: 'uppercase' }}>Подберите услугу</div>
      </Up>
      <Up delay={S + 0.12} y={14} className="absolute text-center" style={{ left: 72, width: 1136, top: 178 - o - 4 }}>
        <div style={{ fontFamily: SANS, fontSize: 17, color: MUTED, lineHeight: 1.3 }}>{PICK_SUB}</div>
      </Up>
      <div className="absolute flex" style={{ left: 128, top: 232 - o, gap: 30 }}>
        <Up delay={S + 0.18} y={10} style={{ width: 322 }}>
          <Select label="Класс авто" active height={44} />
        </Up>
        <Up delay={S + 0.24} y={10} style={{ width: 322 }}>
          <Select label="Услуга" active={false} height={44} />
        </Up>
        <Up delay={S + 0.3} y={10} style={{ width: 322 }}>
          <PickButton label={PICK} delay={S + 0.7} height={44} />
        </Up>
      </div>

      {/* жёсткий переход в белый */}
      <div className="absolute inset-x-0 bottom-0" style={{ top: 368 - o, background: PAPER }} />
      <div className="absolute overflow-hidden" style={{ left: 72, top: 440 - o - 6, paddingBottom: 4 }}>
        <motion.div
          style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 26, letterSpacing: '0.02em', lineHeight: 1, color: PAPER_INK, textTransform: 'uppercase', whiteSpace: 'nowrap' }}
          initial={ini({ transform: 'translateY(110%)' })}
          animate={{ transform: 'translateY(0%)' }}
          transition={t(S + 0.1, 0.7, RISE)}
        >
          Работы {place(d).gen}
        </motion.div>
      </div>
      <Up delay={S + 0.4} y={0} duration={0.4} className="absolute flex" style={{ left: 1108, top: 452 - o - 22, gap: 12 }}>
        {(['left', 'right'] as const).map((dir, i) => (
          <span key={dir} className="grid place-items-center rounded-full" style={{ width: 44, height: 44, border: `1px solid ${PAPER_LINE}`, background: '#fff' }}>
            <span style={{ transform: dir === 'left' ? 'translateX(2px)' : 'translateX(-2px)' }}>
              <Chevron color={i ? PAPER_INK : '#9a9a9a'} size={9} dir={dir} />
            </span>
          </span>
        ))}
      </Up>
      <div className="absolute flex" style={{ left: 72, top: 484 - o, gap: 16 }}>
        {cards.map((c, i) => (
          <WorkCard key={i} d={d} i={i} label={c} last={i === cards.length - 1} w={370} h={278} x={60} delay={S + 0.2 + i * 0.08} title={19} />
        ))}
      </div>
    </section>
  )
}

function Desktop({ d }: { d: Draft }) {
  const on = useAnimOn()
  const hero = useRef<HTMLDivElement>(null)
  const n = useFlare(hero, on, !d.niche.video)
  return (
    <div className="relative" style={{ width: DW, height: DH * 2, background: INK, color: TEXT, fontFamily: SANS }}>
      <DesktopHero d={d} n={n} rootRef={hero} />
      <DesktopSecond d={d} />
      <DesktopNav d={d} n={n} />
    </div>
  )
}

/* ── телефон ───────────────────────────────────────────────────── */

const MW = 390
const MH = 800
const M_OFF = MH - Math.round(MH * 0.92)

function MobileNav({ d, n }: { d: Draft; n: number }) {
  const { on, t, ini } = useTr()
  const nav = useRef<HTMLDivElement>(null)
  const bg = useRef<HTMLDivElement>(null)
  useFixedNav(nav, bg, on)
  const name = d.name.toUpperCase()
  const wm = fit([name], 226, 17, 10, 0.8)
  return (
    <div ref={nav} className="absolute left-0 top-0 z-30" style={{ width: MW, height: 60 }}>
      <div ref={bg} className="absolute inset-0" style={{ background: INK, opacity: 0 }} />
      <motion.div
        className="absolute left-0 right-0"
        style={{ bottom: 0, height: 1, background: HAIR, transformOrigin: '50% 50%' }}
        initial={ini({ transform: 'scaleX(0)' })}
        animate={{ transform: 'scaleX(1)' }}
        transition={t(0.2, 0.9)}
      />
      <Streak n={n} top={59} left={0} width={MW} len={140} delay={0} dur={0.9} />
      <motion.div className="absolute inset-0" initial={ini({ opacity: 0 })} animate={{ opacity: 1 }} transition={t(0.4, 0.5)}>
        <Burger left={16} top={25} />
        <div
          className="absolute"
          style={{ left: MW / 2, top: 30, transform: 'translate(-50%, -50%)', fontFamily: SERIF, fontWeight: 400, fontSize: wm, letterSpacing: wm < 14 ? '0.03em' : '0.06em', color: TEXT, lineHeight: 1.15, whiteSpace: 'nowrap' }}
        >
          {name}
        </div>
        <span className="absolute" style={{ right: 16, top: 25, color: TEXT, ...caps(10.5) }}>
          Запись
        </span>
      </motion.div>
    </div>
  )
}

function MobileHero({ d, n, rootRef }: { d: Draft; n: number; rootRef: RefObject<HTMLDivElement | null> }) {
  const { t, ini } = useTr()
  const v = nicheVideo(d, 'auto')
  const size = fit(d.niche.services, 358, 44, 36, 0.56)
  const lh = size
  const facts = d.niche.facts.map(splitFact)
  return (
    <section ref={rootRef} className="relative overflow-hidden" style={{ width: MW, height: MH, background: INK }}>
      <BgVideo src={v.src} poster={v.poster} position="60% 50%" push={false} className="absolute inset-0" style={{ filter: VIDEO_FILTER }} />
      {/* верх держим тёмным до конца строки боли: в момент вспышки середину кадра заливает дымка */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(2,2,4,.9) 0%, rgba(2,2,4,.74) 38%, rgba(2,2,4,.3) 52%, rgba(2,2,4,0) 64%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(0deg, ${INK} 0%, rgba(2,2,4,0) 42%)` }} />

      <Services d={d} n={n} size={size} lh={lh} style={{ left: 16, top: 100 - Math.round(size * 0.14), width: 370 }} />

      <motion.p
        className="absolute"
        style={{ left: 16, top: 272, width: 350, margin: 0, fontFamily: SANS, fontSize: 15, lineHeight: 1.45, color: '#c9c9c9', textShadow: '0 1px 14px rgba(2,2,4,.85)' }}
        initial={ini({ opacity: 0, transform: 'translateY(12px)' })}
        animate={{ opacity: 1, transform: 'translateY(0px)' }}
        transition={t(1.8, 0.6)}
      >
        {nb(noDot(d.niche.pain))}
      </motion.p>

      <Up delay={2.0} duration={0.5} className="absolute" style={{ left: 16, top: 592, width: 358 }}>
        <div className="grid place-items-center" style={{ height: 52, background: STEEL, color: '#fff', ...caps(11, 0.08) }}>
          {d.niche.cta}
        </div>
      </Up>
      <Up delay={2.08} duration={0.5} className="absolute text-center" style={{ left: 16, top: 664 - 6, width: 358 }}>
        <span className="relative inline-block" style={{ color: TEXT, ...caps(11, 0.08) }}>
          {d.niche.cta2}
          <span className="absolute left-0 right-0" style={{ top: 'calc(100% + 6px)', height: 1, background: TEXT, opacity: 0.4 }} />
        </span>
      </Up>

      <motion.div
        className="absolute"
        style={{ left: 16, top: 708, width: 358, height: 1, background: HAIR, transformOrigin: '0% 50%' }}
        initial={ini({ transform: 'scaleX(0)' })}
        animate={{ transform: 'scaleX(1)' }}
        transition={t(0.9, 1.0)}
      />
      <Streak n={n} top={708} left={16} width={358} len={140} delay={0.25} dur={0.9} />
      <div className="absolute flex" style={{ left: 16, top: 722 }}>
        {facts.map((f, i) => (
          <Up key={i} delay={2.2 + i * 0.08} duration={0.55} y={10} className="relative" style={{ width: 119, paddingLeft: i ? 12 : 0, paddingRight: 8 }}>
            {i > 0 && <span className="absolute left-0" style={{ top: 2, width: 1, height: 30, background: HAIR }} />}
            {f.label ? (
              <>
                <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 22, lineHeight: 1.15, color: TEXT }}>{f.value}</div>
                <div style={{ marginTop: 6, color: MUTED, ...caps(9.5), whiteSpace: 'normal' }}>{f.label}</div>
              </>
            ) : (
              <div style={{ fontFamily: SANS, fontSize: 12.5, lineHeight: 1.35, color: '#c9c9c9' }}>{nb(f.value)}</div>
            )}
          </Up>
        ))}
      </div>
    </section>
  )
}

function MobileSecond({ d }: { d: Draft }) {
  const { t, ini } = useTr()
  const S = SECOND_AT
  const o = M_OFF
  const words = svc(d)
  const cards = [...words, 'Все услуги']
  return (
    <section className="relative overflow-hidden" style={{ width: MW, height: MH, background: INK }}>
      <motion.div
        className="absolute"
        style={{ left: 16, top: 76 - o, width: 358, height: 296, background: PANEL }}
        initial={ini({ clipPath: 'inset(0% 50% 0% 50%)' })}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        transition={t(S, 0.7)}
      />
      <Up delay={S + 0.05} y={14} className="absolute text-center" style={{ left: 16, width: 358, top: 100 - o - 6 }}>
        <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 22, letterSpacing: '0.02em', lineHeight: 1, color: TEXT, textTransform: 'uppercase' }}>Подберите услугу</div>
      </Up>
      <Up delay={S + 0.12} y={14} className="absolute text-center" style={{ left: 40, width: 310, top: 136 - o }}>
        <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, lineHeight: 1.45 }}>{PICK_SUB}</div>
      </Up>
      <div className="absolute" style={{ left: 40, top: 196 - o, width: 310 }}>
        <Up delay={S + 0.18} y={10}>
          <Select label="Класс авто" active height={44} />
        </Up>
        <Up delay={S + 0.24} y={10} style={{ marginTop: 10 }}>
          <Select label="Услуга" active={false} height={44} />
        </Up>
        <Up delay={S + 0.3} y={10} style={{ marginTop: 10 }}>
          <PickButton label={PICK} delay={S + 0.7} height={44} />
        </Up>
      </div>

      <div className="absolute inset-x-0 bottom-0" style={{ top: 400 - o, background: PAPER }} />
      <div className="absolute overflow-hidden" style={{ left: 16, top: 432 - o - 4, paddingBottom: 3 }}>
        <motion.div
          style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 20, letterSpacing: '0.02em', lineHeight: 1, color: PAPER_INK, textTransform: 'uppercase', whiteSpace: 'nowrap' }}
          initial={ini({ transform: 'translateY(110%)' })}
          animate={{ transform: 'translateY(0%)' }}
          transition={t(S + 0.1, 0.7, RISE)}
        >
          Работы {place(d).gen}
        </motion.div>
      </div>
      <div className="absolute flex" style={{ left: 16, top: 480 - o, gap: 12 }}>
        {cards.slice(0, 2).map((c, i) => (
          <WorkCard key={i} d={d} i={i} label={c} last={i === cards.length - 1} w={300} h={225} x={40} delay={S + 0.2 + i * 0.08} title={17} />
        ))}
      </div>
      <Up delay={S + 0.4} y={0} duration={0.4} className="absolute" style={{ left: 16, top: 480 - o + 225 + 26, width: 358, height: 1, background: PAPER_LINE }}>
        <div style={{ width: '25%', height: 1, background: PAPER_INK }} />
      </Up>
    </section>
  )
}

function Mobile({ d }: { d: Draft }) {
  const on = useAnimOn()
  const hero = useRef<HTMLDivElement>(null)
  const n = useFlare(hero, on, !d.niche.video)
  return (
    <div className="relative" style={{ width: MW, height: MH * 2, background: INK, color: TEXT, fontFamily: SANS }}>
      <MobileHero d={d} n={n} rootRef={hero} />
      <MobileSecond d={d} />
      <MobileNav d={d} n={n} />
    </div>
  )
}

export default { Desktop, Mobile } satisfies Template
