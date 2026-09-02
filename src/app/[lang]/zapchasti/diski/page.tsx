import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { PackageSearch } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SITE_URL } from '@/lib/site';
import type { ShopLocale } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';
import { SHOP_BASE, WHEELS_BASE, catalogUrl, isShopLocale, shopAlternates } from '@/lib/shop/urls';
import { WHEELS_PER_PAGE, findWheels, getWheelFacets } from '@/lib/shop/wheels';
import { FilterPanel } from '@/components/shop/filter-panel';
import { LinkPending } from '@/components/shop/link-pending';
import { Pagination } from '@/components/shop/pagination';
import { ResultsSkeleton, ResultsToolbar } from '@/components/shop/results';
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
 *
 * **Отклик на клик по фильтру устроен ровно как в каталоге, и это не совпадение.**
 * Донор второй и таблицы у него свои, но для покупателя это один раздел: панель над
 * выдачей, скелет и подпись для скринридера приезжают из общего
 * `components/shop/results.tsx`, индикатор клика — из общего `link-pending.tsx`.
 * Копию здесь не заводить: она разъедется с каталогом на первой же правке, и две
 * одинаковые с виду страницы поведут себя по-разному.
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

/** Что тащим за собой при переходе по фильтру, сортировке и страницам. */
interface WheelQuery {
  brand?: string;
  diameter?: string;
  condition?: string;
  sort?: string;
}

/**
 * Ссылки сортировки. Отдельным компонентом затем, что рисуются дважды: в готовой выдаче
 * и в скелете под ней. От данных они не зависят — порядок известен из адреса, — и обязаны
 * стоять на одном месте в обоих случаях, иначе приход товаров дёргал бы ряд по вертикали.
 */
function WheelSortLinks({
  keep,
  sort,
  locale,
}: {
  keep: WheelQuery;
  sort: string;
  locale: ShopLocale;
}) {
  const copy = TEXT[locale];

  return (
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
          className={`relative overflow-hidden px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
            sort === value
              ? 'bg-base-darker text-text border border-border'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {label}
          <LinkPending />
        </Link>
      ))}
    </div>
  );
}

/**
 * Сама выдача. Отдельным компонентом ровно затем, что здесь стоит единственный медленный
 * `await` страницы: под `<Suspense>` он перестаёт задерживать оболочку, и на его месте
 * появляется скелет. Пока `findWheels` ждали в теле страницы, отдавать было нечего.
 */
async function WheelResults({
  query,
  keep,
  sort,
  locale,
}: {
  query: WheelSearchParams;
  keep: WheelQuery;
  sort: string;
  locale: ShopLocale;
}) {
  const t = ui(locale);

  const result = await findWheels({
    brand: query.brand,
    diameter: Number(query.diameter) || undefined,
    condition: query.condition === 'new' || query.condition === 'used' ? query.condition : undefined,
    sort,
    page: Number(query.page) || 1,
  });

  return (
    <>
      <ResultsToolbar>
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
          {t.found}: <strong className="text-text">{result.total}</strong>
        </p>

        <WheelSortLinks keep={keep} sort={sort} locale={locale} />
      </ResultsToolbar>

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
    </>
  );
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
  const query = await searchParams;
  const sort = query.sort ?? '';

  /*
   * Фасеты ждём здесь, а не под `<Suspense>`: они рисуют сам фильтр, а прятать фильтр
   * под скелет на каждый клик хуже, чем подождать. Ждать при этом почти не приходится —
   * `getWheelFacets` кэширован в `wheels.ts` на час: от выбранной марки, диаметра
   * и сортировки он не зависит и меняется раз в скрап.
   */
  const facets = await getWheelFacets();

  // Параметры, которые надо сохранять при переходе по фильтрам и страницам.
  const keep: WheelQuery = {
    brand: query.brand,
    diameter: query.diameter,
    condition: query.condition,
    sort: sort || undefined,
  };

  const activeCount = [query.brand, query.diameter, query.condition].filter(Boolean).length;

  /*
   * Ключ границы Suspense. Обязателен: без него React переиспользует границу, скелет
   * не показывается вовсе, а смена адреса ждёт полного ответа сервера. То же правило,
   * что в `catalog-view.tsx`, и по той же причине.
   */
  const resultsKey = JSON.stringify([query.brand, query.diameter, query.condition, sort, query.page]);

  // `relative overflow-hidden` — под заливку `LinkPending`: без них она вылезет
  // за скруглённый край пилюли.
  const pill = (active: boolean) =>
    `relative overflow-hidden block px-3 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-colors ${
      active
        ? 'bg-cta text-base-darker'
        : 'text-text-secondary hover:text-text hover:bg-base-darker'
    }`;

  const chip = (active: boolean) =>
    `relative overflow-hidden px-3 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-colors ${
      active
        ? 'bg-cta text-base-darker'
        : 'bg-base-darker border border-border-subtle text-text-secondary hover:text-text'
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
                  <Link
                    href={catalogUrl({ base: WHEELS_BASE, ...keep, brand: undefined })}
                    className={pill(!query.brand)}
                  >
                    {copy.all}
                    <LinkPending />
                  </Link>
                  {facets.brands.map((brand) => (
                    <Link
                      key={brand.slug}
                      href={catalogUrl({ base: WHEELS_BASE, ...keep, brand: brand.slug })}
                      className={pill(query.brand === brand.slug)}
                    >
                      {brand.name} <span className="opacity-50">{brand.count}</span>
                      <LinkPending />
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
                    className={chip(!query.diameter)}
                  >
                    {copy.all}
                    <LinkPending />
                  </Link>
                  {facets.diameters.map((item) => (
                    <Link
                      key={item.value}
                      href={catalogUrl({ base: WHEELS_BASE, ...keep, diameter: String(item.value) })}
                      className={chip(query.diameter === String(item.value))}
                    >
                      {locale === 'en' ? `${item.value}″` : `R${item.value}`}{' '}
                      <span className="opacity-50">{item.count}</span>
                      <LinkPending />
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
                    <LinkPending />
                  </Link>
                  <Link
                    href={catalogUrl({ base: WHEELS_BASE, ...keep, condition: 'used' })}
                    className={pill(query.condition === 'used')}
                  >
                    {copy.used}
                    <LinkPending />
                  </Link>
                  <Link
                    href={catalogUrl({ base: WHEELS_BASE, ...keep, condition: 'new' })}
                    className={pill(query.condition === 'new')}
                  >
                    {copy.new}
                    <LinkPending />
                  </Link>
                </div>
              </div>
            </div>
          </FilterPanel>
        }
      >
        <Suspense
          key={resultsKey}
          fallback={
            <ResultsSkeleton
              locale={locale}
              count={WHEELS_PER_PAGE}
              /* У диска коробка характеристик в две строки — 58 против 42 у детали.
                 Это единственное, чем карточки двух доноров различаются по высоте. */
              infoBoxHeight={58}
              sort={<WheelSortLinks keep={keep} sort={sort} locale={locale} />}
            />
          }
        >
          <WheelResults query={query} keep={keep} sort={sort} locale={locale} />
        </Suspense>

        <p className="mt-10 text-[10px] font-bold uppercase tracking-widest text-text-muted">
          <Link href={SHOP_BASE} className="hover:text-text transition-colors">
            {locale === 'en' ? '← All parts' : '← Все запчасти'}
          </Link>
        </p>
      </ShopFrame>
    </>
  );
}
