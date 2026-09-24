import { channels, tgLink } from '../data/content'

/** Знак Telegram — тот же, что на sport.caspol.ru */
export function TgIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.3 19 20.1c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.5.5-1 .5l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2L7.4 13.3l-4.5-1.4c-1-.3-1-1 .2-1.4l17.6-6.8c.8-.3 1.5.2 1.2 1.6Z" />
    </svg>
  )
}

/** У MAX нет общеизвестного знака — текстовый бейдж, как на CASPOL, а не выдуманный логотип */
export function MaxBadge() {
  return <b className="text-[10.5px] font-extrabold tracking-[0.02em]">MAX</b>
}

export const tgHref = (text = 'Здравствуйте! Хочу сайт. ') => tgLink(text)
export const maxHref = channels.max
