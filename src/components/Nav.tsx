import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { nav } from '../data/content'
import { LogoMark } from './Logo'
import { MaxBadge, TgIcon, maxHref, tgHref } from './Messengers'
import { useOrder } from './Order'

const SPRING = { type: 'spring', bounce: 0.22, visualDuration: 0.42 } as const

/** Капсула шапки: светлое стекло, а над тёмной секцией — тёмное, с белым кольцом фокуса */
const skin = (dark: boolean) => (dark ? 'glass-dark on-dark text-white/90' : 'glass text-ink')
const SHADOW = 'shadow-[0_10px_30px_-12px_rgba(28,27,26,.55),0_0_0_1px_rgba(255,255,255,.22)]'

/** Что лежит под капсулами шапки: каждая капсула смотрит на свою точку */
type Under = { logo: boolean; links: boolean; cta: boolean }
const LIGHT: Under = { logo: false, links: false, cta: false }

/** Круглая стеклянная кнопка-иконка */
function Circle({ href, label, className, children }: { href: string; label: string; className: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-[transform,scale,background-color,box-shadow,color] duration-200 hover:scale-[1.06] active:scale-95 ${className}`}
    >
      {children}
    </a>
  )
}

export function Nav() {
  const order = useOrder()
  const still = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<Under>(LIGHT)
  const header = useRef<HTMLElement>(null)
  const logo = useRef<HTMLAnchorElement>(null)
  const links = useRef<HTMLElement>(null)
  const cta = useRef<HTMLButtonElement>(null)

  /**
   * Шапка над тёмными секциями ([data-dark]): смотрим, что под центром логотипа, разделов и кнопки «Заказать».
   * Не чаще раза за кадр. Меню и затемнение ([data-nav-layer]) пропускаем: под открытым меню шапка остаётся
   * в тоне страницы, иначе тёмная кнопка снова сливается с тёмной секцией
   */
  useEffect(() => {
    let raf = 0
    const darkAt = (el: HTMLElement | null) => {
      const r = el?.getBoundingClientRect()
      if (!r?.width) return false
      const hit = document
        .elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        .find((e) => !header.current?.contains(e) && !e.closest('[data-nav-layer]'))
      return Boolean(hit?.closest('[data-dark]'))
    }
    const check = () => {
      raf = 0
      const n = { logo: darkAt(logo.current), links: darkAt(links.current), cta: darkAt(cta.current) }
      setD((p) => (p.logo === n.logo && p.links === n.links && p.cta === n.cta ? p : n))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // Высота блоков выше может поменяться без прокрутки (форма в сцене, ответы FAQ)
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ro.disconnect()
    }
  }, [])

  // Меню открыто: Escape закрывает, страница под ним не листается (как у окна заказа)
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = prev
    }
  }, [open])

  const orderNow = () => {
    setOpen(false)
    order()
  }

  /** Плашки меню: сдвиг и масштаб, а если просили меньше движения — только проявление */
  const plate = still
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2 } } }
    : { hidden: { opacity: 0, transform: 'translateY(-10px) scale(.97)' }, show: { opacity: 1, transform: 'translateY(0px) scale(1)', transition: SPRING } }

  return (
    <>
      <header ref={header} className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1248px] items-center justify-between gap-2 px-3 pt-3 sm:px-6">
          <a
            ref={logo}
            href="#top"
            onClick={() => setOpen(false)}
            aria-label="МирВеб — наверх"
            className={`pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full pl-3.5 pr-4 transition-[background-color,box-shadow,color] duration-200 ${skin(d.logo)}`}
          >
            <LogoMark size={20} />
            <span className="text-[16px] font-semibold tracking-[-0.01em]">МирВеб</span>
          </a>

          <nav
            ref={links}
            aria-label="Разделы"
            className={`pointer-events-auto absolute left-1/2 hidden h-11 -translate-x-1/2 items-center gap-1 rounded-full px-1.5 transition-[background-color,box-shadow,color] duration-200 lg:flex ${skin(d.links)}`}
          >
            {nav.map((n) => (
              <a key={n.href} href={n.href} className={`rounded-full px-4 py-2 text-[14.5px] transition-colors ${d.links ? 'hover:bg-white/10' : 'hover:bg-black/[0.05]'}`}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className="pointer-events-auto flex items-center gap-2">
            {/* На самых узких телефонах (320) Telegram живёт в меню, иначе бургер уезжает за край */}
            <span className="hidden min-[370px]:block">
              <Circle href={tgHref()} label="Написать в Telegram" className={skin(d.cta)}>
                <TgIcon />
              </Circle>
            </span>
            <span className="hidden md:block">
              <Circle href={maxHref} label="Написать в Max" className={skin(d.cta)}>
                <MaxBadge />
              </Circle>
            </span>
            {/* Над тёмной секцией тёмная кнопка сливается с фоном (1,07:1) — там она белая */}
            <button
              ref={cta}
              type="button"
              onClick={orderNow}
              className={`btn-dark h-11 rounded-full px-4 text-[14.5px] transition-[background-color,color,transform] duration-200 sm:px-5 ${SHADOW} ${d.cta ? 'on-dark bg-white text-ink hover:bg-cloud' : ''}`}
            >
              <span className="hidden sm:inline">Заказать сайт</span>
              <span className="sm:hidden">Заказать</span>
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={open}
              className={`relative grid h-11 w-11 place-items-center rounded-full transition-[background-color,box-shadow,color] duration-200 lg:hidden ${skin(d.cta)}`}
            >
              <span className={`absolute h-[2px] w-[18px] rounded-full bg-current [transition:transform_.3s,background-color_.2s] ${open ? 'rotate-45' : '-translate-y-[5px]'}`} />
              <span className={`absolute h-[2px] w-[18px] rounded-full bg-current [transition:transform_.3s,background-color_.2s] ${open ? '-rotate-45' : 'translate-y-[5px]'}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Меню на телефоне: стопка плотных стеклянных плашек под шапкой, страница под затемнением не читается и не листается */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Закрыть меню"
              data-nav-layer
              className="fixed inset-0 z-40 bg-[#1c1b1a]/40 backdrop-blur-[6px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              aria-label="Меню"
              data-nav-layer
              className="fixed inset-x-3 top-[68px] z-50 mx-auto flex max-w-[520px] flex-col gap-2 lg:hidden"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{ show: { transition: { staggerChildren: 0.04 } }, hidden: { transition: { staggerChildren: 0.02, staggerDirection: -1 } } }}
            >
              {nav.map((n) => (
                <motion.a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  variants={plate}
                  className="glass-dense flex h-14 items-center justify-between rounded-[20px] px-5 text-[17px] font-medium text-ink"
                >
                  {n.label}
                  <ArrowUpRight size={18} className="rotate-45 text-ink-soft" />
                </motion.a>
              ))}
              {/* От планшета Telegram, Max и «Заказать сайт» уже есть в шапке — в меню не повторяем */}
              <motion.div variants={plate} className="flex gap-2 md:hidden">
                <Circle href={tgHref()} label="Написать в Telegram" className="glass-dense text-ink">
                  <TgIcon />
                </Circle>
                <Circle href={maxHref} label="Написать в Max" className="glass-dense text-ink">
                  <MaxBadge />
                </Circle>
                <button type="button" onClick={orderNow} className={`btn-dark h-11 flex-1 rounded-full text-[15px] ${SHADOW}`}>
                  Заказать сайт
                </button>
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
