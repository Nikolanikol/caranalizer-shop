import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, Info } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  CATEGORIES,
  SHOP_BASE,
  brandUrl,
  categoryUrl,
  getIndexableParts,
  getPartByPath,
  getSimilarParts,
  isCategory,
  modelUrl,
  partUrl,
} from '@/lib/shop/catalog';
import { SHOP_LOCALE, isShopLocale, oemUrl, shopAlternates, shopUrl } from '@/lib/shop/urls';
import { categoryPlural, partTitle } from '@/lib/shop/labels';
import { POSITION_EN, SIDE_EN, type ShopLocale, term } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';
import { formatPartPrice, priceRub } from '@/lib/shop/pricing';
import { getRates } from '@/lib/shop/rates';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { VIN_PATHS } from '@/lib/seo';
import { OfferPicker } from '@/components/shop/offer-picker';
import { CopyOem } from '@/components/shop/copy-oem';
import { FitmentHelp } from '@/components/shop/fitment-help';
import { ProductCard } from '@/components/shop/product-card';

/**
 * Страница товара — лист иерархии:
 * /zapchasti/zadnie-fonari/hyundai/sonata/naruzhnyy-levyy-92401l1000
 *
 * Категория, марка и модель — сегменты маршрута, поэтому новый тип детали
 * не требует нового файла, а каждый уровень пути ведёт на реальную страницу.
 */

/*
 * Пререндерим не весь каталог, а только карточки, которым положена страница в индексе
 * (два и более экземпляра) — 5 834 из 18 655. Остальные рендерятся по первому запросу
 * и кэшируются: собирать восемнадцать тысяч страниц ради товара, который живёт
 * до первой продажи, бессмысленно.
 *
 * Плата за `dynamicParams: true` — несуществующий адрес теперь отвечает 200 с `noindex`,
 * а не 404: `notFound()` в потоковом ответе кода не меняет (см. AGENTS.md).
 */
export const dynamicParams = true;

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  // Раздел одноязычный: на других локалях товаров нет, и 967 страниц
  // не должны собираться по второму и третьему разу.
  if (params.lang !== SHOP_LOCALE) return [];

  const parts = await getIndexableParts();
  return parts.map((part) => ({
    category: part.category,
    brand: part.brandSlug,
    model: part.modelSlug,
    slug: part.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string; brand: string; model: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, ...path } = await params;
  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const part = await getPartByPath(path);
  if (!part) return { title: locale === 'en' ? 'Part not found' : 'Деталь не найдена' };

  const title = partTitle(part, locale);

  // Тот же кэшированный ответ ЦБ, что и у страницы: цена в описании обязана совпадать
  // с ценой на самой карточке.
  const rates = await getRates();
  const oe = part.oemNumber ? ` (OEM ${part.oemNumber})` : '';
  return {
    title: `${title}${oe}`,
    description:
      locale === 'en'
        ? `${title}${oe}. Used original from a South Korean salvage yard, photos of this exact item. Worldwide shipping.`
        : `${part.titleRu}${oe}. Оригинал с авторазборки Южной Кореи, фотографии именно этой детали. Доставка по России, ${part.deliveryDays}.`,
    alternates: shopAlternates(partUrl(part), SITE_URL, locale),
    /*
     * Карточка, за которой стоит один экземпляр, живёт до первой продажи: товар ушёл —
     * страница умерла. Таких 12 821 из 18 655, и пускать их в индекс значит заранее
     * наплодить 404 там, где уже 307 755 адресов висят непроиндексированными.
     *
     * Страница при этом работает: без неё товар нельзя положить в корзину. Закрыт
     * только индекс, и признак берётся из данных, а не из списка исключений.
     */
    robots: part.offersCount < 2 ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description:
        locale === 'en'
          ? `Used original from South Korea${oe}. Price ${formatPartPrice(part.priceKrw, rates)}.`
          : `Оригинал из Южной Кореи${oe}. Цена ${formatPartPrice(part.priceKrw, rates)}.`,
      images: part.images.slice(0, 1),
      type: 'website',
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; category: string; brand: string; model: string; slug: string }>;
}) {
  const { lang, ...path } = await params;
  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const t = ui(locale);
  const part = await getPartByPath(path);

  if (!part || !isCategory(path.category)) notFound();

  const similar = await getSimilarParts(part, 4);
  const info = CATEGORIES[part.category];
  const rates = await getRates();
  const title = partTitle(part, locale);

  // Крошки повторяют путь сегмент в сегмент. Модель у 17 товаров не указана —
  // её ступень тогда просто пропускается, а не показывается пустой.
  const trail = [
    { name: t.section, href: SHOP_BASE },
    { name: categoryPlural(part.category, locale, info.plural), href: categoryUrl(part.category) },
    { name: part.brand, href: brandUrl(part.category, part.brandSlug) },
    ...(part.model
      ? [{ name: part.model, href: modelUrl(part.category, part.brandSlug, part.modelSlug) }]
      : []),
  ];

  // Разметка для поисковиков: товар с ценой и наличием + хлебные крошки.
  // Адреса — абсолютные и с языковым префиксом: без /ru они ведут в никуда.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: title,
        image: part.images.slice(0, 6),
        sku: part.oemNumber || part.id,
        mpn: part.oemNumber || undefined,
        brand: { '@type': 'Brand', name: part.brand },
        itemCondition: part.used ? 'https://schema.org/UsedCondition' : 'https://schema.org/NewCondition',
        /*
         * У детали несколько экземпляров с разной ценой, поэтому AggregateOffer,
         * а не Offer: цена в разметке обязана совпадать с тем, что видит покупатель,
         * а он видит вилку. Валюта — рубли: доллар на сайте справочный.
         */
        offers:
          part.offersCount > 1
            ? {
                '@type': 'AggregateOffer',
                url: shopUrl(partUrl(part), SITE_URL),
                priceCurrency: 'RUB',
                lowPrice: priceRub(part.priceKrw, rates),
                highPrice: priceRub(part.priceKrwMax, rates),
                offerCount: part.offersCount,
                availability: part.inStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
                seller: { '@type': 'Organization', name: SITE_NAME },
              }
            : {
                '@type': 'Offer',
                url: shopUrl(partUrl(part), SITE_URL),
                priceCurrency: 'RUB',
                price: priceRub(part.priceKrw, rates),
                availability: part.inStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
                seller: { '@type': 'Organization', name: SITE_NAME },
              },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          ...trail.map((step, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: step.name,
            item: shopUrl(step.href, SITE_URL),
          })),
          { '@type': 'ListItem', position: trail.length + 1, name: title },
        ],
      },
    ],
  };

  // Характеристики детали, общие для всех экземпляров. Всё, что различается —
  // состояние, разъём, цвет, VIN — показывает `OfferPicker` у выбранного экземпляра.
  const specs: [string, string][] = [
    [t.specBrand, part.brand],
    [t.specModel, part.model],
    [t.specYears, part.years],
    [t.specSide, term(part.side, locale, SIDE_EN)],
    [t.specPosition, term(part.position, locale, POSITION_EN)],
    [t.specCross, part.crossNumbers.join(', ')],
    [t.specWeight, part.weightKg ? `${part.weightKg} ${t.kg} (${t.estimate})` : ''],
    [t.specSize, part.dimensionsCm ? `${part.dimensionsCm.join(' × ')} ${t.cm} (${t.estimate})` : ''],
  ];

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav
        aria-label={t.breadcrumbs}
        className="flex items-center flex-wrap gap-1 text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6"
      >
        {trail.map((step) => (
          <React.Fragment key={step.href}>
            <Link href={step.href} className="hover:text-text transition-colors">
              {step.name}
            </Link>
            <ChevronRight className="w-3 h-3" />
          </React.Fragment>
        ))}
        <span className="text-text-secondary normal-case tracking-normal">{title}</span>
      </nav>

      <OfferPicker
        part={part}
        rates={rates}
        locale={locale}
        vinCheckHref={`/${locale}${VIN_PATHS[locale] ?? VIN_PATHS[SHOP_LOCALE]}`}
        header={
          <>
            <div className="flex flex-wrap items-center gap-2">
              {/* Артикул ведёт на свою страницу: там видно, на каких ещё машинах
                  встречается номер, и что есть в наличии по нему целиком. */}
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-elevated text-text-secondary font-mono text-xs uppercase tracking-wider font-bold border border-border-subtle">
                OEM:{' '}
                {part.oemNumber ? (
                  <Link href={oemUrl(part.oemNumber)} className="text-text hover:text-cta transition-colors">
                    {part.oemNumber}
                  </Link>
                ) : (
                  <span className="text-text">{t.onRequest}</span>
                )}
                <CopyOem value={part.oemNumber} />
              </span>
              <Link
                href={brandUrl(part.category, part.brandSlug)}
                className="px-3 py-1.5 rounded bg-elevated text-text-secondary text-[10px] uppercase tracking-widest font-bold border border-border-subtle hover:text-cta transition-colors"
              >
                {part.brand} {part.model}
              </Link>
              {part.side && (
                <span className="px-3 py-1.5 rounded bg-surface text-text text-[10px] uppercase tracking-widest font-bold border border-border">
                  {term(part.side, locale, SIDE_EN)}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight leading-tight">{title}</h1>
          </>
        }
        footer={
          <>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {specs
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="bg-elevated p-3 rounded border border-border-subtle">
                    <dt className="text-text-dim block text-[9px] font-bold uppercase tracking-widest mb-1">{label}</dt>
                    <dd className="font-bold text-text-secondary text-[11px] tracking-wide">{value}</dd>
                  </div>
                ))}
            </dl>

            <FitmentHelp locale={locale} />

            <div className="bg-amber-950/30 border border-amber-900/50 rounded p-4 flex gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                {locale === 'en'
                  ? 'Every photo shows the exact item that will arrive. Check it against the photos and the OE number on your own car — if in doubt, write to us before placing a request.'
                  : 'Все фотографии показывают именно тот экземпляр, который приедет. Сверьте его по фото и OE-номеру со своей машиной — при сомнениях напишите нам до оформления заявки.'}
              </p>
            </div>
          </>
        }
      />

      {similar.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h2 className="text-lg font-bold text-text">
              {locale === 'en' ? `Other parts for ${part.brand}` : `Другие детали для ${part.brand}`}
            </h2>
            <Link
              href={brandUrl(part.category, part.brandSlug)}
              className="text-sm font-bold text-cta hover:underline"
            >
              {locale === 'en' ? `Show all ${part.brand}` : `Показать все ${part.brand}`}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {similar.map((item) => (
              <ProductCard key={partUrl(item)} part={item} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
