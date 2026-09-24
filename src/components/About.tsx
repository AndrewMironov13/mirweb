import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react'
import type { PointerEvent } from 'react'
import { about } from '../data/content'
import { MaxBadge, TgIcon, maxHref, tgHref } from './Messengers'
import { Reveal } from './Reveal'

const SPRING = { stiffness: 120, damping: 18, mass: 0.6 }

/**
 * Портрет с лёгким наклоном за курсором: пара градусов и блик, как у карточек Apple.
 * Глаза за курсором не следят — это выглядит жутковато. На тач-экранах портрет стоит на месте
 */
function Portrait() {
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const sx = useSpring(px, SPRING)
  const sy = useSpring(py, SPRING)
  const rotateY = useTransform(sx, [0, 1], [-5, 5])
  const rotateX = useTransform(sy, [0, 1], [4, -4])
  const shiftX = useTransform(sx, [0, 1], [-8, 8])
  const glowX = useTransform(sx, [0, 1], ['20%', '80%'])
  const glowY = useTransform(sy, [0, 1], ['15%', '75%'])
  const glow = useMotionTemplate`radial-gradient(420px circle at ${glowX} ${glowY}, rgba(255,236,214,.16), transparent 60%)`

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const leave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <div onPointerMove={move} onPointerLeave={leave} className="relative [perspective:1100px]">
      <motion.div style={{ rotateX, rotateY, x: shiftX }} className="relative overflow-hidden rounded-[22px] will-change-transform">
        <img
          src={`${import.meta.env.BASE_URL}img/andrey.webp`}
          alt={`${about.name}, ${about.role.toLowerCase()}`}
          loading="lazy"
          className="block aspect-[4/5] w-full object-cover [mask-image:linear-gradient(to_bottom,black_78%,transparent)]"
        />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-screen" style={{ background: glow }} />
      </motion.div>
    </div>
  )
}

export function About() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-24 sm:px-6 lg:px-0 lg:pt-32">
      <Reveal>
        <div className="grid items-center gap-8 overflow-hidden rounded-[28px] bg-[radial-gradient(ellipse_at_85%_30%,#2b2a2c_0%,#161519_55%,#121116_100%)] p-5 text-white sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:p-14">
          <div className="order-2 lg:order-1">
            <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#f0a37a]">Кто делает</p>
            <p className="display mt-5 text-[28px] leading-[1.16] sm:text-[38px]">«{about.quote}»</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
              <div>
                <p className="text-[17px] font-semibold">{about.name}</p>
                <p className="text-[14px] text-white/60">{about.role}</p>
              </div>
              <div className="flex gap-2">
                <a href={tgHref('Здравствуйте, Андрей! ')} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-medium text-ink transition hover:bg-white/90 active:scale-[0.97]">
                  <TgIcon size={16} /> Написать мне
                </a>
                <a href={maxHref} target="_blank" rel="noopener" aria-label="Написать в Max" className="grid h-11 w-11 place-items-center rounded-full text-white ring-1 ring-white/25 transition hover:bg-white/10">
                  <MaxBadge />
                </a>
              </div>
            </div>
          </div>
          <div className="order-1 mx-auto w-full max-w-[420px] lg:order-2 lg:max-w-none">
            <Portrait />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
