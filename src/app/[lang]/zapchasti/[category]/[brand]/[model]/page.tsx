import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  CATEGORIES,
  getLandingPaths,
  getBrandBySlug,
  getModelBySlug,
  isCategory,
  modelUrl,
} from '@/lib/shop/catalog';
import { SHOP_LOCALE, isShopLocale, shopAlternates } from '@/lib/shop/urls';
import { categoryPlural, categoryTitle } from '@/lib/shop/labels';
import { modelCopy } from '@/lib/shop/landing-text';
import type { ShopLocale } from '@/lib/shop/terms';
import { SITE_URL } from '@/lib/site';
import { CatalogView, type CatalogSearchParams } from '@/components/shop/catalog-view';

/**
 * Посадочная под модель: «задние фонари BMW 5 Series» — самый частый вид запроса.
 * Сюда же попадает сегмент `prochee`: 17 товаров, у которых донор не указал модель.
 * Отдельной страницей он бесполезен, поэтому из индекса закрыт.
 */
export async function generateStaticParams({ params }: { params: { lang: string } }) {
  if (params.lang !== SHOP_LOCALE) return [];

  // Готовые тройки вместо перебора всего каталога: тянуть 18 тысяч товаров ради
  // полутора тысяч уникальных адресов моделей — лишняя работа на каждой сборке.
  const { models } = await getLandingPaths();
  return [...models].map((path) => {
    const [category, brand, model] = path.split('/');
    return { category, brand, model };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string; brand: string; model: string }>;
}): Promise<Metadata> {
  const { lang, category, brand, model } = await params;
  if (!isCategory(category)) return {};

  const brandName = await getBrandBySlug(category, brand);
  const found = await getModelBySlug(category, brand, model);
  if (!brandName || !found) return {};

  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const info = CATEGORIES[category];
  const plural = categoryPlural(category, locale, info.plural);

  // Модель не указана — страница существует, чтобы товар не остался без родителя,
  // но в индекс ей нельзя: заголовок и содержимое дублируют страницу марки.
  if (!found.name) {
    return { title: `${plural} ${brandName}`, robots: { index: false, follow: true } };
  }

  const copy = modelCopy(locale, {
    plural,
    title: locale === 'en' ? categoryTitle(category, locale) : info.title,
    brand: brandName,
    model: found.name,
  });

  return {
    title: copy.title,
    description: copy.description,
    alternates: shopAlternates(modelUrl(category, brand, model), SITE_URL, locale),
  };
}

export default async function ModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; category: string; brand: string; model: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { lang, category, brand, model } = await params;
  if (!isCategory(category)) notFound();

  const brandName = await getBrandBySlug(category, brand);
  const found = await getModelBySlug(category, brand, model);
  if (!brandName || !found) notFound();

  const locale: ShopLocale = isShopLocale(lang) ? lang : 'ru';
  const info = CATEGORIES[category];
  const copy = modelCopy(locale, {
    plural: categoryPlural(category, locale, info.plural),
    title: locale === 'en' ? categoryTitle(category, locale) : info.title,
    brand: brandName,
    model: found.name,
  });

  return (
    <CatalogView
      category={category}
      brand={{ name: brandName, slug: brand }}
      model={{ name: found.name, slug: model }}
      searchParams={await searchParams}
      heading={copy.heading}
      intro={copy.intro}
      locale={locale}
    />
  );
}
