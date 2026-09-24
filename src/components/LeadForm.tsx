import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { tgLink } from '../data/content'
import { sendLead } from '../lib/lead'

type State = 'idle' | 'sending' | 'sent' | 'error'

/** Поле «телефон или ник» + кнопка. dark = на тёмном фоне */
/** stackedLg: кнопка под полем только на широком экране, где форма стоит в узкой колонке сцены */
export function LeadForm({ business, niche, source, dark, autoFocus, stackedLg }: { business?: string; niche?: string; source: string; dark?: boolean; autoFocus?: boolean; stackedLg?: boolean }) {
  const [contact, setContact] = useState('')
  const [state, setState] = useState<State>('idle')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (contact.trim().length < 5 || state === 'sending') return
    setState('sending')
    const ok = await sendLead({ contact: contact.trim(), business, niche, source })
    setState(ok ? 'sent' : 'error')
  }

  const tg = tgLink(`Здравствуйте! Хочу сайт${business ? ` для «${business}»` : ''}. `)

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state === 'sent' ? (
        <motion.div
          key="ok"
          initial={{ opacity: 0, transform: 'translateY(8px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          className={`flex items-start gap-3 rounded-2xl p-4 ${dark ? 'bg-white/10 text-white' : 'bg-cloud text-ink'}`}
        >
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-go text-white">
            <Check size={14} strokeWidth={3} />
          </span>
          <span className="text-[15px] leading-snug">
            Заявка у нас. Напишем в течение рабочего дня и договоримся о созвоне
          </span>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }} className="w-full">
          <div
            className={`flex flex-col gap-1.5 rounded-[14px] p-1.5 min-[400px]:flex-row min-[400px]:items-center ${stackedLg ? 'lg:flex-col lg:items-stretch' : ''} ${dark ? 'bg-white/10 ring-1 ring-white/15 focus-within:ring-white/40' : 'bg-white ring-1 ring-line focus-within:ring-ink/30'}`}
          >
            <input
              type="text"
              inputMode="tel"
              autoComplete="tel"
              autoFocus={autoFocus}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Телефон или @ник"
              aria-label="Телефон или ник в Telegram"
              className={`min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[16px] outline-none ${dark ? 'text-white placeholder:text-white/45' : 'text-ink placeholder:text-muted'}`}
            />
            <button
              type="submit"
              disabled={state === 'sending'}
              className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[10px] px-4 text-[14px] font-medium transition active:scale-[0.97] ${dark ? 'bg-white text-ink hover:bg-white/90' : 'bg-ink text-white hover:bg-black'}`}
            >
              {state === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <>Отправить <ArrowRight size={15} /></>}
            </button>
          </div>
          <p className={`mt-2 text-[12px] leading-snug ${dark ? 'text-white/45' : 'text-muted'}`}>
            {state === 'error' ? (
              <>
                Не отправилось.{' '}
                <a href={tg} target="_blank" rel="noopener" className="underline underline-offset-2">
                  Напишите нам в Telegram
                </a>
              </>
            ) : (
              'Нажимая «Отправить», вы соглашаетесь на обработку контактных данных'
            )}
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
