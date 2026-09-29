import { AnimatePresence, motion, useInView } from 'motion/react'
import { ArrowRight, Check, Loader2, Send } from 'lucide-react'
import { useRef, useState } from 'react'
import { tgLink } from '../../data/content'
import { LeadForm } from '../LeadForm'
import { BrowserFrame, PhoneFrame } from '../preview/Frames'
import { Scaled } from '../preview/Scaled'
import { DESKTOP, MOBILE, SitePreview } from '../preview/SitePreview'
import { useGen, type Status } from './store'
import { tplOf } from '../../data/niches'
import { useMedia } from '../../lib/useMedia'
import { SNAPSHOT, draftPoster } from '../../lib/snapshot'
import { VideoOk } from '../preview/anim'
import { T } from '../../lib/typo'

/** Фон сцены — крошечная (96 px) копия кадра ниши: браузер сам растягивает её мягко, без дорогого фильтра размытия */
const ambient = (d: { niche: { video?: string } }, tpl: string) => `${import.meta.env.BASE_URL}video/niche/${d.niche.video ?? tpl}-blur.webp`
/** Светлые фоны (клиника, маникюр, йога…): на узком экране подпись стоит прямо на них, а не на тёмной левой части градиента */
const LIGHT = new Set(['health', 'nails', 'beauty', 'yoga', 'edu', 'flat'])
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
/** Длинное имя не должно рваться посреди слова в узкой колонке: уменьшаем кегль по длине самого длинного слова и всей строки */
const titleSize = (name: string) => {
  const longest = Math.max(...name.split(/\s+/).map((w) => w.length))
  if (longest >= 13 || name.length > 22) return 'text-[32px] sm:text-[36px]'
  if (longest >= 10 || name.length > 14) return 'text-[38px] sm:text-[42px]'
  return 'text-[44px] sm:text-[52px]'
}

/** Сцена под полем ввода: браузер и телефон с «собранным» сайтом на размытом фоне ниши */
export function Stage() {
  const g = useGen()
  const d = g.draft
  const done = g.status === 'done'
  const [formFor, setFormFor] = useState<number | null>(null)
  const formOpen = formFor === g.buildKey
  const stage = useRef<HTMLDivElement>(null)
  const visible = useInView(stage)
  /**
   * Живые превью, пока видна хоть часть сцены: на низком экране из-под первого экрана выглядывает только телефон.
   * Ушла из вида — макет стоит без анимаций и видео, но не пропадает. Вернулись — сборка проиграется заново
   */
  const live = visible && !SNAPSHOT
  /** Первый черновик после пререндера: уже нарисован картинкой, поэтому без анимации сборки и без видео */
  const first = g.buildKey === 0
  /** Идёт сборка. idle — посетитель правит текст: это не сборка, прошлый черновик просто ждёт */
  const building = g.status !== 'done' && g.status !== 'idle' && !first
  const sm = useMedia('(min-width: 640px)')
  const lg = useMedia('(min-width: 1024px)')
  /** Видео ниш: на компьютере сразу, на телефоне и при экономии трафика — после первого действия посетителя */
  const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
  const videoOk = !g.demo || (lg && !saveData)
  const shown = d.quoted ? `«${d.name}»` : d.name
  const preview = (mobile?: boolean) =>
    live ? (
      <SitePreview key={`${g.buildKey}-live`} draft={d} mobile={mobile} animated={!first} />
    ) : first ? null : (
      <SitePreview key={`${g.buildKey}-still`} draft={d} mobile={mobile} animated={false} />
    )
  /**
   * Пример автодемо, кубика или сферы — не бизнес посетителя: в заявку и в Telegram его имя не уходит.
   * Своё имя — только если посетитель его написал, а не одни слова ниши («стоматология»)
   */
  const lead = {
    business: d.mine && d.ownName ? d.name : undefined,
    niche: d.mine ? d.niche.noun : undefined,
    source: d.mine
      ? d.ownName
        ? 'Генератор на первом экране'
        : `Генератор на первом экране, вписал «${d.name}»`
      : `Генератор, смотрел пример ${shown} (${d.niche.noun})`,
  }
  const tgText = !d.mine
    ? `Здравствуйте! Хочу сайт. Понравился пример: ${d.niche.noun}. `
    : d.ownName
      ? `Здравствуйте! Хочу сайт для «${d.name}» (${d.niche.noun}). `
      : `Здравствуйте! Хочу сайт: ${d.niche.noun}. `

  return (
    <div id="stage" className="relative mx-auto w-full max-w-[1200px] scroll-mt-24">
      <div ref={stage} data-dark className={`on-dark relative overflow-hidden rounded-[24px] bg-night lg:h-[640px] ${visible ? '' : 'paused'}`}>
        {/* Фон: фото ниши, сильно размытое. Даёт цвет и настроение, не спорит с превью */}
        <AnimatePresence initial={false}>
          <motion.img
            key={ambient(d, tplOf(d.niche))}
            src={ambient(d, tplOf(d.niche))}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover brightness-[.55] saturate-[1.25]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(20,19,18,.8)_0%,rgba(20,19,18,.45)_40%,rgba(20,19,18,.12)_100%)]" />
        {/* Уже 1024 px подпись стоит под превью во всю ширину, и правый светлый край фона приходится на текст: светлой нише — своя подложка */}
        <div
          aria-hidden
          className={`absolute inset-0 bg-[rgba(20,19,18,.42)] transition-opacity duration-1000 lg:hidden ${LIGHT.has(d.niche.video ?? tplOf(d.niche)) ? 'opacity-100' : 'opacity-0'}`}
        />

        <div className="relative flex flex-col gap-8 p-4 pt-6 sm:p-8 lg:block lg:h-full lg:p-0">
          <VideoOk.Provider value={videoOk}>
          {/* Превью: браузер (от планшета) и телефон. На 1024–1279 браузер ужимается, а не наезжает на подпись: сцена теперь видна с первого экрана.
              Лишнее прячем ещё и классом: пререндер снят на 1440, и до запуска JS телефон видел бы браузер, а потом сцена прыгала бы */}
          <div data-nosnippet="" className="hidden sm:block lg:absolute lg:left-[372px] lg:right-[64px] lg:top-10 xl:left-auto xl:right-[88px] xl:w-[720px]">
            {sm && (
              <BrowserFrame domain={d.domain} busy={building}>
                <Scaled width={DESKTOP.w} height={DESKTOP.h} cover={!live && first && <Poster />}>
                  {preview()}
                </Scaled>
              </BrowserFrame>
            )}
          </div>
          {(!sm || lg) && (
            <div data-nosnippet="" className="mx-auto w-[244px] sm:max-lg:hidden lg:absolute lg:bottom-6 lg:right-6 lg:mx-0 lg:w-[190px]">
              {/* На компьютере автодемо показывает ролик ниши в браузере. Телефон рядом качал бы тот же ролик ещё раз */}
              <VideoOk.Provider value={videoOk && !(lg && g.demo)}>
                <PhoneFrame>
                  <Scaled width={MOBILE.w} height={MOBILE.h} cover={!live && first && <Poster mobile />}>
                    {preview(true)}
                  </Scaled>
                </PhoneFrame>
              </VideoOk.Provider>
            </div>
          )}
          </VideoOk.Provider>

          {/* Подпись и заявка */}
          <div className="text-white lg:absolute lg:bottom-12 lg:left-12 lg:top-10 lg:flex lg:w-[292px] lg:flex-col">
            {/* Ход сборки живёт здесь: поле на первом экране компактное, а сцена видна сразу под ним */}
            {/* Пока посетитель просто правит текст (idle), сборки нет: точка не пульсирует, прошлый черновик готов */}
            <div className="inline-flex h-7 items-center gap-2 rounded-full bg-white/12 px-3 text-[12px] text-white/80 ring-1 ring-white/10">
              <span className={`h-1.5 w-1.5 rounded-full ${building ? 'animate-pulse bg-[#fbbf24]' : done ? 'bg-[#34d399]' : 'bg-white/40'}`} />
              {building ? (
                'Собираю черновик…'
              ) : (
                <span>
                  Черновик готов
                  {done && g.took > 0 && <span className="text-white/60"> · {String(g.took).replace('.', ',')} сек</span>}
                </span>
              )}
            </div>
            {/* Скринридеру — только черновик, который собрал сам посетитель. Автодемо каждые восемь секунд не зачитываем */}
            <p role="status" className="sr-only">
              {!g.demo && g.byVisitor && done ? `Черновик готов: ${shown}` : ''}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={g.buildKey}
                initial={{ opacity: 0, transform: 'translateY(12px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                exit={{ opacity: 0, transform: 'translateY(-8px)' }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mt-5 text-[14px] text-white/60">{cap(d.niche.noun)}</p>
                <p
                  lang="ru"
                  className={`display mt-1 leading-[1.04] [hyphens:auto] [overflow-wrap:break-word] ${titleSize(d.name)}`}
                >
                  {shown}
                </p>
              </motion.div>
            </AnimatePresence>

            {!formOpen && <BuildLog />}

            <div className="mt-6 lg:mt-auto">
              <AnimatePresence mode="wait" initial={false}>
                {formOpen ? (
                  <motion.div key="form" initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} exit={{ opacity: 0 }}>
                    {/* Клавиатура сама по себе не выезжает: автофокус только с мышью */}
                    <LeadForm dark stackedLg autoFocus={window.matchMedia('(hover: hover) and (pointer: fine)').matches} {...lead} />
                  </motion.div>
                ) : (
                  <motion.div key="btns" className="flex flex-col gap-2 sm:flex-row lg:flex-col" exit={{ opacity: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        g.stopDemo()
                        setFormFor(g.buildKey)
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-white px-5 text-[15px] font-medium text-ink transition hover:bg-white/90 active:scale-[0.98]"
                    >
                      Хочу такой сайт <ArrowRight size={17} />
                    </button>
                    <a
                      href={tgLink(tgText)}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] px-5 text-[15px] font-medium text-white ring-1 ring-white/25 transition hover:bg-white/10 active:scale-[0.98]"
                    >
                      <Send size={16} /> Обсудить в Telegram
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-4 max-w-[640px] text-center text-[13px] leading-[1.55] text-ink-soft">
        <T>Черновик собран из заготовок. Настоящий сайт делаем с нуля: свой дизайн, ваши фото и видео, анимации при прокрутке</T>
      </p>
    </div>
  )
}

/** Прозрачная точка: её <source> отдаёт там, где рамка скрыта, и браузер не качает кадр, который всё равно не покажет */
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * Кадр готового черновика «Глянец» (детейлинг) до запуска скриптов. Самая крупная картинка первого экрана,
 * поэтому грузится сразу и с высоким приоритетом: LCP фиксируется на ней, а не на поздних кадрах автодемо.
 * Пререндер снят на 1440 и содержит обе рамки: телефон не качает кадр браузера, планшет — кадр телефона
 */
function Poster({ mobile }: { mobile?: boolean }) {
  return (
    <picture>
      <source media={mobile ? '(min-width: 640px) and (max-width: 1023.98px)' : '(max-width: 639.98px)'} srcSet={BLANK} />
      <img
        src={draftPoster(mobile)}
        alt=""
        width={mobile ? MOBILE.w : DESKTOP.w}
        height={mobile ? MOBILE.h : DESKTOP.h}
        fetchPriority="high"
        className="absolute inset-0 block h-full w-full"
      />
    </picture>
  )
}

const ORDER: Status[] = ['style', 'headline', 'mobile', 'done']

/** Журнал сборки: пункты закрываются галочками по ходу. Только на широком экране, там есть место */
function BuildLog() {
  const g = useGen()
  const at = ORDER.indexOf(g.status)
  /** Черновик на сцене собран. idle — посетитель правит текст, прошлая сборка всё равно закончена */
  const fin = g.status === 'done' || g.status === 'idle'
  const rows = [
    `Стиль и фото: ${g.draft.niche.noun}`,
    'Заголовок по вашим услугам',
    'Кнопки записи и мессенджеры',
    'Мобильная версия',
  ]
  return (
    <ul className="mt-8 hidden space-y-2.5 text-[13.5px] lg:block">
      {rows.map((r, i) => {
        const done = fin || at > i
        const active = !fin && at === i
        return (
          <li key={i} className={`flex items-center gap-2.5 transition-colors duration-300 ${done || active ? 'text-white/85' : 'text-white/50'}`}>
            <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full transition-colors duration-300 ${done ? 'bg-[#34d399] text-[#0b0b0c]' : 'bg-white/10'}`}>
              {done ? <Check size={11} strokeWidth={3.2} /> : active ? <Loader2 size={11} className="animate-spin" /> : null}
            </span>
            <span className="truncate">{r}</span>
          </li>
        )
      })}
    </ul>
  )
}
