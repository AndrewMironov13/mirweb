import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { ArrowUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** Плавающее поле внизу экрана, как у референса: напоминает про генератор, пока листают вниз */
export function FloatingAsk() {
  const { scrollY } = useScroll()
  const [show, setShow] = useState(false)
  // Высоту страницы и окна кешируем: чтение scrollHeight на каждом кадре скролла заставляет браузер пересчитывать раскладку
  const dims = useRef({ page: 0, view: 0 })
  useEffect(() => {
    const measure = () => (dims.current = { page: document.documentElement.scrollHeight, view: window.innerHeight })
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  useMotionValueEvent(scrollY, 'change', (y) => {
    const nearEnd = y + dims.current.view > dims.current.page - 1300
    setShow(y > 1300 && !nearEnd)
  })

  const go = () => {
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(() => document.getElementById('gen-hero')?.focus({ preventScroll: true }), 700)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={go}
          initial={{ opacity: 0, transform: 'translate(-50%, 24px)' }}
          animate={{ opacity: 1, transform: 'translate(-50%, 0px)' }}
          exit={{ opacity: 0, transform: 'translate(-50%, 24px)' }}
          transition={{ type: 'spring', bounce: 0.25, visualDuration: 0.45 }}
          className="fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-32px)] max-w-[420px] items-center justify-between gap-3 rounded-[16px] bg-[#e6e5e3]/90 py-2 pl-5 pr-2 text-left shadow-[0_18px_40px_-16px_rgba(0,0,0,.35)] ring-1 ring-black/5 backdrop-blur-xl"
        >
          <span className="truncate text-[15px] text-ink-soft">Как называется ваш бизнес?</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ink text-white">
            <ArrowUp size={16} />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
