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
import { Spheres } from './components/Spheres'
import { Works } from './components/Works'

export default function App() {
  return (
    <GeneratorProvider>
      <OrderProvider>
      <Nav />
      <main>
        <Hero />
        <Spheres />
        <Works />
        <Process />
        <Pricing />
        <About />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <FloatingAsk />
      </OrderProvider>
    </GeneratorProvider>
  )
}
