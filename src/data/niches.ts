/**
 * Данные генератора первого экрана. Никакого ИИ: посетитель пишет, чем занимается,
 * мы находим нишу по ключевым словам и подставляем заготовку.
 *
 * Новая ниша = одна запись в NICHES. Фото лежат в public/img/niche/<photo>.webp
 * (CC0 со StockSnap, авторы — в CREDITS.json рядом).
 */

export type SphereId =
  | 'auto' | 'beauty' | 'food' | 'repair' | 'production'
  | 'health' | 'sport' | 'edu' | 'services'

export type Layout = 'dark-left' | 'center' | 'light-split'

export interface Sphere {
  id: SphereId
  label: string
  /** Ниша по умолчанию, если выбрали сферу кнопкой, а в тексте ничего не узнали */
  fallback: string
}

export interface Niche {
  id: string
  sphere: SphereId
  /** Как назвать бизнес в подписи: «барбершоп», «студия маникюра» */
  noun: string
  /** Корни слов: ищем их в том, что ввёл посетитель */
  keys: string[]
  /** Три услуги — самые крупные слова первого экрана */
  services: [string, string, string]
  /** Боль клиента строкой под услугами */
  pain: string
  cta: string
  cta2: string
  facts: [string, string, string]
  photo: string
  layout: Layout
  accent: string
  /** Заголовок: гротеск или антиква */
  type: 'sans' | 'serif'
  /** Пример для кубика и автодемо */
  sample: string
}

export const SPHERES: Sphere[] = [
  { id: 'auto', label: 'Авто', fallback: 'detailing' },
  { id: 'beauty', label: 'Красота', fallback: 'nails' },
  { id: 'food', label: 'Еда', fallback: 'restaurant' },
  { id: 'repair', label: 'Ремонт', fallback: 'flat' },
  { id: 'production', label: 'Производство', fallback: 'factory' },
  { id: 'health', label: 'Здоровье', fallback: 'clinic' },
  { id: 'sport', label: 'Спорт', fallback: 'gym' },
  { id: 'edu', label: 'Обучение', fallback: 'school' },
  { id: 'services', label: 'Услуги', fallback: 'generic' },
]

export const NICHES: Niche[] = [
  // ── Авто
  {
    id: 'tint', sphere: 'auto', noun: 'тонировка и оклейка',
    keys: ['тонир', 'оклейк', 'плёнк', 'пленк', 'антиграв', 'бронепл', 'винил', 'автозапуск'],
    services: ['Тонировка.', 'Оклейка.', 'Бронеплёнка.'],
    pain: 'Салон без жары, кузов без сколов. Сделаем за день, пока вы на работе',
    cta: 'Рассчитать оклейку', cta2: 'Наши работы',
    facts: ['Свой бокс', 'Гарантия на плёнку', 'Запись онлайн'],
    photo: 'auto', layout: 'dark-left', accent: '#2dd4bf', type: 'sans',
    sample: 'Тонировка «Тень»',
  },
  {
    id: 'detailing', sphere: 'auto', noun: 'детейлинг',
    keys: ['детейл', 'полиров', 'керамик', 'химчист', 'автомо', 'мойк', 'авто', 'машин', 'кузов'],
    services: ['Полировка.', 'Керамика.', 'Химчистка.'],
    pain: 'Машина как из салона: кузов блестит, в салоне ни пятна, ни запаха',
    cta: 'Записаться на осмотр', cta2: 'Цены',
    facts: ['Фото до и после', 'Работаем без выходных', 'Запись онлайн'],
    photo: 'auto', layout: 'dark-left', accent: '#38bdf8', type: 'sans',
    sample: 'Детейлинг «Глянец»',
  },
  {
    id: 'autoservice', sphere: 'auto', noun: 'автосервис',
    keys: ['автосерв', 'сто ', 'шиномон', 'ремонт авто', 'ремонт машин', 'развал', 'диагност', 'масл'],
    services: ['Ремонт.', 'ТО.', 'Шиномонтаж.'],
    pain: 'Запись на время, без очереди и работ, о которых вы не просили',
    cta: 'Записаться на ремонт', cta2: 'Цены на работы',
    facts: ['Гарантия на работы', 'Запчасти в наличии', 'Ждать можно в кофейне'],
    photo: 'auto', layout: 'center', accent: '#f59e0b', type: 'sans',
    sample: 'Автосервис «Гараж 52»',
  },

  // ── Красота
  {
    id: 'barber', sphere: 'beauty', noun: 'барбершоп',
    keys: ['барбер', 'barber', 'мужск', 'бород', 'бритьё', 'бритье'],
    services: ['Стрижки.', 'Борода.', 'Бритьё.'],
    pain: 'Мужская стрижка за 40 минут. Записались онлайн, пришли, сели в кресло',
    cta: 'Записаться', cta2: 'Мастера',
    facts: ['Кофе и пиво за счёт заведения', 'Без очереди', 'Работаем до 22:00'],
    photo: 'barber', layout: 'dark-left', accent: '#f97316', type: 'serif',
    sample: 'Барбершоп «Борода»',
  },
  {
    id: 'nails', sphere: 'beauty', noun: 'студия маникюра',
    keys: ['маникюр', 'ногт', 'педикюр', 'nail', 'нейл', 'бров', 'ресниц', 'гель-лак', 'гель лак'],
    services: ['Маникюр.', 'Педикюр.', 'Брови.'],
    pain: 'Покрытие без сколов до следующей записи. Выберите мастера и время онлайн',
    cta: 'Записаться онлайн', cta2: 'Прайс',
    facts: ['Стерильные инструменты', 'Свободно сегодня', 'Уютно, как дома'],
    photo: 'beauty', layout: 'light-split', accent: '#db2777', type: 'serif',
    sample: 'Студия маникюра «Лак»',
  },
  {
    id: 'salon', sphere: 'beauty', noun: 'салон красоты',
    keys: ['салон', 'парикмах', 'окраш', 'волос', 'стилист', 'уклад', 'стрижк', 'красот'],
    services: ['Стрижки.', 'Окрашивание.', 'Укладки.'],
    pain: 'Цвет, который не придётся исправлять в другом салоне',
    cta: 'Записаться', cta2: 'Наши работы',
    facts: ['Мастера с опытом от 5 лет', 'Профессиональная косметика', 'Запись онлайн'],
    photo: 'beauty', layout: 'light-split', accent: '#a855f7', type: 'serif',
    sample: 'Салон красоты «Шёлк»',
  },
  {
    id: 'spa', sphere: 'beauty', noun: 'SPA и массаж',
    keys: ['массаж', 'спа', 'spa', 'обёртыв', 'обертыв', 'космет', 'чистк лица', 'уход за кож'],
    services: ['Массаж.', 'SPA.', 'Уход за лицом.'],
    pain: 'Спина не болит, голова отдыхает. Час, после которого снова есть силы',
    cta: 'Выбрать время', cta2: 'Сертификаты',
    facts: ['Подарочные сертификаты', 'Душ и чай после сеанса', 'Мастера с медобразованием'],
    photo: 'spa', layout: 'light-split', accent: '#b45309', type: 'serif',
    sample: 'SPA-студия «Облако»',
  },

  // ── Еда
  {
    id: 'coffee', sphere: 'food', noun: 'кофейня',
    keys: ['кофе', 'coffee', 'кофейн'],
    services: ['Кофе.', 'Завтраки.', 'Десерты.'],
    pain: 'Капучино навынос за три минуты и завтраки весь день',
    cta: 'Смотреть меню', cta2: 'Как добраться',
    facts: ['Зерно своей обжарки', 'Завтраки до 16:00', 'Можно с ноутбуком'],
    photo: 'cafe', layout: 'center', accent: '#d97706', type: 'serif',
    sample: 'Кофейня «Зерно»',
  },
  {
    id: 'bakery', sphere: 'food', noun: 'кондитерская',
    keys: ['кондит', 'торт', 'пекарн', 'выпеч', 'десерт', 'капкейк', 'хлеб'],
    services: ['Торты.', 'Десерты.', 'Выпечка.'],
    pain: 'Торт к празднику: эскиз и точная цена в тот же день',
    cta: 'Заказать торт', cta2: 'Каталог',
    facts: ['Натуральные сливки', 'Доставка к дате', 'Дегустация начинок'],
    photo: 'cafe', layout: 'light-split', accent: '#e11d48', type: 'serif',
    sample: 'Кондитерская «Безе»',
  },
  {
    id: 'cafe', sphere: 'food', noun: 'кафе',
    keys: ['кафе', 'бистро', 'пицц', 'шаурм', 'бургер', 'столов', 'пельмен', 'блин'],
    services: ['Обеды.', 'Завтраки.', 'Доставка.'],
    pain: 'Горячий обед за 10 минут и доставка по району без минималки',
    cta: 'Смотреть меню', cta2: 'Доставка',
    facts: ['Бизнес-ланч с 12 до 16', 'Готовим при вас', 'Доставка за 40 минут'],
    photo: 'food', layout: 'center', accent: '#f97316', type: 'sans',
    sample: 'Кафе «Уют»',
  },
  {
    id: 'restaurant', sphere: 'food', noun: 'ресторан',
    keys: ['ресторан', 'бар', 'банкетный зал', 'кухн', 'еда', 'доставк еды', 'суши', 'роллы'],
    services: ['Кухня.', 'Бар.', 'Доставка.'],
    pain: 'Стол на вечер в два касания, доставка горячей за 45 минут',
    cta: 'Забронировать стол', cta2: 'Меню',
    facts: ['Банкеты до 60 гостей', 'Живая музыка по пятницам', 'Детское меню'],
    photo: 'food', layout: 'center', accent: '#eab308', type: 'serif',
    sample: 'Ресторан «Печь»',
  },

  // ── Ремонт и стройка
  {
    id: 'windows', sphere: 'repair', noun: 'окна и балконы',
    keys: ['окн', 'окон', 'балкон', 'лоджи', 'остекл', 'пвх'],
    services: ['Окна.', 'Балконы.', 'Остекление.'],
    pain: 'Тепло дома и никаких сквозняков. Замер бесплатно, монтаж за один день',
    cta: 'Вызвать замерщика', cta2: 'Цены',
    facts: ['Замер бесплатно', 'Монтаж за день', 'Гарантия 5 лет'],
    photo: 'repair', layout: 'light-split', accent: '#0284c7', type: 'sans',
    sample: 'Окна «Тепло»',
  },
  {
    id: 'build', sphere: 'repair', noun: 'строительство',
    keys: ['строит', 'стройк', 'дом', 'бан', 'кровл', 'фундамент', 'каркас', 'коттедж', 'забор'],
    services: ['Дома.', 'Бани.', 'Кровля.'],
    pain: 'Дом по смете из договора, без доплат по ходу стройки',
    cta: 'Рассчитать смету', cta2: 'Готовые объекты',
    facts: ['Фиксированная смета', 'Фотоотчёт каждую неделю', 'Свои бригады'],
    photo: 'build', layout: 'center', accent: '#65a30d', type: 'sans',
    sample: 'СК «Прочный дом»',
  },
  {
    id: 'cleaning', sphere: 'repair', noun: 'клининг',
    keys: ['клининг', 'уборк', 'чистот', 'мойка окон'],
    services: ['Уборка.', 'Генеральная.', 'После ремонта.'],
    pain: 'Чисто с первого раза, а если нет, переделаем бесплатно',
    cta: 'Рассчитать уборку', cta2: 'Что входит',
    facts: ['Своя химия и техника', 'Приедем завтра', 'Оплата после приёмки'],
    photo: 'repair', layout: 'light-split', accent: '#0d9488', type: 'sans',
    sample: 'Клининг «Блеск»',
  },
  {
    id: 'flat', sphere: 'repair', noun: 'ремонт квартир',
    keys: ['ремонт', 'отделк', 'квартир', 'дизайн интер', 'интерьер', 'плитк', 'сантех', 'электрик', 'потолк', 'обои', 'ламинат', 'двер', 'штукатур'],
    services: ['Ремонт.', 'Отделка.', 'Дизайн.'],
    pain: 'Квартира под ключ со сметой, которая не растёт',
    cta: 'Рассчитать ремонт', cta2: 'Наши объекты',
    facts: ['Смета до начала работ', 'Сроки в договоре', 'Уборка за собой'],
    photo: 'repair', layout: 'light-split', accent: '#c2410c', type: 'serif',
    sample: 'Ремонт квартир «Дом Мастер»',
  },

  // ── Производство
  {
    id: 'furniture', sphere: 'production', noun: 'мебель на заказ',
    keys: ['мебел', 'кухни на заказ', 'шкаф', 'столяр', 'дерев'],
    services: ['Кухни.', 'Шкафы.', 'Мебель на заказ.'],
    pain: 'Точно по размерам вашей комнаты. Дизайн-проект до оплаты',
    cta: 'Рассчитать кухню', cta2: 'Каталог работ',
    facts: ['Своё производство', 'Замер бесплатно', 'Гарантия 2 года'],
    photo: 'production', layout: 'dark-left', accent: '#d4a373', type: 'serif',
    sample: 'Мебельная фабрика «Кедр»',
  },
  {
    id: 'metal', sphere: 'production', noun: 'металлоконструкции',
    keys: ['металл', 'свар', 'лестниц', 'ворот', 'ковк', 'навес', 'ангар'],
    services: ['Лестницы.', 'Ворота.', 'Металлоконструкции.'],
    pain: 'Изготовим по вашим чертежам и смонтируем под ключ',
    cta: 'Отправить чертёж', cta2: 'Наши объекты',
    facts: ['Свой цех 800 м²', 'Порошковая покраска', 'Доставка и монтаж'],
    photo: 'production', layout: 'dark-left', accent: '#f59e0b', type: 'sans',
    sample: 'Цех «Сталь-НН»',
  },
  {
    id: 'factory', sphere: 'production', noun: 'производство',
    keys: ['производ', 'завод', 'цех', 'опт', 'b2b', 'клей', 'материал', 'упаковк', 'дилер', 'поставк', 'фабрик'],
    services: ['Производство.', 'Опт.', 'Доставка.'],
    pain: 'Прайс для дилеров и отгрузка со склада в день заказа',
    cta: 'Получить прайс', cta2: 'Каталог',
    facts: ['Работаем с НДС', 'Склад в городе', 'Сертификаты на продукцию'],
    photo: 'production', layout: 'center', accent: '#38bdf8', type: 'sans',
    sample: 'Завод «Полимер»',
  },

  // ── Здоровье
  {
    id: 'dental', sphere: 'health', noun: 'стоматология',
    keys: ['стомат', 'зуб', 'имплант', 'брекет', 'ортодонт'],
    services: ['Лечение.', 'Имплантация.', 'Отбеливание.'],
    pain: 'Лечим без боли и объясняем каждую строчку в смете',
    cta: 'Записаться на приём', cta2: 'Врачи',
    facts: ['Консультация бесплатно', 'Рассрочка без переплат', 'Приём в выходные'],
    photo: 'health', layout: 'light-split', accent: '#0ea5e9', type: 'sans',
    sample: 'Стоматология «Улыбка»',
  },
  {
    id: 'clinic', sphere: 'health', noun: 'клиника',
    keys: ['клиник', 'врач', 'медиц', 'анализ', 'мед', 'узи', 'терапевт', 'психолог', 'ветеринар', 'ветклин'],
    services: ['Приём врачей.', 'Анализы.', 'Диагностика.'],
    pain: 'Запись без очереди и регистратуры, результаты в телефоне',
    cta: 'Записаться к врачу', cta2: 'Цены',
    facts: ['Приём в день обращения', 'Анализы за 24 часа', 'Лицензия Минздрава'],
    photo: 'health', layout: 'light-split', accent: '#059669', type: 'sans',
    sample: 'Клиника «Доктор рядом»',
  },

  // ── Спорт
  {
    id: 'yoga', sphere: 'sport', noun: 'студия йоги',
    keys: ['йог', 'пилатес', 'растяж', 'стретч', 'танц', 'медитац'],
    services: ['Йога.', 'Пилатес.', 'Растяжка.'],
    pain: 'Спина прямая, голова спокойная. Первое занятие для новичков',
    cta: 'Выбрать занятие', cta2: 'Расписание',
    facts: ['Группы до 10 человек', 'Коврики выдаём', 'Утро и вечер'],
    photo: 'yoga', layout: 'light-split', accent: '#16a34a', type: 'serif',
    sample: 'Студия йоги «Прана»',
  },
  {
    id: 'gym', sphere: 'sport', noun: 'фитнес-клуб',
    keys: ['фитнес', 'зал', 'трениров', 'кроссфит', 'бокс', 'единобор', 'спорт', 'тренер'],
    services: ['Тренажёрный зал.', 'Группы.', 'Персональные.'],
    pain: 'Программа под вашу цель с первой тренировки, а не «разберётесь сами»',
    cta: 'Пробная тренировка', cta2: 'Абонементы',
    facts: ['Открыты с 7 до 23', 'Тренер в зале всегда', 'Сауна после'],
    photo: 'fitness', layout: 'dark-left', accent: '#ef4444', type: 'sans',
    sample: 'Фитнес-клуб «Форма»',
  },

  // ── Обучение
  {
    id: 'school', sphere: 'edu', noun: 'учебный центр',
    keys: ['школ', 'курс', 'обучен', 'репетит', 'английск', 'язык', 'егэ', 'огэ', 'подготовк', 'детск', 'развива', 'учеб'],
    services: ['Курсы.', 'Репетиторы.', 'Подготовка к ЕГЭ.'],
    pain: 'Понятный план занятий и результат к экзамену, а не «походим и посмотрим»',
    cta: 'Пробный урок', cta2: 'Программы',
    facts: ['Группы до 6 человек', 'Онлайн и очно', 'Отчёт родителям'],
    photo: 'edu', layout: 'center', accent: '#e11d48', type: 'serif',
    sample: 'Школа английского «Level Up»',
  },

  // ── Услуги
  {
    id: 'lawyer', sphere: 'services', noun: 'юридические услуги',
    keys: ['юрист', 'юрид', 'адвокат', 'бухгалт', 'налог', 'банкрот', 'нотари'],
    services: ['Консультации.', 'Договоры.', 'Суды.'],
    pain: 'Разберём вашу ситуацию за одну встречу и скажем честно, есть ли шансы',
    cta: 'Задать вопрос юристу', cta2: 'Услуги и цены',
    facts: ['Первая консультация бесплатно', 'Фиксированная цена', 'Опыт 12 лет'],
    photo: 'other', layout: 'center', accent: '#ca8a04', type: 'serif',
    sample: 'Юридическое бюро «Право»',
  },
  {
    id: 'photo', sphere: 'services', noun: 'фотостудия',
    keys: ['фото', 'видеосъ', 'съёмк', 'съемк', 'свадеб', 'ведущ', 'праздник', 'декор', 'ивент', 'event'],
    services: ['Фотосессии.', 'Свадьбы.', 'Праздники.'],
    pain: 'Кадры, которые не стыдно распечатать. Готовые фото через неделю',
    cta: 'Забронировать дату', cta2: 'Портфолио',
    facts: ['Своя студия', 'Готовые фото за 7 дней', 'Ретушь включена'],
    photo: 'other', layout: 'light-split', accent: '#7c3aed', type: 'serif',
    sample: 'Фотостудия «Кадр»',
  },
  {
    id: 'transport', sphere: 'services', noun: 'грузоперевозки',
    keys: ['перевоз', 'грузо', 'переезд', 'грузчик', 'эвакуат', 'логист', 'доставк', 'такси', 'газел'],
    services: ['Перевозки.', 'Грузчики.', 'Переезды.'],
    pain: 'Машина через час, цена до выезда, никаких «ой, тут ещё этаж»',
    cta: 'Рассчитать перевозку', cta2: 'Тарифы',
    facts: ['Подача за час', 'Цена фиксируется заранее', 'Работаем круглосуточно'],
    photo: 'other', layout: 'center', accent: '#f97316', type: 'sans',
    sample: 'Грузоперевозки «Газель 24»',
  },
  {
    id: 'generic', sphere: 'services', noun: 'компания',
    keys: [],
    services: ['Услуги.', 'Цены.', 'Запись.'],
    pain: 'Всё о нас на одной странице и заявка в один клик',
    cta: 'Оставить заявку', cta2: 'Наши работы',
    facts: ['Работаем по договору', 'Отвечаем за 15 минут', 'Честные цены'],
    photo: 'other', layout: 'center', accent: '#6366f1', type: 'sans',
    sample: 'Компания «Вектор»',
  },
]

const byId = new Map(NICHES.map((n) => [n.id, n]))
export const nicheById = (id: string) => byId.get(id) ?? byId.get('generic')!

/** Находим нишу по тексту. Самое длинное совпадение побеждает: «ремонт авто» сильнее «ремонт» */
export function detectNiche(text: string): Niche | null {
  const t = ` ${text.toLowerCase().replace(/ё/g, 'е')} `
  let best: Niche | null = null
  let bestLen = 0
  for (const n of NICHES) {
    for (const k of n.keys) {
      const key = k.replace(/ё/g, 'е')
      if (key.length > bestLen && t.includes(key)) {
        best = n
        bestLen = key.length
      }
    }
  }
  return best
}

/** Имя бизнеса: то, что в кавычках. Иначе — текст до первой запятой или тире, не длиннее 24 знаков */
export function extractName(text: string): { name: string; quoted: boolean } {
  const q = text.match(/[«"“„]([^»"”“]{1,40})[»"”“]?/)
  let raw = (q ? q[1] : text.split(/[,;(]|\s[—–-]\s/)[0]).trim().replace(/\s+/g, ' ')
  if (!raw) return { name: '', quoted: false }
  if (raw.length > 24) {
    const cut = raw.slice(0, 24)
    raw = cut.slice(0, cut.lastIndexOf(' ') > 8 ? cut.lastIndexOf(' ') : 24).trim()
    // Не заканчиваем имя предлогом: «Продаём клей для» → «Продаём клей»
    raw = raw.replace(/\s+\S{1,3}$/u, '')
  }
  return { name: raw.charAt(0).toUpperCase() + raw.slice(1), quoted: Boolean(q) }
}

const TR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k',
  л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

/** «Борода» → boroda.ru, для адресной строки превью */
export function toDomain(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/…/g, '')
    .split('')
    .map((c) => TR[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .reduce((acc, w) => (acc && (acc + '-' + w).length > 22 ? acc : acc ? acc + '-' + w : w.slice(0, 22)), '')
  return (s || 'vash-biznes') + '.ru'
}

export interface Draft {
  name: string
  /** Имя пришло в кавычках: показываем «Борода». Иначе — как написали */
  quoted: boolean
  niche: Niche
  domain: string
  /** Подпись над заголовком: «барбершоп «Борода»», а если ниша уже в имени — просто имя */
  label: string
}

export function makeDraft(text: string, sphere: SphereId | null): Draft {
  const found = detectNiche(text)
  const niche =
    found && (!sphere || found.sphere === sphere)
      ? found
      : nicheById(SPHERES.find((s) => s.id === sphere)?.fallback ?? 'generic')
  const got = extractName(text)
  const name = got.name || niche.sample.replace(/^.*«|»$/g, '')
  const quoted = got.name ? got.quoted : true
  const stem = niche.noun.toLowerCase().slice(0, 5)
  const label = !quoted || name.toLowerCase().includes(stem) ? name : `${niche.noun} «${name}»`
  return { name, quoted, niche, domain: toDomain(name), label }
}

/** Сценарий автодемо: что печатаем в поле, пока посетитель не тронул его сам */
export const DEMO_SEQUENCE = [
  'Барбершоп «Борода»',
  'Студия маникюра «Лак»',
  'Детейлинг «Глянец»',
  'Кофейня «Зерно»',
  'Мебельная фабрика «Кедр»',
  'Стоматология «Улыбка»',
]
