import { MetadataRoute } from "next";
import {
  getCatalogCategories,
  getCatalogCategoryCounts,
} from "@/lib/catalog-data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;

const STATIC_PAGES: { path: string; freq: "daily" | "weekly" | "monthly"; priority: number }[] = [
  { path: "", freq: "daily", priority: 1.0 },
  { path: "/catalog", freq: "daily", priority: 0.9 },
  { path: "/about", freq: "monthly", priority: 0.7 },
  { path: "/how-it-works", freq: "monthly", priority: 0.7 },
  { path: "/faq", freq: "monthly", priority: 0.7 },
  { path: "/contact", freq: "monthly", priority: 0.6 },
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_PAGES.flatMap((page) =>
    entry(page.path, page.freq, page.priority)
  );

  let categoryEntries: MetadataRoute.Sitemap = [];
  try {
    const [cats, counts] = await Promise.all([
      getCatalogCategories(),
      getCatalogCategoryCounts(),
    ]);
    const countMap = new Map(counts.map((r) => [r.category_id, Number(r.cnt)]));
    categoryEntries = cats
      .filter((c) => c.parent_id === null && (countMap.get(c.id) ?? 0) > 0)
      .flatMap((c) => entry(`/catalog/${c.slug}`, "daily", 0.8));
  } catch {
    // DB unavailable — ship static entries rather than failing the sitemap
  }

  return [...staticEntries, ...categoryEntries];
}
