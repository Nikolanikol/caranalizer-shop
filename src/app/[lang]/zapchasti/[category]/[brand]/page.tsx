import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATEGORIES, brandUrl, getBrandBySlug, getBrands, isCategory } from '@/lib/shop/catalog';
import { SHOP_LOCALE, isShopLocale, shopAlternates } from '@/lib/shop/urls';
import { categoryPlural } from '@/lib/shop/labels';
import { brandCopy } from '@/lib/shop/landing-text';
import type { ShopLocale } from '@/lib/shop/terms';
import { SITE_URL } from '@/lib/site';
import { CatalogView, type CatalogSearchParams } from '@/components/shop/catalog-view';

/**
 * Посадочная под марку: «задние фонари BMW». Раньше эта подборка жила как `?brand=BMW`
 * и канонизировалась на категорию — то есть ранжироваться не могла в принципе,
 * хотя ищут именно так. Теперь у неё свой адрес: /zapchasti/zadnie-fonari/bmw.
 */
export async function generateStaticParams({ params }: { params: { lang: string } }) {
  if (params.lang !== SHOP_LOCALE) return [];

  const result: { category: string; brand: string }[] = [];
  for (const category of Object.keys(CATEGORIES)) {
    const brands = await getBrands(category as keyof typeof CATEGORIES);
    result.push(...brands.map((brand) => ({ category, brand: brand.slug })));
  }
  return result;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string; brand: string }>;
}): Promise<Metadata> {
  const { lang, category, brand } = await params;
  if (!isCategory(category)) return {};

  const name = await getBrandBySlug(category, brand);
  if (!name) return {};

  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const info = CATEGORIES[category];
  const copy = brandCopy(locale, categoryPlural(category, locale, info.plural), name);

  return {
    title: copy.title,
    description: copy.description,
    alternates: shopAlternates(brandUrl(category, brand), SITE_URL, locale),
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; category: string; brand: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { lang, category, brand } = await params;
  if (!isCategory(category)) notFound();

  const name = await getBrandBySlug(category, brand);
  if (!name) notFound();

  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const info = CATEGORIES[category];
  const copy = brandCopy(locale, categoryPlural(category, locale, info.plural), name);

  return (
    <CatalogView
      category={category}
      brand={{ name, slug: brand }}
      searchParams={await searchParams}
      heading={copy.heading}
      intro={copy.intro}
      locale={locale}
    />
  );
}
