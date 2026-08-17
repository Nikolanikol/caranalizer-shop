import React from 'react';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SHOP_CATALOG, brandUrl, getBrands, getLatestParts, partUrl } from '@/lib/shop/catalog';
import { shopUrl } from '@/lib/shop/urls';
import { SITE_URL } from '@/lib/site';
import { ProductCard } from '@/components/shop/product-card';
import { SearchForm } from '@/components/shop/search-form';
import { FilterPanel } from '@/components/shop/filter-panel';
import { FilterSidebar } from '@/components/shop/filter-sidebar';
import { ShopFrame, ShopHeader } from '@/components/shop/shop-shell';

/**
 * Витрина раздела.
 *
 * Геометрия сверху донизу та же, что у каталога и категорий: `ShopHeader` и `ShopFrame` —
 * общие компоненты. Раньше витрина была центрированным лендингом, и при переходе на
 * категорию заголовок улетал влево и уменьшался, пилюли перелетали через экран вправо,
 * а поиск смещался в правую колонку. Вертикальный сдвиг читается как навигация,
 * горизонтальный — как поломка, поэтому горизонтальных различий здесь быть не должно.
 *
 * Лендингом витрина при этом остаётся: весь каталог живёт на /zapchasti/katalog, а здесь
 * последние поступления и навигация. Положить сюда полный список нельзя — две страницы
 * совпали бы на 95% (967 позиций против 915 на /zapchasti/zadnie-fonari) и начали бы
 * конкурировать за одни и те же запросы. Маркетинговые блоки уехали под сетку: в первом
 * экране им место дороже, чем пользы.
 */
export const metadata: Metadata = {
  title: 'Запчасти из Южной Кореи — оригинальная оптика',
  description:
    'Оригинальные задние фонари и противотуманные фары с авторазборок Южной Кореи. Поиск по OEM-артикулу, марке и модели, доставка по России.',
  alternates: { canonical: shopUrl('/zapchasti', SITE_URL) },
};

export default async function ShopHomePage() {
  const [latest, brands] = await Promise.all([getLatestParts(9), getBrands()]);
  const total = brands.reduce((sum, brand) => sum + brand.count, 0);

  return (
    <div className="flex-1 w-full">
      <ShopHeader
        heading="Оригинальная оптика из Кореи"
        intro={`${total} позиций для ${brands.length} марок: задние фонари и противотуманные фары. Каждая деталь сфотографирована по отдельности — вы видите именно то, что приедет.`}
      />

      <ShopFrame
        sidebar={
          /*
            Фильтр здесь работает навигацией: `basePath` — каталог, поэтому любой выбор
            уводит на /zapchasti/katalog, где есть и сортировка, и пагинация. Фильтровать
            «Последние поступления» на месте было бы хуже: их девять, и выборка по марке
            почти всегда оказывалась бы пустой.

            Категории на витрине нет, поэтому марка остаётся параметром запроса, а не
            сегментом пути — это описанное исключение из lib/shop/urls.ts.
          */
          <FilterPanel activeCount={0}>
            <FilterSidebar query={{}} brands={brands} models={[]} basePath={SHOP_CATALOG} />
          </FilterPanel>
        }
      >
        {/* Поиск на том же месте и той же ширины, что на страницах каталога */}
        <div className="mb-6">
          <SearchForm />
        </div>

        {/* Разделитель повторяет строку «Найдено / сортировка» из каталога */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Последние поступления</p>
          <Link
            href={SHOP_CATALOG}
            className="px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text transition-colors"
          >
            Весь каталог
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {latest.map((part) => (
            <ProductCard key={partUrl(part)} part={part} />
          ))}
        </div>
      </ShopFrame>

      <section className="border-y border-border-subtle bg-base-darker py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
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

      {/*
        Маркетинг витрины. Стоял в первом экране крупным центрированным героем — оттуда
        он и создавал разъезд геометрии при переходе на категорию. Содержание сохранено:
        прямой выкуп с разборов и объяснение, что заявка — не оплата.
      */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl space-y-3">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-elevated border border-border-subtle text-[10px] uppercase tracking-widest text-text-secondary font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cta" />
            Прямой выкуп с авторазборок Южной Кореи
          </p>

          <h2 className="text-lg font-bold text-text tracking-tight">Первый раз заказываете из Кореи?</h2>

          {/*
            Осторожно с `sm:text-base`: в теме объявлен --color-base, поэтому Tailwind
            считает `text-base` ещё и цветом, а адаптивный вариант перебивает класс цвета —
            абзац становится тёмно-синим на тёмно-синем, без ошибки сборки.
          */}
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
        </div>
      </section>
    </div>
  );
}
