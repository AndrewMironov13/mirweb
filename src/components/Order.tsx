import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { about } from '../data/content'
import { goal } from '../lib/goal'
import { T } from '../lib/typo'
import { LeadForm } from './LeadForm'
import { TgIcon, maxHref, tgHref } from './Messengers'

const Ctx = createContext<() => void>(() => {})
/** Открыть окно «Заказать сайт» из любого места страницы */
export const useOrder = () => useContext(Ctx)

/** Мышь или тачпад: там поле можно сфокусировать сразу. На телефоне автофокус открыл бы клавиатуру поверх окна */
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

export function OrderProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  // Откуда открыли окно: туда вернём фокус после закрытия
  const opener = useRef<HTMLElement | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const show = useCallback(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOpen(true)
    goal('order_open')
  }, [])

  useEffect(() => {
    if (!open) return
    // Без автофокуса (телефон) фокус ставим на само окно, иначе он останется на недоступной странице
    if (!dialog.current?.contains(document.activeElement)) dialog.current?.focus({ preventScroll: true })
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = prev
      opener.current?.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <Ctx.Provider value={show}>
      {/* Пока окно открыто, страница под ним недоступна ни Tab, ни скринридеру. Окно — вне обёртки */}
      <div inert={open}>{children}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: 0.25 }}
          >
            <button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-0 bg-[#1c1b1a]/40" onClick={() => setOpen(false)} />
            <motion.div
              ref={dialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-title"
              tabIndex={-1}
              className="relative max-h-full w-full max-w-[440px] overflow-y-auto overscroll-contain rounded-[28px] bg-white p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,.5)] outline-none sm:p-8"
              initial={{ opacity: 0, transform: 'translateY(24px) scale(.98)' }}
              animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
              exit={{ opacity: 0, transform: 'translateY(16px) scale(.98)' }}
              transition={{ type: 'spring', bounce: 0.18, visualDuration: 0.4 }}
            >
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-cloud text-ink-soft transition hover:bg-cloud-2 hover:text-ink">
                <X size={17} />
              </button>
              <div className="mb-5 flex items-center gap-3 pr-10">
                <img src={`${import.meta.env.BASE_URL}img/andrey-avatar.webp`} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-[0_6px_16px_-6px_rgba(0,0,0,.4)]" />
                <div className="leading-tight">
                  <p className="text-[14px] font-semibold text-ink">Андрей</p>
                  <p className="text-[13px] text-ink-soft">{about.role}</p>
                </div>
              </div>
              <h2 id="order-title" className="display pr-10 text-[34px] leading-[1.05] text-ink">Заказать сайт</h2>
              <p className="mt-3 text-[15px] leading-[1.55] text-ink-soft">
                <T>Оставьте телефон или ник — напишем, зададим пару вопросов и покажем первый экран бесплатно</T>
              </p>
              <div className="mt-6">
                <LeadForm source="Кнопка «Заказать сайт»" autoFocus={finePointer()} />
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
                  Max
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  )
}
