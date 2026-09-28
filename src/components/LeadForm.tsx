import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { useId, useRef, useState, type FormEvent } from 'react'
import { tgLink } from '../data/content'
import { sendLead } from '../lib/lead'
import { T } from '../lib/typo'

type State = 'idle' | 'sending' | 'sent' | 'error'

/** Что не так с контактом ('' — можно отправлять). E-mail и ссылки пропускаем как есть */
function check(v: string) {
  if (!v) return 'Напишите телефон или ник в Telegram'
  if (/^\S+@\S+\.\S+$/.test(v) || /^(https?:\/\/|t\.me\/|vk\.com\/|wa\.me\/)\S{3,}/i.test(v)) return ''
  if (/^[\d\s()+\-.]+$/.test(v)) return v.replace(/\D/g, '').length < 10 ? 'Номер неполный: проверьте цифры' : ''
  return v.replace(/^@/, '').length < 5 ? 'Ник в Telegram — от 5 символов' : ''
}

/** Блок успеха забирает фокус: скринридер его прочтёт, а фокус не пропадёт вместе с формой */
const focusOnMount = (el: HTMLDivElement | null) => el?.focus({ preventScroll: true })

const base = import.meta.env.BASE_URL

/** Поле «телефон или ник» + кнопка. dark = на тёмном фоне */
/** stackedLg: кнопка под полем только на широком экране, где форма стоит в узкой колонке сцены */
export function LeadForm({ business, niche, source, dark, autoFocus, stackedLg }: { business?: string; niche?: string; source: string; dark?: boolean; autoFocus?: boolean; stackedLg?: boolean }) {
  const [contact, setContact] = useState('')
  const [state, setState] = useState<State>('idle')
  const [invalid, setInvalid] = useState('')
  const field = useRef<HTMLInputElement>(null)
  const errId = useId()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (state === 'sending') return
    const v = contact.trim()
    const why = check(v)
    setInvalid(why)
    if (why) {
      field.current?.focus()
      return
    }
    setState('sending')
    const ok = await sendLead({ contact: v, business, niche, source })
    setState(ok ? 'sent' : 'error')
    if (!ok) field.current?.focus()
  }

  const tg = tgLink(`Здравствуйте! Хочу сайт${business ? ` для «${business}»` : ''}. `)
  // Ошибка проверки или сети — одной строкой над согласием; согласие не прячем никогда
  const failed = Boolean(invalid) || state === 'error'
  const link = 'py-1 underline underline-offset-2'

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state === 'sent' ? (
        <motion.div
          key="ok"
          ref={focusOnMount}
          role="status"
          tabIndex={-1}
          initial={{ opacity: 0, transform: 'translateY(8px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          className={`flex items-start gap-3 rounded-2xl p-4 outline-none ${dark ? 'bg-white/10 text-white' : 'bg-cloud text-ink ring-1 ring-line'}`}
        >
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-go text-white">
            <Check size={14} strokeWidth={3} />
          </span>
          <span className="text-[15px] leading-snug"><T>Заявка у нас. Напишем в течение рабочего дня</T></span>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }} className="w-full">
          <div
            className={`flex flex-col gap-1.5 rounded-[14px] p-1.5 min-[400px]:flex-row min-[400px]:items-center ${stackedLg ? 'lg:flex-col lg:items-stretch' : ''} ${dark ? 'bg-white/10 ring-1 ring-white/15 focus-within:ring-white/40' : 'bg-white ring-1 ring-line has-[input:focus]:ring-[1.5px] has-[input:focus]:ring-ink-soft'}`}
          >
            <input
              ref={field}
              type="text"
              autoComplete="tel"
              enterKeyHint="send"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus={autoFocus}
              value={contact}
              onChange={(e) => {
                setContact(e.target.value)
                if (invalid) setInvalid('')
              }}
              placeholder="Телефон или @ник"
              aria-label="Телефон или ник в Telegram"
              aria-invalid={invalid ? true : undefined}
              aria-describedby={failed ? errId : undefined}
              className={`min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[16px] outline-none ${dark ? 'text-white placeholder:text-white/55' : 'text-ink placeholder:text-muted'}`}
            />
            <button
              type="submit"
              disabled={state === 'sending'}
              aria-label={state === 'sending' ? 'Отправляем' : undefined}
              className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[10px] px-4 text-[14px] font-medium transition active:scale-[0.97] ${dark ? 'bg-white text-ink hover:bg-white/90' : 'bg-ink text-white hover:bg-black'}`}
            >
              {state === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <>Отправить <ArrowRight size={15} /></>}
            </button>
          </div>
          <p id={errId} role="alert" className={failed ? `mt-2 text-[14px] leading-snug ${dark ? 'text-[#f0a37a]' : 'text-rust'}` : undefined}>
            {invalid ? (
              <T>{invalid}</T>
            ) : state === 'error' ? (
              <>
                Не отправилось.{' '}
                <a href={tg} target="_blank" rel="noopener" className="underline underline-offset-2">
                  <T>Напишите нам в Telegram</T>
                </a>
              </>
            ) : null}
          </p>
          <p className={`mt-2 text-[13px] leading-snug ${dark ? 'text-white/55' : 'text-muted'}`}>
            <T>Отправляя заявку, вы даёте</T>{' '}
            <a href={`${base}consent.html`} target="_blank" className={link}>
              <T>согласие на обработку персональных данных</T>
            </a>{' '}
            <T>и принимаете</T>{' '}
            <a href={`${base}privacy.html`} target="_blank" className={link}>
              политику
            </a>
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
