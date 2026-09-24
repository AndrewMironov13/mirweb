import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { LeadForm } from './LeadForm'
import { MaxBadge, TgIcon, maxHref, tgHref } from './Messengers'

const Ctx = createContext<() => void>(() => {})
/** Открыть окно «Заказать сайт» из любого места страницы */
export const useOrder = () => useContext(Ctx)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const show = useCallback(() => setOpen(true), [])

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

  return (
    <Ctx.Provider value={show}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button type="button" aria-label="Закрыть" className="absolute inset-0 bg-[#1c1b1a]/40" onClick={() => setOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-title"
              className="relative w-full max-w-[440px] rounded-[28px] bg-white p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,.5)] sm:p-8"
              initial={{ opacity: 0, transform: 'translateY(24px) scale(.98)' }}
              animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
              exit={{ opacity: 0, transform: 'translateY(16px) scale(.98)' }}
              transition={{ type: 'spring', bounce: 0.18, visualDuration: 0.4 }}
            >
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-cloud text-ink-soft transition hover:bg-cloud-2 hover:text-ink">
                <X size={17} />
              </button>
              <h2 id="order-title" className="display pr-10 text-[34px] leading-[1.05] text-ink">Заказать сайт</h2>
              <p className="mt-3 text-[15px] leading-[1.55] text-ink-soft">
                Оставьте телефон или ник — напишем, зададим пару вопросов и покажем первый экран бесплатно
              </p>
              <div className="mt-6">
                <LeadForm source="Кнопка «Заказать сайт»" autoFocus />
              </div>
              <div className="mt-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[13px] text-muted">или напишите сами</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={tgHref()} target="_blank" rel="noopener" className="btn-dark h-12 text-[15px]">
                  <TgIcon /> Telegram
                </a>
                <a href={maxHref} target="_blank" rel="noopener" className="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] bg-cloud text-[15px] font-medium text-ink transition hover:bg-cloud-2 active:scale-[0.97]">
                  <MaxBadge /> Max
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  )
}
