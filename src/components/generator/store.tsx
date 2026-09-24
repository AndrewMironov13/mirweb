import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEMO_SEQUENCE, NICHES, SPHERES, detectNiche, makeDraft, type Draft, type SphereId } from '../../data/niches'

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
  demo: boolean
  stopDemo: () => void
  generate: () => void
  random: () => void
  /** Для карточек ниже по странице: подставить пример, прокрутить наверх и собрать */
  runFromOutside: (text: string) => void
  setHeroVisible: (v: boolean) => void
}

const Ctx = createContext<Gen | null>(null)
export const useGen = () => useContext(Ctx)!

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function GeneratorProvider({ children }: { children: ReactNode }) {
  const [text, setTextRaw] = useState(DEMO_SEQUENCE[0])
  const [sphere, setSphere] = useState<SphereId | null>(null)
  const [draft, setDraft] = useState<Draft>(() => makeDraft(DEMO_SEQUENCE[0], null))
  const [buildKey, setBuildKey] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [took, setTook] = useState(0)
  const [demo, setDemo] = useState(true)
  const [heroVisible, setHeroVisible] = useState(true)
  const timers = useRef<number[]>([])
  const textRef = useRef(text)
  textRef.current = text
  const demoIdx = useRef(1)

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  const build = useCallback((t: string, s: SphereId | null) => {
    clearTimers()
    const d = makeDraft(t, s)
    setDraft(d)
    setBuildKey((k) => k + 1)
    setStatus('style')
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

  const stopDemo = useCallback(() => setDemo(false), [])

  const setText = useCallback((t: string) => {
    setDemo(false)
    setTextRaw(t)
  }, [])

  const pickSphere = useCallback(
    (s: SphereId) => {
      const next = sphere === s ? null : s
      setDemo(false)
      setSphere(next)
      // Поле пустое или в нём автодемо: берём пример этой сферы. Иначе пересобираем текст посетителя
      const own = !demo && text.trim()
      const t = own ? text : NICHES.find((n) => n.id === SPHERES.find((x) => x.id === s)!.fallback)!.sample
      setTextRaw(t)
      build(t, own ? next : s)
    },
    [sphere, demo, text, build],
  )

  const generate = useCallback(() => {
    setDemo(false)
    const t = text.trim() || DEMO_SEQUENCE[0]
    if (!text.trim()) setTextRaw(t)
    build(t, sphere)
  }, [text, sphere, build])

  const random = useCallback(() => {
    setDemo(false)
    const pool = NICHES.filter((n) => n.id !== draft.niche.id && n.id !== 'generic')
    const n = pool[Math.floor(Math.random() * pool.length)]
    setSphere(null)
    setTextRaw(n.sample)
    build(n.sample, null)
  }, [draft.niche.id, build])

  const runFromOutside = useCallback(
    (t: string) => {
      setDemo(false)
      setSphere(null)
      setTextRaw(t)
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' })
      window.setTimeout(() => build(t, null), 450)
    },
    [build],
  )

  // Автодемо: печатаем пример, собираем, держим, стираем, следующий
  useEffect(() => {
    if (!demo || !heroVisible) return
    let alive = true
    ;(async () => {
      await sleep(5200)
      // Стираем то, что уже стоит в поле, и идём по списку дальше
      const cur = textRef.current
      for (let c = cur.length; c >= 0 && alive; c--) {
        setTextRaw(cur.slice(0, c))
        await sleep(16)
      }
      while (alive) {
        const sample = DEMO_SEQUENCE[demoIdx.current % DEMO_SEQUENCE.length]
        for (let c = 1; c <= sample.length && alive; c++) {
          setTextRaw(sample.slice(0, c))
          await sleep(48 + Math.random() * 40)
        }
        if (!alive) break
        await sleep(350)
        if (!alive) break
        build(sample, null)
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
    }
  }, [demo, heroVisible, build])

  // Первый показ: собираем пример сразу при загрузке
  useEffect(() => {
    build(DEMO_SEQUENCE[0], null)
    return clearTimers
  }, [build])

  const shownSphere = useMemo(() => sphere ?? detectNiche(text)?.sphere ?? null, [sphere, text])

  const value: Gen = {
    text, setText, sphere, shownSphere, pickSphere, draft, buildKey, status, took, demo, stopDemo,
    generate, random, runFromOutside, setHeroVisible,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
