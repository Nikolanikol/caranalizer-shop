import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  CATEGORIES,
  getAllParts,
  getBrandBySlug,
  getModelBySlug,
  isCategory,
  modelUrl,
} from '@/lib/shop/catalog';
import { SHOP_LOCALE, shopUrl } from '@/lib/shop/urls';
import { SITE_URL } from '@/lib/site';
import { CatalogView, type CatalogSearchParams } from '@/components/shop/catalog-view';

/**
 * Посадочная под модель: «задние фонари BMW 5 Series» — самый частый вид запроса.
 * Сюда же попадает сегмент `prochee`: 17 товаров, у которых донор не указал модель.
 * Отдельной страницей он бесполезен, поэтому из индекса закрыт.
 */
export async function generateStaticParams({ params }: { params: { lang: string } }) {
  if (params.lang !== SHOP_LOCALE) return [];

  const parts = await getAllParts();
  const seen = new Set<string>();

  return parts
    .map((part) => ({ category: part.category, brand: part.brandSlug, model: part.modelSlug }))
    .filter((entry) => {
      const key = `${entry.category}/${entry.brand}/${entry.model}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; brand: string; model: string }>;
}): Promise<Metadata> {
  const { category, brand, model } = await params;
  if (!isCategory(category)) return {};

  const brandName = await getBrandBySlug(category, brand);
  const found = await getModelBySlug(category, brand, model);
  if (!brandName || !found) return {};

  const info = CATEGORIES[category];

  // Модель не указана — страница существует, чтобы товар не остался без родителя,
  // но в индекс ей нельзя: заголовок и содержимое дублируют страницу марки.
  if (!found.name) {
    return { title: `${info.plural} ${brandName}`, robots: { index: false, follow: true } };
  }

  const full = `${brandName} ${found.name}`;
  return {
    title: `${info.title} ${full} — оригинал из Кореи`,
    description: `${info.plural} ${full} с авторазборок Южной Кореи. Поиск по OEM-артикулу, фотографии каждой детали, доставка по России.`,
    alternates: { canonical: shopUrl(modelUrl(category, brand, model), SITE_URL) },
  };
}

export default async function ModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; brand: string; model: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { category, brand, model } = await params;
  if (!isCategory(category)) notFound();

  const brandName = await getBrandBySlug(category, brand);
  const found = await getModelBySlug(category, brand, model);
  if (!brandName || !found) notFound();

  const info = CATEGORIES[category];
  const full = found.name ? `${brandName} ${found.name}` : brandName;

  return (
    <CatalogView
      category={category}
      brand={{ name: brandName, slug: brand }}
      model={{ name: found.name, slug: model }}
      searchParams={await searchParams}
      heading={`${info.plural} ${full}`}
      intro={
        found.name
          ? `${info.plural} ${full} с авторазборок Южной Кореи. Сверьте деталь по фотографиям и OE-номеру — фото показывают именно тот товар, который приедет.`
          : `${info.plural} ${brandName}, у которых донор не указал модель. Сверяйте по фотографиям и OE-номеру.`
      }
    />
  );
}
