import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return STATIC_PAGES.flatMap((page) => entry(page.path, page.freq, page.priority));
}
