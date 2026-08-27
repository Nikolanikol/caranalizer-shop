import React from 'react';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { PageShell, Section } from '@/components/shop/page-shell';
import { RUSSIAN_CITIES } from '@/lib/shop/delivery';
import { isShopLocale, shopAlternates } from '@/lib/shop/urls';
import type { ShopLocale } from '@/lib/shop/terms';
import { SITE_URL } from '@/lib/site';

/**
 * ДОПОЛНИТЬ ОБЯЗАТЕЛЬНО. Условия — со слов владельца, первая версия. Не хватает:
 *
 * - от какого веса и объёма море выгоднее авиа (сейчас сказано «для крупного и сборных»
 *   качественно, без порога в килограммах);
 * - лимит беспошлинного ввоза и с какой суммы возникает пошлина — по РФ и по другим
 *   странам; сейчас сказано только, что пошлины платит покупатель;
 * - реквизиты для инвойса юрлицам — они же нужны на странице «Как заказать».
 *
 * ПРО СРОКИ. Таблица по городам осталась только в русской версии: это оценка по EMS
 * для РФ, и данные под неё у нас есть. По остальным странам таких оценок нет, поэтому
 * в английской версии срок называет менеджер по конкретной отправке — так решено
 * 28.08.2026. Выдуманная таблица «по миру» была бы обещанием, которого никто не давал.
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
    alternates: shopAlternates('/zapchasti/dostavka-i-oplata', SITE_URL, locale),
  };
}

export default async function DeliveryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const t = TEXT[locale];

  return (
    <PageShell title={t.title} intro={t.intro}>
      <Section title={t.requestFirstTitle}>
        {t.requestFirst.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </Section>

      <Section title={t.shippingTitle}>
        <p>
          <strong className="text-text-secondary">{t.air}</strong> {t.airText}
        </p>
        <p>
          <strong className="text-text-secondary">{t.sea}</strong> {t.seaText}
        </p>
        <p>
          <strong className="text-text-secondary">{t.duties}</strong> {t.dutiesText}
        </p>
      </Section>

      <Section title={t.timingTitle}>
        <p>{t.timingText}</p>

        {/* Таблица только для РФ: по другим странам оценок у нас нет, и придумывать их нельзя. */}
        {locale === 'ru' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border-subtle rounded">
              <thead>
                <tr className="bg-base-darker text-text-secondary text-left">
                  <th className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px]">Город</th>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px]">Срок</th>
                </tr>
              </thead>
              <tbody>
                {RUSSIAN_CITIES.map((city) => (
                  <tr key={city.name} className="border-t border-border-subtle">
                    <td className="px-4 py-2.5 text-text-secondary">{city.name}</td>
                    <td className="px-4 py-2.5 text-text-secondary tabular-nums">{city.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title={t.paymentTitle}>
        <p>
          <strong className="text-text-secondary">{t.payQwikpay}</strong> {t.payQwikpayText}
        </p>
        <p>
          <strong className="text-text-secondary">{t.paySwift}</strong> {t.paySwiftText}
        </p>
        <p>
          <strong className="text-text-secondary">{t.payInvoice}</strong> {t.payInvoiceText}
        </p>
        <p>
          <strong className="text-text-secondary">PayPal.</strong> {t.payPaypalText}
        </p>
        <p>{t.paymentNote}</p>
        <p>{t.paymentWarning}</p>
      </Section>

      <Section title={t.returnsTitle}>
        <p>
          {t.returnsBefore}{' '}
          <Link href="/zapchasti/garantiya-i-vozvrat" className="text-cta hover:underline">
            {t.returnsLink}
          </Link>
          {t.returnsAfter}
        </p>
      </Section>
    </PageShell>
  );
}

const TEXT = {
  ru: {
    metaTitle: 'Доставка и оплата запчастей из Кореи',
    metaDescription:
      'Как доставляются запчасти из Южной Кореи: EMS и морская отправка, сроки, способы оплаты. Стоимость доставки менеджер считает по вашей заявке.',
    title: 'Доставка и оплата',
    intro:
      'Мы выкупаем деталь на разборке в Южной Корее под конкретную заявку и отправляем её вам. Поэтому итоговая сумма собирается из двух частей: цена детали на сайте и доставка, которую считает менеджер.',

    requestFirstTitle: 'Сначала заявка, потом оплата',
    requestFirst: [
      'Кнопка «Оформить заявку» ничего не списывает. Заявка уходит менеджеру, он подтверждает, что деталь на месте, присылает дополнительные фотографии и называет итоговую сумму с доставкой. Только после вашего согласия деталь выкупается.',
      'Поэтому в корзине вы видите сумму только за детали. Мы не показываем предварительную стоимость доставки: она зависит от веса, габаритов, страны получателя и способа отправки, и любое число до расчёта было бы обещанием, которого мы не давали.',
    ],

    shippingTitle: 'Способы отправки',
    air: 'EMS, авиа.',
    airText:
      'От недели до полутора недель до получателя в России. Подходит для одной-двух деталей, отслеживается по трек-номеру на всём пути. Дороже, но предсказуемее по срокам.',
    sea: 'Морская отправка.',
    seaText:
      'До двух месяцев. Выгоднее по цене — особенно для крупногабаритной оптики и заказов из нескольких позиций. В Россию идёт через Владивосток.',
    duties: 'Таможенные сборы платит покупатель.',
    dutiesText:
      'Они не входят ни в цену детали, ни в стоимость доставки, которую считает менеджер, и начисляются отдельно при ввозе по правилам вашей страны. Менеджер предупредит, если по вашей отправке они ожидаются.',

    timingTitle: 'Сроки',
    timingText:
      'Ниже ориентировочные сроки авиа (EMS) по городам России — от отправки из Кореи до получения. Это оценка для планирования, а не обязательство перевозчика. Для морской отправки они не подходят, и по другим странам таких оценок у нас нет: точный срок менеджер называет по конкретной отправке.',

    paymentTitle: 'Оплата',
    payQwikpay: 'QwikPay на «Золотую Корону».',
    payQwikpayText:
      'Основной способ для физических лиц в России и СНГ: перевод по реквизитам, которые менеджер присылает после подтверждения наличия.',
    paySwift: 'SWIFT-перевод.',
    paySwiftText: 'Международный банковский перевод — для оплаты из любой страны.',
    payInvoice: 'Инвойс на юридическое лицо.',
    payInvoiceText: 'Безналичный расчёт по счёту — для организаций и ИП, с закрывающими документами.',
    payPaypalText: 'Для оплаты из-за пределов России.',
    paymentNote:
      'В заявке вы отмечаете удобный способ — это пожелание, а не оплата. Реквизиты менеджер присылает после того, как подтвердил наличие детали и посчитал доставку.',
    paymentWarning:
      'Оплату на сайте мы не принимаем и карточные данные не запрашиваем — ни в форме заявки, ни в переписке. Если кто-то просит их от нашего имени, это не мы.',

    returnsTitle: 'Если деталь не подошла',
    returnsBefore: 'Условия возврата и что делать при повреждении в пути — на странице',
    returnsLink: '«Гарантия и возврат»',
    returnsAfter: '.',
  },

  en: {
    metaTitle: 'Shipping and payment for parts from Korea',
    metaDescription:
      'How parts ship from South Korea worldwide: air and sea freight, payment methods, customs. The manager works out the shipping cost and the timeline for your request.',
    title: 'Shipping and payment',
    intro:
      'We buy the part at a salvage yard in South Korea against your specific request and ship it to you. The final amount therefore comes in two parts: the price of the item on the site, and shipping, which the manager works out.',

    requestFirstTitle: 'Request first, payment after',
    requestFirst: [
      'The «Place a request» button charges nothing. The request goes to a manager, who confirms the item is there, sends extra photos and gives you the final amount including shipping. The part is bought only after you agree.',
      'That is why the cart shows the parts total alone. We do not display an estimated shipping cost: it depends on weight, dimensions, your country and the shipping method, and any figure given before the calculation would be a promise we never made.',
    ],

    shippingTitle: 'Shipping methods',
    air: 'EMS, air.',
    airText:
      'The fast option: one or two items, tracked end to end. More expensive, but more predictable on timing.',
    sea: 'Sea freight.',
    seaText:
      'Cheaper — especially for bulky lighting and orders of several items. Slower: counted in weeks rather than days.',
    duties: 'Customs duties are paid by the buyer.',
    dutiesText:
      'They are part of neither the price of the item nor the shipping cost the manager quotes, and are charged separately on import under the rules of your country. The manager will warn you if duties are expected on your shipment.',

    timingTitle: 'Timing',
    /*
     * Никакой таблицы: оценок по миру у нас нет, и выдумывать их нельзя — от этого
     * числа человек планирует ремонт. Решено 28.08.2026, срок называет менеджер.
     */
    timingText:
      'We do not publish a delivery timetable. Transit time depends on the destination country, the shipping method and customs, and we have no estimates we would stand behind for every country. The manager gives you the expected timeline for your specific shipment, together with the shipping cost — before anything is bought.',

    paymentTitle: 'Payment',
    payQwikpay: 'QwikPay to Zolotaya Korona.',
    payQwikpayText:
      'Mainly for private buyers in Russia and the CIS: a transfer to the details the manager sends once the item is confirmed.',
    paySwift: 'SWIFT transfer.',
    paySwiftText: 'An international bank transfer — for payment from any country.',
    payInvoice: 'Invoice for a company.',
    payInvoiceText: 'Bank transfer against an invoice — for companies, with the accompanying paperwork.',
    payPaypalText: 'For payment from anywhere outside Russia.',
    paymentNote:
      'In the request you mark the method that suits you — that is a preference, not a payment. The manager sends the payment details after confirming the item is there and working out the shipping.',
    paymentWarning:
      'We take no payment on the site and never ask for card details — not in the request form, not in correspondence. If someone asks for them in our name, it is not us.',

    returnsTitle: 'If the part does not fit',
    returnsBefore: 'Return terms and what to do if the item is damaged in transit are on the',
    returnsLink: '«Warranty and returns»',
    returnsAfter: ' page.',
  },
} as const;
