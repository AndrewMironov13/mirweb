import { GeneratorBox } from './generator/GeneratorBox'
import { LeadForm } from './LeadForm'
import { Reveal } from './Reveal'

export function FinalCta() {
  return (
    <section className="px-3 pt-24 lg:pt-32">
      <div className="mx-auto max-w-[1416px] rounded-[28px] bg-gradient-to-b from-white to-cloud px-4 pb-20 pt-16 sm:px-6 lg:pb-28 lg:pt-24">
        <Reveal className="text-center">
          <h2 className="display mx-auto max-w-[820px] text-[40px] text-ink sm:text-[64px]">
            Посмотрите свой сайт <span className="accent-word">до&nbsp;оплаты</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] text-[17px] leading-[1.6] text-ink-soft">
            Впишите название и чем занимаетесь. Черновик соберётся за пару секунд, настоящий сайт — за 5 дней
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          <GeneratorBox id="gen-final" toStage />
        </Reveal>
        <Reveal delay={0.15} className="mx-auto mt-10 max-w-[440px]">
          <p className="mb-3 text-center text-[14px] text-ink-soft">Или оставьте контакт, напишем сами</p>
          <LeadForm source="Форма внизу страницы" />
        </Reveal>
      </div>
    </section>
  )
}
