import React from 'react';
import { Link } from '@/i18n/navigation';
import { PackageSearch } from 'lucide-react';
import {
  CATEGORIES,
  SHOP_CATALOG,
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

/**
 * Общая витрина: главная, категория, марка и модель — одна и та же страница
 * с разным уровнем сужения. Считается целиком на сервере, состояние фильтров живёт в адресе.
 *
 * Марка и модель приходят сюда сегментами пути, а не параметрами запроса: это посадочные
 * страницы под «фонарь задний BMW 5 Series», и у каждой должен быть свой адрес.
 */

const SORTS: { value: SortBy; label: string }[] = [
  { value: 'popular', label: 'По умолчанию' },
  { value: 'price_asc', label: 'Сначала дешёвые' },
  { value: 'price_desc', label: 'Сначала дорогие' },
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
}) {
  const sort = (SORTS.find((item) => item.value === searchParams.sort)?.value ?? 'popular') as SortBy;

  // Путь текущей подборки. Всё, что мельче марки и модели, остаётся параметрами запроса.
  const base =
    basePath ??
    (model
      ? modelUrl(category!, brand!.slug, model.slug)
      : brand
        ? brandUrl(category!, brand.slug)
        : category
          ? categoryUrl(category)
          : SHOP_CATALOG);

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
    sort: sort === 'popular' ? '' : sort,
  };

  return (
    <>
      {/*
        Шапка каталога намеренно низкая. В прежнем виде она съедала весь первый экран:
        первый товар начинался на 598 пикселе при высоте окна 720, а на телефоне — сильно ниже.
        Пилюля-подпись «Каталог оригинальной оптики» убрана: она ничего не сообщала.
      */}
      <div className="relative bg-base border-b border-border-subtle py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            {/*
              Размер держим на ступень выше подзаголовков раздела: при text-2xl главный
              заголовок страницы читался слабее пилюль категорий справа, и после перехода
              с витрины — где h1 идёт text-3xl sm:text-5xl — выглядело так, будто заголовок
              вообще пропал. Отступы шапки при этом не растут: они и есть то, что когда-то
              съедало первый экран.
            */}
            <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight leading-tight">
              {heading}
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-2">{intro}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {(Object.keys(CATEGORIES) as PartCategory[]).map((key) => (
              <Link
                key={key}
                href={categoryUrl(key)}
                className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  category === key
                    ? 'bg-cta text-base-darker'
                    : 'bg-base-darker border border-border-subtle text-text-secondary hover:text-text'
                }`}
              >
                {CATEGORIES[key].plural}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Не <main>: он уже есть в layout раздела — вложенный ломает разметку и переходы по «к содержимому». */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-28 lg:border-r border-border-subtle lg:pr-6 pb-6 lg:pb-8">
            <FilterPanel
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
              />
            </FilterPanel>
          </aside>

          <div className="flex-1 w-full">
            {/* Поиска нет в шапке — он стоит рядом с товарами, здесь и на главной */}
            <div className="mb-6">
              <SearchForm initialTerm={searchParams.search ?? ''} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Найдено: <strong className="text-text">{result.total}</strong>
                {searchParams.search && (
                  <>
                    {' '}
                    по запросу <strong className="text-text">«{searchParams.search}»</strong>
                  </>
                )}
              </p>

              <div className="flex items-center gap-2">
                {SORTS.map((item) => (
                  <Link
                    key={item.value}
                    href={catalogUrl({
                      base,
                      ...query,
                      brand: brand ? undefined : searchParams.brand,
                      model: brand ? undefined : searchParams.model,
                      sort: item.value === 'popular' ? '' : item.value,
                    })}
                    className={`px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      sort === item.value
                        ? 'bg-base-darker text-text border border-border'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {result.items.length === 0 ? (
              <div className="bg-elevated border border-border-subtle rounded p-12 text-center space-y-4">
                <span className="w-14 h-14 rounded bg-base-darker text-text-dim flex items-center justify-center mx-auto border border-border-subtle">
                  <PackageSearch className="w-6 h-6" />
                </span>
                <h2 className="text-sm font-black uppercase tracking-widest text-text">Ничего не найдено</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted max-w-md mx-auto leading-relaxed">
                  Попробуйте другой артикул или сбросьте фильтры.
                </p>
                <Link
                  href={base}
                  className="inline-block px-6 py-3 rounded bg-base-darker hover:bg-surface text-text-secondary text-[10px] font-bold uppercase tracking-widest border border-border-subtle transition-colors"
                >
                  Сбросить фильтры
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {result.items.map((part) => (
                    <ProductCard key={partKey(part)} part={part} />
                  ))}
                </div>

                <Pagination
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
          </div>
        </div>
      </div>
    </>
  );
}

/** Слаг уникален только внутри марки и модели — ключом берём весь путь. */
function partKey(part: { category: string; brandSlug: string; modelSlug: string; slug: string }): string {
  return `${part.category}/${part.brandSlug}/${part.modelSlug}/${part.slug}`;
}
