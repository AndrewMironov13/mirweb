import { channels } from '../data/content'

export interface Lead {
  contact: string
  business?: string
  niche?: string
  source: string
}

/**
 * Заявка уходит письмом через formsubmit.co. Сервер не нужен.
 * Первое письмо придёт с просьбой подтвердить адрес: пока не нажать, заявки не доходят
 */
export async function sendLead(lead: Lead): Promise<boolean> {
  try {
    const r = await fetch(channels.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `МирВеб: заявка${lead.business ? ` — ${lead.business}` : ''}`,
        _template: 'table',
        _captcha: 'false',
        'Контакт': lead.contact,
        'Бизнес': lead.business ?? '—',
        'Ниша': lead.niche ?? '—',
        'Откуда': lead.source,
      }),
    })
    return r.ok
  } catch {
    return false
  }
}
