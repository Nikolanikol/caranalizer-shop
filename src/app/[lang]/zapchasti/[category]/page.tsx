import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATEGORIES, categoryUrl, isCategory } from '@/lib/shop/catalog';
import { SHOP_LOCALE, shopUrl } from '@/lib/shop/urls';
import { SITE_URL } from '@/lib/site';
import { CatalogView, type CatalogSearchParams } from '@/components/shop/catalog-view';

/**
 * Страница категории — верхний уровень иерархии, посадочная под «задние фонари»
 * и «противотуманные фары». Ниже неё идут марка и модель, каждая своей страницей.
 *
 * Пустой список для остальных языков — не заглушка: раздел одноязычный, и без этой
 * проверки каждая страница каталога собралась бы трижды, по разу на локаль.
 */
export function generateStaticParams({ params }: { params: { lang: string } }) {
  if (params.lang !== SHOP_LOCALE) return [];
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return {};

  const info = CATEGORIES[category];
  return {
    title: `${info.plural} из Южной Кореи`,
    description: info.description,
    alternates: { canonical: shopUrl(categoryUrl(category), SITE_URL) },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { category } = await params;
  if (!isCategory(category)) notFound();

  const info = CATEGORIES[category];

  return (
    <CatalogView
      category={category}
      searchParams={await searchParams}
      heading={info.plural}
      intro={info.description}
    />
  );
}
