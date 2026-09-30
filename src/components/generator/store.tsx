import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEMO_SEQUENCE, NICHES, SPHERES, detectNiche, makeDraft, type Draft, type SphereId } from '../../data/niches'
import { goal } from '../../lib/goal'
import { SNAPSHOT, isPre } from '../../lib/snapshot'
import { useMedia } from '../../lib/useMedia'

export type Status = 'idle' | 'style' | 'headline' | 'mobile' | 'done'

interface Gen {
  text: string
  setText: (t: string) => void
  sphere: SphereId | null
  /** Сфера, которую подсвечиваем: выбранная вручную или узнанная по тексту */
  shownSphere: SphereId | null
  pickSphere: (s: SphereId) => void
  draft: Draft
  buildKey: number
  status: Status
  /** Секунды, за которые «собрали» сайт: показываем в статусе */
  took: number
  /** Черновик собран по действию посетителя (ввод, сфера, кубик), а не автодемо: только о нём сообщаем скринридеру */
  byVisitor: boolean
  demo: boolean
  stopDemo: () => void
  generate: () => void
  random: () => void
  setHeroVisible: (v: boolean) => void
}

const Ctx = createContext<Gen | null>(null)
export const useGen = () => useContext(Ctx)!

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function GeneratorProvider({ children }: { children: ReactNode }) {
  /** Разметку отдал пререндер: первый черновик уже нарисован картинкой, собираем его без анимации и без видео */
  const [staticStart] = useState(() => SNAPSHOT || isPre())
  const [text, setTextRaw] = useState(DEMO_SEQUENCE[0])
  const [sphere, setSphere] = useState<SphereId | null>(null)
  const [draft, setDraft] = useState<Draft>(() => makeDraft(DEMO_SEQUENCE[0], null))
  const [buildKey, setBuildKey] = useState(0)
  const [status, setStatus] = useState<Status>(staticStart ? 'done' : 'idle')
  const [took, setTook] = useState(0)
  const [byVisitor, setByVisitor] = useState(false)
  /** Автодемо — это печать по буквам: при «уменьшить движение» не запускаем, стоит первый пример */
  const still = useMedia('(prefers-reduced-motion: reduce)', false)
  const [demo, setDemo] = useState(true)
  const [heroVisible, setHeroVisible] = useState(true)
  const timers = useRef<number[]>([])
  const textRef = useRef(text)
  textRef.current = text
  const demoRef = useRef(demo)
  demoRef.current = demo
  /** Текст, по которому собран текущий черновик: к нему возвращаем поле, если автодемо прервали на полуслове */
  const builtRef = useRef(DEMO_SEQUENCE[0])
  /** Пример, который автодемо печатает сейчас: «Показать» посреди печати собирает его целиком, а не обрывок */
  const demoTarget = useRef(DEMO_SEQUENCE[0])
  /**
   * В поле текст самого посетителя. Только тогда имя черновика можно отправить в заявке как его бизнес.
   * Автодемо, кубик, пример сферы и пустое поле — чужой пример
   */
  const ownText = useRef(false)
  const demoIdx = useRef(1)

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  /** auto — сборку запустило автодемо, а не посетитель */
  const build = useCallback((t: string, s: SphereId | null, auto = false) => {
    clearTimers()
    builtRef.current = t
    const d = makeDraft(t, s, ownText.current)
    // Новый черновик рисуется в переходе: чип и Enter откликаются сразу, а не после рендера двух макетов
    startTransition(() => {
      setDraft(d)
      setBuildKey((k) => k + 1)
      setStatus('style')
      setByVisitor(!auto)
    })
    // Черновик собрал сам посетитель, а не автодемо — цель в Метрике
    if (!auto) goal('draft_built')
    const total = 1.7 + Math.random() * 0.5
    timers.current.push(
      window.setTimeout(() => setStatus('headline'), 550),
      window.setTimeout(() => setStatus('mobile'), 1150),
      window.setTimeout(() => {
        setTook(Math.round(total * 10) / 10)
        setStatus('done')
      }, total * 1000),
    )
  }, [])

  const stopDemo = useCallback(() => {
    // Автодемо прервали посреди печати: в поле возвращаем имя того черновика, что на сцене, а не обрывок
    if (demoRef.current) setTextRaw(builtRef.current)
    setDemo(false)
  }, [])

  const setText = useCallback((t: string) => {
    ownText.current = true
    setDemo(false)
    setTextRaw(t)
    // Посетитель пишет своё — «Готово» от прошлого черновика уже не про его текст
    setStatus((st) => (st === 'done' ? 'idle' : st))
  }, [])

  const pickSphere = useCallback(
    (s: SphereId) => {
      const next = sphere === s ? null : s
      setDemo(false)
      setSphere(next)
      // В поле пусто или чужой пример (автодемо, кубик): берём пример этой сферы. Иначе пересобираем текст посетителя
      const own = ownText.current && text.trim()
      const t = own ? text : NICHES.find((n) => n.id === SPHERES.find((x) => x.id === s)!.fallback)!.sample
      if (!own) ownText.current = false
      setTextRaw(t)
      build(t, own ? next : s)
    },
    [sphere, text, build],
  )

  const generate = useCallback(() => {
    // Нажали посреди печати автодемо: собираем печатаемый пример целиком
    const t = demoRef.current ? demoTarget.current : text.trim() || DEMO_SEQUENCE[0]
    if (demoRef.current || !text.trim()) {
      ownText.current = false
      setTextRaw(t)
    }
    setDemo(false)
    build(t, sphere)
  }, [text, sphere, build])

  const random = useCallback(() => {
    ownText.current = false
    setDemo(false)
    const pool = NICHES.filter((n) => n.id !== draft.niche.id && n.id !== 'generic')
    const n = pool[Math.floor(Math.random() * pool.length)]
    setSphere(null)
    setTextRaw(n.sample)
    build(n.sample, null)
  }, [draft.niche.id, build])

  // Автодемо: печатаем пример, собираем, держим, стираем, следующий
  useEffect(() => {
    if (!demo || !heroVisible || SNAPSHOT || still) return
    let alive = true
    ;(async () => {
      // Статичный первый кадр ждёт меньше: иначе первые секунды превью выглядит картинкой
      await sleep(staticStart ? 2600 : 5200)
      // Стираем то, что уже стоит в поле, и идём по списку дальше
      const cur = textRef.current
      for (let c = cur.length; c >= 0 && alive; c--) {
        setTextRaw(cur.slice(0, c))
        await sleep(16)
      }
      while (alive) {
        const sample = DEMO_SEQUENCE[demoIdx.current % DEMO_SEQUENCE.length]
        demoTarget.current = sample
        for (let c = 1; c <= sample.length && alive; c++) {
          setTextRaw(sample.slice(0, c))
          await sleep(48 + Math.random() * 40)
        }
        if (!alive) break
        await sleep(350)
        if (!alive) break
        build(sample, null, true)
        await sleep(5600)
        for (let c = sample.length; c >= 0 && alive; c--) {
          setTextRaw(sample.slice(0, c))
          await sleep(16)
        }
        await sleep(250)
        demoIdx.current++
      }
    })()
    return () => {
      alive = false
      // Первый экран ушёл из вида посреди печати: не оставляем в поле обрывок вроде «Студия маник»
      if (demoRef.current) {
        setTextRaw(builtRef.current)
        demoTarget.current = builtRef.current
      }
    }
  }, [demo, heroVisible, build, staticStart, still])

  // Первый показ: собираем пример сразу при загрузке
  useEffect(() => {
    if (!staticStart) build(DEMO_SEQUENCE[0], null, true)
    return clearTimers
  }, [build, staticStart])

  const shownSphere = useMemo(() => sphere ?? detectNiche(text)?.sphere ?? null, [sphere, text])

  const value: Gen = {
    text, setText, sphere, shownSphere, pickSphere, draft, buildKey, status, took, byVisitor, demo, stopDemo,
    generate, random, setHeroVisible,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
