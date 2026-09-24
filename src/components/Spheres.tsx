import { ArrowRight } from 'lucide-react'
import { sphereCards } from '../data/content'
import { useGen } from './generator/store'
import { Reveal } from './Reveal'

export function Spheres() {
  const g = useGen()
  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-24 sm:px-6 lg:px-0 lg:pt-32">
      <Reveal>
        <h2 className="display text-[34px] text-ink sm:text-[40px]">Делаем для любого бизнеса</h2>
        <p className="mt-3 max-w-[560px] text-[16px] leading-[1.6] text-ink-soft">
          Нажмите на сферу, и первый экран соберётся на примере. Своей нет в списке? Просто впишите, чем занимаетесь
        </p>
      </Reveal>
      <Reveal y={16} className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {sphereCards.map((c) => (
          <div key={c.title}>
            <button
              type="button"
              onClick={() => g.runFromOutside(c.sample)}
              className="group flex w-full items-center justify-between gap-4 rounded-[22px] bg-cloud px-6 py-6 text-left transition-colors duration-300 hover:bg-cloud-2"
            >
              <span>
                <span className="block text-[17px] font-medium text-ink">{c.title}</span>
                <span className="mt-1 block text-[15px] text-ink-soft">{c.text}</span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud-2 text-ink-soft transition-[transform,background-color,color] duration-300 group-hover:translate-x-0.5 group-hover:bg-ink group-hover:text-white">
                <ArrowRight size={16} />
              </span>
            </button>
          </div>
        ))}
      </Reveal>
    </section>
  )
}
