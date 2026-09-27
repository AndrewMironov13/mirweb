import { MotionConfig } from 'motion/react'
import { About } from './components/About'
import { Faq } from './components/Faq'
import { FinalCta } from './components/FinalCta'
import { FloatingAsk } from './components/FloatingAsk'
import { Footer } from './components/Footer'
import { GeneratorProvider } from './components/generator/store'
import { Hero } from './components/Hero'
import { Nav } from './components/Nav'
import { OrderProvider } from './components/Order'
import { Pricing } from './components/Pricing'
import { Process } from './components/Process'
import { Works } from './components/Works'
import { SNAPSHOT } from './lib/snapshot'

export default function App() {
  return (
    // Просили меньше движения в системе — motion гасит анимации x/y/scale, проявление остаётся.
    // Анимации через строку transform (Reveal, меню, плашка) переключают на одну opacity сами, через useReducedMotion
    <MotionConfig reducedMotion="user">
      <GeneratorProvider>
        <OrderProvider>
          <Nav />
          <main>
            <Hero />
            <Works />
            <Process />
            <Pricing />
            <About />
            <Faq />
            <FinalCta />
          </main>
          <Footer />
          {/* В снимок пререндера плашка не идёт: без JS невидимый слой внизу экрана съедал бы нажатия */}
          {!SNAPSHOT && <FloatingAsk />}
        </OrderProvider>
      </GeneratorProvider>
    </MotionConfig>
  )
}
