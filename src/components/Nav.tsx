import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { nav } from '../data/content'
import { LogoMark } from './Logo'
import { MaxBadge, TgIcon, maxHref, tgHref } from './Messengers'
import { useOrder } from './Order'

const SPRING = { type: 'spring', bounce: 0.22, visualDuration: 0.42 } as const

/** Круглая стеклянная кнопка-иконка */
function Circle({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener" aria-label={label} title={label} className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-transform duration-200 hover:scale-[1.06] active:scale-95">
      {children}
    </a>
  )
}

export function Nav() {
  const order = useOrder()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])

  const orderNow = () => {
    setOpen(false)
    order()
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-2 px-3 pt-3 sm:px-5">
          <a href="#top" onClick={() => setOpen(false)} aria-label="МирВеб — наверх" className="glass pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full pl-3.5 pr-4 text-ink">
            <LogoMark size={20} />
            <span className="text-[16px] font-semibold tracking-[-0.01em]">МирВеб</span>
          </a>

          <nav aria-label="Разделы" className="glass pointer-events-auto absolute left-1/2 hidden h-11 -translate-x-1/2 items-center gap-1 rounded-full px-1.5 lg:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-4 py-2 text-[14.5px] text-ink transition-colors hover:bg-black/[0.05]">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="pointer-events-auto flex items-center gap-2">
            {/* На самых узких телефонах (320) Telegram живёт в меню, иначе бургер уезжает за край */}
            <span className="hidden min-[370px]:block">
              <Circle href={tgHref()} label="Написать в Telegram">
                <TgIcon />
              </Circle>
            </span>
            <span className="hidden md:block">
              <Circle href={maxHref} label="Написать в Max">
                <MaxBadge />
              </Circle>
            </span>
            <button type="button" onClick={orderNow} className="btn-dark h-11 rounded-full px-4 text-[14.5px] shadow-[0_10px_30px_-12px_rgba(28,27,26,.55),0_0_0_1px_rgba(255,255,255,.22)] sm:px-5">
              <span className="hidden sm:inline">Заказать сайт</span>
              <span className="sm:hidden">Заказать</span>
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={open}
              className="glass relative grid h-11 w-11 place-items-center rounded-full lg:hidden"
            >
              <span className={`absolute h-[2px] w-[18px] rounded-full bg-ink transition-transform duration-300 ${open ? 'rotate-45' : '-translate-y-[5px]'}`} />
              <span className={`absolute h-[2px] w-[18px] rounded-full bg-ink transition-transform duration-300 ${open ? '-rotate-45' : 'translate-y-[5px]'}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Меню на телефоне: стопка стеклянных плашек под шапкой, страница остаётся видна */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Закрыть меню"
              className="fixed inset-0 z-40 bg-[#1c1b1a]/20 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              aria-label="Меню"
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
                  variants={{ hidden: { opacity: 0, transform: 'translateY(-10px) scale(.97)' }, show: { opacity: 1, transform: 'translateY(0px) scale(1)', transition: SPRING } }}
                  className="glass flex h-14 items-center justify-between rounded-[20px] px-5 text-[17px] font-medium text-ink"
                >
                  {n.label}
                  <ArrowUpRight size={18} className="rotate-45 text-ink-soft" />
                </motion.a>
              ))}
              <motion.div
                variants={{ hidden: { opacity: 0, transform: 'translateY(-10px) scale(.97)' }, show: { opacity: 1, transform: 'translateY(0px) scale(1)', transition: SPRING } }}
                className="flex gap-2"
              >
                <Circle href={tgHref()} label="Написать в Telegram">
                  <TgIcon />
                </Circle>
                <Circle href={maxHref} label="Написать в Max">
                  <MaxBadge />
                </Circle>
                <button type="button" onClick={orderNow} className="btn-dark h-11 flex-1 rounded-full text-[15px]">
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
