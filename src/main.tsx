import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Harness } from './Harness.tsx'
import { goal } from './lib/goal'

// Нажатия на Telegram и Max — цели в Метрике. Одним слушателем на все ссылки: кнопок мессенджеров на сайте много
document.addEventListener('click', (e) => {
  const href = (e.target as Element | null)?.closest?.('a')?.href ?? ''
  if (href.startsWith('https://t.me/')) goal('tg_click')
  else if (href.startsWith('https://max.ru/')) goal('max_click')
})

const root = document.getElementById('root')!
/** Разметку первого экрана уже отдал пререндер: вступительную анимацию пропускаем, чтобы не мигало */
;(window as unknown as { __PRE__: boolean }).__PRE__ = root.childElementCount > 0

createRoot(root).render(
  <StrictMode>
    {import.meta.env.DEV && new URLSearchParams(location.search).has('harness') ? <Harness /> : <App />}
  </StrictMode>,
)
