import { motion, useReducedMotion } from 'motion/react'
import { Check, Menu } from 'lucide-react'
import { useContext, type CSSProperties } from 'react'
import { tplOf, type Draft } from '../../data/niches'
import { Anim, EASE, Fade, Photo, Pop, Rise, ScrollDemo, Typed } from './anim'
import { TEMPLATES } from './templates'

export const DESKTOP = { w: 1280, h: 760 }
export const MOBILE = { w: 390, h: 800 }

const img = (name: string) => `${import.meta.env.BASE_URL}img/niche/${name}.webp`

const headFont = (d: Draft): CSSProperties =>
  d.niche.type === 'serif'
    ? { fontFamily: 'var(--font-display)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 0.98 }
    : { fontFamily: 'var(--font-sans)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 0.96 }

const NAV = ['Услуги', 'Цены', 'Работы', 'Отзывы', 'Контакты']

function Logo({ d, light }: { d: Draft; light: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid h-9 w-9 place-items-center rounded-[10px] text-[17px] font-bold"
        style={{ background: d.niche.accent, color: '#fff' }}
      >
        {d.name.charAt(0)}
      </span>
      <span className="text-[19px] font-semibold tracking-tight" style={{ color: light ? '#fff' : '#1c1b1a' }}>
        <Typed text={d.name} delay={0.3} />
      </span>
    </div>
  )
}

function Header({ d, light, mobile }: { d: Draft; light: boolean; mobile?: boolean }) {
  const on = useContext(Anim)
  const color = light ? 'rgba(255,255,255,.78)' : 'rgba(28,27,26,.7)'
  if (mobile) {
    return (
      <Fade delay={0.2} y={-10} className="relative z-10 flex items-center justify-between px-5 pt-5">
        <Logo d={d} light={light} />
        <Menu size={24} color={light ? '#fff' : '#1c1b1a'} />
      </Fade>
    )
  }
  return (
    <div className="relative z-10 flex items-center justify-between px-14 pt-8">
      <Fade delay={0.2} y={-10}>
        <Logo d={d} light={light} />
      </Fade>
      <nav className="flex gap-9 text-[15px]" style={{ color }}>
        {NAV.map((n, i) => (
          <motion.span
            key={n}
            initial={{ opacity: 0, transform: 'translateY(-10px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={on ? { delay: 0.3 + i * 0.05, duration: 0.5, ease: EASE } : { duration: 0 }}
          >
            {n}
          </motion.span>
        ))}
      </nav>
      <Fade delay={0.55} y={-10}>
        <span
          className="rounded-full border px-5 py-2.5 text-[14px] font-medium"
          style={{ borderColor: light ? 'rgba(255,255,255,.35)' : 'rgba(28,27,26,.2)', color: light ? '#fff' : '#1c1b1a' }}
        >
          {d.niche.cta2}
        </span>
      </Fade>
    </div>
  )
}

function Eyebrow({ d, delay, light, center }: { d: Draft; delay: number; light?: boolean; center?: boolean }) {
  return (
    <Fade delay={delay} className={`flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
      <span className="h-px w-8" style={{ background: d.niche.accent }} />
      <span
        className="text-[12px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: light ? d.niche.accent : d.niche.accent }}
      >
        {d.label}
      </span>
      {center && <span className="h-px w-8" style={{ background: d.niche.accent }} />}
    </Fade>
  )
}

function Buttons({ d, delay, light, stacked, center }: { d: Draft; delay: number; light: boolean; stacked?: boolean; center?: boolean }) {
  const pill = d.niche.layout === 'center'
  const r = pill ? 999 : 12
  const onAccentText = d.niche.layout === 'light-split' ? '#fff' : '#0b0b0c'
  return (
    <div className={`flex gap-3 ${stacked ? 'flex-col' : ''} ${center ? 'justify-center' : ''}`}>
      <Pop delay={delay}>
        <span
          className="flex items-center justify-center font-semibold"
          style={{ background: d.niche.accent, color: onAccentText, borderRadius: r, padding: stacked ? '15px 20px' : '17px 30px', fontSize: stacked ? 15 : 16 }}
        >
          {d.niche.cta} →
        </span>
      </Pop>
      <Pop delay={delay + 0.08}>
        <span
          className="flex items-center justify-center border font-medium"
          style={{
            borderColor: light ? 'rgba(255,255,255,.4)' : 'rgba(28,27,26,.22)',
            color: light ? '#fff' : '#1c1b1a',
            borderRadius: r,
            padding: stacked ? '14px 20px' : '16px 28px',
            fontSize: stacked ? 15 : 16,
          }}
        >
          {d.niche.cta2}
        </span>
      </Pop>
    </div>
  )
}

function Facts({ d, delay, light, center, small }: { d: Draft; delay: number; light: boolean; center?: boolean; small?: boolean }) {
  const on = useContext(Anim)
  return (
    <div className={`flex flex-wrap gap-x-7 gap-y-2 ${center ? 'justify-center' : ''}`} style={{ fontSize: small ? 12 : 14 }}>
      {d.niche.facts.map((f, i) => (
        <motion.span
          key={f}
          className="flex items-center gap-2"
          style={{ color: light ? 'rgba(255,255,255,.78)' : 'rgba(28,27,26,.72)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={on ? { delay: delay + i * 0.1, duration: 0.5 } : { duration: 0 }}
        >
          <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: `${d.niche.accent}33` }}>
            <Check size={12} strokeWidth={3} color={d.niche.accent} />
          </span>
          {f}
        </motion.span>
      ))}
    </div>
  )
}

/* ── Три раскладки первого экрана ───────────────────────────────── */

function DarkLeft({ d }: { d: Draft }) {
  const hs = headFont(d)
  return (
    <div className="relative h-full w-full bg-[#0b0b0c]">
      <Photo src={img(d.niche.photo)} delay={0} dark className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(8,8,10,.94) 0%, rgba(8,8,10,.8) 34%, rgba(8,8,10,.25) 70%, rgba(8,8,10,.1) 100%)' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56" style={{ background: 'linear-gradient(0deg, rgba(8,8,10,.85), transparent)' }} />
      <Header d={d} light />
      <div className="absolute left-14 top-[170px] w-[640px]">
        <Eyebrow d={d} delay={0.5} light />
        <div role="presentation" className="mt-6 text-[88px] text-white" style={hs}>
          <Rise delay={0.6}>{d.niche.services[0]}</Rise>
          <Rise delay={0.72}>{d.niche.services[1]}</Rise>
          <Rise delay={0.84} style={{ color: d.niche.accent }}>{d.niche.services[2]}</Rise>
        </div>
        <Fade delay={1.1} className="mt-6 max-w-[520px] text-[19px] leading-[1.5] text-white/80">{d.niche.pain}</Fade>
        <div className="mt-9">
          <Buttons d={d} delay={1.25} light />
        </div>
      </div>
      <div className="absolute bottom-10 left-14">
        <Facts d={d} delay={1.5} light />
      </div>
    </div>
  )
}

function Center({ d }: { d: Draft }) {
  const hs = headFont(d)
  return (
    <div className="relative h-full w-full bg-[#0b0b0c]">
      <Photo src={img(d.niche.photo)} delay={0} dark className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(8,8,10,.55) 0%, rgba(8,8,10,.82) 70%, rgba(8,8,10,.92) 100%)' }} />
      <Header d={d} light />
      <div className="absolute inset-x-0 top-[190px] flex flex-col items-center px-24 text-center">
        <Eyebrow d={d} delay={0.5} light center />
        <div role="presentation" className="mt-7 text-[92px] text-white" style={hs}>
          <Rise delay={0.6}>
            {d.niche.services[0]} {d.niche.services[1]}
          </Rise>
          <Rise delay={0.74} style={{ color: d.niche.accent }}>{d.niche.services[2]}</Rise>
        </div>
        <Fade delay={1.1} className="mt-6 max-w-[620px] text-[19px] leading-[1.5] text-white/80">{d.niche.pain}</Fade>
        <div className="mt-9">
          <Buttons d={d} delay={1.25} light center />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-10">
        <Facts d={d} delay={1.5} light center />
      </div>
    </div>
  )
}

function LightSplit({ d }: { d: Draft }) {
  const hs = headFont(d)
  const on = useContext(Anim)
  return (
    <div className="relative h-full w-full" style={{ background: '#f6f2ec' }}>
      <Header d={d} light={false} />
      <div className="absolute left-14 top-[170px] w-[560px]">
        <Eyebrow d={d} delay={0.5} />
        <div role="presentation" className="mt-6 text-[84px] text-[#1c1b1a]" style={hs}>
          <Rise delay={0.6}>{d.niche.services[0]}</Rise>
          <Rise delay={0.72}>{d.niche.services[1]}</Rise>
          <Rise delay={0.84} style={{ color: d.niche.accent }}>{d.niche.services[2]}</Rise>
        </div>
        <Fade delay={1.1} className="mt-6 max-w-[480px] text-[19px] leading-[1.5] text-[#1c1b1a]/70">{d.niche.pain}</Fade>
        <div className="mt-9">
          <Buttons d={d} delay={1.25} light={false} />
        </div>
      </div>
      <Photo src={img(d.niche.photo)} delay={0.35} className="absolute bottom-10 right-14 top-[118px] w-[560px] rounded-[30px]" />
      <motion.div
        className="absolute bottom-[86px] right-[520px] flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_18px_50px_-12px_rgba(0,0,0,.25)]"
        initial={{ opacity: 0, transform: 'translateY(16px) scale(.94)' }}
        animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
        transition={on ? { delay: 1.55, type: 'spring', bounce: 0.3, visualDuration: 0.5 } : { duration: 0 }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: '#22c55e' }} />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
        </span>
        <span className="text-[15px] font-medium text-[#1c1b1a]">{d.niche.facts[1]}</span>
      </motion.div>
      <div className="absolute bottom-10 left-14">
        <Facts d={d} delay={1.6} light={false} small />
      </div>
    </div>
  )
}

function MobileSite({ d }: { d: Draft }) {
  const hs = headFont(d)
  const light = d.niche.layout !== 'light-split'
  if (!light) {
    return (
      <div className="relative h-full w-full" style={{ background: '#f6f2ec' }}>
        <Header d={d} light={false} mobile />
        <div className="px-5 pt-9">
          <Eyebrow d={d} delay={0.45} />
          <div role="presentation" className="mt-4 text-[44px] text-[#1c1b1a]" style={hs}>
            <Rise delay={0.55}>{d.niche.services[0]}</Rise>
            <Rise delay={0.66}>{d.niche.services[1]}</Rise>
            <Rise delay={0.77} style={{ color: d.niche.accent }}>{d.niche.services[2]}</Rise>
          </div>
          <Fade delay={1} className="mt-4 text-[15px] leading-[1.5] text-[#1c1b1a]/70">{d.niche.pain}</Fade>
          <div className="mt-6">
            <Buttons d={d} delay={1.15} light={false} stacked />
          </div>
        </div>
        <Photo src={img(d.niche.photo)} delay={0.4} className="absolute inset-x-5 bottom-5 h-[190px] rounded-[22px]" />
      </div>
    )
  }
  return (
    <div className="relative h-full w-full bg-[#0b0b0c]">
      <Photo src={img(d.niche.photo)} delay={0} dark className="absolute inset-x-0 top-0 h-[520px]" />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,10,.55) 0%, rgba(8,8,10,.25) 25%, rgba(8,8,10,.85) 55%, #0b0b0c 70%)' }} />
      <Header d={d} light mobile />
      <div className="absolute inset-x-0 bottom-0 px-5 pb-7">
        <Eyebrow d={d} delay={0.45} light />
        <div role="presentation" className="mt-4 text-[44px] text-white" style={hs}>
          <Rise delay={0.55}>{d.niche.services[0]}</Rise>
          <Rise delay={0.66}>{d.niche.services[1]}</Rise>
          <Rise delay={0.77} style={{ color: d.niche.accent }}>{d.niche.services[2]}</Rise>
        </div>
        <Fade delay={1} className="mt-4 text-[15px] leading-[1.5] text-white/75">{d.niche.pain}</Fade>
        <div className="mt-6">
          <Buttons d={d} delay={1.15} light stacked />
        </div>
      </div>
    </div>
  )
}

export function SitePreview({ draft, mobile, animated = true }: { draft: Draft; mobile?: boolean; animated?: boolean }) {
  const reduce = useReducedMotion()
  const on = animated && !reduce
  const L = draft.niche.layout
  const T = TEMPLATES[tplOf(draft.niche)]
  return (
    <Anim.Provider value={on}>
      <div className="h-full w-full select-none overflow-hidden font-sans" aria-hidden="true">
        {T ? (
          <ScrollDemo h={mobile ? MOBILE.h : DESKTOP.h}>{mobile ? <T.Mobile d={draft} /> : <T.Desktop d={draft} />}</ScrollDemo>
        ) : mobile ? (
          <MobileSite d={draft} />
        ) : L === 'dark-left' ? (
          <DarkLeft d={draft} />
        ) : L === 'center' ? (
          <Center d={draft} />
        ) : (
          <LightSplit d={draft} />
        )}
      </div>
    </Anim.Provider>
  )
}
