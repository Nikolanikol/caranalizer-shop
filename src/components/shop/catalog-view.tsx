import React from 'react';
import { Link } from '@/i18n/navigation';
import { PackageSearch } from 'lucide-react';
import {
  CATEGORIES,
  SHOP_BASE,
  brandUrl,
  catalogUrl,
  categoryUrl,
  findParts,
  getBrands,
  getModels,
  modelUrl,
  type SortBy,
} from '@/lib/shop/catalog';
import type { PartCategory } from '@/types/part';
import { ProductCard } from './product-card';
import { FilterSidebar } from './filter-sidebar';
import { FilterPanel } from './filter-panel';
import { Pagination } from './pagination';
import { SearchForm } from './search-form';
import { ShopFrame, ShopHeader } from './shop-shell';
import { categoryPlural } from '@/lib/shop/labels';
import type { ShopLocale } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';

/**
 * Общая витрина: главная, категория, марка и модель — одна и та же страница
 * с разным уровнем сужения. Считается целиком на сервере, состояние фильтров живёт в адресе.
 *
 * Марка и модель приходят сюда сегментами пути, а не параметрами запроса: это посадочные
 * страницы под «фонарь задний BMW 5 Series», и у каждой должен быть свой адрес.
 */

/** Порядок и ключ подписи. Сама подпись — в словаре интерфейса: она зависит от языка. */
const SORTS: { value: SortBy; key: string }[] = [
  { value: 'popular', key: 'sortPopular' },
  { value: 'newest', key: 'sortNewest' },
  { value: 'price_asc', key: 'sortPriceAsc' },
  { value: 'price_desc', key: 'sortPriceDesc' },
];

export interface CatalogSearchParams {
  brand?: string;
  model?: string;
  side?: string;
  position?: string;
  search?: string;
  sort?: string;
  page?: string;
}

export interface Segment {
  name: string;
  slug: string;
}

export async function CatalogView({
  category,
  brand,
  model,
  searchParams,
  heading,
  intro,
  basePath,
  extra,
  defaultSort = 'popular',
  locale = 'ru',
}: {
  category?: PartCategory;
  brand?: Segment;
  model?: Segment;
  searchParams: CatalogSearchParams;
  heading: string;
  intro: string;
  /** Путь страницы, если он не выводится из категории и марки. Нужен /katalog. */
  basePath?: string;
  /** Дополнительный блок под сеткой — навигация по маркам и моделям на /katalog. */
  extra?: React.ReactNode;
  /**
   * Порядок, если посетитель ничего не выбрал. Витрина открывается свежими
   * поступлениями: это её смысл, и раньше она показывала их отдельным блоком.
   */
  defaultSort?: SortBy;
  /** Язык страницы. Приходит сегментом пути — компонент серверный и сам его не знает. */
  locale?: ShopLocale;
}) {
  const t = ui(locale);
  const sort = (SORTS.find((item) => item.value === searchParams.sort)?.value ?? defaultSort) as SortBy;

  // Путь текущей подборки. Всё, что мельче марки и модели, остаётся параметрами запроса.
  const base =
    basePath ??
    (model
      ? modelUrl(category!, brand!.slug, model.slug)
      : brand
        ? brandUrl(category!, brand.slug)
        : category
          ? categoryUrl(category)
          : SHOP_BASE);

  /*
   * Хлебные крошки строим здесь: категория, марка и модель уже известны компоненту,
   * и дописывать их в каждую из трёх страниц значило бы завести три расходящиеся копии.
   * Последняя ступень — сама страница, у неё адреса нет.
   *
   * На витрине крошек нет вовсе: подниматься с неё некуда.
   */
  const steps = category
    ? [
        { name: t.section, href: SHOP_BASE },
        {
          name: categoryPlural(category, locale, CATEGORIES[category].plural),
          href: categoryUrl(category),
        },
        ...(brand ? [{ name: brand.name, href: brandUrl(category, brand.slug) }] : []),
        // Модель отбрасывается по пустому имени, а не по отсутствию сегмента: у товаров
        // без модели сегмент есть (`prochee`), а имени нет — и ступень выходила пустой,
        // с висящей стрелкой и ссылкой марки на саму себя.
        ...(brand && model?.name
          ? [{ name: model.name, href: modelUrl(category, brand.slug, model.slug) }]
          : []),
      ].filter((step) => step.name)
    : [];

  // Последняя ступень — текущая страница, ссылки у неё быть не должно.
  const trail = steps.length
    ? steps.map((step, index) => (index === steps.length - 1 ? { name: step.name } : step))
    : undefined;

  const result = await findParts({
    category,
    brandSlug: brand?.slug,
    modelSlug: model?.slug,
    // Фильтр по марке параметром живёт только на главной: пути под марку там нет.
    brand: brand ? undefined : searchParams.brand,
    model: brand ? undefined : searchParams.model,
    side: searchParams.side,
    position: searchParams.position,
    search: searchParams.search,
    sort,
    page: Number(searchParams.page) || 1,
  });

  const selectedBrandName = brand?.name ?? searchParams.brand;
  const [brands, models] = await Promise.all([
    getBrands(category),
    selectedBrandName ? getModels(selectedBrandName, category) : Promise.resolve([]),
  ]);

  // Параметры, которые надо сохранять при переходе по фильтрам и страницам.
  const query = {
    side: searchParams.side,
    position: searchParams.position,
    search: searchParams.search,
    sort: sort === defaultSort ? '' : sort,
  };

  return (
    <>
      <ShopHeader heading={heading} intro={intro} activeCategory={category} trail={trail} locale={locale} />

      <ShopFrame
        sidebar={
          <FilterPanel
              locale={locale}
              activeCount={
                [selectedBrandName, model, searchParams.side, searchParams.position].filter(Boolean).length
              }
            >
              <FilterSidebar
                category={category}
                brand={brand}
                model={model}
                selectedBrandName={selectedBrandName}
                query={query}
                brands={brands}
                models={models}
                basePath={basePath}
                locale={locale}
              />
          </FilterPanel>
        }
      >
        {/* Поиска нет в шапке — он стоит рядом с товарами, здесь и на витрине */}
            <div className="mb-6">
              <SearchForm initialTerm={searchParams.search ?? ''} locale={locale} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                {t.found}: <strong className="text-text">{result.total}</strong>
                {searchParams.search && (
                  <>
                    {' '}
                    {t.forQuery} <strong className="text-text">«{searchParams.search}»</strong>
                  </>
                )}
              </p>

              {/*
                flex-wrap обязателен: четыре варианта с русскими подписями не влезают
                в 375 пикселей, и без переноса ряд был шире экрана на 27 px — от этого
                вбок ехала вся страница, а «Сначала дорогие» обрезалось на краю.
              */}
              <div className="flex flex-wrap items-center gap-2">
                {SORTS.map((item) => (
                  <Link
                    key={item.value}
                    href={catalogUrl({
                      base,
                      ...query,
                      brand: brand ? undefined : searchParams.brand,
                      model: brand ? undefined : searchParams.model,
                      sort: item.value === defaultSort ? '' : item.value,
                    })}
                    className={`px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      sort === item.value
                        ? 'bg-base-darker text-text border border-border'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {t[item.key]}
                  </Link>
                ))}
              </div>
            </div>

            {result.items.length === 0 ? (
              <div className="bg-elevated border border-border-subtle rounded p-12 text-center space-y-4">
                <span className="w-14 h-14 rounded bg-base-darker text-text-dim flex items-center justify-center mx-auto border border-border-subtle">
                  <PackageSearch className="w-6 h-6" />
                </span>
                <h2 className="text-sm font-black uppercase tracking-widest text-text">{t.nothingFound}</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted max-w-md mx-auto leading-relaxed">
                  {t.nothingFoundHint}
                </p>
                <Link
                  href={base}
                  className="inline-block px-6 py-3 rounded bg-base-darker hover:bg-surface text-text-secondary text-[10px] font-bold uppercase tracking-widest border border-border-subtle transition-colors"
                >
                  {t.resetFilters}
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {result.items.map((part) => (
                    <ProductCard key={partKey(part)} part={part} locale={locale} />
                  ))}
                </div>

                <Pagination
                  locale={locale}
                  page={result.page}
                  totalPages={result.totalPages}
                  base={base}
                  query={{
                    ...query,
                    brand: brand ? undefined : searchParams.brand,
                    model: brand ? undefined : searchParams.model,
                  }}
                />
              </div>
            )}

        {extra}
      </ShopFrame>
    </>
  );
}

/** Слаг уникален только внутри марки и модели — ключом берём весь путь. */
function partKey(part: { category: string; brandSlug: string; modelSlug: string; slug: string }): string {
  return `${part.category}/${part.brandSlug}/${part.modelSlug}/${part.slug}`;
}
