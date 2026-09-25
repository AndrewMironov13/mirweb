/**
 * Общие кирпичи для шаблонов черновиков: появление строк, кнопок, фото и фонового видео,
 * плюс прокрутка внутри макета, которая показывает вторую секцию сайта.
 * Всё анимируется только transform / opacity / clip-path — это дёшево для браузера.
 */
import { motion, useInView, type Transition } from 'motion/react'
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export const EASE = [0.22, 1, 0.36, 1] as const

/** false = рисуем всё сразу, без анимаций: миниатюры, пререндер, reduced motion */
export const Anim = createContext(true)
export const useAnimOn = () => useContext(Anim)

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

/**
 * Видео для черновика: своё у ниши (маникюр, кофейня, йога…), иначе общее у сферы.
 * Шаблоны берут src и poster только отсюда, чтобы под «Маникюр. Педикюр. Брови.» не играл массаж
 */
export function nicheVideo(d: { niche: { video?: string } }, tpl: string) {
  const id = d.niche.video ?? tpl
  return { src: asset(`video/niche/${id}.mp4`), poster: asset(`video/niche/${id}.webp`) }
}

export function useT(delay: number, duration = 0.7): Transition {
  const on = useAnimOn()
  return on ? { delay, duration, ease: EASE } : { duration: 0 }
}

/** Строка заголовка выезжает снизу из-под маски */
export function Rise({ delay, children, className, style }: { delay: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  const t = useT(delay, 0.8)
  return (
    <span className={`block overflow-hidden pb-[0.08em] ${className ?? ''}`} style={style}>
      <motion.span className="block" initial={{ transform: 'translateY(105%)' }} animate={{ transform: 'translateY(0%)' }} transition={t}>
        {children}
      </motion.span>
    </span>
  )
}

export function Fade({ delay, children, className, style, y = 14, x = 0 }: { delay: number; children: ReactNode; className?: string; style?: CSSProperties; y?: number; x?: number }) {
  const t = useT(delay, 0.6)
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, transform: `translate(${x}px, ${y}px)` }}
      animate={{ opacity: 1, transform: 'translate(0px, 0px)' }}
      transition={t}
    >
      {children}
    </motion.div>
  )
}

export function Pop({ delay, children, className, style }: { delay: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  const on = useAnimOn()
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, transform: 'scale(0.86)' }}
      animate={{ opacity: 1, transform: 'scale(1)' }}
      transition={on ? { delay, type: 'spring', bounce: 0.35, visualDuration: 0.45 } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

/** Текст печатается по буквам, как будто его вводят в конструкторе */
export function Typed({ text, delay }: { text: string; delay: number }) {
  const on = useAnimOn()
  const [n, setN] = useState(on ? 0 : text.length)
  useEffect(() => {
    if (!on) return setN(text.length)
    setN(0)
    let i = 0
    let iv: number | undefined
    const start = window.setTimeout(() => {
      iv = window.setInterval(() => {
        i += 1
        setN(i)
        if (i >= text.length) window.clearInterval(iv)
      }, Math.max(22, 380 / Math.max(1, text.length)))
    }, delay * 1000)
    return () => {
      window.clearTimeout(start)
      if (iv) window.clearInterval(iv)
    }
  }, [text, delay, on])
  return <>{text.slice(0, n)}</>
}

/** Фото проявляется шторкой сверху вниз и медленно «приезжает» из крупного плана */
export function Photo({ src, delay, className, style, dark, position }: { src: string; delay: number; className?: string; style?: CSSProperties; dark?: boolean; position?: string }) {
  const on = useAnimOn()
  const t = useT(delay, 1.1)
  return (
    <motion.div
      className={`overflow-hidden ${className ?? ''}`}
      style={{ ...style, background: dark ? '#0b0b0c' : '#e8e4de' }}
      initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      transition={t}
    >
      <motion.img
        src={src}
        alt=""
        draggable={false}
        className="h-full w-full object-cover"
        style={{ objectPosition: position }}
        initial={{ transform: 'scale(1.18)' }}
        animate={{ transform: 'scale(1)' }}
        transition={{ ...t, duration: on ? 1.8 : 0 }}
      />
    </motion.div>
  )
}

/**
 * Фоновое видео черновика: без звука, по кругу, играет только пока его видно.
 * Пока видео не пошло — стоит постер, поэтому первый кадр есть сразу и на медленном интернете.
 * push = медленный наезд камеры, как в кино
 */
export function BgVideo({
  src,
  poster,
  className,
  style,
  position = 'center',
  delay = 0,
  push = true,
  reveal = 'fade',
}: {
  src: string
  poster: string
  className?: string
  style?: CSSProperties
  position?: string
  delay?: number
  push?: boolean
  reveal?: 'fade' | 'wipe' | 'none'
}) {
  const on = useAnimOn()
  const ref = useRef<HTMLVideoElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const visible = useInView(box, { margin: '120px' })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v || !on) return
    if (visible) v.play().catch(() => {})
    else v.pause()
  }, [visible, on])

  const t = useT(delay, reveal === 'wipe' ? 1.1 : 0.9)
  const initial = !on || reveal === 'none' ? false : reveal === 'wipe' ? { clipPath: 'inset(0% 0% 100% 0%)' } : { opacity: 0 }
  const animate = reveal === 'wipe' ? { clipPath: 'inset(0% 0% 0% 0%)' } : { opacity: 1 }

  return (
    <motion.div ref={box} className={`overflow-hidden bg-[#0b0b0c] ${className ?? ''}`} style={style} initial={initial} animate={animate} transition={t}>
      <motion.div
        className="h-full w-full"
        initial={on && push ? { transform: 'scale(1.12)' } : false}
        animate={{ transform: 'scale(1)' }}
        transition={on && push ? { delay, duration: 9, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
      >
        <img src={poster} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
        {on && (
          <video
            ref={ref}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            onPlaying={() => setReady(true)}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ objectPosition: position, opacity: ready ? 1 : 0 }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}

/**
 * Прокрутка внутри макета: после сборки показываем вторую секцию сайта и возвращаемся наверх.
 * Так видно, что черновик — это сайт с анимациями при прокрутке, а не картинка.
 * Шаблон рисует две секции высотой ровно `h` каждая
 */
export function ScrollDemo({ h, children }: { h: number; children: ReactNode }) {
  const on = useAnimOn()
  const depth = Math.round(h * 0.92)
  return (
    <motion.div
      className="scroll-demo"
      initial={{ transform: 'translateY(0px)' }}
      animate={
        on
          ? { transform: ['translateY(0px)', 'translateY(0px)', `translateY(-${depth}px)`, `translateY(-${depth}px)`, 'translateY(0px)'] }
          : { transform: 'translateY(0px)' }
      }
      // 0–3.3 с первый экран досматривается целиком, 3.3–4.4 едем вниз, до 5.8 смотрим вторую секцию, к 7.0 назад
      // Сглаживание на каждый участок отдельно: одна кривая на весь ролик съедала паузу на второй секции
      transition={on ? { duration: 7.0, times: [0, 0.47, 0.63, 0.83, 1], ease: ['linear', [0.65, 0, 0.35, 1], 'linear', [0.65, 0, 0.35, 1]] } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}

/** Время, когда вторая секция уже на экране: к нему шаблоны привязывают её собственные анимации */
export const SECOND_AT = 3.9
