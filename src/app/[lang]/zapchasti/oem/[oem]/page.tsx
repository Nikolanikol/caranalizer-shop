import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Info } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CATEGORIES, getFitment, getPartsByOem, type FitmentEntry } from '@/lib/shop/catalog';
import { SHOP_BASE, brandUrl, isShopLocale, modelUrl, oemUrl, shopAlternates } from '@/lib/shop/urls';
import { SIDE_EN, type ShopLocale, term } from '@/lib/shop/terms';
import { categoryTitle } from '@/lib/shop/labels';
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
 * ОПУБЛИКОВАНА 28.08.2026. До этого была закрыта `noindex` и вне карты сайта: ждали,
 * пока осядет хвост из 307 755 адресов «обнаружена, не проиндексирована». Решение
 * открыть принято владельцем — эти страницы самые ценные по трафику, а ждать хвост
 * можно бесконечно.
 *
 * Закрытыми остались артикулы без совместимости — 1 047 из 16 755. У них нет строки
 * в `partsfit_fitment` (тип детали или сторона у донора расходятся, такие отсеиваются),
 * поэтому показать «встречается на этих машинах» нечем, и страница держится только
 * на товаре: пропадёт товар — останется 404. Это ровно то же правило, по которому
 * в карту сайта не идут карточки с одним экземпляром. Условие уже стоит ниже: ветка
 * `!fitment.length` возвращает `noindex` и без отдельного флага.
 *
 * ДВА ЯЗЫКА. Ровно эта страница и есть причина, по которой раздел открыли на `en`:
 * артикул интернационален, ищут его одинаково на любом языке, и в прежнем магазине
 * половина кликов по номерам приходила на `/en/` и `/ar/`. Переводить тут нечего —
 * номер это номер, а марка и модель латиницей; на язык ложатся только подписи.
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
  params: Promise<{ lang: string; oem: string }>;
}): Promise<Metadata> {
  const { lang, oem: raw } = await params;
  const locale = localeOf(lang);
  const oem = normalize(raw);
  const alternates = shopAlternates(oemUrl(oem), SITE_URL, locale);
  const fitment = await getFitment(oem);

  if (!fitment.length) {
    return {
      title: locale === 'en' ? `Part number ${oem}` : `Артикул ${oem}`,
      alternates,
      robots: { index: false, follow: true },
    };
  }

  const cars = fitment.map((entry) => `${entry.brand} ${entry.model}`.trim()).filter(Boolean);
  const category = fitment[0].category;

  if (locale === 'en') {
    const type = categoryTitle(category, 'en');
    return {
      title: `${oem} — ${type}, fits ${cars.slice(0, 3).join(', ')}`,
      description: `Part number ${oem}: used ${type.toLowerCase()} from South Korean salvage yards. Seen on ${cars.join(', ')}. Photos of every item, donor car VIN, worldwide shipping.`,
      alternates,
    };
  }

  const type = CATEGORIES[category]?.title ?? 'Деталь';
  return {
    title: `${oem} — ${type}, встречается на ${cars.slice(0, 3).join(', ')}`,
    description: `Артикул ${oem}: ${type.toLowerCase()} с авторазборов Южной Кореи. Встречается на ${cars.join(', ')}. Фотографии каждого экземпляра, VIN донорской машины, доставка по России.`,
    alternates,
  };
}

function localeOf(lang: string): ShopLocale {
  return isShopLocale(lang) ? lang : 'ru';
}

export default async function OemPage({
  params,
}: {
  params: Promise<{ lang: string; oem: string }>;
}) {
  const { lang, oem: raw } = await params;
  const locale = localeOf(lang);
  const t = TEXT[locale];
  const oem = normalize(raw);
  const [fitment, parts] = await Promise.all([getFitment(oem), getPartsByOem(oem)]);

  if (!fitment.length && !parts.length) notFound();

  const category = fitment[0]?.category ?? null;
  const type =
    category === null
      ? null
      : locale === 'en'
        ? categoryTitle(category, 'en')
        : (CATEGORIES[category]?.title ?? null);
  const cars = fitment.length;

  return (
    <div className="flex-1 w-full">
      <ShopHeader
        locale={locale}
        trail={[{ name: t.section, href: SHOP_BASE }, { name: oem }]}
        heading={`${t.heading} ${oem}`}
        intro={cars ? t.introFits(type ?? t.part, cars) : t.introEmpty}
      />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded bg-elevated text-text-secondary font-mono text-sm uppercase tracking-wider font-bold border border-border-subtle">
          {oem}
          <CopyOem value={oem} />
        </div>

        {fitment.length > 0 && (
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text tracking-tight">{t.fitsHeading}</h2>
              {/*
                Оговорка обязательна и стоит рядом со списком, а не внизу страницы:
                данные собраны с авторазбора, а не из каталога применимости завода.
              */}
              <p className="text-xs text-text-muted leading-relaxed max-w-3xl">{t.fitsCaveat}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {fitment.map((entry) => (
                <FitmentCard
                  key={`${entry.category}/${entry.brandSlug}/${entry.modelSlug}/${entry.side}`}
                  entry={entry}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        )}

        {parts.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-text tracking-tight">{t.inStock(parts.length)}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {parts.map((part) => (
                <ProductCard key={part.id} part={part} locale={locale} />
              ))}
            </div>
          </section>
        ) : (
          <div className="bg-amber-950/30 border border-amber-900/50 rounded p-4 flex gap-3">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80 leading-relaxed">{t.nothingInStock}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Машина в списке совместимости. Ведёт на посадочную модели — там весь товар под неё. */
function FitmentCard({ entry, locale }: { entry: FitmentEntry; locale: ShopLocale }) {
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
          {entry.side ? ` · ${term(entry.side, locale, SIDE_EN)}` : ''}
        </span>
      </span>
      <span className="text-[10px] tabular-nums text-text-dim shrink-0">
        {entry.offers} {TEXT[locale].pcs}
      </span>
    </Link>
  );
}

/**
 * Тексты страницы на обоих языках.
 *
 * Переводов в общем словаре (`messages/*.json`) для них нет намеренно: раздел
 * одноязычен по данным, а next-intl тянул бы за собой строгие типы путей — ровно то,
 * из-за чего `pathnames` не подошёл странице проверки по VIN. Здесь строк два десятка,
 * и держать их рядом со страницей честнее.
 */
const TEXT = {
  ru: {
    section: 'Запчасти',
    heading: 'Артикул',
    part: 'Деталь',
    pcs: 'шт.',
    introFits: (type: string, cars: number) =>
      `${type}. Номер встречается на ${cars} ${plural(cars, 'машине', 'машинах', 'машинах')} — ниже список и то, что есть в наличии.`,
    introEmpty: 'Деталь с авторазборов Южной Кореи. Ниже — то, что есть в наличии по этому номеру.',
    fitsHeading: 'Встречается на этих машинах',
    fitsCaveat:
      'Список собран по тому, под какими машинами эта деталь продавалась на разборах Кореи. Это не заводская таблица применимости — перед заказом сверьте номер со своей деталью.',
    inStock: (n: number) => `В наличии по этому номеру: ${n} ${plural(n, 'деталь', 'детали', 'деталей')}`,
    nothingInStock:
      'Сейчас деталей с этим номером в наличии нет. Напишите нам — подберём аналог или сообщим, когда появится.',
  },
  en: {
    section: 'Parts',
    heading: 'Part number',
    part: 'Part',
    pcs: 'pcs',
    introFits: (type: string, cars: number) =>
      `${type}. This number is seen on ${cars} ${cars === 1 ? 'car' : 'cars'} — the list and what we have in stock are below.`,
    introEmpty:
      'A part from South Korean salvage yards. Below is what we currently have under this number.',
    fitsHeading: 'Seen on these cars',
    /*
     * Формулировка держит ту же границу, что и русская: мы наблюдали, под какими машинами
     * донор продавал номер, — это не заводская применимость. «Fits» в заголовке допустимо,
     * а вот обещать совместимость в тексте нельзя: за неё отвечаем мы.
     */
    fitsCaveat:
      'This list reflects the cars this part was sold under at Korean salvage yards. It is not a manufacturer fitment table — check the number against your own part before ordering.',
    inStock: (n: number) => `In stock under this number: ${n} ${n === 1 ? 'item' : 'items'}`,
    nothingInStock:
      'Nothing is in stock under this number right now. Write to us — we will look for an equivalent or let you know when one arrives.',
  },
} as const;

/** Русская форма числа: 1 деталь, 2 детали, 5 деталей. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = count % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
