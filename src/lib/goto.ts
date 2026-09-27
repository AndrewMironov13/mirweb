/** Плавная прокрутка, если посетитель не просил убрать анимации */
export const smooth = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

/**
 * Перейти к полю генератора на первом экране. Фокус ставим синхронно, прямо в обработчике нажатия:
 * иначе iOS не откроет клавиатуру (фокус из setTimeout она игнорирует). Прокрутку делаем сами
 */
export function goToGenerator() {
  const field = document.getElementById('gen-hero')
  field?.focus({ preventScroll: true })
  document.getElementById('top')?.scrollIntoView({ behavior: smooth(), block: 'start' })
}
