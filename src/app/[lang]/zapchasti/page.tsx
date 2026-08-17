import React from 'react';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SHOP_CATALOG, brandUrl, getBrands } from '@/lib/shop/catalog';
import { SHOP_BASE, shopUrl } from '@/lib/shop/urls';
import { SITE_URL } from '@/lib/site';
import { CatalogView, type CatalogSearchParams } from '@/components/shop/catalog-view';

/**
 * Витрина раздела — полный список с фильтром, сортировкой и пагинацией.
 *
 * Раньше здесь было девять последних поступлений и ссылка «Весь каталог». На телефоне
 * это читалось как «всё, что есть»: фильтр свёрнут в кнопку, за девятью карточками —
 * ничего. Пагинация решает именно это: снизу видно, что позиций 967, а не девять.
 *
 * Порядок по умолчанию — `newest`, поэтому витрина по-прежнему открывается свежими
 * поступлениями. Отдельного блока «Последние поступления» больше нет: он стал первой
 * страницей списка.
 *
 * ВАЖНО: с этого момента витрина и /zapchasti/katalog показывают одно и то же. Каталог
 * стал лишним и должен уехать редиректом сюда — пока этого не сделано, две страницы
 * конкурируют за одни и те же запросы (см. AGENTS.md).
 *
 * Фильтр теперь работает на месте, а не уводит в каталог: марка остаётся параметром
 * запроса, потому что категории на витрине нет и пути под марку не существует. Это
 * описанное исключение из lib/shop/urls.ts, и витрина канонизируется сама на себя,
 * поэтому страницы с фильтрами и номерами в индекс отдельно не уходят.
 */
export const metadata: Metadata = {
  title: 'Запчасти из Южной Кореи — оригинальная оптика',
  description:
    'Оригинальные задние фонари и противотуманные фары с авторазборок Южной Кореи. Поиск по OEM-артикулу, марке и модели, доставка по России.',
  alternates: { canonical: shopUrl('/zapchasti', SITE_URL) },
};

export default async function ShopHomePage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const [params, brands] = await Promise.all([searchParams, getBrands()]);
  const total = brands.reduce((sum, brand) => sum + brand.count, 0);

  return (
    <div className="flex-1 w-full">
      <CatalogView
        basePath={SHOP_BASE}
        defaultSort="newest"
        searchParams={params}
        heading="Оригинальная оптика из Кореи"
        intro={`${total} позиций для ${brands.length} марок: задние фонари и противотуманные фары. Каждая деталь сфотографирована по отдельности — вы видите именно то, что приедет.`}
      />

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
        он и создавал разъезд геометрии при переходе на категорию.
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
