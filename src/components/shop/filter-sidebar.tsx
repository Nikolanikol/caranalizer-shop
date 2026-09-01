import React from 'react';
import { Link } from '@/i18n/navigation';
import { Filter, RotateCcw } from 'lucide-react';
// Сборщики адресов берём из urls, а не из catalog: тот помечен `server-only`
// и тянет за собой весь двухмегабайтный каталог, а здесь нужны только пути.
import { SHOP_BASE, brandUrl, catalogUrl, categoryUrl, modelUrl } from '@/lib/shop/urls';
import type { Facet } from '@/lib/shop/catalog';
import type { PartCategory } from '@/types/part';
import type { Segment } from './catalog-view';
import type { ShopLocale } from '@/lib/shop/terms';
import { ui } from '@/lib/shop/ui-text';

/**
 * Фильтр — обычные ссылки, без JavaScript. Состояние живёт в адресе, поэтому
 * подборку можно переслать, а поисковик может её обойти.
 *
 * Марка и модель ведут на настоящие пути (`/zapchasti/zadnie-fonari/bmw/5-series`),
 * а не на параметры запроса: это посадочные страницы. Исключение — витрина раздела,
 * где категории ещё нет и пути под марку не существует.
 */

/*
 * `value` — то, что лежит в данных и уходит в адрес, поэтому оно русское и таким
 * остаётся на всех языках: это ключ фильтра, а не подпись. Переводится только `key`.
 */
const SIDES = [
  { key: 'sideLeft', value: 'Левый (LH)' },
  { key: 'sideRight', value: 'Правый (RH)' },
];

const POSITIONS = [
  { key: 'positionOuter', value: 'Внешний (в крыло)' },
  { key: 'positionInner', value: 'Внутренний (в крышку багажника)' },
];

/**
 * Что тащим за собой при переходе по любому фильтру.
 *
 * Марка и модель попадают сюда **только на витрине**, где пути под них не существует
 * и они живут параметрами. На посадочных страницах они лежат сегментами адреса,
 * и дублировать их ещё и параметром нельзя — фильтр применился бы дважды.
 *
 * Без них тут было так: на витрине с выбранными Peugeot 308 клик по «Любая сторона»
 * уводил на голый `/ru/zapchasti` — марка и модель молча пропадали.
 */
interface Query {
  brand?: string;
  model?: string;
  side?: string;
  position?: string;
  search?: string;
  sort?: string;
}

function Option({
  href,
  active,
  children,
  count,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? 'bg-cta/10 text-cta font-bold' : 'text-text-secondary hover:bg-base-darker hover:text-text'
      }`}
    >
      <span className="truncate">{children}</span>
      {count !== undefined && <span className="text-xs tabular-nums text-text-dim shrink-0">{count}</span>}
    </Link>
  );
}

export function FilterSidebar({
  category,
  brand,
  model,
  selectedBrandName,
  selectedModelName,
  query,
  brands,
  models,
  basePath,
  locale = 'ru',
}: {
  category?: PartCategory;
  brand?: Segment;
  model?: Segment;
  selectedBrandName?: string;
  /**
   * Имя выбранной модели — единственный признак выбора на витрине: сегмента адреса
   * там нет, и `model` приходит пустым. Пара к `selectedBrandName`, которая у марки
   * была с самого начала, а у модели её просто забыли завести.
   */
  selectedModelName?: string;
  query: Query;
  brands: Facet[];
  models: Facet[];
  basePath?: string;
  locale?: ShopLocale;
}) {
  const t = ui(locale);
  const base =
    basePath ??
    (model
      ? modelUrl(category!, brand!.slug, model.slug)
      : brand
        ? brandUrl(category!, brand.slug)
        : category
          ? categoryUrl(category)
          : SHOP_BASE);

  // Без категории пути под марку не существует, поэтому она остаётся параметром —
  // но параметром на текущем адресе, а не на корне раздела.
  const hrefForBrand = (facet: Facet) =>
    category ? brandUrl(category, facet.slug) : catalogUrl({ base, ...query, brand: facet.name, model: '' });
  const hrefForModel = (facet: Facet) =>
    category && brand
      ? modelUrl(category, brand.slug, facet.slug)
      : catalogUrl({ base, ...query, brand: selectedBrandName, model: facet.name });

  // Смена марки обязана сбрасывать модель: «308» у другой марки не существует,
  // и адрес с чужой парой отдал бы пустую выдачу.
  const allBrandsHref = category ? categoryUrl(category) : catalogUrl({ base, ...query, brand: '', model: '' });
  const allModelsHref =
    category && brand
      ? brandUrl(category, brand.slug)
      : catalogUrl({ base, ...query, brand: selectedBrandName, model: '' });

  // Модель выбрана либо сегментом пути (посадочные), либо параметром (витрина).
  const modelChosen = Boolean(model ?? selectedModelName);

  const hasFilters = Boolean(query.side || query.position || query.search);

  return (
    <div className="space-y-8 text-text-secondary">
      {/* На мобильном заголовок дублировал бы кнопку из FilterPanel — там он и живёт */}
      <div className="flex items-center justify-end lg:justify-between pb-4 border-b border-border-subtle">
        <h2 className="hidden lg:flex items-center gap-3 text-sm font-bold text-text">
          <Filter className="w-4 h-4 text-text-secondary" />
          {t.filters}
        </h2>
        {hasFilters && (
          <Link
            href={base}
            className="text-xs text-text-muted hover:text-text flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.reset}
          </Link>
        )}
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-text">{t.brand}</h3>
        <div className="max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
          <Option href={allBrandsHref} active={!selectedBrandName}>
            {t.allBrands}
          </Option>
          {brands.map((facet) => (
            <Option
              key={facet.slug}
              href={hrefForBrand(facet)}
              active={selectedBrandName === facet.name}
              count={facet.count}
            >
              {facet.name}
            </Option>
          ))}
        </div>
      </section>

      {selectedBrandName && models.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-text">{t.model}</h3>
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            <Option href={allModelsHref} active={!modelChosen}>
              {t.allModels}
            </Option>
            {models.map((facet) => (
              <Option
                key={facet.slug}
                href={hrefForModel(facet)}
                /*
                 * На посадочных сверяем слаг — он пришёл сегментом и точен. На витрине
                 * сегмента нет, и остаётся имя: ровно так же, как у марки выше.
                 * Пока этой второй ветки не было, подсветка на витрине не двигалась
                 * вовсе — «Все модели» горели всегда, и клик выглядел проигнорированным,
                 * хотя выдача под ним честно фильтровалась.
                 */
                active={model ? model.slug === facet.slug : selectedModelName === facet.name}
                count={facet.count}
              >
                {facet.name}
              </Option>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-text">{t.side}</h3>
        <Option href={catalogUrl({ base, ...query, side: '' })} active={!query.side}>
          {t.anySide}
        </Option>
        {SIDES.map((side) => (
          <Option
            key={side.value}
            href={catalogUrl({ base, ...query, side: side.value })}
            active={query.side === side.value}
          >
            {t[side.key]}
          </Option>
        ))}
      </section>

      {category !== 'protivotumannye-fary' && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-text">{t.position}</h3>
          <Option href={catalogUrl({ base, ...query, position: '' })} active={!query.position}>
            {t.anyPosition}
          </Option>
          {POSITIONS.map((position) => (
            <Option
              key={position.value}
              href={catalogUrl({ base, ...query, position: position.value })}
              active={query.position === position.value}
            >
              {t[position.key]}
            </Option>
          ))}
        </section>
      )}
    </div>
  );
}
