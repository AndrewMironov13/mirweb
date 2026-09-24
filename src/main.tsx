import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Harness } from './Harness.tsx'

const root = document.getElementById('root')!
/** Разметку первого экрана уже отдал пререндер: вступительную анимацию пропускаем, чтобы не мигало */
;(window as unknown as { __PRE__: boolean }).__PRE__ = root.childElementCount > 0

createRoot(root).render(
  <StrictMode>
    {import.meta.env.DEV && new URLSearchParams(location.search).has('harness') ? <Harness /> : <App />}
  </StrictMode>,
)
