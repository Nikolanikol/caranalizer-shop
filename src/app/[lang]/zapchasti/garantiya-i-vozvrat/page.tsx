import React from 'react';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { PageShell, Section } from '@/components/shop/page-shell';
import { isShopLocale, shopAlternates } from '@/lib/shop/urls';
import type { ShopLocale } from '@/lib/shop/terms';
import { SITE_URL } from '@/lib/site';

/**
 * ДОПОЛНИТЬ ОБЯЗАТЕЛЬНО. Условия — со слов владельца, первая версия. Не хватает:
 *
 * - срок на осмотр детали после получения (сколько дней у покупателя на претензию);
 * - порядок при повреждении в пути: акт при получении, фотографии упаковки,
 *   кто и в какой срок предъявляет претензию перевозчику;
 * - как и в какой срок возвращаются деньги при обоснованном отказе;
 * - кто платит обратную пересылку, если ошибка наша, и если причина у покупателя.
 *
 * ЮРИСТУ ПОКАЗАТЬ ОБЕ ВЕРСИИ. Ограничение возврата опирается на то, что деталь
 * выкупается под конкретную заявку, а не лежит на складе, — при дистанционной продаже
 * это единственное, что удерживает условие в рамках закона. Довод сам по себе
 * от страны не зависит, но обязательные нормы о правах потребителя зависят, и по РФ
 * это ЗоЗПП, а по другим странам — их собственное право. Поэтому в английской версии
 * добавлена оговорка: наши условия не отменяют обязательных норм страны покупателя.
 * Она защищает нас, а не обещает покупателю лишнего, но проверить её должен юрист.
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
    alternates: shopAlternates('/zapchasti/garantiya-i-vozvrat', SITE_URL, locale),
  };
}

export default async function WarrantyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const t = TEXT[locale];

  return (
    <PageShell title={t.title} intro={t.intro}>
      {t.sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Section>
      ))}

      <Section title={t.beforeOrderTitle}>
        <p>
          {t.beforeOrderA}{' '}
          <Link href="/zapchasti/dostavka-i-oplata" className="text-cta hover:underline">
            {t.deliveryLink}
          </Link>
          {t.beforeOrderB}{' '}
          <Link href="/contact" className="text-cta hover:underline">
            {t.contactsLink}
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}

const TEXT = {
  ru: {
    metaTitle: 'Гарантия и возврат запчастей',
    metaDescription:
      'Условия гарантии и возврата на б/у запчасти из Южной Кореи: что делать, если деталь не подошла или повреждена при доставке.',
    title: 'Гарантия и возврат',
    intro:
      'Мы продаём бывшие в употреблении детали с авторазборок. Состояние каждой видно на фотографиях в карточке, а грейд указан честно — включая позиции с царапинами и повреждениями крепления.',

    sections: [
      {
        title: 'Что мы гарантируем уже сейчас',
        body: [
          'Фотографии в карточке показывают именно ту деталь, которая приедет, — не изображение из каталога производителя и не похожую позицию. Грейд состояния и заметки о дефектах взяты у разборки и не приукрашиваются: если на детали трещина или сломано крепление, это написано в карточке.',
          'Перед выкупом менеджер сверяет деталь с вашей машиной по VIN и маркировке. Применимость окончательно подтверждаете вы — по фотографиям и OE-номеру.',
        ],
      },
      {
        title: 'До выкупа — отказ свободный',
        body: [
          'Заявка на сайте ничего не списывает и ни к чему не обязывает. Пока деталь не выкуплена на разборке, вы можете отказаться без причины и без потерь — достаточно написать менеджеру.',
          'Именно поэтому между заявкой и выкупом есть пауза: менеджер подтверждает наличие, присылает дополнительные фотографии и называет итоговую сумму с доставкой. Это ваш момент решения, и мы просим им пользоваться — вопросы по применимости и состоянию дешевле задать здесь.',
        ],
      },
      {
        title: 'После выкупа — по обоснованной причине',
        body: [
          'Деталь выкупается под вашу заявку, а не берётся со склада: разборка продаёт её нам именно потому, что покупатель уже есть. С этого момента отказ рассматривается индивидуально и требует внятной причины — например, подобран не тот OE-номер, деталь не соответствует присланным фотографиям или обнаружен дефект, которого на них не было.',
          'Если ошибка наша — в подборе или в описании состояния — решаем за свой счёт. Если причина в изменившемся решении покупателя, вернуть деталь на разборку мы уже не можем.',
        ],
      },
      {
        title: 'После отправки возврат невозможен',
        body: [
          'Как только посылка ушла из Кореи в страну получателя, отказаться нельзя. Обратная международная пересылка б/у детали стоит дороже самой детали, и такой возврат не имеет смысла ни для одной из сторон.',
          'Это не отменяет претензий по существу: если приехало не то, что показывали на фотографиях, или деталь повреждена в пути — разбираемся. Сохраните упаковку и сфотографируйте её до вскрытия, это основное доказательство при споре с перевозчиком.',
        ],
      },
      {
        title: 'Что мы делаем, чтобы отказ не понадобился',
        body: [
          'Фотографии в карточке — это та самая деталь, а не изображение из каталога производителя. По запросу менеджер присылает дополнительные снимки: разъём, крепления, следы ремонта, маркировку с номером. Просите столько, сколько нужно для уверенности — это бесплатно и быстрее, чем разбираться потом.',
          'Перед выкупом деталь сверяется с вашим автомобилем по VIN и маркировке. Окончательное подтверждение применимости остаётся за вами — по фотографиям и OE-номеру.',
        ],
      },
    ],

    beforeOrderTitle: 'Перед заказом',
    beforeOrderA: 'Как устроен выкуп и что входит в итоговую сумму — на странице',
    deliveryLink: '«Доставка и оплата»',
    beforeOrderB: '. Вопросы по конкретной детали быстрее решаются в мессенджере:',
    contactsLink: 'контакты',
  },

  en: {
    metaTitle: 'Warranty and returns',
    metaDescription:
      'Warranty and return terms for used parts from South Korean salvage yards: what to do if the part does not fit or arrives damaged.',
    title: 'Warranty and returns',
    intro:
      'We sell used parts pulled from cars at salvage yards. The condition of each one is visible in the photos on its page, and the grade is stated honestly — including items with scratches and broken mounting tabs.',

    sections: [
      {
        title: 'What we guarantee right now',
        body: [
          'The photos on the item page show the exact part that will arrive — not a manufacturer catalogue image, and not a similar item. The condition grade and the defect notes come from the salvage yard and are not dressed up: if the part has a crack or a broken mount, it says so on the page.',
          'Before we buy, the manager checks the part against your car by VIN and markings. Final confirmation that it fits is yours to give — from the photos and the OE number.',
        ],
      },
      {
        title: 'Before we buy it — cancel freely',
        body: [
          'A request on the site charges nothing and commits you to nothing. Until the part has been bought at the salvage yard you can cancel for any reason and at no cost — just write to the manager.',
          'That is exactly why there is a pause between the request and the purchase: the manager confirms the item is there, sends extra photos and gives the final amount including shipping. That is your moment to decide, and we ask you to use it — questions about fitment and condition are cheaper to ask here.',
        ],
      },
      {
        title: 'After we buy it — with a substantiated reason',
        body: [
          'The part is bought against your request, not taken off a shelf: the salvage yard sells it to us precisely because a buyer already exists. From that moment a cancellation is considered case by case and needs a clear reason — the wrong OE number was selected, the item does not match the photos we sent, or a defect was found that was not visible on them.',
          'If the mistake is ours — in the selection or in the description of the condition — we resolve it at our own expense. If the reason is that the buyer changed their mind, we can no longer return the part to the salvage yard.',
        ],
      },
      {
        title: 'After dispatch a return is not possible',
        body: [
          'Once the parcel has left Korea for the destination country, it cannot be cancelled. Shipping a used part back internationally costs more than the part itself, and such a return makes sense for neither side.',
          'This does not rule out claims on the merits: if what arrived is not what the photos showed, or the part was damaged in transit, we deal with it. Keep the packaging and photograph it before opening — that is the main evidence in a dispute with the carrier.',
        ],
      },
      {
        title: 'Your statutory rights',
        body: [
          'The terms above describe how we work. They do not override mandatory consumer protection rules that apply in your country — where such rules give you more than is written here, they prevail.',
        ],
      },
      {
        title: 'What we do so that no return is needed',
        body: [
          'The photos on the item page are of that very part, not a manufacturer catalogue image. On request the manager sends more: the connector, the mounts, traces of repair, the markings with the number. Ask for as many as you need to be sure — it is free, and faster than sorting things out afterwards.',
          'Before the purchase the part is checked against your car by VIN and markings. Final confirmation that it fits stays with you — from the photos and the OE number.',
        ],
      },
    ],

    beforeOrderTitle: 'Before you order',
    beforeOrderA: 'How the purchase works and what makes up the final amount is on the',
    deliveryLink: '«Shipping and payment»',
    beforeOrderB: ' page. Questions about a specific part are answered fastest by messenger:',
    contactsLink: 'contacts',
  },
} as const;
