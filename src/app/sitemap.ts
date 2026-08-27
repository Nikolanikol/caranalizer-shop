import { MetadataRoute } from "next";
import {
  CATEGORIES,
  brandUrl,
  categoryUrl,
  getIndexableOemNumbers,
  getIndexableParts,
  getLandingPaths,
  modelUrl,
  partUrl,
} from "@/lib/shop/catalog";
import { oemUrl } from "@/lib/shop/urls";
import { SHOP_LOCALE, SHOP_LOCALES } from "@/lib/shop/urls";
import { SITE_URL as BASE } from "@/lib/site";
import { MAIN_LOCALE, VIN_PATHS, mainUrl, type VinLocale } from "@/lib/seo";
import type { PartCategory } from "@/types/part";

/**
 * Одноязычные страницы: существуют только на русском, hreflang им не положен.
 * Проверка по VIN идёт отдельным списком ниже — она единственная многоязычная.
 *
 * `/privacy` и `/terms` здесь нет намеренно: они закрыты `robots: index: false`.
 */
const STATIC_PAGES: { path: string; freq: "daily" | "weekly" | "monthly"; priority: number }[] = [
  { path: "", freq: "weekly", priority: 1.0 },
  { path: "/guides", freq: "weekly", priority: 0.8 },
  { path: "/guides/kbchachacha-na-russkom", freq: "monthly", priority: 0.8 },
  { path: "/guides/encar-proverka-vin", freq: "monthly", priority: 0.8 },
  { path: "/guides/otchety-po-mashinam-iz-korei", freq: "monthly", priority: 0.8 },
  { path: "/guides/besplatnaya-proverka-avto-iz-korei", freq: "monthly", priority: 0.8 },
  { path: "/guides/avto-iz-korei-v-kazahstan", freq: "monthly", priority: 0.8 },
  { path: "/guides/kak-kupit-avto-na-encar", freq: "monthly", priority: 0.8 },
  { path: "/about", freq: "monthly", priority: 0.6 },
  { path: "/how-it-works", freq: "monthly", priority: 0.6 },
  { path: "/faq", freq: "monthly", priority: 0.6 },
  { path: "/contact", freq: "monthly", priority: 0.5 },
];

// No lastModified: a "now" timestamp is meaningless to Google (it ignores
// always-fresh dates) and GSC flags it as invalid when it lands in the future
// relative to the crawl time.
function entry(path: string, freq: "daily" | "weekly" | "monthly", priority: number) {
  return { url: mainUrl(path), changeFrequency: freq, priority };
}

/**
 * Проверка по VIN — единственная страница с языковыми версиями, и путь у каждой свой.
 * Альтернативы объявляем полным набором с `x-default` на русскую: основной рынок РФ.
 */
function vinEntries(): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(
      (Object.keys(VIN_PATHS) as VinLocale[]).map((l) => [l, `${BASE}/${l}${VIN_PATHS[l]}`])
    ),
    "x-default": `${BASE}/${MAIN_LOCALE}${VIN_PATHS[MAIN_LOCALE]}`,
  };

  return (Object.keys(VIN_PATHS) as VinLocale[]).map((locale) => ({
    url: `${BASE}/${locale}${VIN_PATHS[locale]}`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
    alternates: { languages },
  }));
}

/**
 * Раздел запчастей: по одной записи на каждый язык из `SHOP_LOCALES`, и у каждой полный
 * набор `hreflang`.
 *
 * Раньше здесь был только русский — раздел был одноязычным. С 27.08.2026 у него есть
 * английская версия, и объявить её обязательно: без `hreflang` Google считает две
 * страницы с одинаковой структурой дублями и склеивает их сам, как правило не в нашу
 * пользу. `x-default` ведёт на русскую — она старше и полнее по текстам.
 *
 * Одна запись превращается в две, поэтому карта сайта растёт вдвое. Это осознанно:
 * половина поисковых кликов у прежнего магазина приходила на иноязычные адреса.
 */
function shopEntries(
  path: string,
  freq: "daily" | "weekly" | "monthly",
  priority: number
): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(SHOP_LOCALES.map((l) => [l, `${BASE}/${l}${path}`])),
    "x-default": `${BASE}/${SHOP_LOCALE}${path}`,
  };

  return SHOP_LOCALES.map((locale) => ({
    url: `${BASE}/${locale}${path}`,
    changeFrequency: freq,
    priority,
    alternates: { languages },
  }));
}

async function shopPages(): Promise<MetadataRoute.Sitemap> {
  // Карточки — только те, что переживают продажу: у детали с одним экземпляром
  // страница умрёт вместе с товаром, и в карте сайта ей не место (см. AGENTS.md).
  const parts = await getIndexableParts();

  // Посадочные страницы берём по всему каталогу, а не по индексируемым карточкам:
  // марка и модель живут, пока у них есть хоть один товар. Сегмент `prochee`
  // пропускаем — страница модели закрывает его от индексации сама.
  const landing = await getLandingPaths();

  /*
   * Страницы артикулов. Опубликованы 28.08.2026: до этого лежали под `noindex`
   * и вне карты, пока не осядет хвост прежнего магазина. Берём только те, у которых
   * есть совместимость, — остальные не переживут продажу, подробности в `catalog.ts`.
   */
  const oems = await getIndexableOemNumbers();
  const brands = new Set([...landing.brands].map((path) => {
    const [category, brand] = path.split('/');
    return brandUrl(category as PartCategory, brand);
  }));
  const models = new Set([...landing.models].map((path) => {
    const [category, brand, model] = path.split('/');
    return modelUrl(category as PartCategory, brand, model);
  }));

  return [
    ...shopEntries("/zapchasti", "weekly", 0.9),
    ...shopEntries("/zapchasti/kak-zakazat", "monthly", 0.5),
    ...shopEntries("/zapchasti/dostavka-i-oplata", "monthly", 0.5),
    ...shopEntries("/zapchasti/garantiya-i-vozvrat", "monthly", 0.5),
    ...(Object.keys(CATEGORIES) as PartCategory[]).flatMap((category) =>
      shopEntries(categoryUrl(category), "daily", 0.9)
    ),
    ...[...brands].flatMap((path) => shopEntries(path, "daily", 0.8)),
    ...[...models].flatMap((path) => shopEntries(path, "daily", 0.8)),
    ...parts.flatMap((part) => shopEntries(partUrl(part), "weekly", 0.7)),
    ...oems.flatMap((oem) => shopEntries(oemUrl(oem), "weekly", 0.7)),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    ...STATIC_PAGES.map((page) => entry(page.path, page.freq, page.priority)),
    ...vinEntries(),
    ...(await shopPages()),
  ];
}
