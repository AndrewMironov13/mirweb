import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

const KEY = 'mw-cookies-ok'

/** Хранилище может быть закрыто (приватный режим, запрет сайтов) — тогда плашка просто покажется снова */
const seen = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Уведомление о cookies и Яндекс Метрике: маленькая стеклянная плашка внизу, как капсулы шапки.
 * Появляется через секунду после загрузки, чтобы не спорить с первым экраном, и больше не показывается после «Понятно».
 * Пока плашка на экране, плавающее поле генератора не показываем (onOpen → App → FloatingAsk): вдвоём они закрывали низ экрана
 */
export function CookieNote({ onOpen }: { onOpen: (open: boolean) => void }) {
  const [show, setShow] = useState(false)
  const still = useReducedMotion()

  useEffect(() => {
    if (seen()) return
    const t = window.setTimeout(() => setShow(true), 1000)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => onOpen(show), [show, onOpen])

  const ok = () => {
    setShow(false)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* без хранилища плашка покажется в следующий раз — не страшно */
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="region"
          aria-label="Уведомление о cookies"
          initial={still ? { opacity: 0 } : { opacity: 0, transform: 'translateY(12px)' }}
          animate={still ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px)' }}
          exit={still ? { opacity: 0 } : { opacity: 0, transform: 'translateY(12px)' }}
          transition={{ type: 'spring', bounce: 0.2, visualDuration: 0.4 }}
          className="glass-dense fixed bottom-3 left-3 right-3 z-40 mx-auto flex max-w-[440px] items-center sm:max-w-none gap-3 rounded-[16px] py-2 pl-4 pr-2 text-[13px] leading-snug text-ink-soft sm:left-5 sm:right-auto sm:mx-0 sm:bottom-5"
        >
          <p className="min-w-0 flex-1 sm:whitespace-nowrap">
            Сайт использует cookies и Яндекс Метрику.{' '}
            <a href={`${import.meta.env.BASE_URL}privacy.html#stats`} className="whitespace-nowrap text-ink underline underline-offset-2">
              Подробнее
            </a>
          </p>
          <button type="button" onClick={ok} className="btn-dark h-9 shrink-0 rounded-full px-4 text-[13px]">
            Понятно
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
