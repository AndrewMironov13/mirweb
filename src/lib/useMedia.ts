import { useSyncExternalStore } from 'react'

/** true, если медиазапрос совпадает. Скрытое превью лучше не монтировать вовсе: иначе его анимации крутятся вхолостую */
export function useMedia(query: string, ssr = true) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => ssr,
  )
}
