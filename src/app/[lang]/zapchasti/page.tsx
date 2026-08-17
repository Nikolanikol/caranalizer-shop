import React from 'react';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  CATEGORIES,
  SHOP_CATALOG,
  brandUrl,
  categoryUrl,
  getBrands,
  getLatestParts,
  partUrl,
} from '@/lib/shop/catalog';
import { shopUrl } from '@/lib/shop/urls';
import { SITE_URL } from '@/lib/site';
import type { PartCategory } from '@/types/part';
import { ProductCard } from '@/components/shop/product-card';
import { SearchForm } from '@/components/shop/search-form';
import { FilterPanel } from '@/components/shop/filter-panel';
import { FilterSidebar } from '@/components/shop/filter-sidebar';

/**
 * Витрина раздела — лендинг, а не список товаров.
 *
 * Весь каталог живёт на /zapchasti/katalog. Если положить его ещё и сюда, две страницы
 * совпадут на 95% (967 позиций против 915 на /zapchasti/zadnie-fonari) и начнут
 * конкурировать друг с другом за одни и те же запросы.
 *
 * Поиск стоит не в первом экране, а прямо над товарами: искать артикул человек идёт
 * тогда, когда уже смотрит на детали, а не в момент знакомства с разделом.
 */
export const metadata: Metadata = {
  title: 'Запчасти из Южной Кореи — оригинальная оптика',
  description:
    'Оригинальные задние фонари и противотуманные фары с авторазборок Южной Кореи. Поиск по OEM-артикулу, марке и модели, доставка по России.',
  alternates: { canonical: shopUrl('/zapchasti', SITE_URL) },
};

export default async function ShopHomePage() {
  const [latest, brands] = await Promise.all([getLatestParts(8), getBrands()]);
  const total = brands.reduce((sum, brand) => sum + brand.count, 0);

  return (
    <div className="flex-1 w-full">
      <section className="bg-base border-b border-border-subtle py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-elevated border border-border-subtle text-[10px] uppercase tracking-widest text-text-secondary font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cta" />
            Прямой выкуп с авторазборок Южной Кореи
          </p>

          <h1 className="text-3xl sm:text-5xl font-black text-text tracking-tight leading-tight">
            Оригинальная оптика из Кореи
          </h1>

          {/*
            Размер задан как text-base sm:text-lg — так же, как на других лендингах сайта.
            Осторожно с `sm:text-base`: в теме объявлен --color-base, поэтому Tailwind
            считает `text-base` ещё и цветом, а адаптивный вариант перебивает класс цвета —
            абзац становится тёмно-синим на тёмно-синем. Первый вариант этого блока
            так и пропал с экрана.
          */}
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            {total} позиций для {brands.length} марок: задние фонари и противотуманные фары. Каждая деталь
            сфотографирована по отдельности — вы видите именно то, что приедет, а не картинку из каталога.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {(Object.keys(CATEGORIES) as PartCategory[]).map((key) => (
              <Link
                key={key}
                href={categoryUrl(key)}
                className="px-5 py-3 rounded bg-elevated border border-border-subtle text-text-secondary hover:text-cta hover:border-cta/40 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                {CATEGORIES[key].plural}
              </Link>
            ))}
            <Link
              href="/zapchasti/kak-zakazat"
              className="px-5 py-3 rounded bg-elevated border border-border-subtle text-text-secondary hover:text-cta hover:border-cta/40 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Как это работает
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="max-w-2xl mx-auto w-full space-y-2">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Знаете артикул? Найдём сразу
          </p>
          <SearchForm size="large" />
        </div>

        {/*
          Фильтр на витрине работает как навигация: `basePath` — каталог, поэтому любой
          выбор уводит на /zapchasti/katalog, где уже есть и сортировка, и пагинация.

          Фильтровать «Последние поступления» на месте было бы хуже: их всего восемь,
          и выборка по марке почти всегда оказывалась бы пустой. А показать здесь весь
          каталог нельзя — витрина совпала бы с /zapchasti/katalog на 95% (см. выше).

          Категории здесь нет, поэтому марка остаётся параметром запроса, а не сегментом
          пути — это описанное исключение из lib/shop/urls.ts.
        */}
        <div className="flex flex-col lg:flex-row gap-8 items-start pt-2">
          <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-28 lg:border-r border-border-subtle lg:pr-6 pb-6 lg:pb-8">
            <FilterPanel activeCount={0}>
              <FilterSidebar query={{}} brands={brands} models={[]} basePath={SHOP_CATALOG} />
            </FilterPanel>
          </aside>

          <div className="flex-1 w-full space-y-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold text-text tracking-tight">Последние поступления</h2>
              <Link href={SHOP_CATALOG} className="text-sm font-bold text-cta hover:underline">
                Весь каталог
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {latest.map((part) => (
                <ProductCard key={partUrl(part)} part={part} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border-subtle bg-base-darker py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-text tracking-tight">Марки автомобилей</h2>
            <Link href={SHOP_CATALOG} className="text-sm font-bold text-cta hover:underline">
              Все марки
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {brands.slice(0, 18).map((brand) => (
              <Link
                key={brand.slug}
                href={brandUrl('zadnie-fonari', brand.slug)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-cta hover:border-cta/40 transition-colors"
              >
                {brand.name}
                <span className="text-[10px] tabular-nums text-text-dim">{brand.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-3">
        <h2 className="text-lg font-bold text-text tracking-tight">Первый раз заказываете из Кореи?</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Заявка на сайте — не оплата. Менеджер сначала подтверждает наличие, присылает дополнительные
          фотографии и считает доставку, и только потом деталь выкупается.
        </p>
        <p>
          <Link
            href="/zapchasti/kak-zakazat"
            className="inline-flex items-center gap-2 text-sm font-bold text-cta hover:underline"
          >
            Как это работает, оплата и частые вопросы
            <ArrowRight className="w-4 h-4" />
          </Link>
        </p>
      </section>
    </div>
  );
}
