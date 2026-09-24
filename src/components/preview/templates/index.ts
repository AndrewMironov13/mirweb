import type { ComponentType } from 'react'
import type { Draft, TemplateId } from '../../../data/niches'

/** Шаблон черновика: две секции (первый экран + следующая), каждая ровно 760 px на десктопе и 800 px на телефоне */
export interface Template {
  Desktop: ComponentType<{ d: Draft }>
  Mobile: ComponentType<{ d: Draft }>
}

/**
 * Шаблоны подключаются сами: файл templates/<id>.tsx с `export default { Desktop, Mobile }`.
 * Нет файла — для этой сферы работает старая общая раскладка
 */
const mods = import.meta.glob<{ default: Template }>('./*.tsx', { eager: true })
export const TEMPLATES: Partial<Record<TemplateId, Template>> = Object.fromEntries(
  Object.entries(mods).map(([path, m]) => [path.replace(/^\.\/|\.tsx$/g, ''), m.default]),
)
