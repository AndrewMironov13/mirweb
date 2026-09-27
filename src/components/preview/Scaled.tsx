import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Рисуем «сайт» в настоящем размере (1280 или 390 px) и ужимаем трансформацией
 * под ширину контейнера. Так превью выглядит как живая страница, а не как схема.
 * Высота — через aspect-ratio, а не пикселями: пререндер снят на 1440, и на телефоне
 * рамка не должна дорастать, когда стартует React.
 * cover — картинка на всю рамку без масштаба (кадр черновика до запуска скриптов)
 */
export function Scaled({ width, height, children, cover }: { width: number; height: number; children?: ReactNode; cover?: ReactNode }) {
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
    <div ref={box} className="relative w-full overflow-hidden" style={{ aspectRatio: `${width} / ${height}` }}>
      {cover}
      {scale > 0 && children && (
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
