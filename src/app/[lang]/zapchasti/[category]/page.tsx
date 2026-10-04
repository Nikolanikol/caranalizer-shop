import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATEGORIES, categoryUrl, isCategory } from '@/lib/shop/catalog';
import { isShopLocale, listingPage, pagedPath, pagedTitle, SHOP_LOCALE, shopAlternates } from '@/lib/shop/urls';
import { categoryPlural } from '@/lib/shop/labels';
import { categoryCopy } from '@/lib/shop/landing-text';
import type { ShopLocale } from '@/lib/shop/terms';
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
  searchParams,
}: {
  params: Promise<{ lang: string; category: string }>;
  searchParams: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const page = listingPage({ ...(await searchParams) });
  const { lang, category } = await params;
  if (!isCategory(category)) return {};

  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const info = CATEGORIES[category];
  const copy = categoryCopy(locale, categoryPlural(category, locale, info.plural), info.description);

  return {
    title: pagedTitle(copy.title, page, locale),
    description: copy.description,
    alternates: shopAlternates(pagedPath(categoryUrl(category), page), SITE_URL, locale),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; category: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { lang, category } = await params;
  if (!isCategory(category)) notFound();

  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const info = CATEGORIES[category];
  const copy = categoryCopy(locale, categoryPlural(category, locale, info.plural), info.description);

  return (
    <CatalogView
      category={category}
      searchParams={await searchParams}
      heading={copy.heading}
      intro={copy.intro}
      locale={locale}
    />
  );
}
