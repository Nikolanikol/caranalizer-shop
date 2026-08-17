import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATEGORIES, brandUrl, getBrandBySlug, getBrands, isCategory } from '@/lib/shop/catalog';
import { SHOP_LOCALE, shopUrl } from '@/lib/shop/urls';
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
  params: Promise<{ category: string; brand: string }>;
}): Promise<Metadata> {
  const { category, brand } = await params;
  if (!isCategory(category)) return {};

  const name = await getBrandBySlug(category, brand);
  if (!name) return {};

  const info = CATEGORIES[category];
  return {
    title: `${info.plural} ${name} — оригинал из Кореи`,
    description: `${info.plural} ${name} с авторазборок Южной Кореи. Поиск по OEM-артикулу и модели, фотографии каждой детали, доставка по России.`,
    alternates: { canonical: shopUrl(brandUrl(category, brand), SITE_URL) },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; brand: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { category, brand } = await params;
  if (!isCategory(category)) notFound();

  const name = await getBrandBySlug(category, brand);
  if (!name) notFound();

  const info = CATEGORIES[category];

  return (
    <CatalogView
      category={category}
      brand={{ name, slug: brand }}
      searchParams={await searchParams}
      heading={`${info.plural} ${name}`}
      intro={`${info.plural} ${name} с авторазборок Южной Кореи. Все фотографии — того самого товара, который приедет. Выберите модель, чтобы сузить подборку.`}
    />
  );
}
