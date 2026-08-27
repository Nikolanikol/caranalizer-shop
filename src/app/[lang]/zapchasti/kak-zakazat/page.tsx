import React from 'react';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import {
  Building2,
  Camera,
  CreditCard,
  Landmark,
  MessageSquare,
  PackageCheck,
  QrCode,
  Ship,
} from 'lucide-react';
import { PageShell, Section } from '@/components/shop/page-shell';
import { isShopLocale, shopAlternates } from '@/lib/shop/urls';
import type { ShopLocale } from '@/lib/shop/terms';
import { SITE_URL } from '@/lib/site';

/**
 * Как устроен заказ запчасти: шаги выкупа, способы оплаты и частые вопросы.
 *
 * Раньше это была страница магазина «О нас» — вместе с блоком контактов и разметкой
 * Organization. И то и другое отсюда убрано: сайт один, контакты у него уже есть
 * на /contact, а вторая карточка организации на подстранице раздела только
 * растащила бы сигнал между двумя описаниями одной и той же компании.
 *
 * ЧЕТВЁРТОЕ МЕСТО СО СПОСОБАМИ ОПЛАТЫ: форма в корзине, `PAYMENT_LABELS`
 * в `api/checkout`, текст на `/zapchasti/dostavka-i-oplata` и блок `PAYMENTS` ниже.
 * Это одна и та же оферта — править все четыре.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const t = TEXT[locale];

  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: shopAlternates('/zapchasti/kak-zakazat', SITE_URL, locale),
  };
}

const STEP_ICONS = [MessageSquare, Camera, Ship, PackageCheck];
const PAYMENT_ICONS = [QrCode, Landmark, Building2, CreditCard];

export default async function HowToOrderPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const t = TEXT[locale];

  // FAQPage — разметка для поисковика: вопросы могут показаться прямо в выдаче.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <PageShell title={t.title} intro={t.intro}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Section title={t.writeTitle}>
        <p>{t.writeText}</p>
        <p>
          {t.writeContactsA}{' '}
          <Link href="/contact" className="text-cta hover:underline">
            {t.contactsLink}
          </Link>
          {t.writeContactsB}
        </p>
      </Section>

      <Section title={t.stepsTitle}>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
          {t.steps.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <li key={step.title} className="bg-base-darker border border-border-subtle rounded-lg p-5 space-y-3">
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded bg-base-darker border border-border-subtle flex items-center justify-center text-cta">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                    {t.step} {index + 1}
                  </span>
                </span>
                <span className="block text-sm font-bold text-text">{step.title}</span>
                <span className="block text-xs text-text-secondary leading-relaxed">{step.text}</span>
              </li>
            );
          })}
        </ol>
        <p>
          {t.stepsFooterA}{' '}
          <Link href="/zapchasti/dostavka-i-oplata" className="text-cta hover:underline">
            {t.deliveryLink}
          </Link>
          {t.stepsFooterB}
        </p>
      </Section>

      <Section title={t.paymentsTitle}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose">
          {t.payments.map((payment, index) => {
            const Icon = PAYMENT_ICONS[index];
            return (
              <div key={payment.title} className="bg-base-darker border border-border-subtle rounded-lg p-5 space-y-2">
                <Icon className="w-4 h-4 text-cta" />
                <span className="block text-sm font-bold text-text">{payment.title}</span>
                <span className="block text-xs text-text-secondary leading-relaxed">{payment.text}</span>
              </div>
            );
          })}
        </div>
        <p>{t.paymentsNote}</p>
      </Section>

      <Section title={t.faqTitle}>
        <dl className="space-y-4 not-prose">
          {t.faq.map((item) => (
            <div key={item.q} className="bg-base-darker border border-border-subtle rounded-lg p-5 space-y-2">
              <dt className="text-sm font-bold text-text">{item.q}</dt>
              <dd className="text-xs text-text-secondary leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/*
        Раздел «Реквизиты» снят до появления данных. Вернуть, когда будут наименование
        юрлица или ИП, ИНН, ОГРН(ИП) и адрес: для работы с юрлицами по безналу это
        обязательное условие, а для политики обработки данных — оператор, которого
        по закону надо назвать. Пока раздела нет, чем стоял бы с заглушкой на виду.
      */}
    </PageShell>
  );
}

const TEXT = {
  ru: {
    metaTitle: 'Как заказать запчасть из Кореи',
    metaDescription:
      'Как устроен заказ запчастей из Южной Кореи: заявка, сверка детали по VIN, выкуп на разборке и отправка. Способы оплаты и ответы на частые вопросы.',
    title: 'Как заказать запчасть из Кореи',
    intro:
      'Мы находимся в Южной Корее и выкупаем детали на местных авторазборках под конкретную заявку. Поэтому в каталоге каждая позиция в одном экземпляре и со своими фотографиями — мы не перепродаём чужой склад вслепую.',

    writeTitle: 'Что прислать, когда пишете',
    writeText:
      'В первом сообщении сразу присылайте марку, модель и год машины, VIN и по возможности фотографию старой детали с читаемой маркировкой. Нашли позицию на сайте — пришлите ссылку или OE-номер из карточки, так быстрее всего.',
    writeContactsA: 'Все способы связи — на странице',
    contactsLink: '«Контакты»',
    writeContactsB: '. Быстрее всего отвечаем в мессенджерах: номер корейский, и звонок туда международный.',

    stepsTitle: 'Как это работает',
    step: 'Шаг',
    steps: [
      {
        title: 'Оставляете заявку',
        text: 'Выбираете деталь по фотографиям и OE-номеру и отправляете заявку. Это не оплата — менеджер сначала подтверждает, что деталь на месте.',
      },
      {
        title: 'Сверяем деталь',
        text: 'Присылаем дополнительные фотографии и сверяем номер с вашей машиной по VIN. Не подходит — вы ничего не теряете.',
      },
      {
        title: 'Выкупаем и отправляем',
        text: 'Выкупаем деталь на разборке в Корее и отправляем вам — EMS или морем. Стоимость доставки менеджер считает по вашему адресу.',
      },
      {
        title: 'Получаете',
        text: 'Забираете в пункте выдачи или получаете по адресу. В карточке были фотографии именно той детали, которая приехала.',
      },
    ],
    stepsFooterA: 'Способы отправки, сроки и таможенные сборы — на странице',
    deliveryLink: '«Доставка и оплата»',
    stepsFooterB: '.',

    paymentsTitle: 'Способы оплаты',
    payments: [
      {
        title: 'QwikPay / Золотая Корона',
        text: 'Основной способ для физических лиц в России и СНГ. Реквизиты менеджер присылает после подтверждения наличия.',
      },
      {
        title: 'SWIFT-перевод',
        text: 'Международный банковский перевод — для оплаты из любой страны.',
      },
      {
        title: 'Инвойс на юрлицо',
        text: 'Безналичный расчёт по счёту — для организаций и ИП, с закрывающими документами.',
      },
      { title: 'PayPal', text: 'Для оплаты из-за пределов России.' },
    ],
    paymentsNote:
      'В заявке вы отмечаете удобный способ — это пожелание, а не оплата. Реквизиты менеджер присылает после того, как подтвердил наличие детали и посчитал доставку.',

    faqTitle: 'Частые вопросы',
    faq: [
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
        a: 'Она зависит от веса, габаритов, страны получателя и способа отправки. Мы не показываем предварительное число, потому что любая цифра до расчёта была бы обещанием, которого мы не давали. Менеджер называет её вместе с подтверждением наличия.',
      },
      {
        q: 'Куда вы отправляете?',
        a: 'В любую страну. Способ отправки, стоимость и ожидаемый срок менеджер называет по вашему адресу — вместе с подтверждением наличия и до того, как деталь выкуплена.',
      },
      {
        q: 'Когда и как платить?',
        a: 'После того как менеджер подтвердил наличие и назвал итоговую сумму. Оплату на сайте мы не принимаем и данные карты не запрашиваем — ни в форме заявки, ни в переписке.',
      },
      {
        q: 'А если деталь не подойдёт или приедет повреждённой?',
        a: 'Условия возврата и порядок действий при повреждении в пути описаны на отдельной странице «Гарантия и возврат».',
      },
    ],
  },

  en: {
    metaTitle: 'How to order a part from Korea',
    metaDescription:
      'How ordering parts from South Korea works: the request, checking the part against your VIN, buying it at the salvage yard and shipping worldwide. Payment methods and common questions.',
    title: 'How to order a part from Korea',
    intro:
      'We are based in South Korea and buy parts at local salvage yards against a specific request. That is why every item in the catalog exists once, with its own photos — we do not resell someone else’s warehouse sight unseen.',

    writeTitle: 'What to send when you write',
    writeText:
      'In your first message send the make, model and year of the car, the VIN, and if you can, a photo of the old part with the markings readable. If you found the item on the site, send the link or the OE number from its page — that is fastest.',
    writeContactsA: 'All the ways to reach us are on the',
    contactsLink: '«Contacts»',
    writeContactsB: ' page. Messengers get the fastest reply: the number is Korean, so a call is an international one.',

    stepsTitle: 'How it works',
    step: 'Step',
    steps: [
      {
        title: 'You place a request',
        text: 'You pick the part by its photos and OE number and send a request. This is not a payment — the manager first confirms the item is there.',
      },
      {
        title: 'We check the part',
        text: 'We send extra photos and check the number against your car by VIN. If it does not fit, you lose nothing.',
      },
      {
        title: 'We buy it and ship',
        text: 'We buy the part at the salvage yard in Korea and ship it to you — by air or by sea. The manager works out the shipping cost for your address.',
      },
      {
        title: 'You receive it',
        text: 'You collect it or have it delivered to your address. The photos on the item page were of the very part that arrived.',
      },
    ],
    stepsFooterA: 'Shipping methods, timing and customs duties are on the',
    deliveryLink: '«Shipping and payment»',
    stepsFooterB: ' page.',

    paymentsTitle: 'Payment methods',
    payments: [
      {
        title: 'QwikPay / Zolotaya Korona',
        text: 'Mainly for private buyers in Russia and the CIS. The manager sends the details once the item is confirmed.',
      },
      {
        title: 'SWIFT transfer',
        text: 'An international bank transfer — for payment from any country.',
      },
      {
        title: 'Invoice for a company',
        text: 'Bank transfer against an invoice — for companies, with the accompanying paperwork.',
      },
      { title: 'PayPal', text: 'For payment from anywhere outside Russia.' },
    ],
    paymentsNote:
      'In the request you mark the method that suits you — that is a preference, not a payment. The manager sends the payment details after confirming the item is there and working out the shipping.',

    faqTitle: 'Common questions',
    faq: [
      {
        q: 'Is this genuine or aftermarket?',
        a: 'Genuine parts pulled from cars at South Korean salvage yards. The few aftermarket items are marked on their page with an «Aftermarket, not genuine» badge — we do not call them genuine.',
      },
      {
        q: 'Are the parts new or used?',
        a: 'Used. The condition of each is given as a grade: A+ — no defects noted by the salvage yard, B — scratches, C — a crack or damaged mounting. All of it is on the item page before you buy, not after.',
      },
      {
        q: 'How do I know the part will fit my car?',
        a: 'By the photos and the OE number. Check the markings on your old part, the number of pins in the connector and the shape of the mounts. We do not promise an automatic VIN check: the manager confirms fitment before buying, and the final decision is yours.',
      },
      {
        q: 'Why are there so many photos and why are they all different?',
        a: 'Because they are photos of that specific part, not a manufacturer catalogue image. Every item exists once — what is in the photos is what arrives.',
      },
      {
        q: 'Why does the cart not show a shipping cost?',
        a: 'It depends on weight, dimensions, your country and the shipping method. We do not show a provisional figure, because any number given before the calculation would be a promise we never made. The manager gives it to you along with the confirmation that the item is there.',
      },
      {
        q: 'Where do you ship?',
        a: 'To any country. The shipping method, the cost and the expected timeline are given by the manager for your address — along with the confirmation that the item is there, and before the part is bought.',
      },
      {
        q: 'When and how do I pay?',
        a: 'After the manager has confirmed the item is there and given the final amount. We take no payment on the site and never ask for card details — not in the request form, not in correspondence.',
      },
      {
        q: 'What if the part does not fit or arrives damaged?',
        a: 'Return terms and what to do about damage in transit are described on a separate «Warranty and returns» page.',
      },
    ],
  },
} as const;
