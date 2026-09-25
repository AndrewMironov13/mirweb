import { useEffect, useState, type ComponentType } from 'react'
import type { Draft, TemplateId } from '../../../data/niches'
import barber from './barber'

/** Шаблон черновика: две секции (первый экран + следующая), каждая ровно 760 px на десктопе и 800 px на телефоне */
export interface Template {
  Desktop: ComponentType<{ d: Draft }>
  Mobile: ComponentType<{ d: Draft }>
}

/**
 * Шаблоны подключаются сами: файл templates/<id>.tsx с `export default { Desktop, Mobile }`.
 * Барбершоп в основном бандле — с него начинается автодемо. Остальные грузятся отдельными кусками
 * и подкачиваются в фоне после загрузки страницы, чтобы не тормозить первый экран
 */
const loaders = import.meta.glob<{ default: Template }>(['./*.tsx', '!./barber.tsx'])
const cache = new Map<string, Template>([['barber', barber]])
const pending = new Map<string, Promise<Template | undefined>>()

function load(id: string): Promise<Template | undefined> {
  if (cache.has(id)) return Promise.resolve(cache.get(id))
  const loader = loaders[`./${id}.tsx`]
  if (!loader) return Promise.resolve(undefined)
  if (!pending.has(id)) pending.set(id, loader().then((m) => (cache.set(id, m.default), m.default)))
  return pending.get(id)!
}

/** Порядок фоновой подкачки: как в автодемо, потом остальные */
const ORDER = ['beauty', 'auto', 'food', 'industry', 'health', 'build', 'sport', 'edu', 'services']
let preloading = false
export function preloadTemplates() {
  if (preloading || typeof window === 'undefined') return
  preloading = true
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
  const idle = (cb: () => void) => (w.requestIdleCallback ? w.requestIdleCallback(cb, { timeout: 2500 }) : setTimeout(cb, 1200))
  idle(() => ORDER.reduce((p, id) => p.then(() => load(id)).then(() => undefined), Promise.resolve()))
}

/** Шаблон сферы; пока грузится — undefined (на это время показываем тёмную заглушку) */
export function useTemplate(id: TemplateId): Template | undefined {
  const [, force] = useState(0)
  const t = cache.get(id)
  useEffect(() => {
    if (!cache.has(id)) load(id).then(() => force((n) => n + 1))
  }, [id])
  return t
}

/** Есть ли для сферы шаблон вообще (без загрузки) */
export const hasTemplate = (id: TemplateId) => cache.has(id) || Boolean(loaders[`./${id}.tsx`])
