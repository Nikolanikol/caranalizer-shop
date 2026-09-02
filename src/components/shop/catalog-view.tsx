import React, { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { PackageSearch } from 'lucide-react';
import {
  CATEGORIES,
  ITEMS_PER_PAGE,
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
import { LinkPending } from './link-pending';
import { Pagination } from './pagination';
import { ResultsSkeleton, ResultsToolbar } from './results';
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
 *
 * **Выдача отделена от оболочки `<Suspense>` — и это не оптимизация, а починка.**
 * Клик по фильтру на витрине меняет только параметры запроса, а на такой переход
 * `loading.tsx` не срабатывает: замерено на чистом Next 16.2.9 — смена сегмента пути даёт
 * скелет сразу, смена `?brand=` не даёт вовсе, и старая выдача висит весь ответ сервера.
 * Пока `findParts` ждали в теле этого компонента, отдавать было нечего: страница целиком
 * ждала базу. Теперь оболочка (шапка, фильтр, поиск) уходит к посетителю сразу, а на месте
 * товаров стоит скелет.
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

/** Параметры, которые тащим за собой при переходе по фильтру, сортировке и страницам. */
type CarriedQuery = Parameters<typeof catalogUrl>[0];

/**
 * Ряд сортировки. Вынесен отдельно затем, что рисуется дважды: в настоящей выдаче
 * и в скелете под ней. От данных он не зависит вовсе — порядок известен из адреса, —
 * и обязан стоять на том же месте в обоих случаях, иначе подстановка выдачи дёргала бы
 * ряд по вертикали.
 */
function SortLinks({
  base,
  query,
  sort,
  defaultSort,
  locale,
}: {
  base: string;
  query: Omit<CarriedQuery, 'base' | 'page'>;
  sort: SortBy;
  defaultSort: SortBy;
  locale: ShopLocale;
}) {
  const t = ui(locale);

  return (
    /*
      flex-wrap обязателен: четыре варианта с русскими подписями не влезают
      в 375 пикселей, и без переноса ряд был шире экрана на 27 px — от этого
      вбок ехала вся страница, а «Сначала дорогие» обрезалось на краю.
    */
    <div className="flex flex-wrap items-center gap-2">
      {SORTS.map((item) => (
        <Link
          key={item.value}
          href={catalogUrl({
            base,
            ...query,
            sort: item.value === defaultSort ? '' : item.value,
          })}
          className={`relative overflow-hidden px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
            sort === item.value
              ? 'bg-base-darker text-text border border-border'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {t[item.key]}
          <LinkPending />
        </Link>
      ))}
    </div>
  );
}

/**
 * Сама выдача. Отдельным компонентом ровно затем, что здесь стоит единственный
 * медленный `await` страницы: под `<Suspense>` он перестаёт задерживать оболочку.
 */
async function CatalogResults({
  category,
  brand,
  model,
  searchParams,
  base,
  query,
  sort,
  defaultSort,
  locale,
}: {
  category?: PartCategory;
  brand?: Segment;
  model?: Segment;
  searchParams: CatalogSearchParams;
  base: string;
  query: Omit<CarriedQuery, 'base' | 'page'>;
  sort: SortBy;
  defaultSort: SortBy;
  locale: ShopLocale;
}) {
  const t = ui(locale);

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

  return (
    <>
      <ResultsToolbar>
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
          {t.found}: <strong className="text-text">{result.total}</strong>
          {searchParams.search && (
            <>
              {' '}
              {t.forQuery} <strong className="text-text">«{searchParams.search}»</strong>
            </>
          )}
        </p>

        <SortLinks base={base} query={query} sort={sort} defaultSort={defaultSort} locale={locale} />
      </ResultsToolbar>

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
            query={query}
          />
        </div>
      )}
    </>
  );
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

  const selectedBrandName = brand?.name ?? searchParams.brand;
  /*
   * То же самое для модели, и заводится оно ровно по той же причине, что у марки:
   * на витрине сегмента адреса нет, выбор приезжает параметром. Пары не было, и фильтр
   * по модели там не подсвечивался вовсе — «Все модели» горели при любом выборе.
   *
   * `brand ? undefined` повторяет условие из `findParts`: на посадочной странице
   * марки параметр `model` в выдаче не участвует, и показывать его выбранным нельзя.
   */
  const selectedModelName = model?.name ?? (brand ? undefined : searchParams.model);

  /*
   * Фасеты ждём здесь, а не под `<Suspense>`, и это осознанно: они рисуют сам фильтр,
   * а прятать фильтр под скелет на каждый клик — хуже, чем ждать. Ждать при этом почти
   * не приходится: обе функции кэшированы в `catalog.ts`, потому что от стороны,
   * сортировки и страницы не зависят и меняются раз в скрап.
   */
  const [brands, models] = await Promise.all([
    getBrands(category),
    selectedBrandName ? getModels(selectedBrandName, category) : Promise.resolve([]),
  ]);

  /*
   * Параметры, которые надо сохранять при переходе по фильтрам, сортировке и страницам.
   *
   * Марка и модель лежат здесь же, а не дописываются у каждой ссылки отдельно. Раньше
   * их добавляли руками — и у сортировки с пагинацией добавляли, а у боковой панели
   * забыли: на витрине клик по стороне или позиции уводил на голый `/ru/zapchasti`
   * и молча терял выбранные марку с моделью. Один источник вместо трёх копий.
   */
  const query = {
    brand: brand ? undefined : searchParams.brand,
    model: brand ? undefined : searchParams.model,
    side: searchParams.side,
    position: searchParams.position,
    search: searchParams.search,
    sort: sort === defaultSort ? '' : sort,
  };

  /*
   * Ключ границы Suspense. **Обязателен, и это не перестраховка** — замерено:
   * без ключа React переиспользует границу, fallback не показывается вовсе, а смена
   * адреса ждёт полного ответа сервера (1 540 мс застывшего экрана). С ключом адрес
   * и скелет коммитятся за 65 мс.
   *
   * В ключ входит всё, что меняет выдачу, — и путь тоже: на посадочных страницах
   * марка с моделью приходят сегментами, а не параметрами.
   */
  const resultsKey = JSON.stringify([base, sort, searchParams]);

  return (
    <>
      <ShopHeader heading={heading} intro={intro} activeCategory={category} trail={trail} locale={locale} />

      <ShopFrame
        sidebar={
          <FilterPanel
            locale={locale}
            activeCount={
              [selectedBrandName, selectedModelName, searchParams.side, searchParams.position].filter(Boolean)
                .length
            }
          >
            <FilterSidebar
              category={category}
              brand={brand}
              model={model}
              selectedBrandName={selectedBrandName}
              selectedModelName={selectedModelName}
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

        <Suspense
          key={resultsKey}
          fallback={
            <ResultsSkeleton
              locale={locale}
              count={ITEMS_PER_PAGE}
              sort={
                <SortLinks base={base} query={query} sort={sort} defaultSort={defaultSort} locale={locale} />
              }
            />
          }
        >
          <CatalogResults
            category={category}
            brand={brand}
            model={model}
            searchParams={searchParams}
            base={base}
            query={query}
            sort={sort}
            defaultSort={defaultSort}
            locale={locale}
          />
        </Suspense>

        {extra}
      </ShopFrame>
    </>
  );
}

/** Слаг уникален только внутри марки и модели — ключом берём весь путь. */
function partKey(part: { category: string; brandSlug: string; modelSlug: string; slug: string }): string {
  return `${part.category}/${part.brandSlug}/${part.modelSlug}/${part.slug}`;
}
