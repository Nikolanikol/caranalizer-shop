import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { SITE_URL } from '@/lib/site';
import { formatPartPrice, priceUsd } from '@/lib/shop/pricing';
import { getRates } from '@/lib/shop/rates';
import type { ShopLocale } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';
import {
  SHOP_BASE,
  SHOP_LOCALE,
  WHEELS_BASE,
  isShopLocale,
  shopAlternates,
  wheelCartId,
  wheelUrl,
} from '@/lib/shop/urls';
import { wheelToCartPart } from '@/lib/shop/wheel-cart';
import { getWheelBySlug, getWheelSlugs } from '@/lib/shop/wheels';
import { isWheelMaker, wheelDescription, wheelTitle } from '@/lib/shop/wheels-text';
import { AddToCart } from '@/components/shop/add-to-cart';
import { Gallery } from '@/components/shop/gallery';
import { ShopHeader } from '@/components/shop/shop-shell';
import { WheelViewTracker } from '@/components/shop/wheel-view-tracker';

/**
 * Страница диска.
 *
 * Списка экземпляров здесь нет, в отличие от карточки детали: у диска экземпляр один —
 * само объявление. Поэтому нет и `OfferPicker`, а галерея не переключается по выбору.
 *
 * Описание собирается из полей (`wheels-text.ts`), а не берётся у донора: его текст —
 * объявление чужой розницы с рекламой собственных точек и ценой trade-in.
 */

/**
 * Оценка состояния словами продавца. Живёт здесь, а не в описании: из прозы она убрана
 * 29.08.2026, но потерять её нельзя — четыре диска из ста двадцати требуют ремонта.
 * Пустой грейд подписываем «не указана», а не молчим: молчание донора читается
 * как «хорошее», а такого он не говорил.
 */
const GRADE: Record<string, Record<ShopLocale, string>> = {
  good: { ru: 'Хорошее', en: 'Good' },
  fair: { ru: 'Среднее', en: 'Fair' },
  repair: { ru: 'Требует ремонта', en: 'Needs repair' },
  '': { ru: 'Не указана', en: 'Not stated' },
};

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  // Пререндерим только русские, как и весь раздел: английские рендерятся по первому
  // запросу. Товаров сто двадцать — включение второго языка удвоило бы их даром.
  if (params.lang !== SHOP_LOCALE) return [];
  return (await getWheelSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const wheel = await getWheelBySlug(slug);
  if (!wheel) return {};

  const title = wheelTitle(wheel, locale);
  return {
    title,
    description: wheelDescription(wheel, locale).slice(0, 300),
    // Проданное закрываем от индекса: объявление у донора висит и после продажи,
    // а страница товара, которого нет, в выдаче не нужна.
    robots: wheel.sold ? { index: false, follow: true } : undefined,
    alternates: shopAlternates(wheelUrl(wheel.slug), SITE_URL, locale),
    openGraph: { title, images: wheel.images.slice(0, 1).map((image) => image.url), type: 'website' },
  };
}

export default async function WheelPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const t = ui(locale);
  const wheel = await getWheelBySlug(slug);
  if (!wheel) notFound();

  const rates = await getRates();
  const title = wheelTitle(wheel, locale);
  const description = wheelDescription(wheel, locale);
  const car = isWheelMaker(wheel.brandSlug)
    ? ''
    : [wheel.brandName, wheel.model].filter(Boolean).join(' ');

  const facts: { label: string; value: string }[] = [
    {
      label: locale === 'en' ? 'Diameter' : 'Диаметр',
      value: locale === 'en' ? `${wheel.diameter}″` : `R${wheel.diameter}`,
    },
    // У производителя дисков подпись другая: «встречается на SkyWheel» — бессмыслица,
    // SkyWheel делает диски, а не машины.
    ...(car
      ? [{ label: locale === 'en' ? 'Found on' : 'Встречается на', value: car }]
      : [{ label: locale === 'en' ? 'Made by' : 'Производитель', value: wheel.brandName }]),
    {
      label: locale === 'en' ? 'Condition' : 'Состояние',
      value:
        wheel.condition === 'new'
          ? locale === 'en'
            ? 'New'
            : 'Новый'
          : locale === 'en'
            ? 'Used'
            : 'Б/у',
    },
    // Оценка продавца переехала сюда из описания: в прозе она только удлиняла текст,
    // а потерять её нельзя — четыре диска из ста двадцати требуют ремонта.
    // Пустой грейд подписываем «не указана», а не молчим: молчание донора
    // читается как «хорошее».
    {
      label: locale === 'en' ? 'Seller rates it' : 'Оценка продавца',
      value: GRADE[wheel.grade][locale],
    },
    ...(wheel.withTyres
      ? [
          {
            label: locale === 'en' ? 'Tyres' : 'Шины',
            value: wheel.tyre || (locale === 'en' ? 'included' : 'в комплекте'),
          },
        ]
      : []),
  ];

  const trail = [
    { name: t.section, href: SHOP_BASE },
    { name: locale === 'en' ? 'Wheels' : 'Диски', href: WHEELS_BASE },
    { name: title },
  ];

  return (
    <>
      {/* В подводку идёт первое предложение, а полное описание — блоком ниже:
          иначе один и тот же текст стоял бы на экране дважды. */}
      <ShopHeader
        heading={title}
        intro={description.split('. ')[0] + '.'}
        activeWheels
        trail={trail}
        locale={locale}
      />

      <WheelViewTracker id={wheelCartId(wheel.id)} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Gallery images={wheel.images.map((image) => image.url)} alt={title} locale={locale} />

          <div className="space-y-6">
            <div className="bg-elevated border border-border-subtle rounded-xl p-6">
              {/*
                Цены продажи может не быть: донор у части объявлений публикует только
                цену со сдачей своих дисков в зачёт либо прайс по диаметрам, в котором
                нашего нет. Тогда «по запросу» и без корзины — сумму заявки сервер
                считает по цене, и товар без неё стал бы счётом на ноль.
              */}
              <div className="text-[32px] font-bold text-text tracking-tight leading-none mb-2">
                {wheel.priceKrw === null
                  ? locale === 'en'
                    ? 'On request'
                    : 'По запросу'
                  : formatPartPrice(wheel.priceKrw, rates)}
              </div>
              <p className="text-xs text-text-muted mb-6 font-medium">
                {wheel.priceKrw === null
                  ? locale === 'en'
                    ? 'The seller has not named a price — we will ask and come back to you.'
                    : 'Продавец не назвал цену в объявлении — спросим и вернёмся с ответом.'
                  : t.shippingExtra}
              </p>

              {wheel.sold ? (
                <p className="w-full text-center py-4 rounded-lg bg-base-darker border border-border-subtle text-text-muted text-sm font-bold">
                  {locale === 'en' ? 'Sold' : 'Продано'}
                </p>
              ) : wheel.priceKrw === null ? (
                <Link
                  href="/contact"
                  className="w-full flex items-center justify-center py-4 text-base rounded-lg bg-cta hover:bg-cta-hover text-base-darker font-bold transition-colors"
                >
                  {locale === 'en' ? 'Request price' : 'Запросить цену'}
                </Link>
              ) : (
                <AddToCart part={wheelToCartPart(wheel)} size="large" label={t.addToCart} />
              )}
            </div>

            <dl className="bg-elevated border border-border-subtle rounded-xl divide-y divide-border-subtle">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-center justify-between gap-4 px-6 py-3">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {fact.label}
                  </dt>
                  <dd className="text-sm font-bold text-text text-right">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="bg-elevated border border-border-subtle rounded-xl p-6 space-y-3">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                {locale === 'en' ? 'Description' : 'Описание'}
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              <Link href={WHEELS_BASE} className="hover:text-text transition-colors">
                {locale === 'en' ? '← All wheels' : '← Все диски'}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: title,
            image: wheel.images.map((image) => image.url),
            description,
            brand: { '@type': 'Brand', name: wheel.brandName },
            // Блок предложения — только когда цена есть. Товар «по запросу» без цены
            // в разметке остаётся товаром; Offer с нулём или без `price` Google
            // считает ошибкой разметки, а не отсутствием цены.
            offers: wheel.priceKrw === null ? undefined : {
              '@type': 'Offer',
              // Валюта долларовая, и цифра совпадает с той, что видит покупатель:
              // цена в разметке обязана быть той же, что на витрине.
              priceCurrency: 'USD',
              price: priceUsd(wheel.priceKrw, rates),
              availability: wheel.sold
                ? 'https://schema.org/SoldOut'
                : 'https://schema.org/InStock',
              itemCondition:
                wheel.condition === 'new'
                  ? 'https://schema.org/NewCondition'
                  : 'https://schema.org/UsedCondition',
            },
          }),
        }}
      />
    </>
  );
}
