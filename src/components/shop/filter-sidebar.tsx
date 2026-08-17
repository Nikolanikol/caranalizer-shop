import React from 'react';
import { Link } from '@/i18n/navigation';
import { Filter, RotateCcw } from 'lucide-react';
// Сборщики адресов берём из urls, а не из catalog: тот помечен `server-only`
// и тянет за собой весь двухмегабайтный каталог, а здесь нужны только пути.
import { SHOP_CATALOG, brandUrl, catalogUrl, categoryUrl, modelUrl } from '@/lib/shop/urls';
import type { Facet } from '@/lib/shop/catalog';
import type { PartCategory } from '@/types/part';
import type { Segment } from './catalog-view';

/**
 * Фильтр — обычные ссылки, без JavaScript. Состояние живёт в адресе, поэтому
 * подборку можно переслать, а поисковик может её обойти.
 *
 * Марка и модель ведут на настоящие пути (`/zapchasti/zadnie-fonari/bmw/5-series`),
 * а не на параметры запроса: это посадочные страницы. Исключение — витрина раздела,
 * где категории ещё нет и пути под марку не существует.
 */

const SIDES = [
  { label: 'Левая', value: 'Левый (LH)' },
  { label: 'Правая', value: 'Правый (RH)' },
];

const POSITIONS = [
  { label: 'В крыло', value: 'Внешний (в крыло)' },
  { label: 'В крышку', value: 'Внутренний (в крышку багажника)' },
];

interface Query {
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
  query,
  brands,
  models,
  basePath,
}: {
  category?: PartCategory;
  brand?: Segment;
  model?: Segment;
  selectedBrandName?: string;
  query: Query;
  brands: Facet[];
  models: Facet[];
  basePath?: string;
}) {
  const base =
    basePath ??
    (model
      ? modelUrl(category!, brand!.slug, model.slug)
      : brand
        ? brandUrl(category!, brand.slug)
        : category
          ? categoryUrl(category)
          : SHOP_CATALOG);

  // Без категории пути под марку не существует, поэтому она остаётся параметром —
  // но параметром на текущем адресе, а не на корне раздела.
  const hrefForBrand = (facet: Facet) =>
    category ? brandUrl(category, facet.slug) : catalogUrl({ base, brand: facet.name });
  const hrefForModel = (facet: Facet) =>
    category && brand
      ? modelUrl(category, brand.slug, facet.slug)
      : catalogUrl({ base, brand: selectedBrandName, model: facet.name });

  const allBrandsHref = category ? categoryUrl(category) : base;
  const allModelsHref =
    category && brand ? brandUrl(category, brand.slug) : catalogUrl({ base, brand: selectedBrandName });

  const hasFilters = Boolean(query.side || query.position || query.search);

  return (
    <div className="space-y-8 text-text-secondary">
      {/* На мобильном заголовок дублировал бы кнопку из FilterPanel — там он и живёт */}
      <div className="flex items-center justify-end lg:justify-between pb-4 border-b border-border-subtle">
        <h2 className="hidden lg:flex items-center gap-3 text-sm font-bold text-text">
          <Filter className="w-4 h-4 text-text-secondary" />
          Фильтры каталога
        </h2>
        {hasFilters && (
          <Link
            href={base}
            className="text-xs text-text-muted hover:text-text flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Сбросить
          </Link>
        )}
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-text">Марка автомобиля</h3>
        <div className="max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
          <Option href={allBrandsHref} active={!selectedBrandName}>
            Все марки
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
          <h3 className="text-sm font-bold text-text">Модель</h3>
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            <Option href={allModelsHref} active={!model}>
              Все модели
            </Option>
            {models.map((facet) => (
              <Option
                key={facet.slug}
                href={hrefForModel(facet)}
                active={model?.slug === facet.slug}
                count={facet.count}
              >
                {facet.name}
              </Option>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-text">Сторона установки</h3>
        <Option href={catalogUrl({ base, ...query, side: '' })} active={!query.side}>
          Любая сторона
        </Option>
        {SIDES.map((side) => (
          <Option
            key={side.value}
            href={catalogUrl({ base, ...query, side: side.value })}
            active={query.side === side.value}
          >
            {side.label}
          </Option>
        ))}
      </section>

      {category !== 'protivotumannye-fary' && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-text">Расположение</h3>
          <Option href={catalogUrl({ base, ...query, position: '' })} active={!query.position}>
            Любое
          </Option>
          {POSITIONS.map((position) => (
            <Option
              key={position.value}
              href={catalogUrl({ base, ...query, position: position.value })}
              active={query.position === position.value}
            >
              {position.label}
            </Option>
          ))}
        </section>
      )}
    </div>
  );
}
