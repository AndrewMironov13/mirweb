import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { nav, tgLink } from '../data/content'
import { Logo } from './Logo'

export function Nav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 12))

  return (
    <header className={`sticky top-0 z-50 transition-[background-color,box-shadow] duration-300 ${scrolled ? 'bg-white/90 shadow-[0_1px_0_rgba(0,0,0,.06)] backdrop-blur-xl' : 'bg-white'}`}>
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-0">
        <a href="#top" aria-label="МирВеб — наверх" className="text-ink">
          <Logo />
        </a>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[15px] text-ink md:flex" aria-label="Разделы">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="relative py-1 transition-colors hover:text-black">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <a href={tgLink('Здравствуйте! ')} target="_blank" rel="noopener" className="hidden text-[15px] text-ink-soft transition-colors hover:text-ink sm:block">
            Telegram
          </a>
          <motion.a href="#top" whileTap={{ scale: 0.97 }} className="btn-dark h-9 px-3.5 text-[14px]">
            Собрать свой сайт
          </motion.a>
        </div>
      </div>
    </header>
  )
}
