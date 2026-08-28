import React from 'react';
import type { Metadata } from 'next';
import { PackageSearch } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SITE_URL } from '@/lib/site';
import type { ShopLocale } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';
import { SHOP_BASE, WHEELS_BASE, catalogUrl, isShopLocale, shopAlternates } from '@/lib/shop/urls';
import { findWheels, getWheelFacets } from '@/lib/shop/wheels';
import { FilterPanel } from '@/components/shop/filter-panel';
import { Pagination } from '@/components/shop/pagination';
import { ShopFrame, ShopHeader } from '@/components/shop/shop-shell';
import { WheelCard } from '@/components/shop/wheel-card';

/**
 * Список дисков — второй донор (skywheel.kr).
 *
 * Своя страница, а не двенадцатая категория каталога: у диска нет партномера, стороны
 * и позиции, и лежит он в своих таблицах. Пилюля в шапке при этом общая — для покупателя
 * это такой же раздел товара, и разводить его в отдельную навигацию незачем.
 *
 * Иерархии марок и моделей под ней нет намеренно: товаров сто двадцать, и страницы марок
 * дали бы адреса с одной карточкой. Марка и диаметр остаются фильтром в запросе,
 * а страница канонизируется сама на себя — ровно как витрина раздела.
 *
 * Маршрут динамический (`ƒ`): он принимает `searchParams`. Это та же неизбежная плата
 * за фильтр в адресе, что и у четырёх листинговых маршрутов каталога.
 */

const TEXT = {
  ru: {
    heading: 'Диски с авторазборов Кореи',
    intro:
      'Оригинальные и кованые диски из Южной Кореи: марка, модель, диаметр и состояние у каждой позиции, фотографии продавца.',
    title: 'Диски б/у из Кореи — оригинальные и кованые',
    description:
      'Колёсные диски б/у и новые из Южной Кореи: Mercedes-Benz, BMW, Genesis, Kia, Hyundai. Диаметры 17–22 дюйма, фото каждой позиции, доставка по миру.',
    all: 'Все',
    brand: 'Марка',
    diameter: 'Диаметр',
    condition: 'Состояние',
    new: 'Новые',
    used: 'Б/у',
    cheap: 'Сначала дешёвые',
    expensive: 'Сначала дорогие',
    big: 'Крупный диаметр',
  },
  en: {
    heading: 'Wheels from Korean salvage yards',
    intro:
      'Original and forged wheels from South Korea: make, model, diameter and condition on every listing, seller photos.',
    title: 'Used wheels from Korea — original and forged',
    description:
      'Used and new alloy wheels from South Korea: Mercedes-Benz, BMW, Genesis, Kia, Hyundai. 17–22 inch, photos of every item, worldwide shipping.',
    all: 'All',
    brand: 'Make',
    diameter: 'Diameter',
    condition: 'Condition',
    new: 'New',
    used: 'Used',
    cheap: 'Cheapest first',
    expensive: 'Most expensive first',
    big: 'Largest diameter',
  },
} as const;

interface WheelSearchParams {
  brand?: string;
  diameter?: string;
  condition?: string;
  sort?: string;
  page?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const copy = TEXT[locale];

  return {
    title: copy.title,
    description: copy.description,
    alternates: shopAlternates(WHEELS_BASE, SITE_URL, locale),
  };
}

export default async function WheelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<WheelSearchParams>;
}) {
  const { lang } = await params;
  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const copy = TEXT[locale];
  const t = ui(locale);
  const query = await searchParams;

  const diameter = Number(query.diameter) || undefined;
  const condition = query.condition === 'new' || query.condition === 'used' ? query.condition : undefined;
  const sort = query.sort ?? '';

  const [result, facets] = await Promise.all([
    findWheels({
      brand: query.brand,
      diameter,
      condition,
      sort,
      page: Number(query.page) || 1,
    }),
    getWheelFacets(),
  ]);

  // Параметры, которые надо сохранять при переходе по фильтрам и страницам.
  const keep = {
    brand: query.brand,
    diameter: query.diameter,
    condition: query.condition,
    sort: sort || undefined,
  };

  const activeCount = [query.brand, query.diameter, query.condition].filter(Boolean).length;

  const pill = (active: boolean) =>
    `block px-3 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-colors ${
      active
        ? 'bg-cta text-base-darker'
        : 'text-text-secondary hover:text-text hover:bg-base-darker'
    }`;

  return (
    <>
      <ShopHeader heading={copy.heading} intro={copy.intro} activeWheels locale={locale} />

      <ShopFrame
        sidebar={
          <FilterPanel locale={locale} activeCount={activeCount}>
            <div className="space-y-6">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                  {copy.brand}
                </h2>
                <div className="space-y-0.5">
                  <Link href={catalogUrl({ base: WHEELS_BASE, ...keep, brand: undefined })} className={pill(!query.brand)}>
                    {copy.all}
                  </Link>
                  {facets.brands.map((brand) => (
                    <Link
                      key={brand.slug}
                      href={catalogUrl({ base: WHEELS_BASE, ...keep, brand: brand.slug })}
                      className={pill(query.brand === brand.slug)}
                    >
                      {brand.name} <span className="opacity-50">{brand.count}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                  {copy.diameter}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  <Link
                    href={catalogUrl({ base: WHEELS_BASE, ...keep, diameter: undefined })}
                    className={`px-3 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-colors ${
                      !query.diameter
                        ? 'bg-cta text-base-darker'
                        : 'bg-base-darker border border-border-subtle text-text-secondary hover:text-text'
                    }`}
                  >
                    {copy.all}
                  </Link>
                  {facets.diameters.map((item) => (
                    <Link
                      key={item.value}
                      href={catalogUrl({ base: WHEELS_BASE, ...keep, diameter: String(item.value) })}
                      className={`px-3 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-colors ${
                        query.diameter === String(item.value)
                          ? 'bg-cta text-base-darker'
                          : 'bg-base-darker border border-border-subtle text-text-secondary hover:text-text'
                      }`}
                    >
                      {locale === 'en' ? `${item.value}″` : `R${item.value}`}{' '}
                      <span className="opacity-50">{item.count}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                  {copy.condition}
                </h2>
                <div className="space-y-0.5">
                  <Link
                    href={catalogUrl({ base: WHEELS_BASE, ...keep, condition: undefined })}
                    className={pill(!query.condition)}
                  >
                    {copy.all}
                  </Link>
                  <Link
                    href={catalogUrl({ base: WHEELS_BASE, ...keep, condition: 'used' })}
                    className={pill(query.condition === 'used')}
                  >
                    {copy.used}
                  </Link>
                  <Link
                    href={catalogUrl({ base: WHEELS_BASE, ...keep, condition: 'new' })}
                    className={pill(query.condition === 'new')}
                  >
                    {copy.new}
                  </Link>
                </div>
              </div>
            </div>
          </FilterPanel>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
            {t.found}: <strong className="text-text">{result.total}</strong>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['', copy.big],
                ['price-asc', copy.cheap],
                ['price-desc', copy.expensive],
              ] as const
            ).map(([value, label]) => (
              <Link
                key={value || 'default'}
                href={catalogUrl({ base: WHEELS_BASE, ...keep, sort: value || undefined })}
                className={`px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  sort === value
                    ? 'bg-base-darker text-text border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {result.wheels.length === 0 ? (
          <div className="bg-elevated border border-border-subtle rounded p-12 text-center space-y-4">
            <span className="w-14 h-14 rounded bg-base-darker text-text-dim flex items-center justify-center mx-auto border border-border-subtle">
              <PackageSearch className="w-6 h-6" />
            </span>
            <h2 className="text-sm font-black uppercase tracking-widest text-text">{t.nothingFound}</h2>
            <Link
              href={WHEELS_BASE}
              className="inline-block px-6 py-3 rounded bg-base-darker hover:bg-surface text-text-secondary text-[10px] font-bold uppercase tracking-widest border border-border-subtle transition-colors"
            >
              {t.resetFilters}
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {result.wheels.map((wheel) => (
                <WheelCard key={wheel.id} wheel={wheel} locale={locale} />
              ))}
            </div>

            <Pagination
              locale={locale}
              page={result.page}
              totalPages={result.pages}
              base={WHEELS_BASE}
              query={keep}
            />
          </div>
        )}

        <p className="mt-10 text-[10px] font-bold uppercase tracking-widest text-text-muted">
          <Link href={SHOP_BASE} className="hover:text-text transition-colors">
            {locale === 'en' ? '← All parts' : '← Все запчасти'}
          </Link>
        </p>
      </ShopFrame>
    </>
  );
}
