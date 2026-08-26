import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Info } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CATEGORIES, getFitment, getPartsByOem, type FitmentEntry } from '@/lib/shop/catalog';
import { SHOP_BASE, brandUrl, modelUrl, oemUrl, shopUrl } from '@/lib/shop/urls';
import { SITE_URL } from '@/lib/site';
import { ProductCard } from '@/components/shop/product-card';
import { CopyOem } from '@/components/shop/copy-oem';
import { ShopHeader } from '@/components/shop/shop-shell';

/**
 * Страница артикула: на каких машинах встречается номер и что есть в наличии.
 *
 * Вход сбоку, а не уровень иерархии каталога. Заводится потому, что по номеру и приходят:
 * 87% кликов из поиска у прежнего магазина шли на `/parts/<артикул>`, и запросов-слов
 * там почти не было.
 *
 * ФОРМУЛИРОВКА. Здесь написано «встречается на этих машинах», а не «подходит к» —
 * и переписывать это нельзя. Данные собраны из того, под какими машинами донор продавал
 * номер: это наблюдение, а не подтверждение завода. За «подходит» отвечаем мы, и первый
 * же возврат будет по нашей вине.
 *
 * ПУБЛИКАЦИЯ ОТЛОЖЕНА. Страница закрыта `noindex` и не стоит в карте сайта: в Search
 * Console 307 755 адресов «обнаружена, не проиндексирована», и выкатывать в такой индекс
 * ещё 16 755 страниц бессмысленно — они уедут в тот же хвост. Снимать `noindex` после
 * расчистки, тогда же добавить в `sitemap.ts`.
 */

// Артикулов 16 755, и заранее не собирается ни один: страницы закрыты от индексации,
// а рендер по первому запросу и кэш их полностью закрывают.
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

function normalize(value: string): string {
  return decodeURIComponent(value).trim().toUpperCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ oem: string }>;
}): Promise<Metadata> {
  const oem = normalize((await params).oem);
  const fitment = await getFitment(oem);
  if (!fitment.length) return { title: `Артикул ${oem}`, robots: { index: false, follow: true } };

  const cars = fitment.map((entry) => `${entry.brand} ${entry.model}`.trim()).filter(Boolean);
  const type = CATEGORIES[fitment[0].category]?.title ?? 'Деталь';

  return {
    title: `${oem} — ${type}, встречается на ${cars.slice(0, 3).join(', ')}`,
    description: `Артикул ${oem}: ${type.toLowerCase()} с авторазборов Южной Кореи. Встречается на ${cars.join(', ')}. Фотографии каждого экземпляра, VIN донорской машины, доставка по России.`,
    alternates: { canonical: shopUrl(oemUrl(oem), SITE_URL) },
    // Снять после расчистки индекса — см. комментарий в шапке файла.
    robots: { index: false, follow: true },
  };
}

export default async function OemPage({ params }: { params: Promise<{ oem: string }> }) {
  const oem = normalize((await params).oem);
  const [fitment, parts] = await Promise.all([getFitment(oem), getPartsByOem(oem)]);

  if (!fitment.length && !parts.length) notFound();

  const type = fitment[0] ? CATEGORIES[fitment[0].category] : null;
  const cars = fitment.length;

  return (
    <div className="flex-1 w-full">
      <ShopHeader
        trail={[{ name: 'Запчасти', href: SHOP_BASE }, { name: oem }]}
        heading={`Артикул ${oem}`}
        intro={
          cars
            ? `${type?.title ?? 'Деталь'}. Номер встречается на ${cars} ${plural(cars, 'машине', 'машинах', 'машинах')} — ниже список и то, что есть в наличии.`
            : `Деталь с авторазборов Южной Кореи. Ниже — то, что есть в наличии по этому номеру.`
        }
      />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded bg-elevated text-text-secondary font-mono text-sm uppercase tracking-wider font-bold border border-border-subtle">
          {oem}
          <CopyOem value={oem} />
        </div>

        {fitment.length > 0 && (
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text tracking-tight">Встречается на этих машинах</h2>
              {/*
                Оговорка обязательна и стоит рядом со списком, а не внизу страницы:
                данные собраны с авторазбора, а не из каталога применимости завода.
              */}
              <p className="text-xs text-text-muted leading-relaxed max-w-3xl">
                Список собран по тому, под какими машинами эта деталь продавалась на разборах Кореи. Это не
                заводская таблица применимости — перед заказом сверьте номер со своей деталью.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {fitment.map((entry) => (
                <FitmentCard key={`${entry.category}/${entry.brandSlug}/${entry.modelSlug}/${entry.side}`} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {parts.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-text tracking-tight">
              В наличии по этому номеру: {parts.length}{' '}
              {plural(parts.length, 'деталь', 'детали', 'деталей')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {parts.map((part) => (
                <ProductCard key={part.id} part={part} />
              ))}
            </div>
          </section>
        ) : (
          <div className="bg-amber-950/30 border border-amber-900/50 rounded p-4 flex gap-3">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Сейчас деталей с этим номером в наличии нет. Напишите нам — подберём аналог или сообщим,
              когда появится.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Машина в списке совместимости. Ведёт на посадочную модели — там весь товар под неё. */
function FitmentCard({ entry }: { entry: FitmentEntry }) {
  const href = entry.model
    ? modelUrl(entry.category, entry.brandSlug, entry.modelSlug)
    : brandUrl(entry.category, entry.brandSlug);
  const years = entry.yearFrom === entry.yearTo ? `${entry.yearTo}` : `${entry.yearFrom}–${entry.yearTo}`;

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded bg-elevated border border-border-subtle hover:border-cta/40 transition-colors group"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm text-text-secondary group-hover:text-cta transition-colors">
          {entry.brand} {entry.model}
        </span>
        <span className="block text-[10px] uppercase tracking-widest text-text-dim mt-0.5">
          {years}
          {entry.side ? ` · ${entry.side}` : ''}
        </span>
      </span>
      <span className="text-[10px] tabular-nums text-text-dim shrink-0">{entry.offers} шт.</span>
    </Link>
  );
}

/** Русская форма числа: 1 деталь, 2 детали, 5 деталей. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = count % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
