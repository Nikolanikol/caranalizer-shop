import 'server-only';
import {
  CATEGORIES,
  brandUrl,
  categoryUrl,
  getAllOemNumbers,
  getAllParts,
  getLandingPaths,
  modelUrl,
  partUrl,
} from '@/lib/shop/catalog';
import { getWheelSlugs } from '@/lib/shop/wheels';
import { SHOP_BASE, SHOP_LOCALE, SHOP_LOCALES, WHEELS_BASE, oemUrl, wheelUrl } from '@/lib/shop/urls';
import { SITE_URL as BASE } from '@/lib/site';
import { MAIN_LOCALE, SITE_LOCALES, VIN_PATHS, mainUrl, type VinLocale } from '@/lib/seo';
import { chunkNames, type SitemapPage } from '@/lib/sitemap-xml';
import type { PartCategory } from '@/types/part';

/**
 * Карта сайта по частям — с 04.10.2026.
 *
 * Повод: Search Console на 04.10.2026 — 10 тысяч страниц в индексе против 342 тысяч
 * вне его, а карточка из карты сайта на проверке URL — «неизвестна Google». Одна карта
 * на 47 тысяч адресов давала одно число на всё, и не было видно, что именно Google
 * берёт, а что нет. Теперь по файлу на тип страницы и язык: в отчёте «Файлы Sitemap»
 * у каждого своя строка с числом проиндексированных.
 *
 * Заодно в карту вошло всё, что раньше держали снаружи (решение владельца 04.10.2026:
 * «они все должны индексироваться»): карточки с одним экземпляром (12 821 из 18 655),
 * артикулы без совместимости (1 047 из 16 755) и диски. Довод прежнего правила —
 * проданная деталь оставит 404 — владелец принял как цену: страница, которой нет
 * в индексе, не приводит никого, а продажа случается с одной страницей из тысяч.
 * Единая карта с ними вышла бы за предел Google в 50 000 адресов — это и решает деление.
 */

/** Части карты. Порядок — порядок в индексе. */
export const SECTIONS = ['pages', 'landing', 'parts', 'oem', 'wheels'] as const;
export type Section = (typeof SECTIONS)[number];

export function isSection(value: string): value is Section {
  return (SECTIONS as readonly string[]).includes(value);
}

function sitePage(path: string): SitemapPage {
  return {
    languages: Object.fromEntries(SITE_LOCALES.map((l) => [l, `${BASE}/${l}${path}`])),
    xDefault: mainUrl(path),
  };
}

function shopPage(path: string): SitemapPage {
  return {
    languages: Object.fromEntries(SHOP_LOCALES.map((l) => [l, `${BASE}/${l}${path}`])),
    xDefault: `${BASE}/${SHOP_LOCALE}${path}`,
  };
}

/**
 * Страницы сайта вне раздела. `/privacy` и `/terms` здесь нет намеренно: они закрыты
 * `robots: index: false`.
 */
const STATIC_PATHS = [
  '',
  '/guides',
  '/guides/kbchachacha-na-russkom',
  '/guides/encar-proverka-vin',
  '/guides/otchety-po-mashinam-iz-korei',
  '/guides/besplatnaya-proverka-avto-iz-korei',
  '/guides/avto-iz-korei-v-kazahstan',
  '/guides/kak-kupit-avto-na-encar',
  '/about',
  '/how-it-works',
  '/faq',
  '/contact',
];

/**
 * Проверка по VIN — единственная страница с тремя языками, и путь у каждой свой.
 * `x-default` на русскую: основной рынок РФ.
 */
function vinPage(): SitemapPage {
  return {
    languages: Object.fromEntries(
      (Object.keys(VIN_PATHS) as VinLocale[]).map((l) => [l, `${BASE}/${l}${VIN_PATHS[l]}`]),
    ),
    xDefault: `${BASE}/${MAIN_LOCALE}${VIN_PATHS[MAIN_LOCALE]}`,
  };
}

async function landingPages(): Promise<SitemapPage[]> {
  // Сегмент `prochee` (товары без модели) в `getLandingPaths` не попадает — страница
  // модели закрывает его от индексации сама.
  const landing = await getLandingPaths();
  const brands = [...landing.brands].map((path) => {
    const [category, brand] = path.split('/');
    return brandUrl(category as PartCategory, brand);
  });
  const models = [...landing.models].map((path) => {
    const [category, brand, model] = path.split('/');
    return modelUrl(category as PartCategory, brand, model);
  });

  return [
    SHOP_BASE,
    `${SHOP_BASE}/kak-zakazat`,
    `${SHOP_BASE}/dostavka-i-oplata`,
    `${SHOP_BASE}/garantiya-i-vozvrat`,
    WHEELS_BASE,
    ...(Object.keys(CATEGORIES) as PartCategory[]).map(categoryUrl),
    ...new Set(brands),
    ...new Set(models),
  ].map(shopPage);
}

/** Страницы одной части карты. */
export async function sectionPages(section: Section): Promise<SitemapPage[]> {
  switch (section) {
    case 'pages':
      return [...STATIC_PATHS.map(sitePage), vinPage()];
    case 'landing':
      return landingPages();
    case 'parts':
      return (await getAllParts()).map((part) => shopPage(partUrl(part)));
    case 'oem':
      return (await getAllOemNumbers()).map((oem) => shopPage(oemUrl(oem)));
    case 'wheels':
      return (await getWheelSlugs()).map((slug) => shopPage(wheelUrl(slug)));
  }
}

/** Языки части: у страниц сайта и раздела два, у проверки по VIN — ещё арабский. */
function sectionLocales(pages: SitemapPage[]): string[] {
  const locales = new Set<string>();
  for (const page of pages) for (const locale of Object.keys(page.languages)) locales.add(locale);
  return [...locales];
}

/** Все файлы карты — для индекса на `/sitemap.xml`. */
export async function allSitemapFiles(): Promise<string[]> {
  const files: string[] = [];
  for (const section of SECTIONS) {
    const pages = await sectionPages(section);
    for (const locale of sectionLocales(pages)) {
      const count = pages.filter((page) => page.languages[locale]).length;
      files.push(...chunkNames(section, locale, count));
    }
  }
  return files;
}
