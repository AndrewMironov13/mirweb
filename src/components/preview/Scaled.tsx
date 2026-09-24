import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Рисуем «сайт» в настоящем размере (1280 или 390 px) и ужимаем трансформацией
 * под ширину контейнера. Так превью выглядит как живая страница, а не как схема
 */
export function Scaled({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / width))
    ro.observe(el)
    setScale(el.clientWidth / width)
    return () => ro.disconnect()
  }, [width])

  return (
    <div ref={box} className="relative w-full overflow-hidden" style={{ height: scale ? height * scale : undefined, aspectRatio: scale ? undefined : `${width} / ${height}` }}>
      {scale > 0 && (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
