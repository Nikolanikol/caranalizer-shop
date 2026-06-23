import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;

const STATIC_PAGES: { path: string; freq: "daily" | "weekly" | "monthly"; priority: number }[] = [
  { path: "", freq: "daily", priority: 1.0 },
  { path: "/catalog", freq: "daily", priority: 0.9 },
  { path: "/how-it-works", freq: "monthly", priority: 0.7 },
  { path: "/faq", freq: "monthly", priority: 0.7 },
  { path: "/contact", freq: "monthly", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PAGES.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.freq,
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${BASE}/${l}${page.path}`])
        ),
      },
    }))
  );
}
