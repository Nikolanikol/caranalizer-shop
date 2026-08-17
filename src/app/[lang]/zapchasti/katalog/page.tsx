import React from 'react';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { SHOP_CATALOG, getTopModels, modelUrl } from '@/lib/shop/catalog';
import { shopUrl } from '@/lib/shop/urls';
import { SITE_URL } from '@/lib/site';
import { CatalogView, type CatalogSearchParams } from '@/components/shop/catalog-view';

/**
 * Каталог — полный нефильтрованный список всех позиций обеих категорий.
 *
 * Пересечение с /zapchasti/zadnie-fonari большое (967 против 915), и это осознанное
 * решение владельца: каталог должен показывать товар, а не оглавление. Чтобы страницы
 * всё же различались, у каталога свой заголовок и описание, а под сеткой стоит навигация
 * по частым моделям, которой на странице категории нет. Canonical всегда на сам каталог,
 * поэтому варианты с фильтрами и страницами в индекс отдельно не уходят.
 */
export const metadata: Metadata = {
  title: 'Каталог запчастей из Южной Кореи',
  description:
    'Каталог оригинальной оптики с авторазборок Южной Кореи: задние фонари и противотуманные фары для 30 марок. Поиск по OEM-артикулу, марке и модели.',
  alternates: { canonical: shopUrl(SHOP_CATALOG, SITE_URL) },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const models = await getTopModels(12);

  // Блок навигации показываем только на чистом каталоге: поверх результатов поиска
  // он сбивает — человек уже нашёл, что искал.
  const isFiltered = Boolean(params.search || params.brand || params.side || params.position);

  return (
    <CatalogView
      basePath={SHOP_CATALOG}
      searchParams={params}
      heading="Каталог запчастей из Кореи"
      intro="Оригинальная оптика с авторазборок Южной Кореи — задние фонари и противотуманные фары. Все фотографии показывают именно тот товар, который приедет."
      extra={
        isFiltered ? null : (
          <section className="mt-12 pt-8 border-t border-border-subtle space-y-4">
            <h2 className="text-lg font-bold text-text tracking-tight">Чаще всего спрашивают</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {models.map((item) => (
                <Link
                  key={`${item.category}/${item.brandSlug}/${item.slug}`}
                  href={modelUrl(item.category, item.brandSlug, item.slug)}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-cta hover:border-cta/40 transition-colors"
                >
                  <span className="truncate">{item.name}</span>
                  <span className="text-[10px] tabular-nums text-text-dim shrink-0">{item.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )
      }
    />
  );
}
