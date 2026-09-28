import { about, channels, nav, tgLink, works } from '../data/content'
import { T } from '../lib/typo'
import { Logo } from './Logo'

export function Footer() {
  const col = 'text-[14px] text-white/55'
  const link = 'block py-2 text-[15px] text-white/85 transition-colors hover:text-white'
  // Почта рвётся только перед @, а не посреди имени: на узкой колонке планшета она в строку не влезает
  const [user, domain] = channels.email.split('@')
  return (
    <footer className="px-3 pb-3 pt-3">
      <div className="on-dark mx-auto max-w-[1416px] rounded-[28px] bg-night px-6 py-14 text-white sm:px-10 lg:px-7 lg:py-16">
        {/* Сетка той же ширины, что содержимое секций (1200 px), чтобы логотип стоял на одной линии с заголовками */}
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Logo className="text-white" />
            <p className="mt-4 max-w-[260px] text-[14px] leading-[1.6] text-white/60">
              <T>Продающие сайты для малого бизнеса</T>
            </p>
            <p className="mt-6 text-[13px] text-white/55">© {new Date().getFullYear()} МирВеб, {about.name}</p>
            <a href={`${import.meta.env.BASE_URL}privacy.html`} className="mt-2 inline-block text-[13px] text-white/55 underline-offset-2 transition-colors hover:text-white hover:underline">
              Политика обработки персональных данных
            </a>
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
          <div className="col-span-2 md:col-span-1">
            <p className={col}>Связаться</p>
            <div className="mt-3">
              <a href={tgLink('Здравствуйте! ')} target="_blank" rel="noopener" className={link}>
                Telegram @{channels.telegram}
              </a>
              <a href={channels.max} target="_blank" rel="noopener" className={link}>
                Max
              </a>
              <a href={`mailto:${channels.email}`} className={`${link} [overflow-wrap:anywhere]`}>
                {user}
                <wbr />@{domain}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
