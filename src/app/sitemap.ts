import { MetadataRoute } from "next";
import {
  CATEGORIES,
  SHOP_CATALOG,
  brandUrl,
  categoryUrl,
  getAllParts,
  modelUrl,
  partUrl,
} from "@/lib/shop/catalog";
import { SHOP_LOCALE } from "@/lib/shop/urls";
import { SITE_URL as BASE } from "@/lib/site";
import type { PartCategory } from "@/types/part";

const LOCALES = ["ru", "en", "ar"] as const;

const STATIC_PAGES: { path: string; freq: "daily" | "weekly" | "monthly"; priority: number }[] = [
  { path: "", freq: "weekly", priority: 1.0 },
  { path: "/check", freq: "weekly", priority: 0.9 },
  { path: "/report", freq: "weekly", priority: 0.9 },
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
  return LOCALES.map((locale) => ({
    url: `${BASE}/${locale}${path}`,
    changeFrequency: freq,
    priority,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE}/${l}${path}`])
      ),
    },
  }));
}

/**
 * Раздел запчастей: только русский и без hreflang-альтернатив — других языковых
 * версий у этих страниц не существует, и объявлять их было бы прямой ложью карте сайта.
 */
function shopEntry(path: string, freq: "daily" | "weekly" | "monthly", priority: number) {
  return { url: `${BASE}/${SHOP_LOCALE}${path}`, changeFrequency: freq, priority };
}

async function shopPages(): Promise<MetadataRoute.Sitemap> {
  const parts = await getAllParts();

  // Уровни иерархии собираем из самих товаров: каждый сегмент пути — реальная страница.
  // Сегмент `prochee` пропускаем: страница модели закрывает его от индексации сама,
  // и держать его в карте — противоречить самим себе.
  const brands = new Set<string>();
  const models = new Set<string>();
  for (const part of parts) {
    brands.add(brandUrl(part.category, part.brandSlug));
    if (part.model) models.add(modelUrl(part.category, part.brandSlug, part.modelSlug));
  }

  return [
    shopEntry("/zapchasti", "weekly", 0.9),
    shopEntry(SHOP_CATALOG, "daily", 0.9),
    shopEntry("/zapchasti/kak-zakazat", "monthly", 0.5),
    shopEntry("/zapchasti/dostavka-i-oplata", "monthly", 0.5),
    shopEntry("/zapchasti/garantiya-i-vozvrat", "monthly", 0.5),
    ...(Object.keys(CATEGORIES) as PartCategory[]).map((category) =>
      shopEntry(categoryUrl(category), "daily", 0.9)
    ),
    ...[...brands].map((path) => shopEntry(path, "daily", 0.8)),
    ...[...models].map((path) => shopEntry(path, "daily", 0.8)),
    ...parts.map((part) => shopEntry(partUrl(part), "weekly", 0.7)),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    ...STATIC_PAGES.flatMap((page) => entry(page.path, page.freq, page.priority)),
    ...(await shopPages()),
  ];
}
