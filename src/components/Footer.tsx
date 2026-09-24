import { channels, nav, tgLink, works } from '../data/content'
import { Logo } from './Logo'

export function Footer() {
  const col = 'text-[14px] text-white/55'
  const link = 'block py-1 text-[14px] text-white/85 transition-colors hover:text-white'
  return (
    <footer className="px-3 pb-3 pt-3">
      <div className="mx-auto max-w-[1416px] rounded-[28px] bg-night px-6 py-14 text-white sm:px-10 lg:px-[108px] lg:py-16">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Logo className="text-white" />
            <p className="mt-4 max-w-[260px] text-[14px] leading-[1.6] text-white/60">
              Делаем продающие сайты для малого бизнеса. Первый экран бесплатно, весь сайт за 5 дней
            </p>
            <p className="mt-6 text-[13px] text-white/35">© {new Date().getFullYear()} МирВеб</p>
          </div>
          <div>
            <p className={col}>Разделы</p>
            <div className="mt-3">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className={link}>
                  {n.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className={col}>Наши сайты</p>
            <div className="mt-3">
              {works.map((w) => (
                <a key={w.id} href={w.url} target="_blank" rel="noopener" className={link}>
                  {w.name}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className={col}>Связаться</p>
            <div className="mt-3">
              <a href={tgLink('Здравствуйте! ')} target="_blank" rel="noopener" className={link}>
                Telegram @{channels.telegram}
              </a>
              <a href={channels.max} target="_blank" rel="noopener" className={link}>
                Max
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
