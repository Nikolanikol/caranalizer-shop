import React from 'react';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import {
  Building2,
  Camera,
  CreditCard,
  MessageSquare,
  PackageCheck,
  QrCode,
  Ship,
} from 'lucide-react';
import { PageShell, Section, Todo } from '@/components/shop/page-shell';
import { shopUrl } from '@/lib/shop/urls';
import { SITE_URL } from '@/lib/site';

/**
 * Как устроен заказ запчасти: шаги выкупа, способы оплаты и частые вопросы.
 *
 * Раньше это была страница магазина «О нас» — вместе с блоком контактов и разметкой
 * Organization. И то и другое отсюда убрано: сайт один, контакты у него уже есть
 * на /contact, а вторая карточка организации на подстранице раздела только
 * растащила бы сигнал между двумя описаниями одной и той же компании.
 */
export const metadata: Metadata = {
  title: 'Как заказать запчасть из Кореи',
  description:
    'Как устроен заказ запчастей из Южной Кореи: заявка, сверка детали по VIN, выкуп на разборке и отправка. Способы оплаты и ответы на частые вопросы.',
  alternates: { canonical: shopUrl('/zapchasti/kak-zakazat', SITE_URL) },
};

const STEPS = [
  {
    icon: MessageSquare,
    title: 'Оставляете заявку',
    text: 'Выбираете деталь по фотографиям и OE-номеру и отправляете заявку. Это не оплата — менеджер сначала подтверждает, что деталь на месте.',
  },
  {
    icon: Camera,
    title: 'Сверяем деталь',
    text: 'Присылаем дополнительные фотографии и сверяем номер с вашей машиной по VIN. Не подходит — вы ничего не теряете.',
  },
  {
    icon: Ship,
    title: 'Выкупаем и отправляем',
    text: 'Выкупаем деталь на разборке в Корее и отправляем в Россию — EMS или морем. Стоимость доставки менеджер считает по вашему городу.',
  },
  {
    icon: PackageCheck,
    title: 'Получаете',
    text: 'Забираете в пункте выдачи или получаете по адресу. В карточке были фотографии именно той детали, которая приехала.',
  },
];

// Четвёртое место с теми же способами: форма в корзине, PAYMENT_LABELS в api/checkout,
// текст на /zapchasti/dostavka-i-oplata и этот блок. Править все четыре.
const PAYMENTS = [
  {
    icon: QrCode,
    title: 'QwikPay / Золотая Корона',
    text: 'Основной способ для физических лиц. Реквизиты менеджер присылает после подтверждения наличия.',
  },
  {
    icon: Building2,
    title: 'Инвойс на юрлицо',
    text: 'Безналичный расчёт по счёту — для организаций и ИП, с закрывающими документами.',
  },
  { icon: CreditCard, title: 'PayPal', text: 'Для оплаты из-за пределов России.' },
];

/** Вопросы, ответы на которые мы действительно знаем. Выдуманных сроков и гарантий здесь нет. */
const FAQ = [
  {
    q: 'Это оригинал или аналог?',
    a: 'Оригинальные детали, снятые с автомобилей на авторазборках Южной Кореи. Немногочисленные позиции неоригинального производства помечены в карточке плашкой «Аналог, не оригинал» — оригиналом мы их не называем.',
  },
  {
    q: 'Детали новые или бывшие в употреблении?',
    a: 'Бывшие в употреблении. Состояние каждой указано грейдом: A+ — дефектов у разборки не отмечено, B — есть царапины, C — трещина или повреждение крепления. Всё это написано в карточке до покупки, а не после.',
  },
  {
    q: 'Как понять, что деталь подойдёт моей машине?',
    a: 'По фотографиям и OE-номеру. Сверьте маркировку на своей старой детали, число контактов в разъёме и форму крепления. Автоматической проверки по VIN мы не обещаем: точную применимость подтверждает менеджер до выкупа, а окончательное решение принимаете вы.',
  },
  {
    q: 'Почему фотографий так много и они разные?',
    a: 'Потому что это фотографии конкретной детали, а не изображение из каталога производителя. Каждая позиция существует в одном экземпляре — то, что на снимках, к вам и приедет.',
  },
  {
    q: 'Почему в корзине не видно стоимости доставки?',
    a: 'Она зависит от веса, габаритов и способа отправки. Мы не показываем предварительное число, потому что любая цифра до расчёта была бы обещанием, которого мы не давали. Менеджер называет её вместе с подтверждением наличия.',
  },
  {
    q: 'Когда и как платить?',
    a: 'После того как менеджер подтвердил наличие и назвал итоговую сумму. Оплату на сайте мы не принимаем и данные карты не запрашиваем — ни в форме заявки, ни в переписке.',
  },
  {
    q: 'А если деталь не подойдёт или приедет повреждённой?',
    a: 'Условия возврата и порядок действий при повреждении в пути описаны на отдельной странице «Гарантия и возврат».',
  },
];

export default function HowToOrderPage() {
  // FAQPage — разметка для поисковика: вопросы могут показаться прямо в выдаче.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <PageShell
      title="Как заказать запчасть из Кореи"
      intro="Мы находимся в Южной Корее и выкупаем детали на местных авторазборках под конкретную заявку. Поэтому в каталоге каждая позиция в одном экземпляре и со своими фотографиями — мы не перепродаём чужой склад вслепую."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Section title="Что прислать, когда пишете">
        <p>
          В первом сообщении сразу присылайте марку, модель и год машины, VIN и по возможности фотографию
          старой детали с читаемой маркировкой. Нашли позицию на сайте — пришлите ссылку или OE-номер
          из карточки, так быстрее всего.
        </p>
        <p>
          Все способы связи — на странице{' '}
          <Link href="/contact" className="text-cta hover:underline">
            «Контакты»
          </Link>
          . Быстрее всего отвечаем в мессенджерах: номер корейский, и звонок из России туда международный.
        </p>
      </Section>

      <Section title="Как это работает">
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="bg-base-darker border border-border-subtle rounded-lg p-5 space-y-3">
              <span className="flex items-center gap-3">
                <span className="w-9 h-9 rounded bg-base-darker border border-border-subtle flex items-center justify-center text-cta">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                  Шаг {index + 1}
                </span>
              </span>
              <span className="block text-sm font-bold text-text">{title}</span>
              <span className="block text-xs text-text-secondary leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
        <p>
          Сроки отправки и подробности по EMS и морской доставке — на странице{' '}
          <Link href="/zapchasti/dostavka-i-oplata" className="text-cta hover:underline">
            «Доставка и оплата»
          </Link>
          .
        </p>
      </Section>

      <Section title="Способы оплаты">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose">
          {PAYMENTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-base-darker border border-border-subtle rounded-lg p-5 space-y-2">
              <Icon className="w-4 h-4 text-cta" />
              <span className="block text-sm font-bold text-text">{title}</span>
              <span className="block text-xs text-text-secondary leading-relaxed">{text}</span>
            </div>
          ))}
        </div>
        <p>
          В заявке вы отмечаете удобный способ — это пожелание, а не оплата. Реквизиты менеджер присылает
          после того, как подтвердил наличие детали и посчитал доставку.
        </p>
      </Section>

      <Section title="Частые вопросы">
        <dl className="space-y-4 not-prose">
          {FAQ.map((item) => (
            <div key={item.q} className="bg-base-darker border border-border-subtle rounded-lg p-5 space-y-2">
              <dt className="text-sm font-bold text-text">{item.q}</dt>
              <dd className="text-xs text-text-secondary leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Реквизиты">
        <Todo>
          Нужны данные юридического лица или ИП: наименование, ИНН, ОГРН(ИП) и адрес. Для покупателя это
          сигнал доверия, для работы с юрлицами по безналичному расчёту — обязательное условие,
          а для политики обработки данных — оператор, которого по закону надо назвать.
        </Todo>
      </Section>
    </PageShell>
  );
}
